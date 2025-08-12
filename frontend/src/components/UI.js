import React from 'react';
import { 
  CheckCircle, AlertCircle, Info, X, ChevronDown, ChevronRight,
  Search, Filter, Plus, Edit, Trash2, Eye, EyeOff, Download,
  Upload, Calendar, Clock, MapPin, User, Building, Shield
} from 'lucide-react';

// Modern Button Component
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-soft hover:shadow-medium',
    secondary: 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 focus:ring-secondary-500 border border-secondary-300',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500 shadow-soft hover:shadow-medium',
    warning: 'bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-500 shadow-soft hover:shadow-medium',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500 shadow-soft hover:shadow-medium',
    outline: 'bg-transparent text-primary-600 border-2 border-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'bg-transparent text-secondary-600 hover:bg-secondary-100 focus:ring-secondary-500',
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${iconSizes[size]} mr-2`} />
      )}
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className={`${iconSizes[size]} mr-2`} />
      )}
      {children}
      {Icon && iconPosition === 'right' && (
        <Icon className={`${iconSizes[size]} ml-2`} />
      )}
    </button>
  );
};

// Modern Card Component
export const Card = ({ 
  children, 
  className = '', 
  padding = 'default',
  shadow = 'default',
  hover = false,
  ...props 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-soft',
    default: 'shadow-medium',
    lg: 'shadow-large',
    glow: 'shadow-glow',
  };
  
  const hoverClasses = hover ? 'hover:shadow-large hover:-translate-y-1 transition-all duration-300' : '';

  return (
    <div
      className={`bg-white rounded-xl border border-neutral-200 ${paddingClasses[padding]} ${shadowClasses[shadow]} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Modern Input Component
export const Input = ({ 
  label, 
  error, 
  helperText, 
  icon: Icon,
  className = '',
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-secondary-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-secondary-400" />
          </div>
        )}
        <input
          className={`
            block w-full rounded-lg border-2 transition-colors duration-200
            ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3
            ${error 
              ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' 
              : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500'
            }
            focus:outline-none focus:ring-2 focus:ring-offset-0
            placeholder:text-secondary-400
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-danger-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-secondary-500">{helperText}</p>
      )}
    </div>
  );
};

// Modern Textarea Component
export const Textarea = ({ 
  label, 
  error, 
  helperText, 
  className = '',
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-secondary-700">
          {label}
        </label>
      )}
      <textarea
        className={`
          block w-full rounded-lg border-2 transition-colors duration-200
          px-4 py-3 resize-none
          ${error 
            ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' 
            : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500'
          }
          focus:outline-none focus:ring-2 focus:ring-offset-0
          placeholder:text-secondary-400
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-danger-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-secondary-500">{helperText}</p>
      )}
    </div>
  );
};

// Modern Select Component
export const Select = ({ 
  label, 
  error, 
  helperText, 
  options = [], 
  className = '',
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-secondary-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`
            block w-full rounded-lg border-2 transition-colors duration-200
            px-4 py-3 appearance-none bg-white
            ${error 
              ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' 
              : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500'
            }
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className="h-5 w-5 text-secondary-400" />
        </div>
      </div>
      {error && (
        <p className="text-sm text-danger-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-secondary-500">{helperText}</p>
      )}
    </div>
  );
};

// Modern Badge Component
export const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variants = {
    default: 'bg-secondary-100 text-secondary-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-danger-100 text-danger-800',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// Modern Alert Component
export const Alert = ({ 
  type = 'info', 
  title, 
  children, 
  onClose, 
  className = '',
  ...props 
}) => {
  const alertStyles = {
    info: 'bg-primary-50 border-primary-200 text-primary-800',
    success: 'bg-success-50 border-success-200 text-success-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    danger: 'bg-danger-50 border-danger-200 text-danger-800',
  };
  
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertCircle,
    danger: AlertCircle,
  };
  
  const Icon = icons[type];

  return (
    <div
      className={`rounded-lg border p-4 ${alertStyles[type]} ${className}`}
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium">{title}</h3>
          )}
          {children && (
            <div className="mt-2 text-sm">{children}</div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              className="inline-flex rounded-md p-1.5 hover:bg-white hover:bg-opacity-20 transition-colors"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Modern Modal Component
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = '',
  ...props 
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div
          className={`relative bg-white rounded-xl shadow-large ${sizeClasses[size]} w-full ${className}`}
          {...props}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-secondary-900">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 hover:bg-neutral-100 transition-colors"
              >
                <X className="h-6 w-6 text-secondary-400" />
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

// Modern Tabs Component
export const Tabs = ({ 
  tabs = [], 
  activeTab, 
  onTabChange, 
  className = '',
  ...props 
}) => {
  return (
    <div className={className} {...props}>
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

// Modern Loading Spinner Component
export const Spinner = ({ 
  size = 'md', 
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
};

// Modern Empty State Component
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = '',
  ...props 
}) => {
  return (
    <div
      className={`text-center py-12 ${className}`}
      {...props}
    >
      {Icon && (
        <Icon className="mx-auto h-12 w-12 text-secondary-400 mb-4" />
      )}
      <h3 className="text-lg font-medium text-secondary-900 mb-2">{title}</h3>
      {description && (
        <p className="text-secondary-500 mb-6">{description}</p>
      )}
      {action && action}
    </div>
  );
};

// Modern Search Input Component
export const SearchInput = ({ 
  placeholder = 'Search...', 
  value, 
  onChange, 
  onSearch,
  className = '',
  ...props 
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-secondary-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        className="block w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
};

// Modern Status Indicator Component
export const StatusIndicator = ({ 
  status, 
  size = 'md',
  className = '',
  ...props 
}) => {
  const statusConfig = {
    submitted: { color: 'bg-secondary-500', label: 'Submitted' },
    acknowledged: { color: 'bg-primary-500', label: 'Acknowledged' },
    underReview: { color: 'bg-warning-500', label: 'Under Review' },
    resolved: { color: 'bg-success-500', label: 'Resolved' },
    closed: { color: 'bg-neutral-500', label: 'Closed' },
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const config = statusConfig[status] || statusConfig.submitted;

  return (
    <div className={`flex items-center space-x-2 ${className}`} {...props}>
      <div className={`${config.color} ${sizeClasses[size]} rounded-full`} />
      <span className="text-sm font-medium text-secondary-700">{config.label}</span>
    </div>
  );
};