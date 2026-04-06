/// LETESE — Case Diary Screen
/// The Elevated Advocate Design System
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import 'package:intl/intl.dart';

final casesProvider = FutureProvider<List<Case>>((ref) async {
  final dio = ref.read(dioProvider);
  return CasesApi(dio).listCases();
});
final selectedCaseProvider = StateProvider<String?>((ref) => null);

class CaseDiaryScreen extends ConsumerStatefulWidget {
  const CaseDiaryScreen({super.key});
  @override ConsumerState<CaseDiaryScreen> createState() => _CaseDiaryScreenState();
}

class _CaseDiaryScreenState extends ConsumerState<CaseDiaryScreen> {
  String? _filterStatus;
  String? _filterCourt;
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final casesAsync = ref.watch(casesProvider);

    return Scaffold(
      backgroundColor: LatticeColors.bgBase,
      body: Stack(
        children: [
          // Sky gradient header band
          Positioned(
            top: 0, left: 0, right: 0,
            child: Container(
              height: 200,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter, end: Alignment.bottomCenter,
                  colors: [LatticeColors.skyTop, LatticeColors.skyBot],
                ),
              ),
            ),
          ),
          // Content
          CustomScrollView(
            slivers: [
              // App bar
              SliverAppBar(
                backgroundColor: Colors.transparent,
                elevation: 0,
                pinned: false,
                expandedHeight: 88,
                toolbarHeight: 88,
                flexibleSpace: FlexibleSpaceBar(
                  background: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 52, 20, 0),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Case Diary',
                                style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
                              Text(
                                '${DateFormat('d MMM yyyy').format(DateTime.now())} • ${casesAsync.valueOrNull?.length ?? 0} cases',
                                style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withAlpha(179)),
                              ),
                            ],
                          ),
                        ),
                        // Add button
                        GestureDetector(
                          onTap: () => Navigator.of(context).pushNamed('/cases/new'),
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withAlpha(26),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.add, color: Colors.white, size: 22),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Search
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                  child: Container(
                    decoration: BoxDecoration(
                      color: LatticeColors.glassHi,
                      borderRadius: BorderRadius.circular(100),
                      boxShadow: ElevShadow.md(LatticeColors.primary),
                    ),
                    child: TextField(
                      onChanged: (v) => setState(() => _search = v),
                      style: GoogleFonts.inter(fontSize: 14, color: LatticeColors.text),
                      decoration: InputDecoration(
                        hintText: 'Search cases, clients...',
                        hintStyle: GoogleFonts.inter(fontSize: 14, color: LatticeColors.textDim),
                        prefixIcon: const Icon(Icons.search, color: LatticeColors.primary, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(100), borderSide: BorderSide.none),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(100), borderSide: BorderSide.none),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(100), borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      ),
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 12)),

              // Filter chips
              SliverToBoxAdapter(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      _FilterChip(label: 'All', selected: _filterStatus == null && _filterCourt == null,
                        onTap: () => setState(() { _filterStatus = null; _filterCourt = null; })),
                      const SizedBox(width: 8),
                      _FilterChip(label: 'Urgent', selected: _filterStatus == 'critical',
                        onTap: () => setState(() => _filterStatus = _filterStatus == 'critical' ? null : 'critical')),
                      _FilterChip(label: 'Active', selected: _filterStatus == 'active',
                        onTap: () => setState(() => _filterStatus = _filterStatus == 'active' ? null : 'active')),
                      const SizedBox(width: 8),
                      _FilterChip(label: 'PHAHC', selected: _filterCourt == 'PHAHC',
                        onTap: () => setState(() => _filterCourt = _filterCourt == 'PHAHC' ? null : 'PHAHC')),
                      _FilterChip(label: 'DHC', selected: _filterCourt == 'DHC',
                        onTap: () => setState(() => _filterCourt = _filterCourt == 'DHC' ? null : 'DHC')),
                      _FilterChip(label: 'SC', selected: _filterCourt == 'SC',
                        onTap: () => setState(() => _filterCourt = _filterCourt == 'SC' ? null : 'SC')),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 16)),

              // Case list
              casesAsync.when(
                loading: () => const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator(color: LatticeColors.primary)),
                ),
                error: (e, _) => SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.error_outline, size: 48, color: LatticeColors.error),
                        const SizedBox(height: 12),
                        Text('Failed to load cases', style: Txt.bodyMD(LatticeColors.textSec)),
                        TextButton(
                          onPressed: () => ref.invalidate(casesProvider),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
                data: (cases) {
                  var filtered = cases.where((c) {
                    if (_filterStatus != null && c.status != _filterStatus) return false;
                    if (_filterCourt != null && c.courtCode != _filterCourt) return false;
                    if (_search.isNotEmpty) {
                      final q = _search.toLowerCase();
                      return c.caseTitle.toLowerCase().contains(q) || c.clientName.toLowerCase().contains(q);
                    }
                    return true;
                  }).toList();

                  if (filtered.isEmpty) {
                    return SliverFillRemaining(
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.folder_open, size: 64, color: LatticeColors.textDim),
                            const SizedBox(height: 16),
                            Text('No cases found', style: Txt.headlineSM(LatticeColors.textSec)),
                            const SizedBox(height: 16),
                            ElevatedButton.icon(
                              onPressed: () => Navigator.of(context).pushNamed('/cases/new'),
                              icon: const Icon(Icons.add),
                              label: const Text('Add First Case'),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (ctx, i) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _CaseCard(case_: filtered[i]),
                        ),
                        childCount: filtered.length,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Filter Chip ─────────────────────────────────────────────────────────────

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? LatticeColors.primary : LatticeColors.glassHi,
          borderRadius: BorderRadius.circular(100),
          boxShadow: selected ? ElevShadow.xs(LatticeColors.primary) : ElevShadow.sm(LatticeColors.primary),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500,
            color: selected ? Colors.white : LatticeColors.textSec),
        ),
      ),
    );
  }
}

// ── Case Card — Floating Row (no solid border) ─────────────────────────────

class _CaseCard extends ConsumerWidget {
  final Case case_;
  const _CaseCard({required this.case_});

  Color get _accentColor => switch (case_.urgencyLevel) {
    'critical' => LatticeColors.error,
    'high' => LatticeColors.warn,
    'medium' => LatticeColors.warn,
    _ => LatticeColors.success,
  };

  String get _statusLabel => switch (case_.urgencyLevel) {
    'critical' => 'CRITICAL',
    'high' => 'HIGH',
    'medium' => 'MEDIUM',
    _ => case_.status.toUpperCase(),
  };

  String get _daysLabel {
    if (case_.nextHearingAt == null) return 'No date';
    final d = case_.nextHearingAt!.difference(DateTime.now()).inDays;
    if (d < 0) return '${-d}d overdue';
    if (d == 0) return 'Today';
    if (d == 1) return 'Tomorrow';
    return '$d days';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: () {
        ref.read(selectedCaseProvider.notifier).state = case_.caseId;
        Navigator.of(context).pushNamed('/cases/${case_.caseId}');
      },
      child: FloatingRow(
        accentColor: _accentColor,
        radius: 16,
        pad: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        onTap: () {},
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    case_.caseTitle,
                    style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w600, color: LatticeColors.text),
                    maxLines: 1, overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 12),
                // Status chip with Advocate Pulse
                StatusChip(label: _statusLabel, color: _accentColor),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                // Court badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: LatticeColors.primary.withAlpha(15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(case_.courtCode,
                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: LatticeColors.primary)),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(case_.clientName,
                    style: GoogleFonts.inter(fontSize: 12, color: LatticeColors.textSec),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
                Row(
                  children: [
                    if (case_.nextHearingAt != null) ...[
                      Icon(Icons.calendar_today, size: 12, color: LatticeColors.textDim),
                      const SizedBox(width: 4),
                      Text(_daysLabel,
                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: _accentColor)),
                    ],
                    const SizedBox(width: 8),
                    Icon(Icons.chevron_right, size: 18, color: LatticeColors.textDim),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
