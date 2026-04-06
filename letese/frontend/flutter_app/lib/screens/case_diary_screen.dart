/// LETESE● Case Diary Screen — Lattice Design System (Light Theme)
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import 'package:intl/intl.dart';

final casesProvider = FutureProvider<List<Case>>((ref) async {
  final dio = ref.read(dioProvider);
  final casesApi = CasesApi(dio);
  return casesApi.listCases();
});

final selectedCaseProvider = StateProvider<String?>((ref) => null);

class CaseDiaryScreen extends ConsumerStatefulWidget {
  const CaseDiaryScreen({super.key});

  @override
  ConsumerState<CaseDiaryScreen> createState() => _CaseDiaryScreenState();
}

class _CaseDiaryScreenState extends ConsumerState<CaseDiaryScreen> {
  String? _filterStatus;
  String? _filterCourt;
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final casesAsync = ref.watch(casesProvider);

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
              height: 180,
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
                        Expanded(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Case Diary',
                                style: GoogleFonts.manrope(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                              Text(
                                '${DateFormat('d MMM yyyy').format(DateTime.now())} • ${casesAsync.valueOrNull?.length ?? 0} cases',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: Colors.white.withAlpha(179),
                                ),
                              ),
                            ],
                          ),
                        ),
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

              // Search + Filters
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                  child: Column(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: LatticeColors.surface,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: const [
                            BoxShadow(color: LatticeColors.shadow, blurRadius: 12, offset: Offset(0, 3)),
                          ],
                        ),
                        child: TextField(
                          onChanged: (v) => setState(() => _searchQuery = v),
                          style: GoogleFonts.inter(color: LatticeColors.textPrimary, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Search cases, clients...',
                            hintStyle: GoogleFonts.inter(color: LatticeColors.textTertiary),
                            prefixIcon: const Icon(Icons.search, color: LatticeColors.textTertiary),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide.none,
                            ),
                            filled: true,
                            fillColor: LatticeColors.surface,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _FilterChip(
                              label: 'All',
                              selected: _filterStatus == null && _filterCourt == null,
                              onTap: () => setState(() {
                                _filterStatus = null;
                                _filterCourt = null;
                              }),
                            ),
                            const SizedBox(width: 8),
                            _FilterChip(
                              label: 'Urgent',
                              selected: _filterStatus == 'critical',
                              onTap: () => setState(() => _filterStatus = _filterStatus == 'critical' ? null : 'critical'),
                            ),
                            _FilterChip(
                              label: 'Active',
                              selected: _filterStatus == 'active',
                              onTap: () => setState(() => _filterStatus = _filterStatus == 'active' ? null : 'active'),
                            ),
                            const SizedBox(width: 8),
                            _FilterChip(
                              label: 'PHAHC',
                              selected: _filterCourt == 'PHAHC',
                              onTap: () => setState(() => _filterCourt = _filterCourt == 'PHAHC' ? null : 'PHAHC'),
                            ),
                            _FilterChip(
                              label: 'DHC',
                              selected: _filterCourt == 'DHC',
                              onTap: () => setState(() => _filterCourt = _filterCourt == 'DHC' ? null : 'DHC'),
                            ),
                            _FilterChip(
                              label: 'SC',
                              selected: _filterCourt == 'SC',
                              onTap: () => setState(() => _filterCourt = _filterCourt == 'SC' ? null : 'SC'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 16)),

              // Case List
              casesAsync.when(
                loading: () => const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator(color: LatticeColors.primary)),
                ),
                error: (e, _) => SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: LatticeColors.error),
                        const SizedBox(height: 12),
                        Text('Failed to load cases', style: GoogleFonts.inter(color: LatticeColors.textSecondary)),
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
                    if (_searchQuery.isNotEmpty) {
                      final q = _searchQuery.toLowerCase();
                      return c.caseTitle.toLowerCase().contains(q) ||
                          c.clientName.toLowerCase().contains(q);
                    }
                    return true;
                  }).toList();

                  if (filtered.isEmpty) {
                    return SliverFillRemaining(
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.folder_open, size: 64, color: LatticeColors.textTertiary),
                            const SizedBox(height: 16),
                            Text(
                              'No cases found',
                              style: GoogleFonts.manrope(
                                fontSize: 18,
                                color: LatticeColors.textSecondary,
                              ),
                            ),
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
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 90),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) => _CaseCard(case_: filtered[index]),
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

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: selected ? LatticeColors.primary : LatticeColors.surface,
            borderRadius: BorderRadius.circular(100),
            border: Border.all(color: selected ? LatticeColors.primary : LatticeColors.cardBorder),
            boxShadow: selected ? null : const [
              BoxShadow(color: LatticeColors.shadow, blurRadius: 8, offset: Offset(0, 2)),
            ],
          ),
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: selected ? Colors.white : LatticeColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}

class _CaseCard extends ConsumerWidget {
  final Case case_;
  const _CaseCard({required this.case_});

  Color get _urgencyColor => switch (case_.urgencyLevel) {
    'critical' => LatticeColors.error,
    'high' => LatticeColors.warning,
    'medium' => LatticeColors.warning,
    _ => LatticeColors.successDark,
  };

  String get _daysUntilHearing {
    if (case_.nextHearingAt == null) return 'No date';
    final days = case_.nextHearingAt!.difference(DateTime.now()).inDays;
    if (days < 0) return '${-days}d overdue';
    if (days == 0) return 'Today';
    if (days == 1) return 'Tomorrow';
    return '$days days';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: () {
        ref.read(selectedCaseProvider.notifier).state = case_.caseId;
        Navigator.of(context).pushNamed('/cases/${case_.caseId}');
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: LatticeColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border(
            left: BorderSide(color: _urgencyColor, width: 4),
          ),
          boxShadow: const [
            BoxShadow(color: LatticeColors.shadow, blurRadius: 16, offset: Offset(0, 4)),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      case_.caseTitle,
                      style: GoogleFonts.manrope(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: LatticeColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: LatticeColors.primary.withAlpha(15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            case_.courtCode,
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: LatticeColors.primary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          case_.clientName,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: LatticeColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _urgencyColor.withAlpha(20),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      case_.urgencyLevel.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: _urgencyColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.calendar_today, size: 12, color: LatticeColors.textTertiary),
                      const SizedBox(width: 4),
                      Text(
                        _daysUntilHearing,
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: _urgencyColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}