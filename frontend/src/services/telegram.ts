import WebApp from '@twa-dev/sdk';

export function initTelegram() {
  try {
    WebApp.ready();
    WebApp.expand();
  } catch {
    // The app can run in a normal browser during local development.
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
  root.style.setProperty('--app-bg', '#eafbf3');
  root.style.setProperty('--app-surface', '#f8fffb');
  root.style.setProperty('--app-text', '#0d2f1f');
  root.style.setProperty('--app-muted', '#4d735f');
  root.style.setProperty('--app-line', '#b8f0d0');
  root.style.setProperty('--app-accent', '#2ed67d');
  root.style.setProperty('--app-accent-text', '#ffffff');
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
