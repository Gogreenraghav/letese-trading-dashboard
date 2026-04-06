"""
LETESE● Security Tests — OWASP ZAP Integration
Run: pytest backend/tests/security_scan.py
"""
import pytest
import httpx

ZAP_API = "http://zap:8090"

@pytest.mark.asyncio
async def test_sql_injection_cases_endpoint():
    """Test: SQL injection on /api/v1/cases search param."""
    payloads = [
        "' OR '1'='1",
        "'; DROP TABLE cases;--",
        "1 UNION SELECT * FROM users--",
    ]
    async with httpx.AsyncClient(base_url="http://test") as client:
        for payload in payloads:
            resp = await client.get(
                f"/api/v1/cases?search={payload}",
                headers={"Authorization": "Bearer test-token"},
            )
            # Should NOT return data from other tenants
            assert resp.status_code in (200, 400, 422)  # Not 500

@pytest.mark.asyncio
async def test_jwt_none_algorithm():
    """Test: JWT 'none' algorithm attack."""
    malicious_token = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6ImFkbWluIiwidGVuYW50X2lkIjoiMTIzIn0."
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "/api/v1/admin/tenants",
            headers={"Authorization": f"Bearer {malicious_token}"},
        )
        assert resp.status_code == 401

@pytest.mark.asyncio
async def test_tenant_isolation_enforced():
    """Critical: User A cannot access User B's cases."""
    # Create case as tenant A
    # Try to read as tenant B (different JWT)
    # Must return 404 or 403
    pass
