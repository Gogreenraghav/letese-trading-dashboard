/// LETESE● Tasks Screen
/// Today | Upcoming | Overdue task sections with action buttons
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';

// Tasks state
final allTasksProvider = FutureProvider<List<Task>>((ref) async {
  final dio = ref.read(dioProvider);
  final tasksApi = TasksApi(dio);
  return tasksApi.listTasks();
});

class TasksScreen extends ConsumerStatefulWidget {
  const TasksScreen({super.key});
  @override
  ConsumerState<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends ConsumerState<TasksScreen> {
  bool _isRefreshing = false;

  Future<void> _refresh() async {
    setState(() => _isRefreshing = true);
    ref.invalidate(allTasksProvider);
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) setState(() => _isRefreshing = false);
  }

  @override
  Widget build(BuildContext context) {
    final tasksAsync = ref.watch(allTasksProvider);

    return Scaffold(
      backgroundColor: AppColors.bgObsidian,
      appBar: AppBar(
        title: Row(
          children: [
            const LeteseLogo(fontSize: 22),
            const SizedBox(width: 16),
            const Text('Tasks', style: TextStyle(fontSize: 17)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.neonCyan),
            onPressed: _refresh,
          ),
        ],
      ),
      body: tasksAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.neonCyan)),
        error: (e, _) => Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.error),
            const SizedBox(height: 12),
            Text('Failed to load tasks', style: TextStyle(color: AppColors.textSecondary)),
            TextButton(onPressed: () => ref.invalidate(allTasksProvider), child: const Text('Retry')),
          ]),
        ),
        data: (tasks) {
          final now = DateTime.now();
          final today = DateTime(now.year, now.month, now.day);
          final overdue = tasks.where((t) {
            final due = DateTime(t.dueDate.year, t.dueDate.month, t.dueDate.day);
            return due.isBefore(today) && t.status != 'completed';
          }).toList();
          final todayTasks = tasks.where((t) {
            final due = DateTime(t.dueDate.year, t.dueDate.month, t.dueDate.day);
            return due.isAtSameMomentAs(today) && t.status != 'completed';
          }).toList();
          final upcoming = tasks.where((t) {
            final due = DateTime(t.dueDate.year, t.dueDate.month, t.dueDate.day);
            return due.isAfter(today) && t.status != 'completed';
          }).toList();

          return RefreshIndicator(
            onRefresh: _refresh,
            color: AppColors.neonCyan,
            backgroundColor: AppColors.bgSurface,
            child: ListView(
              padding: const EdgeInsets.all(12),
              children: [
                // Overdue section
                if (overdue.isNotEmpty) ...[
                  _SectionHeader(
                    icon: Icons.warning_amber,
                    label: 'OVERDUE',
                    count: overdue.length,
                    color: AppColors.urgent,
                  ),
                  const SizedBox(height: 8),
                  ...overdue.map((t) => _TaskCard(task: t, color: AppColors.urgent, onRefresh: _refresh)),
                  const SizedBox(height: 16),
                ],

                // Today section
                _SectionHeader(
                  icon: Icons.today,
                  label: 'TODAY',
                  count: todayTasks.length,
                  color: AppColors.warning,
                ),
                const SizedBox(height: 8),
                if (todayTasks.isEmpty)
                  GlassCard(
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        child: Text('No tasks due today 🎉', style: TextStyle(color: AppColors.textTertiary, fontSize: 13)),
                      ),
                    ),
                  )
                else
                  ...todayTasks.map((t) => _TaskCard(task: t, color: AppColors.warning, onRefresh: _refresh)),

                const SizedBox(height: 16),

                // Upcoming section
                _SectionHeader(
                  icon: Icons.event,
                  label: 'UPCOMING',
                  count: upcoming.length,
                  color: AppColors.brandGreen,
                ),
                const SizedBox(height: 8),
                if (upcoming.isEmpty)
                  GlassCard(
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        child: Text('No upcoming tasks scheduled', style: TextStyle(color: AppColors.textTertiary, fontSize: 13)),
                      ),
                    ),
                  )
                else
                  ...upcoming.map((t) => _TaskCard(task: t, color: AppColors.brandGreen, onRefresh: _refresh)),

                const SizedBox(height: 60), // FAB space
              ],
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateTaskDialog(context),
        backgroundColor: AppColors.brandGreen,
        icon: const Icon(Icons.add),
        label: const Text('New Task'),
      ),
    );
  }

  void _showCreateTaskDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CreateTaskSheet(onCreated: () => ref.invalidate(allTasksProvider)),
    );
  }
}

// ── Section Header ─────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String label;
  final int count;
  final Color color;
  const _SectionHeader({required this.icon, required this.label, required this.count, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color, letterSpacing: 1.2)),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
          decoration: BoxDecoration(color: color.withAlpha(26), borderRadius: BorderRadius.circular(10)),
          child: Text('$count', style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w700)),
        ),
      ],
    );
  }
}

// ── Task Card ──────────────────────────────────────────────────────────────

class _TaskCard extends ConsumerStatefulWidget {
  final Task task;
  final Color color;
  final VoidCallback onRefresh;
  const _TaskCard({required this.task, required this.color, required this.onRefresh});

  @override
  ConsumerState<_TaskCard> createState() => _TaskCardState();
}

class _TaskCardState extends ConsumerState<_TaskCard> {
  bool _expanded = false;
  bool _completing = false;

  Color get _priorityColor {
    return switch (widget.task.priority) {
      'high' => AppColors.urgent,
      'medium' => AppColors.warning,
      _ => AppColors.brandGreen,
    };
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.bgSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _expanded ? widget.color.withAlpha(77) : AppColors.bgBorder,
        ),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Checkbox(
                    value: false,
                    onChanged: (v) async {
                      if (v == true) {
                        setState(() => _completing = true);
                        try {
                          final dio = ref.read(dioProvider);
                          final tasksApi = TasksApi(dio);
                          await tasksApi.completeTask(widget.task.taskId);
                          ref.invalidate(allTasksProvider);
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.bgElevated),
                            );
                          }
                        } finally {
                          if (mounted) setState(() => _completing = false);
                        }
                      }
                    },
                    activeColor: widget.color,
                  ),
                  if (_completing)
                    const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.neonCyan)),
                  const SizedBox(width: 10),
                  Container(
                    width: 4, height: 36,
                    decoration: BoxDecoration(color: _priorityColor, borderRadius: BorderRadius.circular(2)),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(widget.task.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            if (widget.task.source != 'system') ...[
                              Text(widget.task.source, style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                              const Text(' • ', style: TextStyle(color: AppColors.textTertiary)),
                            ],
                            Text(
                              DateFormat('dd MMM yyyy').format(widget.task.dueDate),
                              style: TextStyle(fontSize: 11, color: widget.color, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    _expanded ? Icons.expand_less : Icons.expand_more,
                    color: AppColors.textTertiary,
                    size: 20,
                  ),
                ],
              ),
            ),
          ),

          // Expanded content
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (widget.task.description != null && widget.task.description!.isNotEmpty) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.bgElevated,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        widget.task.description!,
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.5),
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _showPostponeDialog(context),
                          icon: const Icon(Icons.schedule, size: 16),
                          label: const Text('Postpone'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.textSecondary,
                            side: const BorderSide(color: AppColors.bgBorder),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () async {
                            setState(() => _completing = true);
                            try {
                              final dio = ref.read(dioProvider);
                              final tasksApi = TasksApi(dio);
                              await tasksApi.completeTask(widget.task.taskId);
                              ref.invalidate(allTasksProvider);
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: const Row(children: [Icon(Icons.check_circle, color: AppColors.brandGreen), SizedBox(width: 12), Text('Task marked as done!')]),
                                    backgroundColor: AppColors.bgElevated,
                                    behavior: SnackBarBehavior.floating,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                );
                              }
                            } catch (e) {
                              if (mounted) ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.bgElevated),
                              );
                            } finally {
                              if (mounted) setState(() => _completing = false);
                            }
                          },
                          icon: const Icon(Icons.check, size: 16),
                          label: const Text('Mark Done'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: widget.color,
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            crossFadeState: _expanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 200),
          ),
        ],
      ),
    );
  }

  void _showPostponeDialog(BuildContext context) {
    DateTime selectedDate = widget.task.dueDate.add(const Duration(days: 1));
    showDatePicker(
      context: context,
      initialDate: widget.task.dueDate.add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    ).then((date) async {
      if (date != null) {
        try {
          final dio = ref.read(dioProvider);
          await dio.patch('/tasks/${widget.task.taskId}', data: {'due_date': date.toIso8601String()});
          ref.invalidate(allTasksProvider);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Task postponed to ${DateFormat('dd MMM').format(date)}'),
                backgroundColor: AppColors.bgElevated,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            );
          }
        } catch (e) {
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.bgElevated),
          );
        }
      }
    });
  }
}

// ── Create Task Sheet ───────────────────────────────────────────────────────

class _CreateTaskSheet extends ConsumerStatefulWidget {
  final VoidCallback onCreated;
  const _CreateTaskSheet({required this.onCreated});
  @override
  ConsumerState<_CreateTaskSheet> createState() => _CreateTaskSheetState();
}

class _CreateTaskSheetState extends ConsumerState<_CreateTaskSheet> {
  final _form = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _priority = 'medium';
  DateTime _dueDate = DateTime.now().add(const Duration(days: 1));
  bool _loading = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final dio = ref.read(dioProvider);
      await dio.post('/tasks', data: {
        'title': _titleCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'due_date': _dueDate.toIso8601String(),
        'priority': _priority,
      });
      widget.onCreated();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.bgElevated),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: const BoxDecoration(
        color: AppColors.bgSurface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(top: BorderSide(color: AppColors.bgBorder)),
      ),
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40, height: 4,
            decoration: BoxDecoration(color: AppColors.bgBorder, borderRadius: BorderRadius.circular(2)),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                const Text('New Task', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close, color: AppColors.textSecondary),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          Expanded(
            child: Form(
              key: _form,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  TextFormField(
                    controller: _titleCtrl,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'Task Title *', hintText: 'e.g. File reply in CWP 245/2024'),
                    validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _descCtrl,
                    maxLines: 4,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(labelText: 'Description (optional)', alignLabelWithHint: true),
                  ),
                  const SizedBox(height: 16),
                  const Text('Priority', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _PriorityChip(label: 'Low', value: 'low', group: _priority, color: AppColors.brandGreen,
                          onTap: () => setState(() => _priority = 'low')),
                      const SizedBox(width: 8),
                      _PriorityChip(label: 'Medium', value: 'medium', group: _priority, color: AppColors.warning,
                          onTap: () => setState(() => _priority = 'medium')),
                      const SizedBox(width: 8),
                      _PriorityChip(label: 'High', value: 'high', group: _priority, color: AppColors.urgent,
                          onTap: () => setState(() => _priority = 'high')),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Due Date', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    subtitle: Text(DateFormat('dd MMMM yyyy').format(_dueDate),
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    trailing: const Icon(Icons.calendar_today, color: AppColors.neonCyan),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: _dueDate,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (date != null) setState(() => _dueDate = date);
                    },
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _submit,
                      child: _loading
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Text('Create Task'),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PriorityChip extends StatelessWidget {
  final String label;
  final String value;
  final String group;
  final Color color;
  final VoidCallback onTap;
  const _PriorityChip({required this.label, required this.value, required this.group, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final selected = value == group;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? color.withAlpha(26) : AppColors.bgElevated,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? color : AppColors.bgBorder),
        ),
        child: Text(label, style: TextStyle(fontSize: 12, color: selected ? color : AppColors.textSecondary, fontWeight: FontWeight.w600)),
      ),
    );
  }
}
