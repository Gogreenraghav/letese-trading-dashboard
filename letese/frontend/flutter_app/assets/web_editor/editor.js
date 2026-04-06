/**
 * LETESE● Tiptap Editor — JS Engine
 * Tiptap v2 + Y.js + Collaboration cursors
 * Supports Gurmukhi (Punjabi) + Devanagari (Hindi)
 */

// ── Config (overridden by Flutter via loadDocument) ──────────────────────────
let DOC_ID     = window.__DOC_ID     || 'default';
let BACKEND_URL = window.__BACKEND_URL || 'ws://localhost:8000';
let AUTH_TOKEN  = window.__AUTH_TOKEN  || '';

// ── Language / Font ─────────────────────────────────────────────────────────
const LANG_FONTS = {
  en: "'Inter', 'Noto Sans', sans-serif",
  pa: "'Noto Sans Gurmukhi', 'Inter', sans-serif",
  hi: "'Noto Sans Devanagari', 'Inter', sans-serif",
};

const LANG_DIR = { en: 'ltr', pa: 'ltr', hi: 'ltr' };

let currentLang = 'en';
window.setLanguage = (lang) => {
  currentLang = lang;
  document.execCommand('fontName', false, LANG_FONTS[lang] || LANG_FONTS.en);
  document.querySelectorAll('.lang-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.lang === lang)
  );
};

// ── Word Count ──────────────────────────────────────────────────────────────
function updateWordCount() {
  const text = editor.getText();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const el = document.getElementById('wc-val');
  if (el) el.textContent = words;
}

// ── Y.js Collaboration Setup ─────────────────────────────────────────────────
let ydoc     = null;
let provider = null;
let wsProvider = null;
let awareness  = null;

const COLLAB_COLORS = [
  '#00e5ff', '#ff4081', '#ffea00', '#69f0ae',
  '#ff6e40', '#b388ff', '#64ffda', '#ffd740',
];

function getCollabColor(index) {
  return COLLAB_COLORS[index % COLLAB_COLORS.length];
}

function initYjs(docId) {
  ydoc = new Y.Doc();

  // WebSocket provider (Y.js protocol)
  const wsUrl = `${BACKEND_URL}/ws/editor/${docId}?token=${encodeURIComponent(AUTH_TOKEN)}`;
  wsProvider = new WebsocketProvider(wsUrl, docId, ydoc, {
    connect: true,
  });

  wsProvider.on('status', ({ status }) => {
    const el = document.getElementById('conn-status');
    if (!el) return;
    if (status === 'connected') {
      el.className = 'status-dot connected';
      el.textContent = '● Connected';
    } else if (status === 'connecting') {
      el.className = 'status-dot connecting';
      el.textContent = '● Connecting…';
    } else {
      el.className = 'status-dot disconnected';
      el.textContent = '● Disconnected';
    }
  });

  wsProvider.on('connection-close', () => {
    const el = document.getElementById('conn-status');
    if (el) { el.className = 'status-dot disconnected'; el.textContent = '● Disconnected'; }
  });

  awareness = wsProvider.awareness;

  // Set local user info from Flutter if available
  const userName = window.__USER_NAME || 'User';
  const userColor = getCollabColor(Math.floor(Math.random() * COLLAB_COLORS.length));
  awareness.setLocalStateField('user', { name: userName, color: userColor });

  // Track collaborator awareness changes
  awareness.on('change', updateCollaborators);
  return wsProvider;
}

function updateCollaborators() {
  const users = awareness.getStates();
  const container = document.getElementById('collab-users');
  if (!container) return;
  container.innerHTML = '';
  let idx = 0;
  users.forEach((state, clientId) => {
    if (clientId === awareness.clientID) return; // skip self
    if (!state.user) return;
    const badge = document.createElement('span');
    badge.className = 'collab-badge';
    badge.style.background = state.user.color;
    badge.title = state.user.name;
    badge.textContent = state.user.name.charAt(0).toUpperCase();
    container.appendChild(badge);
    idx++;
  });
  const countEl = document.getElementById('collab-count');
  if (countEl) countEl.textContent = idx > 0 ? `${idx} collaborator${idx > 1 ? 's' : ''}` : '';
}

// ── Tiptap Editor ────────────────────────────────────────────────────────────
let editor = null;

function createEditor(content) {
  const el = document.getElementById('editor');

  editor = new Tiptap.Editor({
    element: el,
    extensions: [
      Tiptap.StarterKit,
      Tiptap.Underline,
      Tiptap.Placeholder.configure({
        placeholder: 'Start drafting your legal document…',
      }),
      Tiptap.Collaboration.configure({
        document: ydoc,
      }),
      Tiptap.CollaborationCursor.configure({
        provider: wsProvider,
        user: { name: window.__USER_NAME || 'User', color: getCollabColor(0) },
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prosemirror-editor',
        spellcheck: 'true',
      },
    },
    onUpdate: () => {
      updateWordCount();
      scheduleAutoSave();
    },
    onSelectionUpdate: () => {
      updateWordCount();
    },
  });

  updateWordCount();
  return editor;
}

// ── Auto-save ────────────────────────────────────────────────────────────────
let saveTimer = null;
function scheduleAutoSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveDocument(true); // silent auto-save
  }, 5000);
}

// ── Save / Export ─────────────────────────────────────────────────────────────
async function saveDocument(silent = false) {
  if (!editor) return;
  try {
    const json  = editor.getJSON();
    const text  = editor.getText();
    const html  = editor.getHTML();
    const body  = { docId: DOC_ID, content: json, text, html, updatedAt: new Date().toISOString() };

    const resp = await fetch(`/api/v1/documents/${DOC_ID}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AUTH_TOKEN}` },
      body: JSON.stringify(body),
    });

    if (!silent && resp.ok) {
      flashStatus('✓ Saved');
    } else if (!silent && !resp.ok) {
      flashStatus('✗ Save failed');
    }
    return resp;
  } catch (e) {
    if (!silent) flashStatus('✗ Save error');
    console.error(e);
  }
}

async function exportPDF() {
  const html = editor.getHTML();
  const text = editor.getText();
  try {
    const resp = await fetch('/api/v1/documents/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AUTH_TOKEN}` },
      body: JSON.stringify({ docId: DOC_ID, html, format: 'pdf' }),
    });
    const blob = await resp.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `document_${DOC_ID}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    flashStatus('✓ PDF exported');
  } catch (e) {
    flashStatus('✗ Export failed');
    console.error(e);
  }
}

async function exportDOCX() {
  const html = editor.getHTML();
  try {
    const resp = await fetch('/api/v1/documents/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AUTH_TOKEN}` },
      body: JSON.stringify({ docId: DOC_ID, html, format: 'docx' }),
    });
    const blob = await resp.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `document_${DOC_ID}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    flashStatus('✓ DOCX exported');
  } catch (e) {
    flashStatus('✗ Export failed');
    console.error(e);
  }
}

function flashStatus(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// ── Toolbar Actions ──────────────────────────────────────────────────────────
function setupToolbar() {
  document.getElementById('btn-bold')?.addEventListener('click', () =>
    editor.chain().focus().toggleBold().run());
  document.getElementById('btn-italic')?.addEventListener('click', () =>
    editor.chain().focus().toggleItalic().run());
  document.getElementById('btn-underline')?.addEventListener('click', () =>
    editor.chain().focus().toggleUnderline().run());
  document.getElementById('btn-h1')?.addEventListener('click', () =>
    editor.chain().focus().toggleHeading({ level: 1 }).run());
  document.getElementById('btn-h2')?.addEventListener('click', () =>
    editor.chain().focus().toggleHeading({ level: 2 }).run());
  document.getElementById('btn-h3')?.addEventListener('click', () =>
    editor.chain().focus().toggleHeading({ level: 3 }).run());
  document.getElementById('btn-bullet-list')?.addEventListener('click', () =>
    editor.chain().focus().toggleBulletList().run());
  document.getElementById('btn-ordered-list')?.addEventListener('click', () =>
    editor.chain().focus().toggleOrderedList().run());
  document.getElementById('btn-indent')?.addEventListener('click', () =>
    editor.chain().focus().sinkListItem('listItem').run());

  // Template dropdown
  const tmplBtn  = document.getElementById('btn-template');
  const dropdown = document.getElementById('template-dropdown');
  tmplBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });
  document.addEventListener('click', () => dropdown?.classList.add('hidden'));

  document.querySelectorAll('.tmpl-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tmpl = btn.dataset.tmpl;
      applyTemplate(tmpl);
      dropdown.classList.add('hidden');
    });
  });

  // Language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => window.setLanguage(btn.dataset.lang));
  });

  // Highlight placeholders
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.placeholder').forEach(el => {
        el.style.background = currentLang === 'pa' || currentLang === 'hi'
          ? 'rgba(0,229,255,0.15)' : '';
      });
    });
  });
}

function applyTemplate(tmpl) {
  if (typeof window.LEGAL_TEMPLATES !== 'undefined' && window.LEGAL_TEMPLATES[tmpl]) {
    const content = window.LEGAL_TEMPLATES[tmpl];
    if (editor) {
      editor.commands.setContent(content);
      highlightPlaceholders();
    }
  }
}

function highlightPlaceholders() {
  if (!editor) return;
  // Re-render to highlight placeholder spans
  const html = editor.getHTML();
  const highlighted = html.replace(/\{\{(\w+)\}\}/g,
    '<span class="placeholder" contenteditable="false">$&&</span>');
  if (highlighted !== html) {
    editor.commands.setContent(highlighted);
  }
}

// ── Flutter Interop ──────────────────────────────────────────────────────────
window.saveDocument   = saveDocument;
window.exportPDF      = exportPDF;
window.exportDOCX     = exportDOCX;
window.getEditorContent = () => editor ? editor.getJSON() : null;
window.getEditorHTML  = () => editor ? editor.getHTML() : '';
window.getEditorText  = () => editor ? editor.getText() : '';

window.loadDocument = (docId, backendUrl, authToken, userName, initialContent) => {
  DOC_ID      = docId      || DOC_ID;
  BACKEND_URL = backendUrl || BACKEND_URL;
  AUTH_TOKEN  = authToken  || AUTH_TOKEN;
  if (userName) window.__USER_NAME = userName;

  // Destroy existing editor
  if (editor) editor.destroy();
  if (wsProvider) wsProvider.destroy();

  // Init Y.js → then create editor
  initYjs(DOC_ID);
  // Wait for Y.js connection before rendering
  wsProvider.once('sync', (isSynced) => {
    createEditor(initialContent);
  });
};

// ── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupToolbar();
  // Auto-initialise with defaults if DOC_ID is set
  if (DOC_ID !== 'default') {
    initYjs(DOC_ID);
    createEditor('');
  }
});