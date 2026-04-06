/// LETESE● AIPOT Feed Screen — Lattice Design System
/// Auto-scraped judgment live feed from Indian courts
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import 'package:intl/intl.dart';

// ── Mock AIPOT Feed Data ────────────────────────────────────────────────────

class AipotFeedItem {
  final String courtType;
  final String courtLabel;
  final String courtFull;
  final String caseNumber;
  final String parties;
  final String subject;
  final String section;
  final DateTime date;
  final String? citation;
  final bool bookmarked;

  AipotFeedItem({
    required this.courtType,
    required this.courtLabel,
    required this.courtFull,
    required this.caseNumber,
    required this.parties,
    required this.subject,
    required this.section,
    required this.date,
    this.citation,
    this.bookmarked = false,
  });
}

final aipotAllFeedProvider = Provider<List<AipotFeedItem>>((ref) {
  return [
    AipotFeedItem(
      courtType: 'SC',
      courtLabel: 'SC',
      courtFull: 'Supreme Court of India',
      caseNumber: 'SLP(C) 23456/2024',
      parties: 'Ramesh Kumar v. Union of India',
      subject: 'Article 32 — Fundamental Rights violation in prison',
      section: 'Article 32, Constitution',
      date: DateTime.now().subtract(const Duration(hours: 1)),
      citation: '(2024) 6 SCC 1',
    ),
    AipotFeedItem(
      courtType: 'HC',
      courtLabel: 'DHC',
      courtFull: 'Delhi High Court',
      caseNumber: 'CWP 1847/2024',
      parties: 'Sneha Patel v. NCT of Delhi',
      subject: 'Service Law — wrongful termination, back wages',
      section: 'Industrial Disputes Act, S. 11',
      date: DateTime.now().subtract(const Duration(hours: 3)),
      citation: '2024 DLT 432',
    ),
    AipotFeedItem(
      courtType: 'HC',
      courtLabel: 'PHAHC',
      courtFull: 'Punjab & Haryana High Court',
      caseNumber: 'CRM(M) 12543/2024',
      parties: 'Harpreet Singh v. State of Punjab',
      subject: 'Section 138 NI Act — cheque dishonour, compoundable',
      section: 'NI Act S. 138',
      date: DateTime.now().subtract(const Duration(hours: 6)),
      citation: '2024 SCC OnLine P&H 890',
    ),
    AipotFeedItem(
      courtType: 'Tribunal',
      courtLabel: 'NCLAT',
      courtFull: 'NCLAT New Delhi',
      caseNumber: 'Comp. App. 456/2023',
      parties: 'Steel Corp v. Axis Bank',
      subject: 'IBC S. 7 — initiation of CIRP',
      section: 'IBC S. 7, Reg. 8',
      date: DateTime.now().subtract(const Duration(hours: 12)),
      citation: '2024 SCC OnLine NCLAT 234',
    ),
    AipotFeedItem(
      courtType: 'SC',
      courtLabel: 'SC',
      courtFull: 'Supreme Court of India',
      caseNumber: 'CrA 124/2024',
      parties: 'State v. Abdul Kareem',
      subject: 'Criminal appeal — Section 302 IPC — murder',
      section: 'IPC S. 302, S. 304',
      date: DateTime.now().subtract(const Duration(days: 1)),
      citation: '(2024) 7 SCC 88',
    ),
  ];
});

final aipotFilterProvider = StateProvider<String>((ref) => 'All');

// ── AIPOT Feed Screen ───────────────────────────────────────────────────────

class AipotFeedScreen extends ConsumerWidget {
  const AipotFeedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final allItems = ref.watch(aipotAllFeedProvider);
    final activeFilter = ref.watch(aipotFilterProvider);

    final filtered = activeFilter == 'All'
        ? allItems
        : allItems.where((i) => i.courtType == _courtTypeForFilter(activeFilter)).toList();

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
              height: 280,
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
                              Row(
                                children: [
                                  Text(
                                    '⚡ AIPOT Live Feed',
                                    style: GoogleFonts.manrope(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: LatticeColors.liveRed,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      'LIVE',
                                      style: GoogleFonts.inter(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Auto-scraped judgments from Indian courts',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: Colors.white.withAlpha(179),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(26),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.tune, color: Colors.white, size: 22),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Stats row
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                    decoration: BoxDecoration(
                      color: LatticeColors.surface,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: const [
                        BoxShadow(color: LatticeColors.shadow, blurRadius: 12, offset: Offset(0, 3)),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _StatItem(value: '1,24,680', label: 'Judgments', color: LatticeColors.textPrimary),
                        Container(width: 1, height: 30, color: LatticeColors.cardBorder),
                        _StatItem(value: '847', label: 'Today', color: LatticeColors.primary),
                        Container(width: 1, height: 30, color: LatticeColors.cardBorder),
                        _StatItem(value: '42', label: 'This Hour', color: LatticeColors.skyTop),
                      ],
                    ),
                  ),
                ),
              ),

              // Filter chips
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: ['All', 'Supreme Court', 'High Court', 'Tribunal'].map((f) {
                        final isSelected = activeFilter == f;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: GestureDetector(
                            onTap: () => ref.read(aipotFilterProvider.notifier).state = f,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: isSelected ? LatticeColors.primary : LatticeColors.surface,
                                borderRadius: BorderRadius.circular(100),
                                border: Border.all(
                                  color: isSelected ? LatticeColors.primary : LatticeColors.cardBorder,
                                ),
                                boxShadow: isSelected ? null : const [
                                  BoxShadow(color: LatticeColors.shadow, blurRadius: 8, offset: Offset(0, 2)),
                                ],
                              ),
                              child: Text(
                                f,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: isSelected ? Colors.white : LatticeColors.textSecondary,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ),

              // Judgment cards
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final item = filtered[index];
                    return Padding(
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                      child: _JudgmentCard(item: item),
                    );
                  },
                  childCount: filtered.length,
                ),
              ),

              // Bottom padding
              const SliverToBoxAdapter(child: SizedBox(height: 90)),
            ],
          ),
        ],
      ),
    );
  }

  String _courtTypeForFilter(String filter) => switch (filter) {
    'Supreme Court' => 'SC',
    'High Court' => 'HC',
    'Tribunal' => 'Tribunal',
    _ => '',
  };
}

// ── Stat Item ───────────────────────────────────────────────────────────────

class _StatItem extends StatelessWidget {
  final String value;
  final String label;
  final Color color;

  const _StatItem({
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.manrope(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            color: LatticeColors.textSecondary,
          ),
        ),
      ],
    );
  }
}

// ── Judgment Card ───────────────────────────────────────────────────────────

class _JudgmentCard extends StatefulWidget {
  final AipotFeedItem item;
  const _JudgmentCard({required this.item});

  @override
  State<_JudgmentCard> createState() => _JudgmentCardState();
}

class _JudgmentCardState extends State<_JudgmentCard> {
  bool _bookmarked = false;

  String _formatDate(DateTime date) => DateFormat('d MMM yyyy').format(date);

  String _timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    return Container(
      decoration: BoxDecoration(
        color: LatticeColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: const Border(
          left: BorderSide(color: LatticeColors.primary, width: 4),
        ),
        boxShadow: const [
          BoxShadow(color: LatticeColors.shadow, blurRadius: 16, offset: Offset(0, 4)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row: court badge + case number + bookmark
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: LatticeColors.primary.withAlpha(20),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Text(
                        item.courtType == 'SC' ? '🏛️' : item.courtType == 'HC' ? '⚖️' : '📋',
                        style: const TextStyle(fontSize: 14),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        item.courtLabel,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: LatticeColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    item.caseNumber,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: LatticeColors.textSecondary,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => setState(() => _bookmarked = !_bookmarked),
                  child: Icon(
                    _bookmarked ? Icons.bookmark : Icons.bookmark_outline,
                    color: _bookmarked ? LatticeColors.primary : LatticeColors.textTertiary,
                    size: 22,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Parties
            Text(
              item.parties,
              style: GoogleFonts.manrope(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: LatticeColors.textPrimary,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),

            const SizedBox(height: 8),

            // Subject/section
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: LatticeColors.background,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: LatticeColors.cardBorder),
              ),
              child: Row(
                children: [
                  const Icon(Icons.gavel, size: 14, color: LatticeColors.primary),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      item.subject,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: LatticeColors.textSecondary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Footer: court full name + date + citation
            Row(
              children: [
                Expanded(
                  child: Text(
                    item.courtFull,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: LatticeColors.textTertiary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  _timeAgo(item.date),
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: LatticeColors.textTertiary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (item.citation != null) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: LatticeColors.primary.withAlpha(15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      item.citation!,
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: LatticeColors.primary,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}