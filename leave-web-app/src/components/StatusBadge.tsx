import React from 'react';

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected';
}

const colors: Record<string, { bg: string; color: string }> = {
  pending:  { bg: '#fef3c7', color: '#92400e' },
  approved: { bg: '#d1fae5', color: '#065f46' },
  rejected: { bg: '#fee2e2', color: '#991b1b' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style = colors[status] ?? { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      background: style.bg,
      color: style.color,
      textTransform: 'capitalize',
    }}>
      {status}
    </span>
  );
};
