import React from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export const FormField = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  required = false,
  options = [],
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            className={`input ${error && touched ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
            {...props}
          >
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            rows={4}
            className={`input resize-none ${error && touched ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
            {...props}
          />
        );

      case 'password':
        return (
          <div className="relative">
            <input
              name={name}
              type={showPassword ? 'text' : 'password'}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              className={`input pr-10 ${error && touched ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
              {...props}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              name={name}
              type="checkbox"
              checked={value}
              onChange={onChange}
              onBlur={onBlur}
              disabled={disabled}
              required={required}
              className={`h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded ${className}`}
              {...props}
            />
            <label className="text-sm text-gray-700">{label}</label>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <input
                  name={name}
                  type="radio"
                  value={option.value}
                  checked={value === option.value}
                  onChange={onChange}
                  onBlur={onBlur}
                  disabled={disabled}
                  required={required}
                  className={`h-4 w-4 text-primary focus:ring-primary border-gray-300 ${className}`}
                  {...props}
                />
                <label className="text-sm text-gray-700">{option.label}</label>
              </div>
            ))}
          </div>
        );

      case 'file':
        return (
          <input
            name={name}
            type="file"
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            className={`input ${error && touched ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
            {...props}
          />
        );

      case 'date':
        return (
          <input
            name={name}
            type="date"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            className={`input ${error && touched ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
            {...props}
          />
        );

      case 'datetime-local':
        return (
          <input
            name={name}
            type="datetime-local"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            className={`input ${error && touched ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
            {...props}
          />
        );

      case 'number':
        return (
          <input
            name={name}
            type="number"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`input ${error && touched ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
            {...props}
          />
        );

      default:
        return (
          <input
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`input ${error && touched ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
            {...props}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      {type !== 'checkbox' && label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {error && touched && (
        <div className="flex items-center gap-1 text-red-500 text-xs">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
};

export const FormSection = ({ title, description, children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      )}
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

export const FormActions = ({ onCancel, onSubmit, submitText = 'Submit', cancelText = 'Cancel', loading = false }) => (
  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
    <button
      type="button"
      onClick={onCancel}
      disabled={loading}
      className="btn-secondary"
    >
      {cancelText}
    </button>
    <button
      type="submit"
      disabled={loading}
      className="btn-primary"
    >
      {loading ? 'Loading...' : submitText}
    </button>
  </div>
);
