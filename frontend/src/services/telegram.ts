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
  root.style.setProperty('--app-bg', '#effbf5');
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
