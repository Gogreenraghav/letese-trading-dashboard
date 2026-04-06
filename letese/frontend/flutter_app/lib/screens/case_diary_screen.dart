/// LETESE● Case Diary Workstation — TIER 3 User Terminal
/// Route: /app/cases
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
      backgroundColor: AppColors.bgObsidian,
      appBar: AppBar(
        title: Row(
          children: [
            const LeteseLogo(fontSize: 22),
            const SizedBox(width: 16),
            const Text('Case Diary', style: TextStyle(fontSize: 17)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.neonCyan),
            onPressed: () => ref.invalidate(casesProvider),
          ),
          IconButton(
            icon: const Icon(Icons.add_circle_outline, color: AppColors.brandGreen),
            onPressed: () => Navigator.of(context).pushNamed('/cases/new'),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search + Filters
          Container(
            padding: const EdgeInsets.all(12),
            color: AppColors.bgSurface,
            child: Column(
              children: [
                TextField(
                  onChanged: (v) => setState(() => _searchQuery = v),
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'Search cases, clients...',
                    prefixIcon: const Icon(Icons.search, color: AppColors.textTertiary),
                    filled: true,
                    fillColor: AppColors.bgElevated,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                  ),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterChip(label: 'All', selected: _filterStatus == null,
                          onTap: () => setState(() => _filterStatus = null)),
                      _FilterChip(label: '🔴 Urgent', selected: _filterStatus == 'critical',
                          onTap: () => setState(() => _filterStatus = 'critical')),
                      _FilterChip(label: 'Active', selected: _filterStatus == 'active',
                          onTap: () => setState(() => _filterStatus = 'active')),
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
              ],
            ),
          ),

          // Case List
          Expanded(
            child: casesAsync.when(
              loading: () => const Center(child: CircularProgressIndicator(color: AppColors.neonCyan)),
              error: (e, _) => Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                  const SizedBox(height: 12),
                  Text('Failed to load cases', style: TextStyle(color: AppColors.textSecondary)),
                  TextButton(onPressed: () => ref.invalidate(casesProvider), child: const Text('Retry')),
                ]),
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
                  return Center(
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.folder_open, size: 64, color: AppColors.textTertiary),
                      const SizedBox(height: 16),
                      Text('No cases found', style: TextStyle(color: AppColors.textSecondary, fontSize: 16)),
                      const SizedBox(height: 8),
                      ElevatedButton.icon(
                        onPressed: () => Navigator.of(context).pushNamed('/cases/new'),
                        icon: const Icon(Icons.add),
                        label: const Text('Add First Case'),
                      ),
                    ]),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final c = filtered[index];
                    return _CaseCard(case_: c);
                  },
                );
              },
            ),
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
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: selected ? AppColors.neonCyanDim : AppColors.bgElevated,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: selected ? AppColors.neonCyan : AppColors.bgBorder),
          ),
          child: Text(label,
              style: TextStyle(fontSize: 12, color: selected ? AppColors.neonCyan : AppColors.textSecondary)),
        ),
      ),
    );
  }
}

class _CaseCard extends ConsumerWidget {
  final Case case_;
  const _CaseCard({required this.case_});

  Color get _urgencyColor {
    return switch (case_.urgencyLevel) {
      'critical' => AppColors.urgent,
      'high' => AppColors.warning,
      'medium' => AppColors.medium,
      _ => AppColors.low,
    };
  }

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
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.bgSurface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.bgBorder),
          boxShadow: [BoxShadow(color: _urgencyColor.withAlpha(13), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 4, height: 36,
                  decoration: BoxDecoration(color: _urgencyColor, borderRadius: BorderRadius.circular(2)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(case_.caseTitle,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.textPrimary),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 2),
                      Text('${case_.courtCode} • ${case_.clientName}',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    UrgencyBadge(level: case_.urgencyLevel),
                    const SizedBox(height: 4),
                    Text(_daysUntilHearing,
                        style: TextStyle(fontSize: 11, color: _urgencyColor, fontWeight: FontWeight.w600)),
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
