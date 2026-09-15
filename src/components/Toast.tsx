import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface ToastItem {
  id: number;
  /** Ops-radio prefix, e.g. "TOWER:", "RAMP:". */
  prefix: string;
  message: string;
}

interface ToastContextValue {
  showToast: (prefix: string, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Toast (design.md §6): bottom-left ops-radio style — mono prefix + message,
 * slide-up 240ms, auto-dismiss 4s. Layout wraps the app in this provider;
 * page agents call `const { showToast } = useToast()`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((prefix: string, message: string) => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((list) => [...list.slice(-2), { id, prefix, message }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-5 z-[110] flex w-[min(92vw,380px)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout="position"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex items-start gap-2 rounded-[2px] border border-tarmac-700 bg-tarmac-900 px-4 py-3 shadow-modal"
              role="status"
            >
              <span className="label shrink-0 pt-[3px] text-glow-amber">{t.prefix}</span>
              <span className="small text-fog-100">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is part of the Toast API by design
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider> (provided by Layout)');
  return ctx;
}
