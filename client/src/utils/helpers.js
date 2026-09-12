/**
 * Format a date to a readable string
 */
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format a datetime to a readable time string
 */
export const formatTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format working minutes to "Xh Ym"
 */
export const formatWorkingHours = (minutes) => {
  if (!minutes || minutes === 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

/**
 * Get status badge class
 */
export const getStatusBadgeClass = (status) => {
  const map = {
    present: 'badge-present',
    absent: 'badge-absent',
    late: 'badge-late',
    'half-day': 'badge-half-day',
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    active: 'badge-approved',
    inactive: 'badge-absent',
  };
  return map[status] || 'badge-pending';
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Get greeting based on time of day
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Calculate number of days between two dates (inclusive)
 */
export const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Get current date as YYYY-MM-DD string (for date inputs)
 */
export const getTodayString = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Get error message from axios error
 */
export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'An unexpected error occurred'
  );
};
