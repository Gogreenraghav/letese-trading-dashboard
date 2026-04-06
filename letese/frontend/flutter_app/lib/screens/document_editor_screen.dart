import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

// ─────────────────────────────────────────────────────────────────
// DocumentEditorScreen — LETESE● Tiptap Live-Sync Editor
// Tiptap v2 + Y.js collaboration via Flutter WebView
// ─────────────────────────────────────────────────────────────────

class DocumentEditorScreen extends StatefulWidget {
  final String documentId;
  final String? initialContent; // JSON string for initial doc content
  final String backendUrl;
  final String authToken;
  final String userName;

  const DocumentEditorScreen({
    super.key,
    required this.documentId,
    this.initialContent,
    this.backendUrl = 'http://localhost:8000',
    required this.authToken,
    this.userName   = 'User',
  });

  @override
  State<DocumentEditorScreen> createState() => _DocumentEditorScreenState();
}

class _DocumentEditorScreenState extends State<DocumentEditorScreen> {
  InAppWebViewController? _webViewController;

  bool _isLoading       = true;
  bool _hasError        = false;
  String _errorMessage  = '';
  String _connStatus    = 'Connecting…';
  int   _wordCount      = 0;
  int   _collabCount    = 0;
  String _selectedLang  = 'en';
  bool _isSaving        = false;
  bool _isExporting     = false;

  // Assets path for the web editor
  String get _editorAssetsPath =>
      'file:///android_asset/flutter_assets/assets/web_editor/index.html';

  @override
  void initState() {
    super.initState();
    _setupSystemChrome();
  }

  void _setupSystemChrome() {
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xff0b0e1a),
      systemNavigationBarIconBrightness: Brightness.light,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xff0b0e1a),
      appBar: _buildAppBar(),
      body: _buildBody(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0x12161e28),
      elevation: 0,
      title: Text(
        'LETESE● Editor',
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: Colors.white.withValues(alpha: 0.9),
          letterSpacing: 0.5,
        ),
      ),
      centerTitle: true,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new, size: 20, color: Colors.white70),
        onPressed: () => Navigator.of(context).pop(),
      ),
      actions: [
        // Language selector
        PopupMenuButton<String>(
          icon: const Icon(Icons.language, color: Colors.white70, size: 22),
          tooltip: 'Language',
          onSelected: (lang) => _setLanguage(lang),
          itemBuilder: (ctx) => [
            const PopupMenuItem(value: 'en', child: Text('English')),
            const PopupMenuItem(value: 'pa', child: Text('ਪੰਜਾਬੀ Punjabi')),
            const PopupMenuItem(value: 'hi', child: Text('हिन्दी Hindi')),
          ],
        ),
        // Export
        PopupMenuButton<String>(
          icon: const Icon(Icons.ios_share, color: Colors.white70, size: 22),
          tooltip: 'Export',
          onSelected: _isExporting ? null : (fmt) => _exportDocument(fmt),
          itemBuilder: (ctx) => [
            const PopupMenuItem(
              value: 'pdf',
              child: Row(children: [
                Icon(Icons.picture_as_pdf, size: 18),
                SizedBox(width: 8),
                Text('Export PDF'),
              ]),
            ),
            const PopupMenuItem(
              value: 'docx',
              child: Row(children: [
                Icon(Icons.description, size: 18),
                SizedBox(width: 8),
                Text('Export DOCX'),
              ]),
            ),
          ],
        ),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(36),
        child: _buildStatusBar(),
      ),
    );
  }

  Widget _buildStatusBar() {
    final isConnected = _connStatus == 'Connected';
    return Container(
      height: 36,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: const BoxDecoration(
        color: Color(0x12161e28),
        border: Border(
          bottom: BorderSide(color: Color(0x1fffffff), width: 0.5),
        ),
      ),
      child: Row(
        children: [
          // Connection status dot
          Container(
            width: 8, height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isConnected
                  ? const Color(0xff69f0ae)
                  : (_connStatus == 'Connecting…'
                      ? const Color(0xffffea00)
                      : const Color(0xff7a82a0)),
            ),
          ),
          const SizedBox(width: 6),
          Text(
            _connStatus,
            style: const TextStyle(fontSize: 12, color: Color(0xff7a82a0)),
          ),
          const Spacer(),
          if (_collabCount > 0) ...[
            const Icon(Icons.people, size: 14, color: Color(0xff7a82a0)),
            const SizedBox(width: 4),
            Text(
              '$_collabCount collaborator${_collabCount > 1 ? 's' : ''}',
              style: const TextStyle(fontSize: 12, color: Color(0xff7a82a0)),
            ),
            const SizedBox(width: 12),
          ],
          Text(
            'Words: $_wordCount',
            style: const TextStyle(fontSize: 12, color: Color(0xff7a82a0)),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_hasError) return _buildErrorState();
    return Stack(
      children: [
        // WebView
        InAppWebView(
          initialFile: _editorAssetsPath,
          initialSettings: InAppWebViewSettings(
            javaScriptEnabled: true,
            mediaPlaybackRequiresUserGesture: false,
            supportZoom: true,
            useShouldOverrideUrlLoading: true,
            cacheMode: CacheMode.LOAD_NO_CACHE,
          ),
          onWebViewCreated: _onWebViewCreated,
          onPageStarted: (ctrl, url) {
            setState(() => _isLoading = true);
          },
          onPageFinished: (ctrl, url) async {
            await _injectConfig(ctrl);
            setState(() => _isLoading = false);
          },
          onConsoleMessage: (ctrl, msg) {
            debugPrint('[WebView Console] ${msg.message}');
          },
          onReceivedError: (ctrl, err) {
            setState(() {
              _hasError = true;
              _errorMessage = err.description ?? 'WebView failed to load';
              _isLoading = false;
            });
          },
          onReceivedHttpError: (ctrl, res) {
            if (res.response?.statusCode == 404) {
              setState(() {
                _hasError = true;
                _errorMessage = 'Editor assets not found. Check asset paths.';
                _isLoading = false;
              });
            }
          },
        ),

        // Loading overlay
        if (_isLoading) _buildLoadingOverlay(),

        // Save FAB
        Positioned(
          right: 16,
          bottom: 24,
          child: FloatingActionButton.extended(
            heroTag: 'save_fab',
            backgroundColor: const Color(0xff00e5ff),
            icon: _isSaving
                ? const SizedBox(
                    width: 18, height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.black54,
                    ),
                  )
                : const Icon(Icons.save, color: Colors.black87, size: 20),
            label: Text(
              _isSaving ? 'Saving…' : 'Save',
              style: const TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.w600,
              ),
            ),
            onPressed: _isSaving ? null : () => _saveDocument(),
          ),
        ),
      ],
    );
  }

  Widget _buildLoadingOverlay() {
    return Container(
      color: const Color(0xff0b0e1a),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation(Color(0xff00e5ff)),
              strokeWidth: 2.5,
            ),
            const SizedBox(height: 20),
            Text(
              'Loading editor…',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.6),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Connecting to collaboration server',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.35),
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off,
              size: 56,
              color: Color(0xff7a82a0),
            ),
            const SizedBox(height: 16),
            const Text(
              'Editor failed to load',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xff7a82a0),
              ),
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: () => setState(() { _hasError = false; _isLoading = true; }),
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xff00e5ff),
                side: const BorderSide(color: Color(0x4000e5ff)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _onWebViewCreated(InAppWebViewController controller) async {
    _webViewController = controller;

    // Listen for messages from JavaScript
    await controller.addJavaScriptHandler(
      handlerName: 'flutterSave',
      callback: (args) async {
        await _saveDocument();
        return {'saved': true};
      },
    );

    await controller.addJavaScriptHandler(
      handlerName: 'flutterStatusUpdate',
      callback: (args) {
        if (args.isNotEmpty) {
          final data = args.first as Map<String, dynamic>?;
          if (data != null) {
            setState(() {
              _connStatus  = data['status']  ?? _connStatus;
              _wordCount   = data['words']   ?? _wordCount;
              _collabCount = data['collabs'] ?? _collabCount;
            });
          }
        }
      },
    );

    await controller.addJavaScriptHandler(
      handlerName: 'flutterError',
      callback: (args) {
        if (args.isNotEmpty) {
          debugPrint('[WebView Error] ${args.first}');
        }
      },
    );
  }

  Future<void> _injectConfig(InAppWebViewController ctrl) async {
    // Pass configuration to the web editor via JS window variables
    final initScript = '''
      (function() {
        window.__DOC_ID        = ${jsonEncode(widget.documentId)};
        window.__BACKEND_URL   = ${jsonEncode(widget.backendUrl)};
        window.__AUTH_TOKEN    = ${jsonEncode(widget.authToken)};
        window.__USER_NAME     = ${jsonEncode(widget.userName)};
        window.__INITIAL_CONTENT = ${widget.initialContent ?? 'null'};

        // Trigger load after vars are set
        if (window.loadDocument) {
          const content = window.__INITIAL_CONTENT
            ? JSON.parse(window.__INITIAL_CONTENT)
            : null;
          window.loadDocument(
            window.__DOC_ID,
            window.__BACKEND_URL,
            window.__AUTH_TOKEN,
            window.__USER_NAME,
            content
          );
        }
      })();
    ''';

    await ctrl.evaluateJavascript(source: initScript);

    // Also inject real-time status polling back to Flutter
    await ctrl.evaluateJavascript(source: '''
      (function() {
        setInterval(function() {
          const editor = window.editor;
          if (!editor) return;
          const text   = editor.getText() || '';
          const words  = text.trim() ? text.trim().split(/\\s+/).length : 0;
          const statusEl = document.getElementById('conn-status');
          const status   = statusEl ? statusEl.textContent.replace('● ', '').trim() : '';
          const collabEl   = document.getElementById('collab-count');
          const collabText = collabEl ? collabEl.textContent : '';
          const collabs    = parseInt(collabText.match(/\\d+/)?.[0] || '0');

          // Dispatch to Flutter handler
          if (window.flutter_webview) {
            window.flutter_webview.postMessage(JSON.stringify({
              type: 'status',
              status: status,
              words: words,
              collabs: collabs,
            }));
          }
        }, 2000);
      })();
    ''');

    // Expose flutter_save to web view so JS can call it
    await ctrl.addJavaScriptEnabled(true);
  }

  Future<void> _setLanguage(String lang) async {
    setState(() => _selectedLang = lang);
    await _webViewController?.evaluateJavascript(
      source: "if(window.setLanguage) window.setLanguage('$lang');",
    );
  }

  Future<void> _saveDocument() async {
    if (_webViewController == null) return;
    setState(() => _isSaving = true);

    try {
      final content = await _webViewController!.evaluateJavascript(
        source: 'JSON.stringify(window.getEditorContent ? window.getEditorContent() : null)',
      );

      if (content == null || content == 'null') {
        _showSnack('Could not read editor content');
        setState(() => _isSaving = false);
        return;
      }

      final resp = await http.post(
        Uri.parse('${widget.backendUrl}/api/v1/documents/${widget.documentId}/save'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.authToken}',
        },
        body: jsonEncode({
          'content': jsonDecode(content),
          'updatedAt': DateTime.now().toIso8601String(),
        }),
      );

      if (resp.statusCode == 200) {
        _showSnack('✓ Document saved', isError: false);
      } else {
        _showSnack('✗ Save failed (${resp.statusCode})');
      }
    } catch (e) {
      // Fallback: trigger JS-side save (offline mode)
      try {
        await _webViewController!.evaluateJavascript(
          source: 'if(window.saveDocument) window.saveDocument(false);',
        );
        _showSnack('✓ Saved locally');
      } catch (_) {
        _showSnack('✗ Save failed: $e');
      }
    } finally {
      setState(() => _isSaving = false);
    }
  }

  Future<void> _exportDocument(String format) async {
    if (_webViewController == null) return;
    setState(() => _isExporting = true);

    try {
      final exportFn = format == 'pdf' ? 'window.exportPDF()' : 'window.exportDOCX()';
      await _webViewController!.evaluateJavascript(source: exportFn);
      _showSnack('✓ Exporting $format…', isError: false);
    } catch (e) {
      _showSnack('✗ Export failed');
    } finally {
      await Future.delayed(const Duration(seconds: 2));
      setState(() => _isExporting = false);
    }
  }

  void _showSnack(String msg, {bool isError = true}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? const Color(0xff2d1f1f) : const Color(0xff1f2d24),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 3),
      ),
    );
  }
}