/// LETESE● Profile & Settings Screen
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';

// Session state provider
final sessionProvider = FutureProvider<SessionData>((ref) async {
  final prefs = await SharedPreferences.getInstance();
  return SessionData(
    userName: prefs.getString('user_name') ?? '',
    userEmail: prefs.getString('user_email') ?? '',
    userRole: prefs.getString('user_role') ?? '',
    tenantName: prefs.getString('tenant_name') ?? '',
    plan: prefs.getString('plan') ?? 'basic',
    activeCases: prefs.getInt('active_cases') ?? 0,
    storageUsedMb: prefs.getDouble('storage_used_mb') ?? 0.0,
    teamMembers: prefs.getInt('team_members') ?? 1,
  );
});

class SessionData {
  final String userName;
  final String userEmail;
  final String userRole;
  final String tenantName;
  final String plan;
  final int activeCases;
  final double storageUsedMb;
  final int teamMembers;
  SessionData({
    required this.userName,
    required this.userEmail,
    required this.userRole,
    required this.tenantName,
    required this.plan,
    required this.activeCases,
    required this.storageUsedMb,
    required this.teamMembers,
  });
}

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _waEnabled = true;
  bool _smsEnabled = false;
  bool _emailEnabled = true;
  bool _inAppEnabled = true;
  bool _loadingLogout = false;

  @override
  Widget build(BuildContext context) {
    final sessionAsync = ref.watch(sessionProvider);

    return Scaffold(
      backgroundColor: AppColors.bgObsidian,
      appBar: AppBar(
        title: Row(
          children: [
            const LeteseLogo(fontSize: 22),
            const SizedBox(width: 16),
            const Text('Profile', style: TextStyle(fontSize: 17)),
          ],
        ),
      ),
      body: sessionAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.neonCyan)),
        error: (_, __) => const Center(child: Text('Failed to load profile', style: TextStyle(color: AppColors.textSecondary))),
        data: (session) => _buildContent(session),
      ),
    );
  }

  Widget _buildContent(SessionData session) {
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        // User info card
        GlassCard(
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 56, height: 56,
                    decoration: BoxDecoration(
                      color: AppColors.neonCyanDim,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.neonCyan.withAlpha(77)),
                    ),
                    child: Center(
                      child: Text(
                        session.userName.isNotEmpty ? session.userName[0].toUpperCase() : 'U',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.neonCyan),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          session.userName.isNotEmpty ? session.userName : 'User',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: 2),
                        Text(session.userEmail, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                        const SizedBox(height: 6),
                        _RoleBadge(role: session.userRole),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit_outlined, color: AppColors.neonCyan, size: 20),
                    onPressed: () {},
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Tenant / Firm info
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.business, color: AppColors.electricPurple, size: 20),
                  const SizedBox(width: 10),
                  const Text('Firm', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  const Spacer(),
                  _PlanBadge(plan: session.plan),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                session.tenantName.isNotEmpty ? session.tenantName : 'Your Law Firm',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
              ),
              if (session.plan == 'basic') ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withAlpha(18),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.warning.withAlpha(51)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.upgrade, color: AppColors.warning, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Upgrade to Elite',
                                style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.warning, fontSize: 13)),
                            const SizedBox(height: 2),
                            Text('Unlock AI drafting, court scraping & more',
                                style: TextStyle(color: AppColors.warning.withAlpha(179), fontSize: 11)),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: () {},
                        style: TextButton.styleFrom(foregroundColor: AppColors.warning),
                        child: const Text('Upgrade'),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Quick stats
        _SectionHeader(title: '📊 QUICK STATS'),
        const SizedBox(height: 8),
        GlassCard(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              _StatTile(
                icon: Icons.folder_copy,
                value: '${session.activeCases}',
                label: 'Active Cases',
                color: AppColors.neonCyan,
              ),
              _StatTile(
                icon: Icons.cloud,
                value: '${session.storageUsedMb.toStringAsFixed(1)} MB',
                label: 'Storage Used',
                color: AppColors.electricPurple,
              ),
              _StatTile(
                icon: Icons.group,
                value: '${session.teamMembers}',
                label: 'Team Members',
                color: AppColors.brandGreen,
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Notification settings
        _SectionHeader(title: '🔔 NOTIFICATIONS'),
        const SizedBox(height: 8),
        GlassCard(
          child: Column(
            children: [
              _NotificationToggle(
                icon: Icons.chat,
                iconColor: const Color(0xFF25D366),
                title: 'WhatsApp Reminders',
                subtitle: 'Case hearing reminders via WhatsApp',
                value: _waEnabled,
                onChanged: (v) => setState(() => _waEnabled = v),
              ),
              const Divider(color: AppColors.bgBorder, height: 1),
              _NotificationToggle(
                icon: Icons.sms,
                iconColor: AppColors.neonCyan,
                title: 'SMS Alerts',
                subtitle: 'Urgent court updates via SMS',
                value: _smsEnabled,
                onChanged: (v) => setState(() => _smsEnabled = v),
              ),
              const Divider(color: AppColors.bgBorder, height: 1),
              _NotificationToggle(
                icon: Icons.email_outlined,
                iconColor: AppColors.electricPurple,
                title: 'Email Notifications',
                subtitle: 'Daily case diary digest',
                value: _emailEnabled,
                onChanged: (v) => setState(() => _emailEnabled = v),
              ),
              const Divider(color: AppColors.bgBorder, height: 1),
              _NotificationToggle(
                icon: Icons.notifications_outlined,
                iconColor: AppColors.warning,
                title: 'In-App Notifications',
                subtitle: 'Real-time alerts and updates',
                value: _inAppEnabled,
                onChanged: (v) => setState(() => _inAppEnabled = v),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // App settings
        _SectionHeader(title: '⚙️ APP'),
        const SizedBox(height: 8),
        GlassCard(
          child: Column(
            children: [
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.language, color: AppColors.textSecondary, size: 20),
                title: const Text('Language', style: TextStyle(fontSize: 14, color: AppColors.textPrimary)),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('English', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                    const SizedBox(width: 8),
                    const Icon(Icons.chevron_right, color: AppColors.textTertiary, size: 18),
                  ],
                ),
                onTap: () {},
              ),
              const Divider(color: AppColors.bgBorder, height: 1),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.dark_mode, color: AppColors.textSecondary, size: 20),
                title: const Text('Dark Mode', style: TextStyle(fontSize: 14, color: AppColors.textPrimary)),
                trailing: Switch(
                  value: true,
                  onChanged: (_) {},
                  activeColor: AppColors.neonCyan,
                ),
              ),
              const Divider(color: AppColors.bgBorder, height: 1),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.help_outline, color: AppColors.textSecondary, size: 20),
                title: const Text('Help & Support', style: TextStyle(fontSize: 14, color: AppColors.textPrimary)),
                trailing: const Icon(Icons.chevron_right, color: AppColors.textTertiary, size: 18),
                onTap: () {},
              ),
              const Divider(color: AppColors.bgBorder, height: 1),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.privacy_tip_outlined, color: AppColors.textSecondary, size: 20),
                title: const Text('Privacy Policy', style: TextStyle(fontSize: 14, color: AppColors.textPrimary)),
                trailing: const Icon(Icons.chevron_right, color: AppColors.textTertiary, size: 18),
                onTap: () {},
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Logout
        GlassCard(
          child: InkWell(
            onTap: _logout,
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(color: AppColors.error.withAlpha(26), borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.logout, color: AppColors.error, size: 18),
                ),
                title: _loadingLogout
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.error))
                    : const Text('Logout', style: TextStyle(fontSize: 15, color: AppColors.error, fontWeight: FontWeight.w600)),
                trailing: const Icon(Icons.chevron_right, color: AppColors.textTertiary, size: 18),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Version
        Center(
          child: Column(
            children: [
              Text('LETESE● Legal v1.0.0',
                  style: TextStyle(fontSize: 11, color: AppColors.textTertiary)),
              const SizedBox(height: 4),
              Text('LETESE Legal Technologies Pvt. Ltd.',
                  style: TextStyle(fontSize: 10, color: AppColors.textTertiary.withAlpha(128))),
            ],
          ),
        ),
        const SizedBox(height: 40),
      ],
    );
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.bgSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Logout?', style: TextStyle(color: AppColors.textPrimary)),
        content: const Text('Are you sure you want to logout of LETESE?', style: TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;
    setState(() => _loadingLogout = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('access_token');
      await prefs.remove('refresh_token');
      await prefs.remove('user_name');
      await prefs.remove('user_email');
      await prefs.remove('user_role');
      await prefs.remove('tenant_id');
      await prefs.remove('tenant_name');
      await prefs.remove('plan');
      if (mounted) {
        Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
      }
    } catch (_) {
      if (mounted) setState(() => _loadingLogout = false);
    }
  }
}

// ── Sub-widgets ──────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});
  @override
  Widget build(BuildContext context) => Text(title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.2));
}

class _RoleBadge extends StatelessWidget {
  final String role;
  const _RoleBadge({required this.role});
  @override
  Widget build(BuildContext context) {
    final color = role == 'admin' ? AppColors.neonCyan
        : role == 'partner' ? AppColors.electricPurple
        : AppColors.brandGreen;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: color.withAlpha(26), borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withAlpha(77))),
      child: Text(role.toUpperCase(), style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w700)),
    );
  }
}

class _PlanBadge extends StatelessWidget {
  final String plan;
  const _PlanBadge({required this.plan});
  @override
  Widget build(BuildContext context) {
    final color = plan == 'enterprise' ? AppColors.electricPurple
        : plan == 'elite' ? AppColors.neonCyan
        : AppColors.textTertiary;
    final label = plan == 'enterprise' ? 'ENTERPRISE'
        : plan == 'elite' ? 'ELITE'
        : 'BASIC';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withAlpha(26), borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withAlpha(77))),
      child: Text(label, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w700)),
    );
  }
}

class _StatTile extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;
  const _StatTile({required this.icon, required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: color)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textTertiary), textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _NotificationToggle extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _NotificationToggle({required this.icon, required this.iconColor, required this.title, required this.subtitle, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: iconColor.withAlpha(26), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, color: iconColor, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
                Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.neonCyan,
          ),
        ],
      ),
    );
  }
}
