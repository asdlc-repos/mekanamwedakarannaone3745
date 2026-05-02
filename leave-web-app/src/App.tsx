import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { LeaveBalance } from './components/LeaveBalance';
import { Toast } from './components/Toast';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  }, []);

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <nav style={{
          background: '#1e3a5f', color: '#fff', padding: '0 32px',
          display: 'flex', alignItems: 'center', gap: 8, height: 56,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          <span style={{ fontWeight: 700, fontSize: 18, marginRight: 32 }}>Leave Management</span>
          <NavLink to="/employee" style={navLinkStyle}>Employee</NavLink>
          <NavLink to="/manager" style={navLinkStyle}>Manager</NavLink>
          <NavLink to="/balance" style={navLinkStyle}>Balance</NavLink>
        </nav>

        <main style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/employee" replace />} />
            <Route path="/employee" element={<EmployeeDashboard onToast={showToast} />} />
            <Route path="/manager" element={<ManagerDashboard onToast={showToast} />} />
            <Route path="/balance" element={<LeaveBalance onToast={showToast} />} />
          </Routes>
        </main>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </BrowserRouter>
  );
};

function navLinkStyle({ isActive }: { isActive: boolean }): React.CSSProperties {
  return {
    color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    padding: '6px 14px',
    borderRadius: 6,
    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
    fontWeight: isActive ? 600 : 400,
    fontSize: 15,
  };
}

export default App;
