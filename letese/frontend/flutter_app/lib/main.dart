/// LETESE● Main App Entry Point
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'theme/app_theme.dart';
import 'screens/auth_screen.dart';
import 'screens/case_diary_screen.dart';

void main() {
  runApp(const ProviderScope(child: LeteseApp()));
}

class LeteseApp extends StatelessWidget {
  const LeteseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LETESE● Legal',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      initialRoute: '/login',
      routes: {
        '/login': (_) => const LoginScreen(),
        '/app': (_) => const MainShell(),
        '/cases/new': (_) => const NewCaseScreen(),
      },
    );
  }
}

/// Main Shell — Bottom navigation for TIER 3 User Terminal
class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  final _screens = const [
    CaseDiaryScreen(),
    _InboxScreen(),
    _TasksScreen(),
    _ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: AppColors.bgBorder, width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (i) => setState(() => _currentIndex = i),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.folder_copy_outlined), label: 'Cases'),
            BottomNavigationBarItem(icon: Icon(Icons.inbox_outlined), label: 'Inbox'),
            BottomNavigationBarItem(icon: Icon(Icons.checklist_outlined), label: 'Tasks'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
          ],
        ),
      ),
    );
  }
}

class _InboxScreen extends StatelessWidget {
  const _InboxScreen();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgObsidian,
      appBar: AppBar(title: const Text('Inbox')),
      body: Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.all_inbox, size: 64, color: AppColors.textTertiary),
          const SizedBox(height: 16),
          Text('Unified Inbox', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text('WhatsApp, Email, Court orders\nall in one place',
              textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary)),
        ]),
      ),
    );
  }
}

class _TasksScreen extends ConsumerWidget {
  const _TasksScreen();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.bgObsidian,
      appBar: AppBar(title: const Text('Tasks')),
      body: const Center(
        child: Text('Task Hub\n(Court orders → Tasks, Manual tasks)',
            textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary)),
      ),
    );
  }
}

class _ProfileScreen extends StatelessWidget {
  const _ProfileScreen();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgObsidian,
      appBar: AppBar(title: const Text('Profile')),
      body: const Center(
        child: Text('Profile & Settings', style: TextStyle(color: AppColors.textSecondary)),
      ),
    );
  }
}

/// New Case Form Screen
class NewCaseScreen extends ConsumerStatefulWidget {
  const NewCaseScreen({super.key});
  @override
  ConsumerState<NewCaseScreen> createState() => _NewCaseScreenState();
}

class _NewCaseScreenState extends ConsumerState<NewCaseScreen> {
  final _form = GlobalKey<FormState>();
  final _caseTitleCtrl = TextEditingController();
  final _clientNameCtrl = TextEditingController();
  final _clientPhoneCtrl = TextEditingController();
  final _caseNumberCtrl = TextEditingController();
  String _courtCode = 'PHAHC';
  String _petitionType = 'CWP';
  DateTime? _nextHearing;
  bool _loading = false;
  String? _error;

  final _courtOptions = {
    'PHAHC': 'Punjab & Haryana HC',
    'DHC': 'Delhi High Court',
    'SC': 'Supreme Court',
    'NCDRC': 'NCDRC',
    'CHD_DC': 'Chandigarh DC',
  };

  final _petitionOptions = {
    'CWP': 'Civil Writ Petition',
    'CRM': 'Criminal Misc',
    'SLP': 'Special Leave Petition',
    'CS': 'Civil Suit',
    'WP': 'Writ Petition',
  };

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final dio = ref.read(dioProvider);
      final casesApi = CasesApi(dio);
      await casesApi.createCase(
        caseTitle: _caseTitleCtrl.text.trim(),
        courtCode: _courtCode,
        clientName: _clientNameCtrl.text.trim(),
        clientPhone: _clientPhoneCtrl.text.trim(),
        petitionType: _petitionType,
        caseNumber: _caseNumberCtrl.text.isNotEmpty ? _caseNumberCtrl.text.trim() : null,
        nextHearingAt: _nextHearing,
      );
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgObsidian,
      appBar: AppBar(title: const Text('New Case')),
      body: Form(
        key: _form,
        child: ListView(padding: const EdgeInsets.all(16), children: [
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Case Details', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _caseTitleCtrl,
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: const InputDecoration(labelText: 'Case Title *', hintText: 'Sharma v. Union of India'),
                  validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _courtCode,
                  dropdownColor: AppColors.bgElevated,
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: const InputDecoration(labelText: 'Court *'),
                  items: _courtOptions.entries.map((e) =>
                      DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
                  onChanged: (v) => setState(() => _courtCode = v!),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _petitionType,
                  dropdownColor: AppColors.bgElevated,
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: const InputDecoration(labelText: 'Petition Type'),
                  items: _petitionOptions.entries.map((e) =>
                      DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
                  onChanged: (v) => setState(() => _petitionType = v!),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _caseNumberCtrl,
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: const InputDecoration(labelText: 'Case Number (optional)'),
                ),
                const SizedBox(height: 12),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(_nextHearing != null
                      ? '${_nextHearing!.day}/${_nextHearing!.month}/${_nextHearing!.year}'
                      : 'Next Hearing Date (optional)',
                      style: TextStyle(color: _nextHearing != null ? AppColors.textPrimary : AppColors.textTertiary)),
                  trailing: const Icon(Icons.calendar_today, color: AppColors.neonCyan),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now().add(const Duration(days: 30)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 3650)),
                    );
                    if (date != null) setState(() => _nextHearing = date);
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Client Details', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _clientNameCtrl,
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: const InputDecoration(labelText: 'Client Name *'),
                  validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _clientPhoneCtrl,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: const InputDecoration(labelText: 'Phone *', hintText: '+919876543210'),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Required';
                    if (!v.startsWith('+')) return 'Must include country code (e.g. +91)';
                    return null;
                  },
                ),
              ],
            ),
          ),
          if (_error != null) Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loading ? null : _submit,
            child: _loading
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Create Case'),
          ),
        ]),
      ),
    );
  }
}
