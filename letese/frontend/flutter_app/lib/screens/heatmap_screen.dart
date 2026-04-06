/// LETESE — Heatmap of My Cases
/// Visual workload/activity heatmap screen
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class HeatmapScreen extends ConsumerWidget {
  const HeatmapScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: LatticeColors.bgBase,
      body: Stack(
        children: [
          // Sky gradient
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
                              Text('Case Heatmap',
                                style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
                              Text('Visual workload overview',
                                style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withAlpha(179))),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(26),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.calendar_month, color: Colors.white, size: 22),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Stats summary
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                  child: Row(
                    children: [
                      _StatCard(label: '247', sub: 'Total Cases', color: LatticeColors.primary),
                      const SizedBox(width: 12),
                      _StatCard(label: '89', sub: 'This Month', color: LatticeColors.qaSrch),
                      const SizedBox(width: 12),
                      _StatCard(label: '34', sub: 'High Priority', color: LatticeColors.error),
                    ],
                  ),
                ),
              ),

              // Monthly Heatmap Grid
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                  child: _GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Monthly Activity',
                          style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                        const SizedBox(height: 16),
                        _HeatmapGrid(),
                      ],
                    ),
                  ),
                ),
              ),

              // Case Distribution by Court
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: _GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Cases by Court',
                          style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                        const SizedBox(height: 16),
                        _CourtBar(label: 'Supreme Court', count: 28, color: LatticeColors.primary),
                        const SizedBox(height: 12),
                        _CourtBar(label: 'P&H High Court', count: 94, color: LatticeColors.qaSrch),
                        const SizedBox(height: 12),
                        _CourtBar(label: 'Delhi High Court', count: 67, color: LatticeColors.qaTask),
                        const SizedBox(height: 12),
                        _CourtBar(label: 'Tribunal', count: 38, color: LatticeColors.qaAI),
                        const SizedBox(height: 12),
                        _CourtBar(label: 'District Court', count: 20, color: LatticeColors.textDim),
                      ],
                    ),
                  ),
                ),
              ),

              // Weekly Activity
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: _GlassCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Weekly Workload',
                          style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w700, color: LatticeColors.text)),
                        const SizedBox(height: 16),
                        SizedBox(
                          height: 120,
                          child: _WeeklyChart(),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label, sub;
  final Color color;
  const _StatCard({required this.label, required this.sub, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: LatticeColors.glassHi,
          borderRadius: BorderRadius.circular(16),
          boxShadow: ElevShadow.md(LatticeColors.primary),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
              style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.w800, color: color)),
            const SizedBox(height: 4),
            Text(sub,
              style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textSec)),
          ],
        ),
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
        color: LatticeColors.glassHi,
        borderRadius: BorderRadius.circular(20),
        boxShadow: ElevShadow.lg(LatticeColors.primary),
      ),
      child: child,
    );
  }
}

class _HeatmapGrid extends StatelessWidget {
  // 7 weeks x 7 days grid
  final List<List<int>> data = [
    [2, 1, 0, 3, 1, 0, 1],
    [0, 2, 3, 1, 2, 0, 1],
    [1, 0, 2, 4, 1, 3, 0],
    [2, 3, 1, 0, 2, 1, 4],
    [1, 0, 3, 2, 1, 0, 2],
    [0, 2, 1, 3, 0, 2, 1],
    [3, 1, 0, 2, 4, 1, 0],
  ];

  Color _cellColor(int level) => switch (level) {
    0 => LatticeColors.textDim.withAlpha(20),
    1 => LatticeColors.primary.withAlpha(60),
    2 => LatticeColors.primary.withAlpha(120),
    3 => LatticeColors.primary.withAlpha(180),
    _ => LatticeColors.primary,
  };

  @override
  Widget build(BuildContext context) {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return Column(
      children: [
        // Day labels
        Row(
          children: [
            const SizedBox(width: 4),
            ...days.map((d) => Expanded(
              child: Text(d,
                style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textDim),
                textAlign: TextAlign.center),
            )),
          ],
        ),
        const SizedBox(height: 8),
        // Grid
        ...data.map((week) => Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: Row(
            children: [
              const SizedBox(width: 4),
              ...week.map((level) => Expanded(
                child: AspectRatio(
                  aspectRatio: 1,
                  child: Container(
                    decoration: BoxDecoration(
                      color: _cellColor(level),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              )),
            ],
          ),
        )),
        const SizedBox(height: 12),
        // Legend
        Row(
          children: [
            Text('Less',
              style: GoogleFonts.inter(fontSize: 10, color: LatticeColors.textDim)),
            const SizedBox(width: 8),
            for (int i = 0; i <= 4; i++)
              Container(
                width: 16, height: 16, margin: const EdgeInsets.only(right: 4),
                decoration: BoxDecoration(
                  color: _cellColor(i),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            Text('More',
              style: GoogleFonts.inter(fontSize: 10, color: LatticeColors.textDim)),
          ],
        ),
      ],
    );
  }
}

class _CourtBar extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  const _CourtBar({required this.label, required this.count, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: Text(label, style: GoogleFonts.inter(fontSize: 13, color: LatticeColors.text))),
            Text('$count', style: GoogleFonts.manrope(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: count / 100,
            backgroundColor: color.withAlpha(20),
            valueColor: AlwaysStoppedAnimation(color),
            minHeight: 8,
          ),
        ),
      ],
    );
  }
}

class _WeeklyChart extends StatelessWidget {
  final List<double> heights = [0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8];
  final List<String> days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: List.generate(7, (i) => Expanded(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Expanded(
                child: Align(
                  alignment: Alignment.bottomCenter,
                  child: FractionallySizedBox(
                    heightFactor: heights[i],
                    child: Container(
                      decoration: BoxDecoration(
                        color: i == 6 ? LatticeColors.primary : LatticeColors.primary.withAlpha(140),
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(days[i],
                style: GoogleFonts.inter(fontSize: 11, color: LatticeColors.textSec)),
            ],
          ),
        ),
      )),
    );
  }
}
