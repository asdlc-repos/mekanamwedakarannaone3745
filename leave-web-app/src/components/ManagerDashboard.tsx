import React, { useState, useEffect, useCallback } from 'react';
import { getLeaveRequestsByManager, updateLeaveRequestStatus } from '../api';
import { StatusBadge } from './StatusBadge';
import type { LeaveRequest } from '../types';

const MANAGER_ID = 'manager1';

interface Props {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ManagerDashboard: React.FC<Props> = ({ onToast }) => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeaveRequestsByManager(MANAGER_ID);
      setRequests(data);
    } catch (err) {
      onToast(`Failed to load requests: ${(err as Error).message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (requestId: string, status: 'approved' | 'rejected') => {
    setProcessing(p => ({ ...p, [requestId]: true }));
    try {
      await updateLeaveRequestStatus(requestId, status);
      onToast(`Request ${status} successfully.`, 'success');
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r));
    } catch (err) {
      onToast(`Failed to update: ${(err as Error).message}`, 'error');
    } finally {
      setProcessing(p => ({ ...p, [requestId]: false }));
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const others = requests.filter(r => r.status !== 'pending');

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Manager Dashboard</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Logged in as: <strong>{MANAGER_ID}</strong></p>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>
          Pending Requests
          {pending.length > 0 && (
            <span style={{ marginLeft: 8, background: '#ef4444', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 12 }}>
              {pending.length}
            </span>
          )}
        </h3>
        {loading ? (
          <p style={{ color: '#6b7280' }}>Loading…</p>
        ) : pending.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No pending requests.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Start Date</th>
                <th style={thStyle}>End Date</th>
                <th style={thStyle}>Reason</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(r => (
                <tr key={r.id}>
                  <td style={tdStyle}>{r.userId}</td>
                  <td style={tdStyle}>{r.startDate}</td>
                  <td style={tdStyle}>{r.endDate}</td>
                  <td style={tdStyle}>{r.reason || '—'}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleAction(r.id, 'approved')}
                      disabled={processing[r.id]}
                      style={{ ...approveBtn, marginRight: 8 }}
                    >Approve</button>
                    <button
                      onClick={() => handleAction(r.id, 'rejected')}
                      disabled={processing[r.id]}
                      style={rejectBtn}
                    >Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {others.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Processed Requests</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Start Date</th>
                <th style={thStyle}>End Date</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {others.map(r => (
                <tr key={r.id}>
                  <td style={tdStyle}>{r.userId}</td>
                  <td style={tdStyle}>{r.startDate}</td>
                  <td style={tdStyle}>{r.endDate}</td>
                  <td style={tdStyle}><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24 };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#6b7280', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 14 };
const approveBtn: React.CSSProperties = { background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 };
const rejectBtn: React.CSSProperties = { background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 };
