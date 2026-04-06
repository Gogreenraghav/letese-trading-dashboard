/// LETESE — Customer Admin Dashboard
/// Law Firm Management Panel
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class CustomerAdminScreen extends ConsumerWidget {
  const CustomerAdminScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: LatticeColors.bgBase,
      body: Row(
        children: [
          // ── Sidebar ──────────────────────────────────────────
          Container(
            width: 260,
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Color(0x142B51C7), blurRadius: 16, offset: const Offset(4, 0))],
            ),
            child: Column(
              children: [
                const SizedBox(height: 20),
                // Logo
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Image.asset('assets/letese_logo.png', height: 44),
                ),
                const SizedBox(height: 6),
                // Firm name
                Text('Sharma Law Partners',
                  style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textSec)),
                const SizedBox(height: 24),
                // Nav
                _NavItem(icon: Icons.dashboard_rounded, label: 'Dashboard', active: true),
                _NavItem(icon: Icons.gavel_rounded, label: 'Cases'),
                _NavItem(icon: Icons.group_rounded, label: 'Team Members'),
                _NavItem(icon: Icons.smart_toy_rounded, label: 'AI & Drafts'),
                _NavItem(icon: Icons.chat_rounded, label: 'Communications'),
                _NavItem(icon: Icons.analytics_rounded, label: 'Analytics'),
                _NavItem(icon: Icons.currency_exchange_rounded, label: 'Billing & Payments'),
                _NavItem(icon: Icons.phone_android_rounded, label: 'WhatsApp Hub'),
                _NavItem(icon: Icons.summarize_rounded, label: 'Reports'),
                _NavItem(icon: Icons.settings_rounded, label: 'Settings'),
                const Spacer(),
                // User
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(
                          color: Color(0xFF2B51C7),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(child: Text('RS', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white))),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Rajesh Sharma', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                            Text('Admin', style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textSec)),
                          ],
                        ),
                      ),
                      Icon(Icons.edit_rounded, size: 16, color: LatticeColors.textSec),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Main Canvas ────────────────────────────────────────
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                  colors: [Color(0xFF819BFF), Color(0xFF2B51C7)],
                ),
              ),
              child: Column(
                children: [
                  // Top bar
                  Container(
                    height: 60,
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    decoration: BoxDecoration(color: Colors.white.withAlpha(26)),
                    child: Row(
                      children: [
                        Text('Welcome back, Rajesh 👋',
                          style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(26),
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.notifications_rounded, color: Colors.white, size: 18),
                              const SizedBox(width: 6),
                              Text('5', style: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white)),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Text('+ Quick Add',
                            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF0037AD))),
                        ),
                      ],
                    ),
                  ),

                  // Content
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          // Stats
                          Row(
                            children: [
                              _StatCard(label: 'Active Cases', value: '47', icon: Icons.gavel_rounded, color: Color(0xFF0037AD)),
                              const SizedBox(width: 16),
                              _StatCard(label: 'Team Members', value: '8', icon: Icons.group_rounded, color: Color(0xFF0037AD)),
                              const SizedBox(width: 16),
                              _StatCard(label: 'Hearings This Week', value: '12', icon: Icons.event_rounded, color: Color(0xFF0037AD)),
                              const SizedBox(width: 16),
                              _StatCard(label: 'Revenue', value: '₹2.4L', icon: Icons.currency_exchange_rounded, color: Color(0xFF59FEAE), valueColor: Color(0xFF59FEAE)),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // Cases + Team
                          IntrinsicHeight(
                            child: Row(
                              children: [
                                Expanded(
                                  flex: 3,
                                  child: _GlassCard(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text('Active Cases',
                      style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                                            const Spacer(),
                                            TextButton(onPressed: () {}, child: Text('View All →',
                      style: GoogleFonts.inter(fontSize: 13, color: Color(0xFF0037AD)))),
                                          ],
                                        ),
                                        const SizedBox(height: 16),
                                        _CaseMiniRow(status: '🔴', caseName: 'S.C.Jain vs State', court: 'P&H HC', hearing: '30 Jul • 10:30 AM', active: true),
                                        _CaseMiniRow(status: '🟡', caseName: 'Mehta vs Union', court: 'Delhi HC', hearing: '02 Aug • 11:00 AM', active: false),
                                        _CaseMiniRow(status: '🟢', caseName: 'R.Singh vs Steel', court: 'SC', hearing: 'Order Reserved', active: false),
                                        _CaseMiniRow(status: '🔴', caseName: 'State vs Kumar', court: 'Dist. Court', hearing: '15 Aug • 2:00 PM', active: false),
                                        const SizedBox(height: 12),
                                        Center(
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                            decoration: BoxDecoration(
                                              color: Color(0xFF0037AD),
                                              borderRadius: BorderRadius.circular(100),
                                            ),
                                            child: Text('+ Add New Case',
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white)),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 24),
                                Expanded(
                                  flex: 2,
                                  child: _GlassCard(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text('Team Members',
                      style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                                            const Spacer(),
                                            TextButton(onPressed: () {}, child: Text('Manage →',
                      style: GoogleFonts.inter(fontSize: 13, color: Color(0xFF0037AD)))),
                                          ],
                                        ),
                                        const SizedBox(height: 16),
                                        _MemberRow(name: 'Rajesh Sharma', role: 'Admin', status: '🟢', active: true),
                                        _MemberRow(name: 'Priya Mehta', role: 'Advocate', status: '🟢', active: true),
                                        _MemberRow(name: 'Amit Kumar', role: 'Paralegal', status: '🟡', active: false),
                                        _MemberRow(name: 'Sneha R', role: 'Intern', status: '⚫', active: false),
                                        const SizedBox(height: 12),
                                        Text('+ Invite Member',
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF0037AD))),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // AI Drafts + Communications
                          IntrinsicHeight(
                            child: Row(
                              children: [
                                Expanded(
                                  child: _GlassCard(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text('Recent AI Drafts',
                      style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                                            const Spacer(),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: Color(0xFF59FEAE).withAlpha(26),
                                                borderRadius: BorderRadius.circular(100),
                                              ),
                                              child: Text('AI ✓',
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF59FEAE))),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 16),
                                        _DraftRow(title: 'Reply to Section 5 Application', caseId: 'SC-2024-00412', time: '10 min ago', status: 'AI ✓'),
                                        _DraftRow(title: 'Viva Voce Arguments Draft', caseId: 'WP-2024-1182', time: '1h ago', status: 'AI ✓'),
                                        _DraftRow(title: 'Counter Affidavit', caseId: 'CA-2023-8891', time: '2h ago', status: 'Pending'),
                                        _DraftRow(title: 'LOC Reply Draft', caseId: 'CRLP-2024-224', time: '3h ago', status: 'AI ✓'),
                                        const SizedBox(height: 12),
                                        Text('Open AI Assistant →',
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF0037AD))),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 24),
                                Expanded(
                                  child: _GlassCard(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text('Communications',
                      style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                                            Container(
                                              margin: const EdgeInsets.only(left: 8),
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: Color(0xFFB41340),
                                                borderRadius: BorderRadius.circular(100),
                                              ),
                                              child: Text('5',
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
                                            ),
                                            const Spacer(),
                                            // Channel tabs
                                            Row(
                                              children: [
                                                _ChannelTab(label: 'WhatsApp', active: true),
                                                const SizedBox(width: 4),
                                                _ChannelTab(label: 'Email', active: false),
                                                const SizedBox(width: 4),
                                                _ChannelTab(label: 'SMS', active: false),
                                              ],
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 16),
                                        _CommRow(client: 'Rakesh Client', msg: 'Case hearing date confirmed', status: 'Sent ✓', time: '5m ago'),
                                        _CommRow(client: 'Mehta Properties', msg: 'Documents received', status: 'Delivered ✓', time: '15m ago'),
                                        _CommRow(client: 'Advocate Singh', msg: 'Invoice attached', status: 'Read ✓', time: '30m ago'),
                                        const SizedBox(height: 12),
                                        Text('Open WhatsApp Hub →',
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF0037AD))),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Billing + Analytics
                          IntrinsicHeight(
                            child: Row(
                              children: [
                                Expanded(
                                  child: _GlassCard(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('This Month Billing',
                      style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                                        const SizedBox(height: 16),
                                        Text('Pro Plan — ₹2,000/month',
                      style: GoogleFonts.inter(fontSize: 14, color: LatticeColors.textSec)),
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            Text('847 / 1000 cases used',
                      style: GoogleFonts.inter(fontSize: 13, color: LatticeColors.textSec)),
                                            const Spacer(),
                                            Text('₹2,000 due on 1st Aug',
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFFB41340))),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(4),
                                          child: LinearProgressIndicator(
                                            value: 0.847,
                                            backgroundColor: Color(0xFFE1E2E7),
                                            valueColor: AlwaysStoppedAnimation(Color(0xFF0037AD)),
                                            minHeight: 8,
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(vertical: 10),
                                                decoration: BoxDecoration(
                                                  color: Color(0xFF0037AD),
                                                  borderRadius: BorderRadius.circular(100),
                                                ),
                                                child: Text('Upgrade Plan →',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white), textAlign: TextAlign.center),
                                              ),
                                            ),
                                            const SizedBox(width: 12),
                                            TextButton(onPressed: () {}, child: Text('Invoice History →',
                      style: GoogleFonts.inter(fontSize: 13, color: Color(0xFF0037AD)))),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 24),
                                Expanded(
                                  child: _GlassCard(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Performance This Month',
                      style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                                        const SizedBox(height: 16),
                                        _PerfRow(label: 'Cases Won', value: '12'),
                                        _PerfRow(label: 'Cases Lost', value: '3'),
                                        _PerfRow(label: 'Hearings Attended', value: '28'),
                                        _PerfRow(label: 'AI Drafts Generated', value: '47'),
                                        _PerfRow(label: 'Client Messages Sent', value: '156'),
                                        const SizedBox(height: 12),
                                        Text('View Full Analytics →',
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF0037AD))),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // AIPOT Alerts
                          _GlassCard(
                            child: Row(
                              children: [
                                Icon(Icons.bolt_rounded, color: Color(0xFF0037AD), size: 24),
                                const SizedBox(width: 12),
                                Text('⚡ AIPOT — Relevant Judgments Found',
                      style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                                const Spacer(),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Color(0xFFB41340).withAlpha(20),
                                    borderRadius: BorderRadius.circular(100),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 8, height: 8,
                                        decoration: BoxDecoration(
                                          color: Color(0xFFB41340), shape: BoxShape.circle,
                                          boxShadow: [BoxShadow(color: Color(0xFFB41340).withAlpha(128), blurRadius: 6)],
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text('LIVE',
                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFB41340))),
                                    ],
                                  ),
                                ),
                                const Spacer(),
                                TextButton(onPressed: () {}, child: Text('View All →',
                      style: GoogleFonts.inter(fontSize: 13, color: Color(0xFF0037AD)))),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          IntrinsicHeight(
                            child: Row(
                              children: [
                                Expanded(child: _AipotAlert(court: '🏛️ SC', text: 'Similar precedent found for SC-2024-00412', time: '20m ago')),
                                const SizedBox(width: 16),
                                Expanded(child: _AipotAlert(court: '⚖️ P&H HC', text: 'New judgment: Kishore vs State — IPC 420', time: '1h ago')),
                                const SizedBox(width: 16),
                                Expanded(child: _AipotAlert(court: '🏛️ SC', text: 'Constitutional bench ruling relevant', time: '3h ago')),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GlassCard extends StatelessWidget {
  final Widget child;
  const _GlassCard({required this.child});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(216),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Color(0x142B51C7), blurRadius: 24, offset: const Offset(0, 8))],
      ),
      child: child,
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  const _NavItem({required this.icon, required this.label, this.active = false});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: active ? Color(0xFF0037AD).withAlpha(15) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: active ? Color(0xFF0037AD) : LatticeColors.textSec),
            const SizedBox(width: 10),
            Text(label, style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: active ? FontWeight.w600 : FontWeight.w400,
              color: active ? Color(0xFF0037AD) : LatticeColors.textSec)),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  final Color? valueColor;
  const _StatCard({required this.label, required this.value, required this.icon, required this.color, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(216),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Color(0x142B51C7), blurRadius: 24, offset: const Offset(0, 8))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 12),
            Text(value, style: GoogleFonts.manrope(
              fontSize: 28, fontWeight: FontWeight.w800,
              color: valueColor ?? color, letterSpacing: -0.5)),
            const SizedBox(height: 4),
            Text(label, style: GoogleFonts.inter(fontSize: 12, color: LatticeColors.textSec)),
          ],
        ),
      ),
    );
  }
}

class _CaseMiniRow extends StatelessWidget {
  final String status, caseName, court, hearing;
  final bool active;
  const _CaseMiniRow({required this.status, required this.caseName, required this.court, required this.hearing, required this.active});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: active ? Color(0xFF0037AD).withAlpha(10) : Color(0xFFF2F3F9),
        borderRadius: BorderRadius.circular(12),
        border: active ? Border.all(color: Color(0xFF0037AD).withAlpha(60)) : null,
      ),
      child: Row(
        children: [
          Text(status, style: GoogleFonts.inter(fontSize: 13)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(caseName, style: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w600, color: LatticeColors.text), maxLines: 1, overflow: TextOverflow.ellipsis),
                Text('$court  •  $hearing', style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textSec)),
              ],
            ),
          ),
          Icon(Icons.chevron_right, size: 18, color: LatticeColors.textDim),
        ],
      ),
    );
  }
}

class _MemberRow extends StatelessWidget {
  final String name, role, status;
  final bool active;
  const _MemberRow({required this.name, required this.role, required this.status, required this.active});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: active ? Color(0xFF0037AD) : Color(0xFFE1E2E7),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(name.split(' ').map((n) => n[0]).take(2).join(),
                style: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w700,
                  color: active ? Colors.white : LatticeColors.textSec)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w600, color: LatticeColors.text)),
                Text(role, style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textSec)),
              ],
            ),
          ),
          Text(status, style: GoogleFonts.inter(fontSize: 14)),
        ],
      ),
    );
  }
}

class _DraftRow extends StatelessWidget {
  final String title, caseId, time, status;
  const _DraftRow({required this.title, required this.caseId, required this.time, required this.status});

  @override
  Widget build(BuildContext context) {
    final isAI = status == 'AI ✓';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: isAI ? Color(0xFF59FEAE).withAlpha(26) : Color(0xFFFFB547).withAlpha(26),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.smart_toy_rounded,
              size: 18, color: isAI ? Color(0xFF59FEAE) : Color(0xFFFFB547)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.inter(fontSize: 13, color: LatticeColors.text), maxLines: 1, overflow: TextOverflow.ellipsis),
                Text('$caseId  •  $time', style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textSec)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: isAI ? Color(0xFF59FEAE).withAlpha(26) : Color(0xFFFFB547).withAlpha(26),
              borderRadius: BorderRadius.circular(100),
            ),
            child: Text(status,
              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600,
                color: isAI ? Color(0xFF59FEAE) : Color(0xFFFFB547))),
          ),
        ],
      ),
    );
  }
}

class _ChannelTab extends StatelessWidget {
  final String label;
  final bool active;
  const _ChannelTab({required this.label, required this.active});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: active ? Color(0xFF0037AD) : Color(0xFFF2F3F9),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(label,
        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500,
          color: active ? Colors.white : LatticeColors.textSec)),
    );
  }
}

class _CommRow extends StatelessWidget {
  final String client, msg, status, time;
  const _CommRow({required this.client, required this.msg, required this.status, required this.time});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: Color(0xFF25D366).withAlpha(26), borderRadius: BorderRadius.circular(10)),
            child: Icon(Icons.chat_rounded, size: 18, color: Color(0xFF25D366)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(client, style: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w600, color: LatticeColors.text)),
                Text(msg, style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textSec)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(status, style: GoogleFonts.inter(fontSize: 11, color: Color(0xFF59FEAE))),
              Text(time, style: GoogleFonts.inter(fontSize: 10, color: LatticeColors.textDim)),
            ],
          ),
        ],
      ),
    );
  }
}

class _PerfRow extends StatelessWidget {
  final String label, value;
  const _PerfRow({required this.label, required this.value});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 13, color: LatticeColors.textSec)),
          const Spacer(),
          Text(value, style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0037AD))),
        ],
      ),
    );
  }
}

class _AipotAlert extends StatelessWidget {
  final String court, text, time;
  const _AipotAlert({required this.court, required this.text, required this.time});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Color(0xFF0037AD).withAlpha(10),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFF0037AD).withAlpha(40)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(court, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF0037AD))),
              const Spacer(),
              Text(time, style: GoogleFonts.inter(fontSize: 10, color: LatticeColors.textDim)),
            ],
          ),
          const SizedBox(height: 6),
          Text(text, style: GoogleFonts.inter(fontSize: 12, color: LatticeColors.text), maxLines: 2, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}
