import React, { useState, useEffect } from 'react';
import { getLeaveBalance } from '../api';
import type { LeaveBalance as LeaveBalanceType } from '../types';

const EMPLOYEE_ID = 'user1';

interface Props {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const LeaveBalance: React.FC<Props> = ({ onToast }) => {
  const [balance, setBalance] = useState<LeaveBalanceType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaveBalance(EMPLOYEE_ID)
      .then(setBalance)
      .catch(err => onToast(`Failed to load balance: ${(err as Error).message}`, 'error'))
      .finally(() => setLoading(false));
  }, [onToast]);

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Leave Balance</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Employee: <strong>{EMPLOYEE_ID}</strong></p>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : balance ? (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <BalanceCard label="Total Days" value={balance.totalDays} color="#2563eb" />
          <BalanceCard label="Used Days" value={balance.usedDays} color="#f59e0b" />
          <BalanceCard label="Remaining Days" value={balance.remainingDays} color="#22c55e" />
        </div>
      ) : (
        <p style={{ color: '#6b7280' }}>No balance information available.</p>
      )}
    </div>
  );
};

const BalanceCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{
    background: '#fff', borderRadius: 10, padding: '28px 36px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'center',
    borderTop: `4px solid ${color}`, minWidth: 140,
  }}>
    <div style={{ fontSize: 42, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>{label}</div>
  </div>
);
