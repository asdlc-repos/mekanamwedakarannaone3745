import type { LeaveRequest, LeaveBalance, User } from './types';

const LEAVE_BASE = '/api/leave';
const USER_BASE = '/api/user';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// Leave requests
export const getLeaveRequests = (userId: string) =>
  request<LeaveRequest[]>(`${LEAVE_BASE}/leave-requests?userId=${encodeURIComponent(userId)}`);

export const getLeaveRequestsByManager = (managerId: string) =>
  request<LeaveRequest[]>(`${LEAVE_BASE}/leave-requests?managerId=${encodeURIComponent(managerId)}`);

export const createLeaveRequest = (data: {
  userId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}) => request<LeaveRequest>(`${LEAVE_BASE}/leave-requests`, { method: 'POST', body: JSON.stringify(data) });

export const updateLeaveRequestStatus = (requestId: string, status: 'approved' | 'rejected') =>
  request<LeaveRequest>(`${LEAVE_BASE}/leave-requests/${encodeURIComponent(requestId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

// Leave balance
export const getLeaveBalance = (userId: string) =>
  request<LeaveBalance>(`${LEAVE_BASE}/leave-balance/${encodeURIComponent(userId)}`);

// Users
export const getDirectReports = (managerId: string) =>
  request<User[]>(`${USER_BASE}/users/${encodeURIComponent(managerId)}/reports`);
