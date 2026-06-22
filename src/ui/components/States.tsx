// מצבי טעינה / שגיאה / ריק — בעברית, ענייניים (CLAUDE.md §14).
import { apiErrorMessage } from '../../api/errors';

export function LoadingState({ label = 'טוען…' }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="state state--error" role="alert">
      <p>{apiErrorMessage(error)}</p>
      <p className="state__hint">
        אם עוד לא חיברת מקור נתונים — הגדר <code>VITE_API_BASE</code> לכתובת פונקציית הפרוקסי (ראה{' '}
        <code>.env.example</code>).
      </p>
      {onRetry && (
        <button className="btn" onClick={onRetry}>
          נסה שוב
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="state state--empty">{children}</div>;
}
