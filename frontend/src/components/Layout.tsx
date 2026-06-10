import { LayoutGroup, motion } from 'framer-motion';
import { ClipboardList, Home, Shield, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CSSProperties, ReactNode } from 'react';
import type { User } from '../types';
import { springTransition } from './Motion';

type LayoutProps = {
  user: User | null;
  children: ReactNode;
};

function navClass(isActive: boolean) {
  return [
    'relative flex h-12 flex-1 items-center justify-center overflow-hidden rounded-full px-2 transition-colors',
    isActive ? 'text-app-accentText' : 'text-app-muted hover:bg-white/60 hover:text-app-text'
  ].join(' ');
}

function isActiveRoute(pathname: string, path: string) {
  if (path === '/') {
    return pathname === '/';
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

const NAV_COLORS: Record<string, string> = {
  '/': '#2ED67D',
  '/orders': '#FF8A00',
  '/profile': '#7B3DFF',
  '/admin': '#2ED67D'
};

function navStyle(path: string) {
  const color = NAV_COLORS[path] || '#2ED67D';

  return {
    '--nav-color': color,
    '--nav-color-soft': `${color}28`,
    '--nav-color-deep': color
  } as CSSProperties;
}

export function Layout({ user, children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'Услуги', icon: Home },
    { path: '/orders', label: 'Заявки', icon: ClipboardList },
    { path: '/profile', label: 'Профиль', icon: UserRound },
    ...(user?.is_admin ? [{ path: '/admin', label: 'Управление', icon: Shield }] : [])
  ];

  return (
    <div className="app-page-gradient app-viewport-shell text-app-text">
      <main className="app-safe-x mx-auto w-full py-5 pb-[calc(6.25rem+var(--tg-safe-area-inset-bottom,env(safe-area-inset-bottom,0px)))]">
        {children}
      </main>
      <nav className="app-bottom-gradient fixed inset-x-0 bottom-0 z-30 border-t border-app-line pb-[max(0.75rem,var(--tg-safe-area-inset-bottom,env(safe-area-inset-bottom,0px)))] pt-2 backdrop-blur">
        <LayoutGroup id="bottom-navigation">
          <div className="app-safe-x mx-auto flex w-full gap-2">
            <div className="flex w-full gap-2 rounded-full border border-app-line bg-white/55 p-1 shadow-soft backdrop-blur">
              {navItems.map((item) => {
                const isActive = isActiveRoute(location.pathname, item.path);
                const Icon = item.icon;

                return (
                  <motion.button
                    key={item.path}
                    type="button"
                    className={navClass(isActive)}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => navigate(item.path)}
                    style={navStyle(item.path)}
                    whileTap={{ scale: 0.96 }}
                    transition={springTransition}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="active-bottom-tab"
                        className="app-nav-active-gradient absolute inset-0 rounded-full"
                        transition={springTransition}
                      />
                    ) : null}
                    <span className="relative z-10 flex h-full w-full items-center justify-center">
                      <motion.span animate={{ scale: isActive ? 1.12 : 1 }} transition={springTransition}>
                        <Icon className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
                      </motion.span>
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
