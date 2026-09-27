import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

let toastIdCounter = 0;

const TOAST_VARIANTS = {
  success: {
    bg: 'bg-green-500/10 border-green-500/30',
    icon: '✓',
    iconBg: 'bg-green-500/20 text-green-400',
    progress: 'bg-green-500',
  },
  error: {
    bg: 'bg-red-500/10 border-red-500/30',
    icon: '✕',
    iconBg: 'bg-red-500/20 text-red-400',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-orange-500/10 border-orange-500/30',
    icon: '⚠',
    iconBg: 'bg-orange-500/20 text-orange-400',
    progress: 'bg-orange-500',
  },
  info: {
    bg: 'bg-blue-500/10 border-blue-500/30',
    icon: 'ℹ',
    iconBg: 'bg-blue-500/20 text-blue-400',
    progress: 'bg-blue-500',
  },
};

function Toast({ toast, onDismiss }) {
  const variant = TOAST_VARIANTS[toast.type] || TOAST_VARIANTS.info;

  return (
    <div
      className={`
        ${toast.exiting ? 'toast-exit' : 'toast-enter'}
        relative w-80 max-w-[90vw] p-4 rounded-xl border backdrop-blur-lg
        shadow-2xl shadow-black/20 overflow-hidden
        ${variant.bg}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${variant.iconBg}`}>
          {variant.icon}
        </div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="text-white text-sm font-bold mb-0.5 leading-tight">{toast.title}</p>
          )}
          <p className="text-gray-300 text-xs leading-relaxed">{toast.message}</p>
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0 mt-0.5"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
          <div
            className={`h-full ${variant.progress} opacity-60`}
            style={{ animation: `toast-progress ${toast.duration}ms linear forwards` }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, type, title, message, duration, exiting: false }]);

    if (duration > 0) {
      setTimeout(() => dismissToast(id), duration);
    }

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    // Remove from DOM after exit animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, dismissToast }}>
      {children}

      {/* Toast container — fixed top-right */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
