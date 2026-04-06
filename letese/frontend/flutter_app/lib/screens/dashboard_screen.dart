/// LETESE● Dashboard Screen — Lattice Design System
/// Home screen with sky gradient, hero hearing card, quick actions, AIPOT feed
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import 'package:intl/intl.dart';

// ── Dashboard Stats Provider (mock) ─────────────────────────────────────────

class DashboardStats {
  final int liveCases;
  final int pendingCases;
  final int doneCases;
  DashboardStats({required this.liveCases, required this.pendingCases, required this.doneCases});
}

final dashboardStatsProvider = Provider<DashboardStats>((ref) {
  return DashboardStats(liveCases: 12, pendingCases: 7, doneCases: 43);
});

// ── Today's Hearing Provider (mock) ─────────────────────────────────────────

class HearingData {
  final String caseTitle;
  final String courtCode;
  final String time;
  final int progressPct;
  final String judgeName;
  final DateTime hearingDate;
  HearingData({
    required this.caseTitle,
    required this.courtCode,
    required this.time,
    required this.progressPct,
    required this.judgeName,
    required this.hearingDate,
  });
}

final todayHearingProvider = Provider<HearingData>((ref) {
  return HearingData(
    caseTitle: 'State of Maharashtra vs. K. Deshmukh',
    courtCode: 'Court 4',
    time: '11:30 AM',
    progressPct: 68,
    judgeName: 'Hon. Justice A.B. Sharma',
    hearingDate: DateTime.now().add(const Duration(hours: 3)),
  );
});

// ── AIPOT Mock Judgments ────────────────────────────────────────────────────

class AipotJudgment {
  final String court;
  final String courtLabel;
  final String caseNumber;
  final String parties;
  final String subject;
  final DateTime date;
  final String courtType; // SC | HC | Tribunal

  AipotJudgment({
    required this.court,
    required this.courtLabel,
    required this.caseNumber,
    required this.parties,
    required this.subject,
    required this.date,
    required this.courtType,
  });
}

final aipotFeedProvider = Provider<List<AipotJudgment>>((ref) {
  return [
    AipotJudgment(
      court: 'Supreme Court of India',
      courtLabel: 'SC',
      caseNumber: 'SLP(C) 23456/2024',
      parties: 'Ramesh Kumar v. Union of India',
      subject: 'Article 32 — Fundamental Rights',
      date: DateTime.now().subtract(const Duration(hours: 2)),
      courtType: 'SC',
    ),
    AipotJudgment(
      court: 'Delhi High Court',
      courtLabel: 'DHC',
      caseNumber: 'CWP 1847/2024',
      parties: 'Sneha Patel v. NCT of Delhi',
      subject: 'Service Law — Termination',
      date: DateTime.now().subtract(const Duration(hours: 5)),
      courtType: 'HC',
    ),
    AipotJudgment(
      court: 'Punjab & Haryana HC',
      courtLabel: 'PHAHC',
      caseNumber: 'CRM(M) 12543/2024',
      parties: 'Harpreet Singh v. State',
      subject: 'Section 138 NI Act',
      date: DateTime.now().subtract(const Duration(hours: 8)),
      courtType: 'HC',
    ),
  ];
});

// ── Dashboard Screen ────────────────────────────────────────────────────────

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(dashboardStatsProvider);
    final hearing = ref.watch(todayHearingProvider);
    final judgments = ref.watch(aipotFeedProvider);

    return Scaffold(
      backgroundColor: LatticeColors.background,
      body: Stack(
        children: [
          // Sky gradient header area
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 260,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [LatticeColors.skyTop, LatticeColors.skyBottom],
                ),
              ),
            ),
          ),
          // Scrollable content
          CustomScrollView(
            slivers: [
              // Top App Bar
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
                        Image.asset(
                          'assets/letese_logo.png',
                          height: 40,
                          errorBuilder: (_, __, ___) => Text(
                            'LETESE',
                            style: GoogleFonts.manrope(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Namaste, Advocate 👋',
                                style: GoogleFonts.manrope(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                              Text(
                                DateFormat('EEEE, d MMM').format(DateTime.now()),
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
                          child: const Icon(Icons.notifications_outlined, color: Colors.white, size: 22),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Status chips row
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                  child: Row(
                    children: [
                      _StatusChip(
                        label: 'Live',
                        count: stats.liveCases,
                        color: LatticeColors.liveRed,
                        isDot: true,
                      ),
                      const SizedBox(width: 10),
                      _StatusChip(
                        label: 'Pending',
                        count: stats.pendingCases,
                        color: LatticeColors.pendingBlue,
                        isDot: false,
                      ),
                      const SizedBox(width: 10),
                      _StatusChip(
                        label: 'Done',
                        count: stats.doneCases,
                        color: LatticeColors.doneGreen,
                        isDot: false,
                      ),
                    ],
                  ),
                ),
              ),

              // Today's Hearing Hero Card
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: _HearingHeroCard(hearing: hearing),
                ),
              ),

              // Quick Actions section
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Quick Actions',
                        style: GoogleFonts.manrope(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: LatticeColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _QuickActionCard(
                              label: 'New Case',
                              color: LatticeColors.actionNewCase,
                              emoji: '📝',
                              onTap: () {},
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _QuickActionCard(
                              label: 'AI Draft',
                              color: LatticeColors.actionAiDraft,
                              emoji: '🤖',
                              onTap: () {},
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _QuickActionCard(
                              label: 'Search',
                              color: LatticeColors.actionSearch,
                              emoji: '🔍',
                              onTap: () {},
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _QuickActionCard(
                              label: 'Tasks',
                              color: LatticeColors.actionTasks,
                              emoji: '📋',
                              onTap: () {},
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // AIPOT Live Feed section
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            '⚡ AIPOT Live Feed',
                            style: GoogleFonts.manrope(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: LatticeColors.textPrimary,
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
                          const Spacer(),
                          TextButton(
                            onPressed: () {},
                            child: const Text('View All →'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      ...judgments.map((j) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _AipotMiniCard(judgment: j),
                      )),
                    ],
                  ),
                ),
              ),

              // Bottom padding for nav bar
              const SliverToBoxAdapter(child: SizedBox(height: 90)),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Status Chip ─────────────────────────────────────────────────────────────

class _StatusChip extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final bool isDot;

  const _StatusChip({
    required this.label,
    required this.count,
    required this.color,
    required this.isDot,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
        decoration: BoxDecoration(
          color: LatticeColors.glassHi,
          borderRadius: BorderRadius.circular(16),
          boxShadow: const [
            BoxShadow(color: LatticeColors.shadow, blurRadius: 12, offset: Offset(0, 3), spreadRadius: -2),
          ],
        ),
        child: Row(
          children: [
            if (isDot)
              Container(
                width: 8, height: 8,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              )
            else
              Icon(Icons.schedule, color: color, size: 14),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$count',
                    style: GoogleFonts.manrope(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: color,
                    ),
                  ),
                  Text(
                    label,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: LatticeColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Hearing Hero Card ──────────────────────────────────────────────────────

class _HearingHeroCard extends StatelessWidget {
  final HearingData hearing;
  const _HearingHeroCard({required this.hearing});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: LatticeColors.glassHi,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: LatticeColors.shadow.withAlpha(20), blurRadius: 24, offset: const Offset(0, 8)),
          BoxShadow(color: LatticeColors.shadow.withAlpha(8), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: LatticeColors.primary.withAlpha(20),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Next Up • ${hearing.courtCode}',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: LatticeColors.primary,
                    ),
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: LatticeColors.skyTop.withAlpha(26),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.access_time, size: 14, color: LatticeColors.primary),
                      const SizedBox(width: 4),
                      Text(
                        hearing.time,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: LatticeColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              hearing.caseTitle,
              style: GoogleFonts.manrope(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: LatticeColors.textPrimary,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            Text(
              hearing.judgeName,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: LatticeColors.textSecondary,
              ),
            ),
            const SizedBox(height: 14),
            // Progress bar
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Case Progress',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: LatticeColors.textSecondary,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${hearing.progressPct}%',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: LatticeColors.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: hearing.progressPct / 100,
                    backgroundColor: LatticeColors.cardBorder,
                    valueColor: const AlwaysStoppedAnimation<Color>(LatticeColors.primary),
                    minHeight: 6,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _ActionButton(
                    label: 'Briefing Docs',
                    icon: Icons.description_outlined,
                    filled: true,
                    onTap: () {},
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _ActionButton(
                    label: 'View Details',
                    icon: Icons.arrow_forward,
                    filled: false,
                    onTap: () {},
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Quick Action Card ──────────────────────────────────────────────────────

// ── Quick Action Card — Floating Row style ──────────────────────────────
class _QuickActionCard extends StatelessWidget {
  final String label;
  final Color color;
  final String emoji;
  final VoidCallback onTap;
  const _QuickActionCard({required this.label, required this.color, required this.emoji, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: LatticeColors.glassHi,
          borderRadius: BorderRadius.circular(16),
          boxShadow: ElevShadow.md(color),
        ),
        child: Row(
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: color.withAlpha(20),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(child: Text(emoji, style: const TextStyle(fontSize: 20))),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label,
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600,
                  color: LatticeColors.text)),
            ),
            Icon(Icons.arrow_forward_ios, size: 14, color: LatticeColors.textDim),
          ],
        ),
      ),
    );
  }
}

// ── AIPOT Mini Card ────────────────────────────────────────────────────────

class _AipotMiniCard extends StatelessWidget {
  final AipotJudgment judgment;
  const _AipotMiniCard({required this.judgment});

  String _timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: LatticeColors.glassHi,
        borderRadius: BorderRadius.circular(16),
        boxShadow: ElevShadow.sm(LatticeColors.primary),
      ),
      child: Row(
        children: [
          Container(
            width: 42, height: 42,
            decoration: BoxDecoration(
              color: LatticeColors.primary.withAlpha(20),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(child: Text(judgment.courtType == 'SC' ? '🏛️' : '⚖️', style: const TextStyle(fontSize: 18))),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: LatticeColors.primary.withAlpha(20),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(judgment.courtLabel,
                      style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: LatticeColors.primary)),
                  ),
                  const SizedBox(width: 6),
                  Text(_timeAgo(judgment.date),
                    style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textDim)),
                ]),
                const SizedBox(height: 4),
                Text(judgment.parties,
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: LatticeColors.text),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
                Text(judgment.subject,
                  style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textSec),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          IconButton(
            icon: Icon(Icons.bookmark_outline, color: LatticeColors.textDim, size: 20),
            onPressed: () {},
          ),
        ],
      ),
    );
  }
}

// ── Action Button ───────────────────────────────────────────────────────────

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool filled;
  final VoidCallback onTap;

  const _ActionButton({
    required this.label,
    required this.icon,
    required this.filled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
        decoration: BoxDecoration(
          color: filled ? LatticeColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(100),
          border: filled ? null : Border.all(color: LatticeColors.primary, width: 1.5),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: filled ? Colors.white : LatticeColors.primary,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: filled ? Colors.white : LatticeColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}