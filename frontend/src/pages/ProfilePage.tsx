import { AtSign, Shield, UserRound } from 'lucide-react';
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
      <section className="rounded-lg border border-app-line bg-app-surface p-5 shadow-soft">
        <h1 className="text-2xl font-semibold">Профиль</h1>
        <p className="mt-2 text-sm leading-6 text-app-muted">Данные профиля появятся после авторизации через Telegram.</p>
      </section>
    );
  }

  const displayName = user.first_name || user.username || `ID ${user.telegram_id}`;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-app-line bg-app-surface p-5 shadow-soft">
        <div className="flex items-center gap-4">
          {user.photo_url ? (
            <img className="h-16 w-16 rounded-md object-cover" src={user.photo_url} alt="" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-md bg-app-line text-app-accent">
              <UserRound size={28} />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold">{displayName}</h1>
            <p className="mt-1 text-sm text-app-muted">Профиль Telegram</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-app-line bg-app-surface p-5 shadow-soft">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-app-muted">Данные</h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-app-muted">Telegram ID</dt>
            <dd className="font-medium">{user.telegram_id}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-app-muted">Username</dt>
            <dd className="inline-flex items-center gap-1 font-medium">
              {user.username ? (
                <>
                  <AtSign size={15} /> {user.username}
                </>
              ) : (
                'не указан'
              )}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-app-muted">Роль</dt>
            <dd className="inline-flex items-center gap-1 font-medium">
              {user.is_admin ? (
                <>
                  <Shield size={15} /> Администратор
                </>
              ) : (
                'Клиент'
              )}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-app-muted">В приложении с</dt>
            <dd className="font-medium">{formatDate(user.created_at)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
