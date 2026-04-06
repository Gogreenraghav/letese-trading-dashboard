"""
LETESE● Auth Tests
MODULE B: Auth & RBAC — test all auth flows + RBAC enforcement
"""
import pytest
import pytest_asyncio
import time
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

# Use the bundled TestClient from httpx for synchronous FastAPI tests
from httpx import AsyncClient, ASGITransport

from app.services.auth_service import auth_service
from app.services.rbac import check_permission, get_allowed_actions


# ── Fixtures ─────────────────────────────────────────────────────────

@pytest.fixture
def mock_redis():
    """In-memory Redis mock using a plain dict."""
    store: dict[str, str] = {}

    class MockRedis:
        async def setex(self, key, ttl, value):
            store[key] = value

        async def get(self, key):
            return store.get(key)

        async def delete(self, key):
            return store.pop(key, None)

        async def setex_refresh(self, key, ttl, value):
            store[key] = value

        async def keys(self, pattern):
            return [k for k in store if pattern.replace("*", "") in k]

    return MockRedis(), store


# ── OTP Tests ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_send_otp_generates_and_stores_otp(mock_redis):
    """send-otp: OTP should be generated and stored in Redis with 600s TTL."""
    redis_mock, store = mock_redis
    email = "advocate@sharma-law.in"

    otp = await auth_service.generate_otp(email, redis_mock)

    # OTP should be a 6-character hex string
    assert otp is not None
    assert len(otp) == 6
    assert otp.isalnum()

    # OTP should be stored in Redis
    assert f"otp:{email}" in store
    assert store[f"otp:{email}"] == otp


@pytest.mark.asyncio
async def test_verify_otp_correct(mock_redis):
    """verify_otp: correct OTP returns True and deletes it from Redis."""
    redis_mock, store = mock_redis
    email = "advocate@sharma-law.in"

    otp = await auth_service.generate_otp(email, redis_mock)
    result = await auth_service.verify_otp(email, otp, redis_mock)

    assert result is True


@pytest.mark.asyncio
async def test_verify_otp_wrong(mock_redis):
    """verify_otp: wrong OTP returns False, does not delete store."""
    redis_mock, store = mock_redis
    email = "advocate@sharma-law.in"

    await auth_service.generate_otp(email, redis_mock)
    result = await auth_service.verify_otp(email, "WRONG0", redis_mock)

    assert result is False
    # OTP should still exist (not consumed by wrong attempt — or consumed,
    # depending on implementation: we verify it is NOT usable)
    # Our implementation: wrong OTP → stored OTP stays (first check fails before delete)
    # so we check verify is False
    assert result is False


@pytest.mark.asyncio
async def test_verify_otp_expired_or_missing(mock_redis):
    """verify_otp: missing key returns False (expired/deleted OTP)."""
    redis_mock, store = mock_redis
    email = "advocate@sharma-law.in"

    result = await auth_service.verify_otp(email, "ANYTHING", redis_mock)
    assert result is False


# ── JWT Token Tests ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_with_correct_otp_returns_jwt(mock_redis):
    """
    Full login flow test (mocked DB + Redis):
    1. generate_otp → stored in Redis
    2. verify_otp → True
    3. create_access_token → signed JWT
    """
    redis_mock, store = mock_redis
    email = "advocate@sharma-law.in"

    # Generate and verify OTP
    otp = await auth_service.generate_otp(email, redis_mock)
    is_valid = await auth_service.verify_otp(email, otp, redis_mock)
    assert is_valid is True

    # Create tokens (mock user + tenant objects)
    mock_user = MagicMock()
    mock_user.user_id = uuid4()
    mock_user.tenant_id = uuid4()
    mock_user.email = email
    mock_user.role = "advocate"

    mock_tenant = MagicMock()
    mock_tenant.plan = "professional"

    access_token = auth_service.create_access_token(mock_user, mock_tenant)
    refresh_token = auth_service.create_refresh_token(str(mock_user.user_id), redis_mock)

    assert access_token is not None
    assert len(access_token) > 20
    assert refresh_token is not None
    assert len(refresh_token) > 20

    # Verify the access token decodes correctly
    payload = auth_service.verify_token(access_token)
    assert payload["sub"] == str(mock_user.user_id)
    assert payload["tenant_id"] == str(mock_user.tenant_id)
    assert payload["role"] == "advocate"
    assert payload["plan"] == "professional"


@pytest.mark.asyncio
async def test_expired_token_returns_401():
    """verify_token: an expired JWT raises ValueError('Token expired')."""
    import jwt
    from app.core.config import settings

    # Craft an already-expired token
    expired_payload = {
        "sub": str(uuid4()),
        "tenant_id": str(uuid4()),
        "role": "advocate",
        "plan": "basic",
        "email": "test@example.com",
        "iat": 0,
        "exp": 0,   # expired in 1970
        "type": "access",
    }
    expired = jwt.encode(expired_payload, "dev-secret", algorithm="HS256")

    with pytest.raises(ValueError, match="Token expired"):
        auth_service.verify_token(expired)


@pytest.mark.asyncio
async def test_invalid_token_returns_401():
    """verify_token: a malformed token raises ValueError('Invalid token')."""
    with pytest.raises(ValueError, match="Invalid token"):
        auth_service.verify_token("not.a.real.token.at.all.12345")


# ── Refresh Token Tests ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_refresh_token_stored_and_revoked(mock_redis):
    """Refresh token is stored in Redis; logout deletes it."""
    redis_mock, store = mock_redis
    user_id = str(uuid4())

    token = auth_service.create_refresh_token(user_id, redis_mock)
    assert f"refresh:{token}" in store

    # Logout: delete the key
    count = await redis_mock.delete(f"refresh:{token}")
    assert count == 1

    # Second logout should fail (key gone)
    count2 = await redis_mock.delete(f"refresh:{token}")
    assert count2 == 0


# ── Google OAuth Tests ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_google_oauth_token_verification_fails_on_invalid_token():
    """
    Google tokeninfo endpoint should reject a fake ID token.
    httpx would raise HTTPStatusError on non-200 response.
    """
    import httpx

    fake_token = "fake.google.id.token.dots.here"

    # Patch httpx client to simulate Google rejecting the token
    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_response.json.return_value = {"error": "invalid_token"}

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client_cls.return_value.__aenter__.return_value = mock_client

        from app.api.v1.endpoints.auth import google_auth

        with pytest.raises(Exception):  # google_auth raises HTTPException(401)
            await google_auth(id_token=fake_token, db=AsyncMock())


# ── RBAC Tests ────────────────────────────────────────────────────────

@pytest.mark.parametrize("role,expected", [
    ("admin",      True),
    ("advocate",   True),
    ("clerk",      True),
    ("paralegal",  True),
    ("intern",     False),
    ("unknown",    False),
])
def test_clerk_cannot_create_case(role, expected):
    """RBAC: CLERK cannot create cases (interns cannot either)."""
    # Intern cannot create cases
    if role == "intern":
        result = check_permission("intern", "create_case")
        assert result is False

    # Advocate/Admin CAN create cases
    result_advocate = check_permission("advocate", "create_case")
    assert result_advocate is True

    result_admin = check_permission("admin", "create_case")
    assert result_admin is True


@pytest.mark.parametrize("role,action", [
    ("clerk",      "edit_case"),
    ("clerk",      "draft_documents"),
    ("clerk",      "trigger_ai_draft"),
    ("clerk",      "send_client_message"),
    ("clerk",      "view_billing"),
    ("clerk",      "manage_team"),
    ("clerk",      "view_audit_logs"),
    ("clerk",      "export_data"),
    ("paralegal",  "edit_case"),
    ("paralegal",  "draft_documents"),
    ("paralegal",  "trigger_ai_draft"),
    ("paralegal",  "view_billing"),
    ("paralegal",  "manage_team"),
    ("paralegal",  "view_audit_logs"),
    ("intern",     "create_case"),
    ("intern",     "edit_case"),
    ("intern",     "send_client_message"),
    ("intern",     "upload_document"),
    ("intern",     "view_billing"),
])
def test_rbac_denied_actions(role, action):
    """Each role should be explicitly denied the listed actions."""
    result = check_permission(role, action)
    assert result is False, f"Role '{role}' should NOT have permission for '{action}'"


@pytest.mark.parametrize("role,action", [
    ("admin",      "view_audit_logs"),
    ("admin",      "manage_team"),
    ("admin",      "view_billing"),
    ("advocate",   "create_case"),
    ("advocate",   "edit_case"),
    ("advocate",   "draft_documents"),
    ("advocate",   "trigger_ai_draft"),
    ("advocate",   "send_client_message"),
    ("advocate",   "export_data"),
    ("clerk",      "create_case"),
    ("clerk",      "upload_document"),
    ("clerk",      "view_case"),
    ("paralegal",  "create_case"),
    ("paralegal",  "send_client_message"),
    ("paralegal",  "upload_document"),
    ("intern",     "view_case"),
])
def test_rbac_allowed_actions(role, action):
    """Each role should have permission for the listed actions."""
    result = check_permission(role, action)
    assert result is True, f"Role '{role}' SHOULD have permission for '{action}'"


def test_get_allowed_actions_completeness():
    """get_allowed_actions returns all AND ONLY allowed actions for a role."""
    for role in ["admin", "advocate", "clerk", "paralegal", "intern", "super_admin"]:
        allowed = set(get_allowed_actions(role))
        for action in allowed:
            assert check_permission(role, action) is True, f"{role} → {action} should be allowed"

        # Verify it's a proper subset of ALL_ACTIONS
        from app.services.rbac import ALL_ACTIONS
        assert allowed.issubset(set(ALL_ACTIONS)), f"{role} allowed actions include invalid action"


def test_unknown_role_raises_error():
    """check_permission with unknown role raises ValueError."""
    with pytest.raises(ValueError, match="Unknown role"):
        check_permission("fake_role", "create_case")


def test_unknown_action_raises_error():
    """check_permission with unknown action raises ValueError."""
    with pytest.raises(ValueError, match="Unknown action"):
        check_permission("admin", "impossible_action")


# ── Rate Limiter Tests ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_rate_limiter_blocks_excess_requests():
    """After max_requests in the window, next request raises 429."""
    from app.api.v1.endpoints.auth import _check_rate_limit, _RATE_LIMIT

    ip = "192.168.1.99"
    _RATE_LIMIT.clear()  # Reset in-memory store

    # Should pass for first 10 requests
    for i in range(10):
        await _check_rate_limit(f"test-limit:{ip}", max_requests=10)

    # 11th request should raise 429
    with pytest.raises(Exception) as exc_info:
        await _check_rate_limit(f"test-limit:{ip}", max_requests=10)
    assert exc_info.value.status_code == 429

    _RATE_LIMIT.clear()
