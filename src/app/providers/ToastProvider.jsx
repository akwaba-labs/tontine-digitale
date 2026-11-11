import { useCallback, useMemo, useRef, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { ToastContext } from '../../shared/hooks/useToast';

const DEFAULT_DELAY_MS = 5000;

const VARIANTS = {
  success: { bg: 'success', icon: CircleCheck, title: 'Succès', textClass: 'text-white' },
  danger: { bg: 'danger', icon: CircleAlert, title: 'Erreur', textClass: 'text-white' },
  warning: { bg: 'warning', icon: CircleAlert, title: 'Attention', textClass: 'text-dark' },
  info: { bg: 'info', icon: Info, title: 'Information', textClass: 'text-white' },
};

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({ message, variant = 'info', delay = DEFAULT_DELAY_MS }) => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((current) => [...current, { id, message, variant, delay }]);
    return id;
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      showSuccess: (message) => showToast({ message, variant: 'success' }),
      showError: (message) => showToast({ message, variant: 'danger', delay: 8000 }),
      showInfo: (message) => showToast({ message, variant: 'info' }),
      dismiss,
    }),
    [showToast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer position="top-center" className="p-3 position-fixed" style={{ zIndex: 1090 }}>
        {toasts.map((toast) => {
          const config = VARIANTS[toast.variant] ?? VARIANTS.info;
          const Icon = config.icon;
          return (
            <Toast
              key={toast.id}
              bg={config.bg}
              onClose={() => dismiss(toast.id)}
              delay={toast.delay}
              autohide
              role={toast.variant === 'danger' ? 'alert' : 'status'}
            >
              <Toast.Body className={`d-flex align-items-start gap-2 ${config.textClass}`}>
                <Icon size={20} aria-hidden="true" className="flex-shrink-0 mt-1" />
                <span className="flex-grow-1">
                  <span className="visually-hidden">{config.title} : </span>
                  {toast.message}
                </span>
                <button
                  type="button"
                  className={`btn-close ${config.textClass === 'text-white' ? 'btn-close-white' : ''}`}
                  aria-label="Fermer"
                  onClick={() => dismiss(toast.id)}
                />
              </Toast.Body>
            </Toast>
          );
        })}
      </ToastContainer>
    </ToastContext.Provider>
  );
}
