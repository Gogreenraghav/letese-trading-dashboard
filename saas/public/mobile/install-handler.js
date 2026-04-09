let deferredPrompt = null;
let isStandalone = window.matchMedia('(display-mode: standalone)').matches;

// Show install banner if criteria met but user hasn't installed
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// Capture install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById('installBanner');
  if (banner) {
    banner.style.display = 'flex';
  }
});

// Show install banner automatically if already installed (standalone mode)
if (isStandalone) {
  const banner = document.getElementById('installBanner');
  if (banner) banner.style.display = 'none';
}

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  const banner = document.getElementById('installBanner');
  if (banner) banner.style.display = 'none';
});

function installApp() {
  if (!deferredPrompt) {
    // Try native iOS/Android Add to Home Screen
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      showInstallToast('📱 iOS: Tap Share ⬆️ → "Add to Home Screen"');
    } else if (isAndroid) {
      showInstallToast('📱 Android: Tap menu ⋮ → "Install app" or check address bar');
    } else {
      showInstallToast('💻 Desktop: Click the 🔽 icon in address bar to install');
    }
    return;
  }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      showInstallToast('✅ App installed successfully!');
    }
    deferredPrompt = null;
    const banner = document.getElementById('installBanner');
    if (banner) banner.style.display = 'none';
  });
}

function showInstallToast(msg) {
  // Remove existing
  const existing = document.getElementById('installToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'installToast';
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(17,24,39,0.97);
    border: 1px solid rgba(0,212,255,0.3);
    color: #F1F5F9;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 13px;
    z-index: 9999;
    max-width: 90vw;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    animation: slideUp 0.3s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);

  // Add animation
  if (!document.getElementById('installToastStyle')) {
    const style = document.createElement('style');
    style.id = 'installToastStyle';
    style.textContent = '@keyframes slideUp { from { opacity:0; transform: translate(-50%, 20px); } to { opacity:1; transform: translate(-50%, 0); } }';
    document.head.appendChild(style);
  }

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function dismissInstall() {
  const banner = document.getElementById('installBanner');
  if (banner) banner.style.display = 'none';
  // Remember dismissal
  try { localStorage.setItem('installDismissed', '1'); } catch(e) {}
}

// Re-show banner if dismissed but app not installed
window.addEventListener('load', () => {
  try {
    if (localStorage.getItem('installDismissed') && !isStandalone) {
      const banner = document.getElementById('installBanner');
      if (banner && !deferredPrompt) {
        banner.style.display = 'flex';
      }
    }
  } catch(e) {}
});
