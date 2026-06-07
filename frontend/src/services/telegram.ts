import WebApp from '@twa-dev/sdk';

export function initTelegram() {
  const syncViewport = () => {
    const root = document.documentElement;
    root.style.setProperty('--app-viewport-height', `${Math.max(WebApp.viewportHeight || window.innerHeight, 320)}px`);
    root.style.setProperty('--app-viewport-stable-height', `${Math.max(WebApp.viewportStableHeight || window.innerHeight, 320)}px`);
    root.dataset.telegramFullscreen = WebApp.isFullscreen ? 'true' : 'false';
  };

  try {
    WebApp.ready();
    WebApp.expand();
    WebApp.enableVerticalSwipes();

    if (!WebApp.isFullscreen) {
      WebApp.requestFullscreen();
    }

    syncViewport();
    WebApp.onEvent('viewportChanged', syncViewport);
    WebApp.onEvent('safeAreaChanged', syncViewport);
    WebApp.onEvent('contentSafeAreaChanged', syncViewport);
    WebApp.onEvent('fullscreenChanged', syncViewport);

    return () => {
      WebApp.offEvent('viewportChanged', syncViewport);
      WebApp.offEvent('safeAreaChanged', syncViewport);
      WebApp.offEvent('contentSafeAreaChanged', syncViewport);
      WebApp.offEvent('fullscreenChanged', syncViewport);
    };
  } catch {
    // The app can run in a normal browser during local development.
    document.documentElement.style.setProperty('--app-viewport-height', `${window.innerHeight}px`);
    return () => undefined;
  }
}

export function getTelegramInitData() {
  try {
    return WebApp.initData || '';
  } catch {
    return '';
  }
}

export function applyTelegramTheme() {
  const root = document.documentElement;
  root.style.setProperty('--app-bg', '#dff5e9');
  root.style.setProperty('--app-surface', '#f8fffb');
  root.style.setProperty('--app-text', '#0b2f1d');
  root.style.setProperty('--app-muted', '#35664d');
  root.style.setProperty('--app-line', '#a7e3bf');
  root.style.setProperty('--app-accent', '#24b26d');
  root.style.setProperty('--app-accent-text', '#ffffff');
  root.style.setProperty('--app-accent-soft', '#d7f5e4');
  root.style.setProperty('--app-accent-mid', '#1aa060');
  root.style.setProperty('--app-accent-deep', '#12844f');
}

export function showBackButton(onClick: () => void) {
  try {
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(onClick);
    return () => {
      WebApp.BackButton.offClick(onClick);
      WebApp.BackButton.hide();
    };
  } catch {
    return () => undefined;
  }
}

export function hapticSuccess() {
  try {
    WebApp.HapticFeedback.notificationOccurred('success');
  } catch {
    // Haptics are available only inside Telegram.
  }
}
