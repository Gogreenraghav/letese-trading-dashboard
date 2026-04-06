/// LETESE — Super Admin Dashboard
/// "The Luminescent Litigator" Design System
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class SuperAdminScreen extends ConsumerWidget {
  const SuperAdminScreen({super.key});

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
                const SizedBox(height: 24),
                // Logo
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Image.asset('assets/letese_logo.png', height: 44, width: 160),
                ),
                const SizedBox(height: 32),
                // Nav items
                _SidebarItem(icon: Icons.dashboard_rounded, label: 'Dashboard', active: true),
                _SidebarItem(icon: Icons.apartment_rounded, label: 'Tenants'),
                _SidebarItem(icon: Icons.api_rounded, label: 'API Vendors'),
                _SidebarItem(icon: Icons.group_rounded, label: 'All Users'),
                _SidebarItem(icon: Icons.monitor_heart_rounded, label: 'System Health'),
                _SidebarItem(icon: Icons.security_rounded, label: 'Security & Logs'),
                _SidebarItem(icon: Icons.notifications_rounded, label: 'Notifications'),
                _SidebarItem(icon: Icons.settings_rounded, label: 'Settings'),
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
                        child: Center(child: Text('👑', style: TextStyle(fontSize: 18))),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Super Admin', style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                            Text('Global Access', style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textSec)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
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
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(26),
                    ),
                    child: Row(
                      children: [
                        Text('Super Admin Dashboard',
                          style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
                        const Spacer(),
                        // Status badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(26),
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 8, height: 8,
                                decoration: BoxDecoration(color: Color(0xFF59FEAE), shape: BoxShape.circle,
                                  boxShadow: [BoxShadow(color: Color(0xFF59FEAE).withAlpha(128), blurRadius: 6)]),
                              ),
                              const SizedBox(width: 8),
                              Text('All Systems Operational',
                                style: GoogleFonts.inter(fontSize: 13, color: Colors.white, fontWeight: FontWeight.w500)),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Icon(Icons.refresh_rounded, color: Colors.white.withAlpha(179), size: 20),
                      ],
                    ),
                  ),

                  // Content
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Stats row
                          Row(
                            children: [
                              _StatCard(
                                icon: Icons.apartment_rounded,
                                label: 'Active Tenants',
                                value: '247',
                                color: Color(0xFF0037AD),
                              ),
                              const SizedBox(width: 16),
                              _StatCard(
                                icon: Icons.group_rounded,
                                label: 'Total Users',
                                value: '12,480',
                                color: Color(0xFF0037AD),
                              ),
                              const SizedBox(width: 16),
                              _StatCard(
                                icon: Icons.bolt_rounded,
                                label: 'API Calls Today',
                                value: '8.4M',
                                color: Color(0xFF0037AD),
                              ),
                              const SizedBox(width: 16),
                              _StatCard(
                                icon: Icons.currency_rupee_rounded,
                                label: 'Revenue Today',
                                value: '₹4.2L',
                                color: Color(0xFF59FEAE),
                                valueColor: Color(0xFF59FEAE),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // Two column layout
                          IntrinsicHeight(
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                // Left — System Health
                                Expanded(
                                  flex: 3,
                                  child: _GlassCard(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text('System Health',
                      style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                                            const Spacer(),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: Color(0xFF59FEAE).withAlpha(26),
                                                borderRadius: BorderRadius.circular(100),
                                              ),
                                              child: Text('All Green ✓',
                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF59FEAE))),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 20),
                                        _HealthItem(label: 'API Server', status: '🟢 Online', latency: '98ms'),
                                        _HealthItem(label: 'Database', status: '🟢 Online', latency: '12ms'),
                                        _HealthItem(label: 'Kafka', status: '🟢 Running', latency: ''),
                                        _HealthItem(label: 'AI Models', status: '🟢 Active', latency: ''),
                                        _HealthItem(label: 'CDN', status: '🟢 Healthy', latency: ''),
                                        const SizedBox(height: 20),
                                        _MiniBar(label: 'CPU', value: 0.34),
                                        const SizedBox(height: 12),
                                        _MiniBar(label: 'RAM', value: 0.58),
                                        const SizedBox(height: 12),
                                        _MiniBar(label: 'Disk', value: 0.42),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 24),
                                // Right — Recent Activity
                                Expanded(
                                  flex: 2,
                                  child: _GlassCard(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Recent Activity',
                      style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                                        const SizedBox(height: 16),
                                        _ActivityItem(text: 'New tenant: Sharma Law Firm', time: '2m ago', dotColor: Color(0xFF0037AD)),
                                        _ActivityItem(text: 'Payment received: ₹12,000', time: '5m ago', dotColor: Color(0xFF59FEAE)),
                                        _ActivityItem(text: 'New user: Priya Mehta', time: '8m ago', dotColor: Color(0xFF0037AD)),
                                        _ActivityItem(text: 'API limit warning: Acme Corp', time: '12m ago', dotColor: Color(0xFFFFB547)),
                                        _ActivityItem(text: 'System backup completed', time: '15m ago', dotColor: Color(0xFF59FEAE)),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Tenants Table
                          _GlassCard(
                            pad: 0,
                            child: Column(
                              children: [
                                Padding(
                                  padding: const EdgeInsets.all(20),
                                  child: Row(
                                    children: [
                                      Text('All Tenants',
                    style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                                      const Spacer(),
                                      TextButton.icon(
                                        onPressed: () {},
                                        icon: const Icon(Icons.download_rounded, size: 16),
                                        label: const Text('Export CSV'),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                        decoration: BoxDecoration(
                                          color: Color(0xFF0037AD),
                                          borderRadius: BorderRadius.circular(100),
                                        ),
                                        child: Text('+ Add Tenant',
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white)),
                                      ),
                                    ],
                                  ),
                                ),
                                DataTable(
                                  headingRowColor: WidgetStateProperty.all(Color(0xFFF2F3F9)),
                                  columns: [
                                    DataColumn(label: Text('Tenant', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
                                    DataColumn(label: Text('Plan', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
                                    DataColumn(label: Text('Users', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
                                    DataColumn(label: Text('Cases', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
                                    DataColumn(label: Text('Status', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
                                    DataColumn(label: Text('Revenue', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
                                  ],
                                  rows: [
                                    _tenantRow('Sharma Law Partners', 'Pro', '24', '847', '🟢 Active', '₹24K/mo'),
                                    _tenantRow('Advocate Associates', 'Pro', '12', '423', '🟢 Active', '₹12K/mo'),
                                    _tenantRow('Legal Eagles', 'Free', '5', '89', '🟡 Trial', '₹0'),
                                    _tenantRow('Justice First', 'Pro', '18', '612', '🟢 Active', '₹18K/mo'),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // API Vendors + Alerts
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
                                            Text('API Vendors',
                      style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                                            const Spacer(),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                              decoration: BoxDecoration(
                                                color: Color(0xFF0037AD).withAlpha(20),
                                                borderRadius: BorderRadius.circular(100),
                                              ),
                                              child: Text('+ Add Vendor',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0037AD))),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 16),
                                        _VendorRow(name: 'OpenAI', status: '🟢 Active', calls: '2.4M', cost: '₹1.2L'),
                                        _VendorRow(name: 'Anthropic', status: '🟢 Active', calls: '890K', cost: '₹89K'),
                                        _VendorRow(name: 'Razorpay', status: '🟢 Active', calls: '—', cost: 'Payment'),
                                        _VendorRow(name: 'WhatsApp', status: '🟢 Active', calls: '—', cost: 'Business API'),
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
                                            Text('System Alerts',
                      style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                                            Container(
                                              margin: const EdgeInsets.only(left: 8),
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: Color(0xFFB41340),
                                                borderRadius: BorderRadius.circular(100),
                                              ),
                                              child: Text('3',
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 16),
                                        _AlertRow(color: Color(0xFFB41340), text: 'Storage at 78% — consider upgrade', time: '1h ago'),
                                        _AlertRow(color: Color(0xFFFFB547), text: 'OpenAI rate limit approaching', time: '2h ago'),
                                        _AlertRow(color: Color(0xFFB41340), text: 'Failed login attempts: 12 in 1h', time: '3h ago'),
                                      ],
                                    ),
                                  ),
                                ),
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

  DataRow _tenantRow(String tenant, String plan, String users, String cases, String status, String revenue) {
    return DataRow(cells: [
      DataCell(Text(tenant, style: GoogleFonts.inter(fontSize: 14, color: LatticeColors.text))),
      DataCell(Text(plan, style: GoogleFonts.inter(fontSize: 14, color: LatticeColors.text))),
      DataCell(Text(users, style: GoogleFonts.inter(fontSize: 14, color: LatticeColors.text))),
      DataCell(Text(cases, style: GoogleFonts.inter(fontSize: 14, color: LatticeColors.text))),
      DataCell(Text(status, style: GoogleFonts.inter(fontSize: 14))),
      DataCell(Text(revenue, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF0037AD)))),
    ]);
  }
}

class _GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? pad;
  final EdgeInsets? margin;
  const _GlassCard({required this.child, this.pad, this.margin});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: pad ?? const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(216),  // 85%
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Color(0x142B51C7), blurRadius: 24, offset: const Offset(0, 8))],
      ),
      child: child,
    );
  }
}

class _SidebarItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  const _SidebarItem({required this.icon, required this.label, this.active = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: active ? Color(0xFF0037AD).withAlpha(15) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: active ? Color(0xFF0037AD) : LatticeColors.textSec),
            const SizedBox(width: 12),
            Text(label,
              style: GoogleFonts.inter(fontSize: 14, fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                color: active ? Color(0xFF0037AD) : LatticeColors.textSec)),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final Color color;
  final Color? valueColor;
  const _StatCard({required this.icon, required this.label, required this.value, required this.color, this.valueColor});

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
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 12),
            Text(value,
              style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w800,
                color: valueColor ?? color, letterSpacing: -0.5)),
            const SizedBox(height: 4),
            Text(label,
              style: GoogleFonts.inter(fontSize: 12, color: LatticeColors.textSec)),
          ],
        ),
      ),
    );
  }
}

class _HealthItem extends StatelessWidget {
  final String label, status, latency;
  const _HealthItem({required this.label, required this.status, required this.latency});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Text(status, style: GoogleFonts.inter(fontSize: 13)),
          const SizedBox(width: 12),
          Expanded(Text(label, style: GoogleFonts.inter(fontSize: 13, color: LatticeColors.text))),
          if (latency.isNotEmpty)
            Text(latency, style: GoogleFonts.inter(fontSize: 12, color: LatticeColors.textSec)),
        ],
      ),
    );
  }
}

class _MiniBar extends StatelessWidget {
  final String label;
  final double value;
  const _MiniBar({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(width: 40, child: Text(label, style: GoogleFonts.inter(fontSize: 12, color: LatticeColors.textSec))),
        Expanded(
          child: Container(
            height: 8,
            decoration: BoxDecoration(
              color: Color(0xFFE1E2E7),
              borderRadius: BorderRadius.circular(4),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: value,
              child: Container(
                decoration: BoxDecoration(
                  color: Color(0xFF0037AD),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text('${(value*100).toInt()}%',
          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0037AD))),
      ],
    );
  }
}

class _ActivityItem extends StatelessWidget {
  final String text, time;
  final Color dotColor;
  const _ActivityItem({required this.text, required this.time, required this.dotColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 10, height: 10,
                decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
              ),
              Container(width: 1, height: 28, color: Color(0xFFE1E2E7)),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(text, style: GoogleFonts.inter(fontSize: 13, color: LatticeColors.text)),
                Text(time, style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textDim)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _VendorRow extends StatelessWidget {
  final String name, status, calls, cost;
  const _VendorRow({required this.name, required this.status, required this.calls, required this.cost});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: Color(0xFF0037AD).withAlpha(15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(child: Text('⚡', style: TextStyle(fontSize: 18))),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                Text('$status  •  $calls calls', style: GoogleFonts.inter(fontSize: 12, color: LatticeColors.textSec)),
              ],
            ),
          ),
          Text(cost, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF0037AD))),
        ],
      ),
    );
  }
}

class _AlertRow extends StatelessWidget {
  final Color color;
  final String text, time;
  const _AlertRow({required this.color, required this.text, required this.time});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(text, style: GoogleFonts.inter(fontSize: 13, color: LatticeColors.text)),
                Text(time, style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textDim)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
