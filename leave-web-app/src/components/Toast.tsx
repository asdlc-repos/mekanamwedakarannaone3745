import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors: Record<string, string> = {
    success: '#22c55e',
    error: '#ef4444',
    info: '#3b82f6',
  };

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
      background: colors[type], color: '#fff',
      padding: '12px 20px', borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      maxWidth: 360, fontSize: 14,
    }}>
      {message}
      <button
        onClick={onClose}
        style={{ marginLeft: 12, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}
      >×</button>
    </div>
  );
};
