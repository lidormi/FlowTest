import React, { createContext, useContext, useState, useCallback } from 'react';

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
const COLORS = {
  success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', text: '#22c55e' },
  error:   { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', text: '#ef4444' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: '#f59e0b' },
  info:    { bg: 'rgba(79,142,247,0.12)', border: 'rgba(79,142,247,0.25)', text: '#4f8ef7' },
};

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 340
    }}>
      {toasts.map(t => {
        const c = COLORS[t.type] || COLORS.info;
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: 'var(--bg2)', border: `1px solid ${c.border}`,
            borderLeft: `3px solid ${c.text}`,
            borderRadius: 9, padding: '10px 12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease',
          }}>
            <span style={{ fontSize: 13, color: c.text, marginTop: 1, flexShrink: 0 }}>{ICONS[t.type]}</span>
            <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5 }}>{t.msg}</span>
            <button onClick={() => onRemove(t.id)} style={{
              background: 'none', border: 'none', color: 'var(--text3)',
              fontSize: 14, cursor: 'pointer', padding: 0, lineHeight: 1, marginTop: 1
            }}>×</button>
          </div>
        );
      })}
    </div>
  );
}
