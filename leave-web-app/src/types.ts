export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt?: string;
}

export interface LeaveBalance {
  userId: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  managerId?: string;
}
