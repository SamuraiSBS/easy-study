import { ClipboardList, Home, Shield, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { User } from '../types';

type LayoutProps = {
  user: User | null;
  children: React.ReactNode;
};

function navClass(isActive: boolean) {
  return [
    'flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-md px-2 text-xs font-medium transition',
    isActive ? 'bg-app-accent text-app-accentText' : 'text-app-muted hover:bg-app-line/50 hover:text-app-text'
  ].join(' ');
}

function isActiveRoute(pathname: string, path: string) {
  if (path === '/') {
    return pathname === '/';
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function Layout({ user, children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'Услуги', icon: Home },
    { path: '/orders', label: 'Заявки', icon: ClipboardList },
    { path: '/profile', label: 'Профиль', icon: UserRound },
    ...(user?.is_admin ? [{ path: '/admin', label: 'Админ', icon: Shield }] : [])
  ];

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <header className="sticky top-0 z-20 border-b border-app-line bg-app-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-app-accent text-sm font-bold text-app-accentText">
              ES
            </span>
            <span>
              <span className="block text-base font-semibold leading-tight">Easy Study</span>
              <span className="block text-xs text-app-muted">Учебные работы</span>
            </span>
          </Link>
          {user ? (
            <div className="min-w-0 text-right text-xs text-app-muted">
              <div className="truncate">{user.first_name || user.username || `ID ${user.telegram_id}`}</div>
              {user.is_admin ? <div className="font-medium text-app-accent">admin</div> : null}
            </div>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5 pb-24">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-app-line bg-app-bg/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <div className="mx-auto flex max-w-5xl gap-2 px-4">
          {navItems.map((item) => {
            const isActive = isActiveRoute(location.pathname, item.path);
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                type="button"
                className={navClass(isActive)}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => navigate(item.path)}
              >
                <Icon size={20} /> {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
