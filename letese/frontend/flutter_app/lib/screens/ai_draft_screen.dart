/// LETESE● AI Document Draft Screen
/// Petition drafting with compliance checking — Elite/Enterprise only
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';

class AiDraftScreen extends ConsumerStatefulWidget {
  final CaseDetail caseDetail;
  const AiDraftScreen({super.key, required this.caseDetail});
  @override
  ConsumerState<AiDraftScreen> createState() => _AiDraftScreenState();
}

class _AiDraftScreenState extends ConsumerState<AiDraftScreen> {
  String? _plan;
  bool _loadingPlan = true;
  bool _planCheckDone = false;
  bool _showUpgradePrompt = false;
  bool _generating = false;
  String? _draftResult;
  List<Map<String, dynamic>> _complianceChecks = [];
  bool _filingReady = false;
  String _petitionType = 'CWP';
  final _summaryCtrl = TextEditingController();
  List<String> _selectedDocIds = [];

  final _petitionTypes = {
    'CWP': 'Civil Writ Petition',
    'SLP': 'Special Leave Petition',
    'CS': 'Civil Suit',
    'WP': 'Writ Petition',
    'CRM': 'Criminal Misc',
  };

  @override
  void initState() {
    super.initState();
    _checkPlan();
  }

  Future<void> _checkPlan() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final plan = prefs.getString('plan') ?? 'basic';
      setState(() {
        _plan = plan;
        _loadingPlan = false;
        _planCheckDone = true;
        _showUpgradePrompt = plan != 'elite' && plan != 'enterprise';
      });
    } catch (e) {
      setState(() { _loadingPlan = false; _planCheckDone = true; });
    }
  }

  Future<void> _generateDraft() async {
    if (_summaryCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please enter a case summary'),
          backgroundColor: AppColors.bgElevated,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }
    setState(() { _generating = true; _draftResult = null; _complianceChecks = []; });
    try {
      final dio = ref.read(dioProvider);
      final resp = await dio.post('/drafts/generate', data: {
        'case_id': widget.caseDetail.caseId,
        'court_code': widget.caseDetail.courtCode,
        'petition_type': _petitionType,
        'case_summary': _summaryCtrl.text.trim(),
        'document_ids': _selectedDocIds,
      });
      setState(() {
        _draftResult = resp.data['draft_text'] as String? ?? resp.data['content'] as String? ?? '';
        final checks = resp.data['compliance_checks'] as List? ?? [];
        _complianceChecks = checks.map((c) => Map<String, dynamic>.from(c)).toList();
        final criticalFails = _complianceChecks.where((c) =>
            c['severity'] == 'critical' && c['status'] == 'fail').length;
        _filingReady = criticalFails == 0;
      });
    } catch (e) {
      setState(() => _draftResult = 'Error: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingPlan) {
      return Scaffold(
        backgroundColor: AppColors.bgObsidian,
        appBar: AppBar(title: const Text('AI Document Draft')),
        body: const Center(child: CircularProgressIndicator(color: AppColors.neonCyan)),
      );
    }

    if (_showUpgradePrompt) {
      return Scaffold(
        backgroundColor: AppColors.bgObsidian,
        appBar: AppBar(title: const Text('AI Document Draft')),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.warning.withAlpha(18),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.warning.withAlpha(51)),
                ),
                child: const Icon(Icons.lock_outline, size: 48, color: AppColors.warning),
              ),
              const SizedBox(height: 24),
              const Text('Elite/Enterprise Plan Required',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                  textAlign: TextAlign.center),
              const SizedBox(height: 12),
              const Text(
                'AI Document Drafting is available on Elite and Enterprise plans. '
                'Upgrade to access AI-powered petition drafting, compliance checking, and more.',
                style: TextStyle(color: AppColors.textSecondary, height: 1.6),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brandGreen,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Upgrade to Elite', style: TextStyle(fontSize: 16)),
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Go Back', style: TextStyle(color: AppColors.textSecondary)),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.bgObsidian,
      appBar: AppBar(title: const Text('AI Document Draft')),
      body: _draftResult == null ? _buildForm() : _buildDraftResult(),
    );
  }

  Widget _buildForm() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Court info pre-filled
        GlassCard(
          child: Row(
            children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(color: AppColors.neonCyanDim, borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.court, color: AppColors.neonCyan),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Court', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    Text(
                      '${widget.caseDetail.courtDisplayName} — ${widget.caseDetail.caseTitle}',
                      style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Draft Petition', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                value: _petitionType,
                dropdownColor: AppColors.bgElevated,
                style: const TextStyle(color: AppColors.textPrimary),
                decoration: const InputDecoration(labelText: 'Petition Type'),
                items: _petitionTypes.entries.map((e) =>
                    DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
                onChanged: (v) => setState(() => _petitionType = v!),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _summaryCtrl,
                maxLines: 6,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, height: 1.6),
                decoration: const InputDecoration(
                  labelText: 'Case Summary *',
                  hintText: 'Describe the facts, issues, and relief sought...\n\nExample:\nPetitioner Shri Rajesh Kumar challenges the order dated...\nThe opposite party has violated Section 138 of N.I. Act...',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 16),

              // Supporting documents
              const Text('Supporting Documents (optional)',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
              const SizedBox(height: 8),
              if (widget.caseDetail.documents.isEmpty)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.bgElevated,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.bgBorder),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.folder_open, color: AppColors.textTertiary, size: 18),
                      SizedBox(width: 8),
                      Text('No documents attached to this case',
                          style: TextStyle(color: AppColors.textTertiary, fontSize: 12)),
                    ],
                  ),
                )
              else
                ...widget.caseDetail.documents.map<Widget>((doc) {
                  final docId = doc['document_id'] as String? ?? '';
                  final selected = _selectedDocIds.contains(docId);
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: InkWell(
                      onTap: () {
                        setState(() {
                          if (selected) {
                            _selectedDocIds.remove(docId);
                          } else {
                            _selectedDocIds.add(docId);
                          }
                        });
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: selected ? AppColors.neonCyanDim : AppColors.bgElevated,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: selected ? AppColors.neonCyan : AppColors.bgBorder,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              selected ? Icons.check_circle : Icons.description_outlined,
                              color: selected ? AppColors.neonCyan : AppColors.textTertiary,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                doc['name'] as String? ?? 'Document',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: selected ? AppColors.neonCyan : AppColors.textSecondary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (doc['type'] != null)
                              Text(
                                (doc['type'] as String).toUpperCase(),
                                style: const TextStyle(fontSize: 10, color: AppColors.textTertiary),
                              ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),

              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _generating ? null : _generateDraft,
                  icon: _generating
                      ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.auto_awesome),
                  label: Text(_generating ? 'Generating Draft...' : 'Generate Draft'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.electricPurple,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDraftResult() {
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Compliance checks
              if (_complianceChecks.isNotEmpty) ...[
                const Text('🔍 COMPLIANCE CHECK',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.2)),
                const SizedBox(height: 8),
                ..._complianceChecks.map((check) => _ComplianceBadge(check: check)),
                const SizedBox(height: 16),
              ],

              // Draft preview
              const Text('📄 DRAFT PREVIEW',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textSecondary, letterSpacing: 1.2)),
              const SizedBox(height: 8),
              GlassCard(
                padding: const EdgeInsets.all(16),
                child: SelectableText(
                  _draftResult ?? '',
                  style: const TextStyle(fontSize: 12, color: AppColors.textPrimary, height: 1.6),
                ),
              ),
            ],
          ),
        ),

        // Bottom action bar
        Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            color: AppColors.bgSurface,
            border: Border(top: BorderSide(color: AppColors.bgBorder)),
          ),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => setState(() => _draftResult = null),
                  icon: const Icon(Icons.edit, size: 18),
                  label: const Text('Edit'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.textSecondary,
                    side: const BorderSide(color: AppColors.bgBorder),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: _filingReady
                      ? () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: const Row(children: [
                                Icon(Icons.check_circle, color: AppColors.brandGreen),
                                SizedBox(width: 12),
                                Text('Draft marked as Filing Ready!'),
                              ]),
                              backgroundColor: AppColors.bgElevated,
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          );
                        }
                      : null,
                  icon: const Icon(Icons.flag, size: 18),
                  label: Text(_filingReady ? 'Mark as Filing Ready' : 'Resolve Issues First'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _filingReady ? AppColors.brandGreen : AppColors.textTertiary,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ComplianceBadge extends StatelessWidget {
  final Map<String, dynamic> check;
  const _ComplianceBadge({required this.check});

  @override
  Widget build(BuildContext context) {
    final status = check['status'] as String? ?? 'unknown';
    final severity = check['severity'] as String? ?? 'info';
    final message = check['message'] as String? ?? check['rule'] as String? ?? '';
    final passed = status == 'pass';
    final color = passed
        ? AppColors.brandGreen
        : severity == 'critical'
            ? AppColors.urgent
            : AppColors.warning;

    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withAlpha(18),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withAlpha(51)),
        ),
        child: Row(
          children: [
            Icon(
              passed ? Icons.check_circle : Icons.error_outline,
              color: color,
              size: 18,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(message, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500)),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: color.withAlpha(26),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                severity.toUpperCase(),
                style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
