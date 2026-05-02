import React, { useState, useEffect, useCallback } from 'react';
import { createLeaveRequest, getLeaveRequests } from '../api';
import { StatusBadge } from './StatusBadge';
import type { LeaveRequest } from '../types';

const EMPLOYEE_ID = 'user1';

interface Props {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const EmployeeDashboard: React.FC<Props> = ({ onToast }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeaveRequests(EMPLOYEE_ID);
      setRequests(data);
    } catch (err) {
      onToast(`Failed to load leave requests: ${(err as Error).message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      onToast('Please fill in both start and end dates.', 'error');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      onToast('End date must be on or after start date.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await createLeaveRequest({ userId: EMPLOYEE_ID, startDate, endDate, reason: reason || undefined });
      onToast('Leave request submitted successfully!', 'success');
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchRequests();
    } catch (err) {
      onToast(`Failed to submit: ${(err as Error).message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Employee Dashboard</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Logged in as: <strong>{EMPLOYEE_ID}</strong></p>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Submit Leave Request</h3>
        <form onSubmit={handleSubmit}>
          <div style={fieldRow}>
            <div style={fieldGroup}>
              <label style={labelStyle}>Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>End Date *</label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={e => setEndDate(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
              placeholder="Vacation, personal, etc."
            />
          </div>
          <button type="submit" disabled={submitting} style={btnStyle}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>My Leave Requests</h3>
        {loading ? (
          <p style={{ color: '#6b7280' }}>Loading…</p>
        ) : requests.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No leave requests found.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Start Date</th>
                <th style={thStyle}>End Date</th>
                <th style={thStyle}>Reason</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td style={tdStyle}>{r.startDate}</td>
                  <td style={tdStyle}>{r.endDate}</td>
                  <td style={tdStyle}>{r.reason || '—'}</td>
                  <td style={tdStyle}><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 8, padding: 24,
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24,
};
const fieldRow: React.CSSProperties = { display: 'flex', gap: 16, marginBottom: 16 };
const fieldGroup: React.CSSProperties = { flex: 1 };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14, color: '#374151' };
const inputStyle: React.CSSProperties = { border: '1px solid #d1d5db', borderRadius: 6, padding: '8px 12px', fontSize: 14, width: '100%', boxSizing: 'border-box' };
const btnStyle: React.CSSProperties = { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 600 };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13, color: '#6b7280', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 14 };
