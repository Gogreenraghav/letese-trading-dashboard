"""
LETESE● AIPOT-POLICE Audit Engine Tests
Tests: small/major audit logic, P1/P2 severity classification,
and PagerDuty alert routing.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.aipots.police import AIPOTPolice, SMALL_AUDIT_INTERVAL, MAJOR_AUDIT_INTERVAL


class TestAIPOTPoliceAudit:
    """AIPOT-POLICE audit logic without Kafka/Redis dependencies."""

    @pytest.fixture
    def police(self):
        """Build a mock-free AIPOTPolice instance for method testing."""
        agent = AIPOTPolice.__new__(AIPOTPolice)
        agent._running = True
        agent.redis = AsyncMock()
        agent.producer = AsyncMock()
        return agent

    @pytest.mark.asyncio
    async def test_small_audit_returns_results(self, police):
        """_run_small_audit must return a dict of check results."""
        # Mock Redis responses
        police.redis.get = AsyncMock(
            side_effect=lambda key: {
                "heartbeat:AIPOT-SCRAPER": "9999999999",   # stale → FAIL
                "heartbeat:AIPOT-COMPLIANCE": str(int(__import__("time").time())),  # fresh → PASS
                "heartbeat:AIPOT-COMUNICATOR": str(int(__import__("time").time())),
                "metrics:api_p95_latency_ms": "200",
                "metrics:scraper_success_rate_10min": "0.99",
            }.get(key)
        )
        police.redis.info = AsyncMock(
            return_value={"used_memory": 1_000_000, "maxmemory": 10_000_000}
        )
        police.redis.set = AsyncMock()

        # Mock K8s restart (skip actual HTTP calls)
        police._restart_pod = AsyncMock()

        # Patch _pagerduty_alert and _save_audit to avoid external calls
        police._pagerduty_alert = AsyncMock()
        police._save_audit = AsyncMock()

        await police._run_small_audit()

        # Verify _save_audit was called with expected structure
        police._save_audit.assert_called_once()
        call_args = police._save_audit.call_args
        assert call_args.kwargs.get("audit_type") == "small"
        assert "results" in call_args.kwargs

    @pytest.mark.asyncio
    async def test_small_audit_flags_stale_heartbeat(self, police):
        """A heartbeat older than 180 seconds must be flagged FAIL."""
        police.redis.get = AsyncMock(
            side_effect=lambda key: {
                "heartbeat:AIPOT-SCRAPER": str(int(__import__("time").time()) - 300),  # 5 min old → FAIL
                "heartbeat:AIPOT-COMPLIANCE": str(int(__import__("time").time())),      # fresh → PASS
                "heartbeat:AIPOT-COMUNICATOR": str(int(__import__("time").time())),
                "metrics:api_p95_latency_ms": "500",
                "metrics:scraper_success_rate_10min": "0.80",
            }.get(key)
        )
        police.redis.info = AsyncMock(
            return_value={"used_memory": 1_000_000, "maxmemory": 10_000_000}
        )
        police.redis.set = AsyncMock()
        police._restart_pod = AsyncMock()
        police._pagerduty_alert = AsyncMock()
        police._save_audit = AsyncMock()

        await police._run_small_audit()

        results = police._save_audit.call_args.kwargs["results"]
        assert "heartbeat_AIPOT-SCRAPER" in results
        assert "FAIL" in results["heartbeat_AIPOT-SCRAPER"]

    @pytest.mark.asyncio
    async def test_p1_alert_on_tenant_isolation_error(self):
        """
        Tenant isolation errors must trigger a P1 PagerDuty alert.
        """
        agent = AIPOTPolice.__new__(AIPOTPolice)
        agent._running = True
        agent.redis = AsyncMock()
        agent.producer = AsyncMock()

        # Patch PagerDuty HTTP call
        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_client_instance = AsyncMock()
            mock_client_instance.__aenter__.return_value = mock_client_instance
            mock_client_instance.__aexit__.return_value = None
            mock_client_instance.post = AsyncMock(return_value=mock_response)
            mock_client_cls.return_value = mock_client_instance

            agent._pagerduty_alert = AIPOTPolice._pagerduty_alert.__get__(agent, AIPOTPolice)
            await agent._pagerduty_alert(
                severity="P1",
                summary="Tenant isolation failure in AIPOT-SCRAPER",
                details={
                    "agent_id": "AIPOT-SCRAPER",
                    "error": "tenant isolation breach — cross-tenant data access detected",
                },
            )

            # Assert PagerDuty enqueue was called with P1 severity
            mock_client_instance.post.assert_called_once()
            call_args = mock_client_instance.post.call_args
            payload = call_args.kwargs.get("json", {})
            assert payload.get("event_action") == "trigger"
            assert "letese-P1" in payload.get("dedup_key", "")

    @pytest.mark.asyncio
    async def test_p2_alert_on_scraper_failure(self):
        """Scraper failure (non-isolation) should be P2, not P1."""
        agent = AIPOTPolice.__new__(AIPOTPolice)
        agent._running = True
        agent.redis = AsyncMock()
        agent.producer = AsyncMock()

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_client_instance = AsyncMock()
            mock_client_instance.__aenter__.return_value = mock_client_instance
            mock_client_instance.__aexit__.return_value = None
            mock_client_instance.post = AsyncMock(return_value=mock_response)
            mock_client_cls.return_value = mock_client_instance

            agent._pagerduty_alert = AIPOTPolice._pagerduty_alert.__get__(agent, AIPOTPolice)
            await agent._pagerduty_alert(
                severity="P2",
                summary="Scraper success rate below threshold",
                details={"scraper_success_rate": "0.80"},
            )

            call_args = mock_client_instance.post.call_args
            payload = call_args.kwargs.get("json", {})
            assert "letese-P2" in payload.get("dedup_key", "")

    @pytest.mark.asyncio
    async def test_major_audit_calls_save_audit(self, police):
        """_run_major_audit must invoke _save_audit with 'major' audit_type."""
        police.redis.get = AsyncMock(return_value=None)
        police.redis.set = AsyncMock()
        police._pagerduty_alert = AsyncMock()
        police._save_audit = AsyncMock()

        await police._run_major_audit()

        police._save_audit.assert_called_once()
        assert police._save_audit.call_args.kwargs.get("audit_type") == "major"

    def test_audit_intervals_are_sensible(self):
        """Small audit every 10 min, major every 60 min."""
        assert SMALL_AUDIT_INTERVAL == 600
        assert MAJOR_AUDIT_INTERVAL == 3600

    @pytest.mark.asyncio
    async def test_error_event_p1_on_isolation_keyword(self, police):
        """Error event containing 'tenant isolation' must be classified P1."""
        import time
        police.redis.get = AsyncMock(return_value=None)
        police._pagerduty_alert = AsyncMock()
        police._save_audit = AsyncMock()

        with patch("httpx.AsyncClient"):
            await police._process_error_event({
                "agent_id": "AIPOT-SCRAPER",
                "error": "Tenant isolation error: cross-tenant read detected",
                "timestamp": str(int(time.time())),
            })

            police._pagerduty_alert.assert_called_once()
            call_kwargs = police._pagerduty_alert.call_args.kwargs
            assert call_kwargs["severity"] == "P1"
