import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, Info, X } from 'lucide-react';
import { Icon } from './Icon';

export type ToastVariant = 'default' | 'success' | 'error';

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastOptions = {
  duration?: number;
  variant?: ToastVariant;
};

type ToastFn = (message: string, options?: ToastOptions) => void;

const ToastContext = createContext<ToastFn | null>(null);

const DEFAULT_DURATION = 3000;
const MAX_VISIBLE = 3;

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const handle = timeouts.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timeouts.current.delete(id);
    }
  }, []);

  const toast = useCallback<ToastFn>(
    (message, opts = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const next: ToastItem = {
        id,
        message,
        variant: opts.variant ?? 'default',
      };
      setToasts((prev) => {
        const merged = [...prev, next];
        return merged.length > MAX_VISIBLE ? merged.slice(merged.length - MAX_VISIBLE) : merged;
      });
      const handle = setTimeout(() => remove(id), opts.duration ?? DEFAULT_DURATION);
      timeouts.current.set(id, handle);
    },
    [remove],
  );

  useEffect(() => {
    const handles = timeouts.current;
    return () => {
      handles.forEach((h) => clearTimeout(h));
      handles.clear();
    };
  }, []);

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined'
        ? createPortal(<ToastViewport toasts={toasts} onClose={remove} />, document.body)
        : null}
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: string) => void }) {
  return (
    <ol
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none"
    >
      {toasts.map((t) => (
        <li key={t.id} className="pointer-events-auto">
          <ToastCard item={t} onClose={() => onClose(t.id)} />
        </li>
      ))}
    </ol>
  );
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const accent =
    item.variant === 'success'
      ? 'border-l-accent'
      : item.variant === 'error'
      ? 'border-l-chrome'
      : 'border-l-divider';
  const icon = item.variant === 'success' ? Check : Info;
  return (
    <div
      className={`flex items-start gap-2 bg-page border border-border border-l-2 ${accent} rounded-md px-3 py-2 shadow-[var(--shadow-2)] min-w-[260px]`}
    >
      <span className="text-accent mt-0.5">
        <Icon icon={icon} size={16} />
      </span>
      <div className="flex-1 text-[13px] text-text leading-relaxed">{item.message}</div>
      <button
        type="button"
        onClick={onClose}
        aria-label="关闭通知"
        className="text-text-muted hover:text-text -mr-1 -mt-1 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2/40"
      >
        <Icon icon={X} size={14} />
      </button>
    </div>
  );
}
