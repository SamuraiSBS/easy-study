import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { applyTelegramTheme, initTelegram, showBackButton } from '../services/telegram';

export function useTelegram() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    initTelegram();
    applyTelegramTheme();
  }, []);

  useEffect(() => {
    if (location.pathname === '/') {
      return undefined;
    }
    return showBackButton(() => {
      const state = window.history.state as { idx?: number } | null;
      if (typeof state?.idx === 'number' && state.idx > 0) {
        navigate(-1);
        return;
      }
      navigate('/');
    });
  }, [location.pathname, navigate]);
}

