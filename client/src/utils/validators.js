// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation (Ethiopian format)
export const isValidPhone = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check for Ethiopian phone formats
  // +251 9XXXXXXXX or 09XXXXXXXXX
  const ethiopianPhoneRegex = /^(\+251)?(9\d{8})$/;
  
  return ethiopianPhoneRegex.test(cleaned);
};

// Required field validation
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

// Length validation
export const validateLength = (value, minLength, maxLength, fieldName) => {
  if (value && (value.length < minLength || value.length > maxLength)) {
    return `${fieldName} must be between ${minLength} and ${maxLength} characters`;
  }
  return null;
};

// Number validation
export const validateNumber = (value, fieldName, min = null, max = null) => {
  if (value === '' || value === null || value === undefined) return null;
  
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  
  if (min !== null && num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  
  if (max !== null && num > max) {
    return `${fieldName} must be at most ${max}`;
  }
  
  return null;
};

// Percentage validation
export const validatePercentage = (value, fieldName) => {
  return validateNumber(value, fieldName, 0, 100);
};

// Date validation
export const validateDate = (value, fieldName, minDate = null, maxDate = null) => {
  if (!value) return null;
  
  const date = new Date(value);
  
  if (isNaN(date.getTime())) {
    return `${fieldName} must be a valid date`;
  }
  
  if (minDate && date < minDate) {
    return `${fieldName} must be after ${minDate.toLocaleDateString()}`;
  }
  
  if (maxDate && date > maxDate) {
    return `${fieldName} must be before ${maxDate.toLocaleDateString()}`;
  }
  
  return null;
};

// Future date validation
export const validateFutureDate = (value, fieldName) => {
  return validateDate(value, fieldName, new Date());
};

// Past date validation
export const validatePastDate = (value, fieldName) => {
  return validateDate(value, fieldName, null, new Date());
};

// License plate validation (Ethiopian format)
export const isValidLicensePlate = (plate) => {
  // Ethiopian license plates typically follow formats like:
  // 2-3 letters followed by 3-4 digits, or similar patterns
  const plateRegex = /^[A-Z]{2,3}\d{3,4}$/i;
  return plateRegex.test(plate.replace(/\s/g, ''));
};

// Password validation
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return errors;
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return errors;
};

// URL validation
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// File validation
export const validateFile = (file, allowedTypes = [], maxSizeMB = 5) => {
  const errors = [];
  
  if (!file) return errors;
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }
  
  return errors;
};

// Vehicle validation
export const validateVehicle = (vehicle) => {
  const errors = {};
  
  if (!vehicle.plateNumber) {
    errors.plateNumber = 'License plate is required';
  } else if (!isValidLicensePlate(vehicle.plateNumber)) {
    errors.plateNumber = 'Invalid license plate format';
  }
  
  if (!vehicle.make) {
    errors.make = 'Vehicle make is required';
  }
  
  if (!vehicle.model) {
    errors.model = 'Vehicle model is required';
  }
  
  if (!vehicle.year) {
    errors.year = 'Vehicle year is required';
  } else {
    const currentYear = new Date().getFullYear();
    const year = parseInt(vehicle.year);
    if (isNaN(year) || year < 1900 || year > currentYear + 1) {
      errors.year = `Year must be between 1900 and ${currentYear + 1}`;
    }
  }
  
  if (!vehicle.capacity) {
    errors.capacity = 'Vehicle capacity is required';
  } else {
    const capacityError = validateNumber(vehicle.capacity, 'Capacity', 1, 100);
    if (capacityError) errors.capacity = capacityError;
  }
  
  return errors;
};

// Driver validation
export const validateDriver = (driver) => {
  const errors = {};
  
  if (!driver.name) {
    errors.name = 'Driver name is required';
  } else {
    const nameError = validateLength(driver.name, 2, 50, 'Name');
    if (nameError) errors.name = nameError;
  }
  
  if (!driver.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(driver.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!driver.phone) {
    errors.phone = 'Phone number is required';
  } else if (!isValidPhone(driver.phone)) {
    errors.phone = 'Invalid phone number format';
  }
  
  if (!driver.licenseNumber) {
    errors.licenseNumber = 'License number is required';
  }
  
  if (!driver.licenseClass) {
    errors.licenseClass = 'License class is required';
  }
  
  return errors;
};

// Route validation
export const validateRoute = (route) => {
  const errors = {};
  
  if (!route.name) {
    errors.name = 'Route name is required';
  } else {
    const nameError = validateLength(route.name, 2, 100, 'Route name');
    if (nameError) errors.name = nameError;
  }
  
  if (!route.startPoint) {
    errors.startPoint = 'Start point is required';
  }
  
  if (!route.endPoint) {
    errors.endPoint = 'End point is required';
  }
  
  if (!route.distance) {
    errors.distance = 'Distance is required';
  } else {
    const distanceError = validateNumber(route.distance, 'Distance', 0.1, 1000);
    if (distanceError) errors.distance = distanceError;
  }
  
  if (!route.estimatedDuration) {
    errors.estimatedDuration = 'Estimated duration is required';
  } else {
    const durationError = validateNumber(route.estimatedDuration, 'Duration', 5, 1440);
    if (durationError) errors.estimatedDuration = durationError;
  }
  
  return errors;
};

// Fuel record validation
export const validateFuelRecord = (record) => {
  const errors = {};
  
  if (!record.vehicleId) {
    errors.vehicleId = 'Vehicle is required';
  }
  
  if (!record.date) {
    errors.date = 'Date is required';
  } else {
    const dateError = validateDate(record.date, 'Date');
    if (dateError) errors.date = dateError;
  }
  
  if (!record.liters) {
    errors.liters = 'Fuel amount is required';
  } else {
    const litersError = validateNumber(record.liters, 'Fuel amount', 0.1, 1000);
    if (litersError) errors.liters = litersError;
  }
  
  if (!record.cost) {
    errors.cost = 'Cost is required';
  } else {
    const costError = validateNumber(record.cost, 'Cost', 0, 100000);
    if (costError) errors.cost = costError;
  }
  
  if (!record.odometer) {
    errors.odometer = 'Odometer reading is required';
  } else {
    const odometerError = validateNumber(record.odometer, 'Odometer', 0);
    if (odometerError) errors.odometer = odometerError;
  }
  
  return errors;
};

// Maintenance task validation
export const validateMaintenanceTask = (task) => {
  const errors = {};
  
  if (!task.title) {
    errors.title = 'Task title is required';
  } else {
    const titleError = validateLength(task.title, 2, 100, 'Title');
    if (titleError) errors.title = titleError;
  }
  
  if (!task.vehicleId) {
    errors.vehicleId = 'Vehicle is required';
  }
  
  if (!task.type) {
    errors.type = 'Maintenance type is required';
  }
  
  if (!task.priority) {
    errors.priority = 'Priority is required';
  }
  
  if (!task.scheduledDate) {
    errors.scheduledDate = 'Scheduled date is required';
  } else {
    const dateError = validateFutureDate(task.scheduledDate, 'Scheduled date');
    if (dateError) errors.scheduledDate = dateError;
  }
  
  if (task.estimatedCost) {
    const costError = validateNumber(task.estimatedCost, 'Estimated cost', 0, 100000);
    if (costError) errors.estimatedCost = costError;
  }
  
  return errors;
};

// Form validation helper
export const validateForm = (data, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = data[field];
    
    for (const rule of rules) {
      const error = rule(value, field, data);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });
  
  return errors;
};

// Check if form has any validation errors
export const hasValidationErrors = (errors) => {
  return Object.keys(errors).some(key => errors[key]);
};

// Get first validation error
export const getFirstError = (errors) => {
  const firstKey = Object.keys(errors).find(key => errors[key]);
  return firstKey ? errors[firstKey] : null;
};
