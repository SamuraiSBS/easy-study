import { motion } from 'framer-motion';
import { AtSign, Shield, UserRound } from 'lucide-react';
import { AnimatedList, listItemVariants, springTransition } from '../components/Motion';
import type { User } from '../types';

type ProfilePageProps = {
  user: User | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(value));
}

export function ProfilePage({ user }: ProfilePageProps) {
  if (!user) {
    return (
      <motion.section
        className="app-card rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft"
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springTransition}
      >
        <h1 className="text-3xl font-bold leading-tight">Профиль</h1>
        <p className="mt-3 text-base leading-7 text-app-muted">Профиль появится после входа через Telegram.</p>
      </motion.section>
    );
  }

  const displayName = user.first_name || user.username || `ID ${user.telegram_id}`;

  return (
    <AnimatedList className="space-y-4">
      <motion.section className="app-card app-card-strong rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft" variants={listItemVariants}>
        <div className="flex items-center gap-4">
          {user.photo_url ? (
            <motion.img
              className="h-16 w-16 rounded-2xl object-cover"
              src={user.photo_url}
              alt=""
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springTransition}
            />
          ) : (
            <motion.span
              className="app-soft-gradient flex h-16 w-16 items-center justify-center rounded-2xl text-app-accent"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springTransition}
            >
              <UserRound size={28} />
            </motion.span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold leading-tight">{displayName}</h1>
            <p className="mt-1 text-base text-app-muted">Telegram</p>
          </div>
        </div>
      </motion.section>

      <motion.section className="app-card rounded-3xl border border-app-line bg-app-surface p-5 shadow-soft" variants={listItemVariants}>
        <h2 className="text-lg font-bold leading-tight text-app-text">Информация</h2>
        <dl className="mt-4 space-y-4 text-base leading-7">
          <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3">
            <dt className="text-app-muted">Telegram ID</dt>
            <dd className="font-bold sm:text-right">{user.telegram_id}</dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3">
            <dt className="text-app-muted">Username</dt>
            <dd className="inline-flex items-center gap-1 font-bold sm:justify-end sm:text-right">
              {user.username ? (
                <>
                  <AtSign size={15} /> {user.username}
                </>
              ) : (
                'не указан'
              )}
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3">
            <dt className="text-app-muted">Роль</dt>
            <dd className="inline-flex items-center gap-1 font-bold sm:justify-end sm:text-right">
              {user.is_admin ? (
                <>
                  <Shield size={15} /> Админ
                </>
              ) : (
                'Клиент'
              )}
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3">
            <dt className="text-app-muted">В приложении с</dt>
            <dd className="whitespace-nowrap font-bold sm:text-right">{formatDate(user.created_at)}</dd>
          </div>
        </dl>
      </motion.section>
    </AnimatedList>
  );
}
