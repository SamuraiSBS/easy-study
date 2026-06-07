import { LayoutGroup, motion } from 'framer-motion';
import { ClipboardList, Home, Shield, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { springTransition } from './Motion';

type LayoutProps = {
  user: User | null;
  children: ReactNode;
};

function navClass(isActive: boolean) {
  return [
    'relative flex min-h-12 flex-1 overflow-hidden rounded-full px-2 text-[13px] font-semibold transition-colors',
    isActive ? 'text-app-accentText' : 'text-app-muted hover:bg-white/60 hover:text-app-text'
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
    <div className="app-page-gradient min-h-screen text-app-text">
      <header className="app-shell-gradient sticky top-0 z-20 border-b border-app-line backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={springTransition}>
            <Link to="/" className="flex items-center gap-3">
              <span className="app-accent-gradient flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-bold text-app-accentText">
                ES
              </span>
              <span>
                <span className="block text-lg font-bold leading-tight">Easy Study</span>
                <span className="block text-sm text-app-muted">Учебные работы</span>
              </span>
            </Link>
          </motion.div>
          {user ? (
            <div className="min-w-0 text-right text-sm text-app-muted">
              <div className="truncate">{user.first_name || user.username || `ID ${user.telegram_id}`}</div>
              {user.is_admin ? <div className="font-medium text-app-accent">admin</div> : null}
            </div>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5 pb-24">{children}</main>
      <nav className="app-bottom-gradient fixed inset-x-0 bottom-0 z-30 border-t border-app-line pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <LayoutGroup id="bottom-navigation">
          <div className="mx-auto flex max-w-5xl gap-2 px-4">
            <div className="flex w-full gap-2 rounded-full border border-app-line bg-white/55 p-1 shadow-soft backdrop-blur">
              {navItems.map((item) => {
                const isActive = isActiveRoute(location.pathname, item.path);
                const Icon = item.icon;

                return (
                  <motion.button
                    key={item.path}
                    type="button"
                    className={navClass(isActive)}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => navigate(item.path)}
                    whileTap={{ scale: 0.96 }}
                    transition={springTransition}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="active-bottom-tab"
                        className="app-accent-gradient absolute inset-0 rounded-full"
                        transition={springTransition}
                      />
                    ) : null}
                    <span className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-1">
                      <motion.span animate={{ y: isActive ? -2 : 0, scale: isActive ? 1.08 : 1 }} transition={springTransition}>
                        <Icon size={20} />
                      </motion.span>
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </LayoutGroup>
      </nav>
    </div>
  );
}
