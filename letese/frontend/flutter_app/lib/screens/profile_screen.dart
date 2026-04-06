/// LETESE● Profile & Settings Screen — Lattice Design System (Light Theme)
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_fonts/google_fonts.dart';
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
      backgroundColor: LatticeColors.background,
      body: Stack(
        children: [
          // Sky gradient header
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 240,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [LatticeColors.skyTop, LatticeColors.skyBottom],
                ),
              ),
            ),
          ),
          CustomScrollView(
            slivers: [
              // App Bar
              SliverAppBar(
                backgroundColor: Colors.transparent,
                elevation: 0,
                pinned: false,
                expandedHeight: 80,
                toolbarHeight: 80,
                flexibleSpace: FlexibleSpaceBar(
                  background: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 48, 20, 0),
                    child: Row(
                      children: [
                        Text(
                          'Profile',
                          style: GoogleFonts.manrope(
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(26),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.settings_outlined, color: Colors.white, size: 22),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // User info card
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                  child: sessionAsync.when(
                    loading: () => const Center(child: CircularProgressIndicator(color: LatticeColors.primary)),
                    error: (_, __) => const SizedBox.shrink(),
                    data: (session) => _buildProfileCard(session),
                  ),
                ),
              ),

              // Content list
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: _buildContent(sessionAsync),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 90)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProfileCard(SessionData session) {
    return Container(
      decoration: BoxDecoration(
        color: LatticeColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(color: LatticeColors.shadow, blurRadius: 20, offset: Offset(0, 5)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              width: 60, height: 60,
              decoration: BoxDecoration(
                color: LatticeColors.primary.withAlpha(20),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: Text(
                  session.userName.isNotEmpty ? session.userName[0].toUpperCase() : 'U',
                  style: GoogleFonts.manrope(
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    color: LatticeColors.primary,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    session.userName.isNotEmpty ? session.userName : 'User',
                    style: GoogleFonts.manrope(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: LatticeColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    session.userEmail,
                    style: GoogleFonts.inter(fontSize: 13, color: LatticeColors.textSecondary),
                  ),
                  const SizedBox(height: 8),
                  _RoleBadge(role: session.userRole),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.edit_outlined, color: LatticeColors.primary, size: 20),
              onPressed: () {},
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(AsyncValue<SessionData> sessionAsync) {
    final session = sessionAsync.valueOrNull;

    return Column(
      children: [
        // Tenant / Firm info
        _CardWrapper(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.business, color: LatticeColors.primary, size: 20),
                  const SizedBox(width: 10),
                  Text('Firm', style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textSecondary, letterSpacing: 1)),
                  const Spacer(),
                  _PlanBadge(plan: session?.plan ?? 'basic'),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                session?.tenantName.isNotEmpty == true ? session!.tenantName : 'Your Law Firm',
                style: GoogleFonts.manrope(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: LatticeColors.textPrimary,
                ),
              ),
              if (session?.plan == 'basic') ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: LatticeColors.warningBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: LatticeColors.warning.withAlpha(51)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.upgrade, color: LatticeColors.warning, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Upgrade to Elite',
                                style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: LatticeColors.textPrimary, fontSize: 13)),
                            const SizedBox(height: 2),
                            Text('Unlock AI drafting, court scraping & more',
                                style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textSecondary)),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: () {},
                        style: TextButton.styleFrom(foregroundColor: LatticeColors.primary),
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
        _CardWrapper(
          child: Row(
            children: [
              _StatTile(icon: Icons.folder_copy, value: '${session?.activeCases ?? 0}', label: 'Active Cases', color: LatticeColors.primary),
              _divider,
              _StatTile(icon: Icons.cloud, value: '${session?.storageUsedMb.toStringAsFixed(1) ?? '0.0'} MB', label: 'Storage Used', color: const Color(0xFF8B5CF6)),
              _divider,
              _StatTile(icon: Icons.group, value: '${session?.teamMembers ?? 1}', label: 'Team Members', color: LatticeColors.successDark),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Notification settings
        _SectionHeader(title: '🔔 NOTIFICATIONS'),
        const SizedBox(height: 8),
        _CardWrapper(
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
              _divider2,
              _NotificationToggle(
                icon: Icons.sms,
                iconColor: LatticeColors.primary,
                title: 'SMS Alerts',
                subtitle: 'Urgent court updates via SMS',
                value: _smsEnabled,
                onChanged: (v) => setState(() => _smsEnabled = v),
              ),
              _divider2,
              _NotificationToggle(
                icon: Icons.email_outlined,
                iconColor: const Color(0xFF8B5CF6),
                title: 'Email Notifications',
                subtitle: 'Daily case diary digest',
                value: _emailEnabled,
                onChanged: (v) => setState(() => _emailEnabled = v),
              ),
              _divider2,
              _NotificationToggle(
                icon: Icons.notifications_outlined,
                iconColor: LatticeColors.warning,
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
        _CardWrapper(
          child: Column(
            children: [
              _SettingsTile(
                icon: Icons.language,
                title: 'Language',
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('English', style: GoogleFonts.inter(fontSize: 13, color: LatticeColors.textSecondary)),
                    const SizedBox(width: 8),
                    const Icon(Icons.chevron_right, color: LatticeColors.textTertiary, size: 18),
                  ],
                ),
                onTap: () {},
              ),
              _divider2,
              _SettingsTile(
                icon: Icons.dark_mode_outlined,
                title: 'Dark Mode',
                trailing: Switch(
                  value: false,
                  onChanged: (_) {},
                  activeColor: LatticeColors.primary,
                ),
              ),
              _divider2,
              _SettingsTile(
                icon: Icons.help_outline,
                title: 'Help & Support',
                trailing: const Icon(Icons.chevron_right, color: LatticeColors.textTertiary, size: 18),
                onTap: () {},
              ),
              _divider2,
              _SettingsTile(
                icon: Icons.privacy_tip_outlined,
                title: 'Privacy Policy',
                trailing: const Icon(Icons.chevron_right, color: LatticeColors.textTertiary, size: 18),
                onTap: () {},
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Logout
        _CardWrapper(
          child: InkWell(
            onTap: _logout,
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(color: LatticeColors.errorBg, borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.logout, color: LatticeColors.error, size: 18),
                ),
                title: _loadingLogout
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: LatticeColors.error))
                    : Text('Logout', style: GoogleFonts.inter(fontSize: 15, color: LatticeColors.error, fontWeight: FontWeight.w600)),
                trailing: const Icon(Icons.chevron_right, color: LatticeColors.textTertiary, size: 18),
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
                  style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textTertiary)),
              const SizedBox(height: 4),
              Text('LETESE Legal Technologies Pvt. Ltd.',
                  style: GoogleFonts.inter(fontSize: 10, color: LatticeColors.textTertiary.withAlpha(128))),
            ],
          ),
        ),
        const SizedBox(height: 40),
      ],
    );
  }

  Widget get _divider => Container(width: 1, height: 40, color: LatticeColors.cardBorder);
  Widget get _divider2 => const Divider(color: LatticeColors.cardBorder, height: 1);

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: LatticeColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Logout?', style: GoogleFonts.manrope(color: LatticeColors.textPrimary, fontWeight: FontWeight.w700)),
        content: Text('Are you sure you want to logout of LETESE?', style: GoogleFonts.inter(color: LatticeColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Cancel', style: GoogleFonts.inter(color: LatticeColors.textSecondary))),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: LatticeColors.error),
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

class _CardWrapper extends StatelessWidget {
  final Widget child;
  const _CardWrapper({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: LatticeColors.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [
          BoxShadow(color: LatticeColors.shadow, blurRadius: 16, offset: Offset(0, 4)),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: child,
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(left: 4),
    child: Align(
      alignment: Alignment.centerLeft,
      child: Text(title, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: LatticeColors.textSecondary, letterSpacing: 1.2)),
    ),
  );
}

class _RoleBadge extends StatelessWidget {
  final String role;
  const _RoleBadge({required this.role});

  @override
  Widget build(BuildContext context) {
    final color = role == 'admin' ? LatticeColors.primary
        : role == 'partner' ? const Color(0xFF8B5CF6)
        : LatticeColors.successDark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withAlpha(77)),
      ),
      child: Text(role.toUpperCase(),
          style: GoogleFonts.inter(fontSize: 10, color: color, fontWeight: FontWeight.w700)),
    );
  }
}

class _PlanBadge extends StatelessWidget {
  final String plan;
  const _PlanBadge({required this.plan});

  @override
  Widget build(BuildContext context) {
    final color = plan == 'enterprise' ? const Color(0xFF8B5CF6)
        : plan == 'elite' ? LatticeColors.primary
        : LatticeColors.textTertiary;
    final label = plan == 'enterprise' ? 'ENTERPRISE'
        : plan == 'elite' ? 'ELITE'
        : 'BASIC';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withAlpha(77)),
      ),
      child: Text(label, style: GoogleFonts.inter(fontSize: 10, color: color, fontWeight: FontWeight.w700)),
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
          Text(value, style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w700, color: color)),
          const SizedBox(height: 2),
          Text(label, style: GoogleFonts.inter(fontSize: 10, color: LatticeColors.textTertiary), textAlign: TextAlign.center),
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
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: iconColor.withAlpha(20), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, color: iconColor, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: LatticeColors.textPrimary)),
                Text(subtitle, style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textSecondary)),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: LatticeColors.primary,
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget trailing;
  final VoidCallback? onTap;

  const _SettingsTile({required this.icon, required this.title, required this.trailing, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Icon(icon, color: LatticeColors.textSecondary, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(title, style: GoogleFonts.inter(fontSize: 14, color: LatticeColors.textPrimary)),
            ),
            trailing,
          ],
        ),
      ),
    );
  }
}