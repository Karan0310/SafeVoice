import React, { useState } from 'react';
import { 
  CheckCircle, AlertCircle, Info, X, ChevronDown, ChevronRight,
  Search, Filter, Plus, Edit, Trash2, Eye, EyeOff, Download,
  Upload, Calendar, Clock, MapPin, User, Building, Shield,
  Sun, Moon, Monitor as MonitorIcon, ArrowRight, Star
} from 'lucide-react';

// Modern Button Component with enhanced variants
export const ModernButton = ({ 
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
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500 shadow-soft hover:shadow-glow',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 border border-gray-300 hover:border-gray-400',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 focus:ring-green-500 shadow-soft hover:shadow-glow',
    warning: 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:from-yellow-700 hover:to-orange-700 focus:ring-yellow-500 shadow-soft hover:shadow-glow',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 focus:ring-red-500 shadow-soft hover:shadow-glow',
    outline: 'bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-50 focus:ring-blue-500 hover:border-blue-700',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500 hover:text-gray-800',
    glass: 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 focus:ring-white/50',
  };
  
  const sizes = {
    sm: 'px-4 py-2.5 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
    xl: 'px-10 py-5 text-lg',
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

// Enhanced Card Component with glassmorphism and animations
export const ModernCard = ({ 
  children, 
  className = '', 
  padding = 'default',
  shadow = 'default',
  hover = false,
  glass = false,
  gradient = false,
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
  
  const glassClasses = glass ? 'bg-white/20 backdrop-blur-sm border border-white/30' : 'bg-white border border-gray-200';
  const gradientClasses = gradient ? 'bg-gradient-to-br from-white to-gray-50' : '';
  const hoverClasses = hover ? 'hover:shadow-large hover:-translate-y-2 transition-all duration-300 cursor-pointer' : '';

  return (
    <div
      className={`rounded-2xl ${glassClasses} ${gradientClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Enhanced Input Component with better focus states
export const ModernInput = ({ 
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
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
          </div>
        )}
        <input
          className={`
            block w-full rounded-xl border-2 transition-all duration-200
            ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-4 focus:ring-blue-100'
            }
            focus:outline-none
            placeholder:text-gray-400
            hover:border-gray-400
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center animate-fade-in">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

// Enhanced Textarea Component
export const ModernTextarea = ({ 
  label, 
  error, 
  helperText, 
  className = '',
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <textarea
        className={`
          block w-full rounded-xl border-2 transition-all duration-200
          px-4 py-3.5 resize-none
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500 focus:ring-4 focus:ring-red-100' 
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-4 focus:ring-blue-100'
          }
          focus:outline-none
          placeholder:text-gray-400
          hover:border-gray-400
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 flex items-center animate-fade-in">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

// Enhanced Select Component
export const ModernSelect = ({ 
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
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <div className="relative group">
        <select
          className={`
            block w-full rounded-xl border-2 transition-all duration-200
            px-4 py-3.5 appearance-none bg-white
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500 focus:ring-4 focus:ring-red-100' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-4 focus:ring-blue-100'
            }
            focus:outline-none
            hover:border-gray-400
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
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <ChevronDown className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center animate-fade-in">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

// Enhanced Badge Component with more variants
export const ModernBadge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center font-semibold rounded-full transition-all duration-200';
  
  const variants = {
    default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    primary: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    success: 'bg-green-100 text-green-800 hover:bg-green-200',
    warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    danger: 'bg-red-100 text-red-800 hover:bg-red-200',
    purple: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    indigo: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
  };
  
  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
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

// Enhanced Alert Component with better styling
export const ModernAlert = ({ 
  type = 'info', 
  title, 
  children, 
  onClose, 
  className = '',
  ...props 
}) => {
  const alertStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
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
      className={`rounded-xl border p-4 animate-fade-in ${alertStyles[type]} ${className}`}
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-semibold">{title}</h3>
          )}
          {children && (
            <div className="mt-2 text-sm">{children}</div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              className="inline-flex rounded-lg p-1.5 hover:bg-white hover:bg-opacity-20 transition-colors"
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

// Enhanced Loading Spinner Component
export const ModernSpinner = ({ 
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

// Enhanced Empty State Component
export const ModernEmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = '',
  ...props 
}) => {
  return (
    <div
      className={`text-center py-16 animate-fade-in ${className}`}
      {...props}
    >
      {Icon && (
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-8 max-w-md mx-auto">{description}</p>
      )}
      {action && action}
    </div>
  );
};

// Enhanced Search Input Component
export const ModernSearchInput = ({ 
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
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
};

// Enhanced Status Indicator Component
export const ModernStatusIndicator = ({ 
  status, 
  size = 'md',
  className = '',
  ...props 
}) => {
  const statusConfig = {
    submitted: { color: 'bg-gray-500', label: 'Submitted', bg: 'bg-gray-100', text: 'text-gray-700' },
    acknowledged: { color: 'bg-blue-500', label: 'Acknowledged', bg: 'bg-blue-100', text: 'text-blue-700' },
    underReview: { color: 'bg-yellow-500', label: 'Under Review', bg: 'bg-yellow-100', text: 'text-yellow-700' },
    resolved: { color: 'bg-green-500', label: 'Resolved', bg: 'bg-green-100', text: 'text-green-700' },
    closed: { color: 'bg-gray-500', label: 'Closed', bg: 'bg-gray-100', text: 'text-gray-700' },
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const config = statusConfig[status] || statusConfig.submitted;

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full ${config.bg} ${className}`} {...props}>
      <div className={`${config.color} ${sizeClasses[size]} rounded-full`} />
      <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
    </div>
  );
};

// Theme Toggle Component
export const ThemeToggle = ({ className = '', ...props }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    // Add theme switching logic here
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105 ${className}`}
      {...props}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-600" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600" />
      )}
    </button>
  );
};

// Feature Card Component for landing page
export const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  gradient = false,
  className = '',
  ...props 
}) => {
  const gradientClasses = gradient ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-white';
  
  return (
    <div
      className={`p-8 rounded-2xl ${gradientClasses} shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-1 ${className}`}
      {...props}
    >
      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 shadow-soft">
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

// Stats Card Component
export const StatsCard = ({ 
  icon: Icon, 
  title, 
  value, 
  change, 
  changeType = 'positive',
  className = '',
  ...props 
}) => {
  const changeColor = changeType === 'positive' ? 'text-green-600' : 'text-red-600';
  const changeIcon = changeType === 'positive' ? '↗' : '↘';
  
  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-soft border border-gray-100 ${className}`}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        {change && (
          <span className={`text-sm font-medium ${changeColor}`}>
            {changeIcon} {change}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};