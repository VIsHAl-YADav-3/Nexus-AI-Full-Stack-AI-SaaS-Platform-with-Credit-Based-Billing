export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);

export const formatNumber = (num) => new Intl.NumberFormat('en-IN').format(num || 0);

export const truncate = (text, length = 80) => {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
};

export const statusColor = (status) => {
  switch (status) {
    case 'captured':
      return 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20';
    case 'failed':
      return 'text-red-400 bg-red-400/10 border-red-400/20';
    default:
      return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  }
};
