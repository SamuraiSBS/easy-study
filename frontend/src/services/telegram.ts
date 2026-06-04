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
  try {
    const theme = WebApp.themeParams;
    if (theme.bg_color) {
      root.style.setProperty('--app-bg', theme.bg_color);
    }
    if (theme.secondary_bg_color) {
      root.style.setProperty('--app-surface', theme.secondary_bg_color);
    }
    if (theme.text_color) {
      root.style.setProperty('--app-text', theme.text_color);
    }
    if (theme.hint_color) {
      root.style.setProperty('--app-muted', theme.hint_color);
    }
    if (theme.button_color) {
      root.style.setProperty('--app-accent', theme.button_color);
    }
    if (theme.button_text_color) {
      root.style.setProperty('--app-accent-text', theme.button_text_color);
    }
  } catch {
    root.style.setProperty('--app-bg', '#f6f7f4');
  }
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

