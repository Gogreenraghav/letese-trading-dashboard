"""
LETESE● RBAC Permission Matrix
MODULE B: Auth & RBAC — Role-based access control for LETESE Legal SaaS

Role Hierarchy & Permissions
───────────────────────────────────────────────────────────────────────
 ADMIN      — Full access to all tenant data and settings
 ADVOCATE   — Full access to own cases; read-only on other cases
 CLERK      — Create/view cases; upload docs; cannot edit drafts
 PARALEGAL  — CLERK permissions + can trigger communications
 INTERN     — View-only on assigned cases
───────────────────────────────────────────────────────────────────────

Action              │ ADMIN │ ADVOCATE │ CLERK │ PARALEGAL │ INTERN
────────────────────┼───────┼──────────┼───────┼───────────┼────────
create_case        │   ✓   │    ✓     │   ✓  │     ✓     │   ✗
edit_case          │   ✓   │    ✓     │   ✗  │     ✗     │   ✗
draft_documents    │   ✓   │    ✓     │   ✗  │     ✗     │   ✗
trigger_ai_draft   │   ✓   │    ✓     │   ✗  │     ✗     │   ✗
send_client_message│   ✓   │    ✓     │   ✗  │     ✓     │   ✗
view_billing       │   ✓   │    ✗     │   ✗  │     ✗     │   ✗
manage_team        │   ✓   │    ✗     │   ✗  │     ✗     │   ✗
view_audit_logs    │   ✓   │    ✗     │   ✗  │     ✗     │   ✗
export_data        │   ✓   │    ✓     │   ✗  │     ✗     │   ✗
upload_document    │   ✓   │    ✓     │   ✓  │     ✓     │   ✗
view_case          │   ✓   │    ✓     │   ✓  │     ✓     │   ✗
view_billing       │   ✓   │    ✗     │   ✗  │     ✗     │   ✗
manage_billing     │   ✓   │    ✗     │   ✗  │     ✗     │   ✗
"""

from typing import Literal

# ── Permission Matrix ───────────────────────────────────────────────
_PERMISSION_MATRIX: dict[str, dict[str, bool]] = {
    "super_admin": {
        "create_case":         True,
        "edit_case":           True,
        "draft_documents":     True,
        "trigger_ai_draft":    True,
        "send_client_message": True,
        "view_billing":        True,
        "manage_billing":      True,
        "manage_team":         True,
        "view_audit_logs":     True,
        "export_data":         True,
        "upload_document":     True,
        "view_case":           True,
        "delete_case":         True,
        "trigger_scrape":      True,
        "manage_plan":         True,
        "manage_vendors":      True,
    },
    "admin": {
        "create_case":         True,
        "edit_case":           True,
        "draft_documents":     True,
        "trigger_ai_draft":    True,
        "send_client_message": True,
        "view_billing":        True,
        "manage_billing":      True,
        "manage_team":         True,
        "view_audit_logs":     True,
        "export_data":         True,
        "upload_document":     True,
        "view_case":           True,
        "delete_case":         True,
        "trigger_scrape":      True,
        "manage_plan":         False,
        "manage_vendors":      False,
    },
    "advocate": {
        "create_case":         True,
        "edit_case":           True,
        "draft_documents":     True,
        "trigger_ai_draft":    True,
        "send_client_message": True,
        "view_billing":        False,
        "manage_billing":      False,
        "manage_team":         False,
        "view_audit_logs":     False,
        "export_data":         True,
        "upload_document":     True,
        "view_case":           True,
        "delete_case":         False,
        "trigger_scrape":      True,
        "manage_plan":         False,
        "manage_vendors":      False,
    },
    "clerk": {
        "create_case":         True,
        "edit_case":           False,
        "draft_documents":     False,
        "trigger_ai_draft":    False,
        "send_client_message": False,
        "view_billing":        False,
        "manage_billing":      False,
        "manage_team":         False,
        "view_audit_logs":     False,
        "export_data":         False,
        "upload_document":     True,
        "view_case":           True,
        "delete_case":         False,
        "trigger_scrape":      False,
        "manage_plan":         False,
        "manage_vendors":      False,
    },
    "paralegal": {
        "create_case":         True,
        "edit_case":           False,
        "draft_documents":     False,
        "trigger_ai_draft":    False,
        "send_client_message": True,
        "view_billing":        False,
        "manage_billing":      False,
        "manage_team":         False,
        "view_audit_logs":     False,
        "export_data":         False,
        "upload_document":     True,
        "view_case":           True,
        "delete_case":         False,
        "trigger_scrape":      False,
        "manage_plan":         False,
        "manage_vendors":      False,
    },
    "intern": {
        "create_case":         False,
        "edit_case":           False,
        "draft_documents":     False,
        "trigger_ai_draft":    False,
        "send_client_message": False,
        "view_billing":        False,
        "manage_billing":      False,
        "manage_team":         False,
        "view_audit_logs":     False,
        "export_data":         False,
        "upload_document":     False,
        "view_case":           True,   # assigned cases only — enforced at DB query level
        "delete_case":         False,
        "trigger_scrape":      False,
        "manage_plan":         False,
        "manage_vendors":      False,
    },
}

# All defined actions (for OpenAPI / documentation)
ALL_ACTIONS = sorted(
    set(action for perms in _PERMISSION_MATRIX.values() for action in perms)
)

# All defined roles
ALL_ROLES = sorted(_PERMISSION_MATRIX.keys())


# ── Core Functions ───────────────────────────────────────────────────

def check_permission(
    role: str,
    action: str,
    raise_error: bool = False,
) -> bool:
    """
    Check whether `role` is permitted to perform `action`.

    Args:
        role:    One of: super_admin, admin, advocate, clerk, paralegal, intern
        action:  One of the defined actions (see ALL_ACTIONS)
        raise_error: If True, raises PermissionError when check fails.
                     If False (default), returns bool.

    Returns:
        bool — True if permitted, False otherwise.

    Raises:
        PermissionError — only when raise_error=True and permission denied.
        ValueError       — if role or action is unknown.
    """
    if role not in _PERMISSION_MATRIX:
        raise ValueError(f"Unknown role: '{role}'. Valid roles: {ALL_ROLES}")

    perms = _PERMISSION_MATRIX[role]

    if action not in perms:
        raise ValueError(
            f"Unknown action: '{action}'. Valid actions: {ALL_ACTIONS}"
        )

    allowed = perms[action]

    if raise_error and not allowed:
        raise PermissionError(
            f"Role '{role}' is not permitted to perform action '{action}'."
        )

    return allowed


def get_allowed_actions(role: str) -> list[str]:
    """
    Return the list of action names the given role is permitted to perform.

    Args:
        role: One of the valid roles.

    Returns:
        list[str] — sorted list of permitted action names.

    Raises:
        ValueError — if role is unknown.
    """
    if role not in _PERMISSION_MATRIX:
        raise ValueError(f"Unknown role: '{role}'. Valid roles: {ALL_ROLES}")

    return sorted(
        action for action, allowed in _PERMISSION_MATRIX[role].items()
        if allowed
    )


def get_denied_actions(role: str) -> list[str]:
    """Return the list of action names the given role is NOT permitted."""
    if role not in _PERMISSION_MATRIX:
        raise ValueError(f"Unknown role: '{role}'. Valid roles: {ALL_ROLES}")

    return sorted(
        action for action, allowed in _PERMISSION_MATRIX[role].items()
        if not allowed
    )


def format_permission_table() -> str:
    """Return the permission matrix as a formatted ASCII table."""
    headers = ["Action", *ALL_ROLES]
    col_widths = [max(len(headers[i]), 22) for i in range(len(headers))]
    rows = [headers]
    for action in ALL_ACTIONS:
        row = [action]
        for role in ALL_ROLES:
            allowed = _PERMISSION_MATRIX[role].get(action, False)
            row.append("✓" if allowed else "✗")
        rows.append(row)

    lines = []
    header_line = "│".join(
        f" {h:<{col_widths[i]}} " for i, h in enumerate(rows[0])
    )
    lines.append("┌" + header_line.replace(" ", "─" * (len(header_line)//len(headers))) + "┐")
    lines.append("│" + " │ ".join(f" {h:<{col_widths[i]}}" for i, h in enumerate(rows[0])) + "│")
    lines.append("│" + "─│─".join("─" * w for w in col_widths) + "│")

    for row in rows[1:]:
        lines.append("│" + " │ ".join(f" {c:<{col_widths[i]}}" for i, c in enumerate(row)) + "│")

    lines.append("└" + "─┴─".join("─" * w for w in col_widths) + "┘")
    return "\n".join(lines)


def get_effective_role(role: str, tenant_plan: str | None = None) -> str:
    """
    Returns the effective role, taking plan-based limitations into account.
    For now this is a pass-through; in future, plan-based overrides could
    further restrict actions.
    """
    return role
