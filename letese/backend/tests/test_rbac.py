"""
LETESE● RBAC Permission Matrix Tests
Validates role-action matrix and plan feature gates.
"""
import pytest
from app.services.rbac import (
    check_permission,
    get_allowed_actions,
    check_plan_feature,
    Action,
)


class TestRBACPermissionMatrix:
    """Permission matrix — role × action."""

    def test_admin_has_all_standard_permissions(self):
        admin_actions = get_allowed_actions("admin")
        assert "create_case" in admin_actions
        assert "edit_case" in admin_actions
        assert "manage_team" in admin_actions
        assert "view_system_health" not in admin_actions  # super_admin only

    def test_admin_cannot_manage_vendors(self):
        """Vendors config is super_admin only."""
        assert not check_permission("admin", "manage_vendors")

    def test_clerk_cannot_draft(self):
        assert not check_permission("clerk", "draft_documents")
        assert not check_permission("clerk", "trigger_ai_draft")
        assert not check_permission("clerk", "trigger_scrape")
        assert check_permission("clerk", "create_case")
        assert check_permission("clerk", "upload_document")

    def test_clerk_cannot_send_messages(self):
        assert not check_permission("clerk", "send_client_message")

    def test_intern_view_only(self):
        assert check_permission("intern", "view_case")
        assert not check_permission("intern", "create_case")
        assert not check_permission("intern", "send_client_message")
        assert not check_permission("intern", "upload_document")

    def test_intern_has_no_upload(self):
        assert not check_permission("intern", "upload_document")

    def test_paralegal_can_send_messages(self):
        assert check_permission("paralegal", "send_client_message")

    def test_paralegal_cannot_draft(self):
        assert not check_permission("paralegal", "draft_documents")
        assert not check_permission("paralegal", "trigger_ai_draft")

    def test_super_admin_has_all_permissions(self):
        assert check_permission("super_admin", "view_system_health")
        assert check_permission("super_admin", "manage_vendors")
        assert check_permission("super_admin", "manage_plan")
        assert check_permission("super_admin", "manage_team")

    def test_super_admin_bypass(self):
        """super_admin has system-level actions not available to admin."""
        assert check_permission("super_admin", "view_system_health")
        assert not check_permission("admin", "view_system_health")

    def test_advocate_can_draft(self):
        assert check_permission("advocate", "draft_documents")
        assert check_permission("advocate", "trigger_ai_draft")

    def test_action_enum_values_match_strings(self):
        """Enum values must match the string keys in the permission matrix."""
        assert Action.CREATE_CASE.value == "create_case"
        assert Action.DRAFT_DOCUMENT.value == "draft_documents"
        assert Action.AI_DRAFT.value == "trigger_ai_draft"
        assert Action.TRIGGER_SCRAPE.value == "trigger_scrape"
        assert Action.SEND_MESSAGE.value == "send_client_message"
        assert Action.VIEW_CASE.value == "view_case"
        assert Action.MANAGE_TEAM.value == "manage_team"
        assert Action.CONFIGURE_VENDORS.value == "manage_vendors"
        assert Action.VIEW_SYSTEM_HEALTH.value == "view_system_health"

    def test_check_permission_with_raise_error(self):
        with pytest.raises(PermissionError):
            check_permission("intern", "create_case", raise_error=True)

    def test_unknown_role_raises(self):
        with pytest.raises(ValueError, match="Unknown role"):
            check_permission("ghost", "view_case")

    def test_unknown_action_raises(self):
        with pytest.raises(ValueError, match="Unknown action"):
            check_permission("admin", "delete_entire_system")


class TestPlanFeatureGates:
    """Plan × feature matrix."""

    def test_basic_has_cases(self):
        assert check_plan_feature("basic", "cases")

    def test_basic_missing_ai_drafting(self):
        assert not check_plan_feature("basic", "ai_drafting")

    def test_basic_missing_translation(self):
        assert not check_plan_feature("basic", "translation")

    def test_elite_has_ai_drafting(self):
        assert check_plan_feature("elite", "ai_drafting")

    def test_elite_has_translation(self):
        assert check_plan_feature("elite", "translation")

    def test_elite_has_whatsapp(self):
        assert check_plan_feature("elite", "whatsapp")

    def test_professional_missing_ai_drafting(self):
        assert not check_plan_feature("professional", "ai_drafting")

    def test_enterprise_has_post_judgment(self):
        assert check_plan_feature("enterprise", "post_judgment")

    def test_enterprise_has_api_access(self):
        assert check_plan_feature("enterprise", "api_access")

    def test_basic_only_one_team_member(self):
        assert check_plan_feature("basic", "team_1")
        assert not check_plan_feature("basic", "team_5")

    def test_professional_five_team_members(self):
        assert check_plan_feature("professional", "team_5")

    def test_elite_ten_team_members(self):
        assert check_plan_feature("elite", "team_10")

    def test_enterprise_unlimited_team(self):
        assert check_plan_feature("enterprise", "team_unlimited")

    def test_unknown_plan_returns_false(self):
        assert not check_plan_feature("unknown_plan", "cases")
