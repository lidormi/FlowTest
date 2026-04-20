import React, { createContext, useContext, useState, useCallback } from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const remove = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
const TOAST_CLASS  = { success: styles.toastSuccess,  error: styles.toastError,  warning: styles.toastWarning,  info: styles.toastInfo };
const ICON_CLASS   = { success: styles.toastIconSuccess, error: styles.toastIconError, warning: styles.toastIconWarning, info: styles.toastIconInfo };

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className={styles.container}>
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${TOAST_CLASS[t.type] || styles.toastInfo}`}>
          <span className={`${styles.toastIcon} ${ICON_CLASS[t.type] || styles.toastIconInfo}`}>
            {ICONS[t.type]}
          </span>
          <span className={styles.toastMsg}>{t.msg}</span>
          <button onClick={() => onRemove(t.id)} className={styles.toastClose}>×</button>
        </div>
      ))}
    </div>
  );
}
