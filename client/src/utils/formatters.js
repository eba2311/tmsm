// Date formatting utilities
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-GB', defaultOptions).format(new Date(date));
};

export const formatDateTime = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-GB', defaultOptions).format(new Date(date));
};

export const formatTime = (date, options = {}) => {
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-GB', defaultOptions).format(new Date(date));
};

export const formatRelativeTime = (date) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(date);
};

// Number formatting utilities
export const formatNumber = (num, options = {}) => {
  const defaultOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  };
  
  return new Intl.NumberFormat('en-US', defaultOptions).format(num);
};

export const formatCurrency = (amount, currency = 'ETB', locale = 'en-ET') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDistance = (meters, unit = 'km') => {
  if (unit === 'km') {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(0)} m`;
};

export const formatSpeed = (speed, unit = 'km/h') => {
  return `${speed.toFixed(1)} ${unit}`;
};

export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

// String formatting utilities
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const camelCase = (str) => {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
};

export const snakeCase = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

export const kebabCase = (str) => {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
};

export const truncate = (str, length = 50, suffix = '...') => {
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
};

// Status formatting utilities
export const formatStatus = (status) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const getStatusColor = (status) => {
  const statusColors = {
    ACTIVE: 'text-green-600 bg-green-100',
    INACTIVE: 'text-gray-600 bg-gray-100',
    PENDING: 'text-yellow-600 bg-yellow-100',
    COMPLETED: 'text-green-600 bg-green-100',
    CANCELLED: 'text-red-600 bg-red-100',
    SCHEDULED: 'text-blue-600 bg-blue-100',
    IN_PROGRESS: 'text-yellow-600 bg-yellow-100',
    OVERDUE: 'text-red-600 bg-red-100',
    ON_LEAVE: 'text-orange-600 bg-orange-100',
    SUSPENDED: 'text-red-600 bg-red-100'
  };
  
  return statusColors[status] || 'text-gray-600 bg-gray-100';
};

// Vehicle formatting utilities
export const formatVehicleInfo = (vehicle) => {
  if (!vehicle) return 'Unknown Vehicle';
  return `${vehicle.plateNumber} (${vehicle.make} ${vehicle.model})`;
};

export const formatCapacity = (current, total) => {
  const percentage = total > 0 ? (current / total * 100).toFixed(0) : 0;
  return `${current}/${total} (${percentage}%)`;
};

// Fuel formatting utilities
export const formatFuelEfficiency = (km, liters) => {
  if (liters === 0) return 'N/A';
  const efficiency = km / liters;
  return `${efficiency.toFixed(2)} km/L`;
};

export const formatFuelCost = (cost, distance) => {
  if (distance === 0) return 'N/A';
  const costPerKm = cost / distance;
  return `${costPerKm.toFixed(2)} ETB/km`;
};

// Driver formatting utilities
export const formatDriverName = (driver) => {
  if (!driver) return 'Unknown Driver';
  return driver.name || driver.user?.name || 'Unknown';
};

export const formatDriverRating = (rating) => {
  if (!rating) return 'N/A';
  return `${rating.toFixed(1)}/5.0`;
};

// Phone number formatting
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format for Ethiopian numbers
  if (cleaned.startsWith('251')) {
    return `+251 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  // Format for local numbers (9 digits)
  if (cleaned.length === 9) {
    return `09${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
};

// File size formatting
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Color utilities
export const getContrastColor = (hexColor) => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

export const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
