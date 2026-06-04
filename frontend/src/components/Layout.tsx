import { ClipboardList, Home, Shield } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { User } from '../types';

type LayoutProps = {
  user: User | null;
  children: React.ReactNode;
};

function navClass({ isActive }: { isActive: boolean }) {
  return [
    'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition',
    isActive ? 'bg-app-accent text-app-accentText' : 'text-app-muted hover:bg-app-line/50 hover:text-app-text'
  ].join(' ');
}

export function Layout({ user, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <header className="sticky top-0 z-20 border-b border-app-line bg-app-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-app-accent text-sm font-bold text-app-accentText">
              ES
            </span>
            <span>
              <span className="block text-base font-semibold leading-tight">Easy Study</span>
              <span className="block text-xs text-app-muted">Учебные работы</span>
            </span>
          </NavLink>
          {user ? (
            <div className="min-w-0 text-right text-xs text-app-muted">
              <div className="truncate">{user.first_name || user.username || `ID ${user.telegram_id}`}</div>
              {user.is_admin ? <div className="font-medium text-app-accent">admin</div> : null}
            </div>
          ) : null}
        </div>
        <nav className="mx-auto flex max-w-5xl gap-2 px-4 pb-3">
          <NavLink to="/" className={navClass} end>
            <Home size={18} /> Услуги
          </NavLink>
          <NavLink to="/orders" className={navClass}>
            <ClipboardList size={18} /> Заказы
          </NavLink>
          {user?.is_admin ? (
            <NavLink to="/admin" className={navClass}>
              <Shield size={18} /> Админ
            </NavLink>
          ) : null}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5 pb-10">{children}</main>
    </div>
  );
}

