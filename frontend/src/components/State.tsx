import { AlertCircle, Loader2 } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex min-h-40 items-center justify-center text-app-muted">
      <Loader2 className="mr-2 animate-spin" size={20} />
      Загрузка
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-app-line bg-app-surface p-4 text-sm shadow-soft">
      <div className="flex items-start gap-3 text-app-danger">
        <AlertCircle size={20} />
        <div className="min-w-0 flex-1">{message}</div>
      </div>
      {onRetry ? (
        <button className="mt-4 rounded-md bg-app-accent px-4 py-2 text-sm font-medium text-app-accentText" onClick={onRetry}>
          Повторить
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-app-line bg-app-surface p-6 text-center text-sm text-app-muted">
      {title}
    </div>
  );
}

