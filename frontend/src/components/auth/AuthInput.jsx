import { useState } from 'react';

/**
 * AuthInput — Reusable form input with validation, password toggle, and accessible labels.
 * 
 * Props:
 *  - id (string) — unique element ID
 *  - label (string) — field label
 *  - type (string) — 'text' | 'email' | 'password' | 'tel'
 *  - value (string)
 *  - onChange (fn)
 *  - onBlur (fn, optional)
 *  - placeholder (string, optional)
 *  - error (string|null) — validation error
 *  - success (bool) — shows green check
 *  - disabled (bool)
 *  - autoComplete (string, optional)
 *  - maxLength (number, optional)
 *  - children (ReactNode, optional) — rendered below input (e.g. strength meter)
 */
const AuthInput = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  success = false,
  disabled = false,
  autoComplete,
  maxLength,
  children,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`
            input-glass w-full py-3 px-4 pr-10 text-sm text-white transition-all duration-200
            ${error
              ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
              : success
                ? 'border-green-500/50 focus:border-green-500/70 focus:ring-green-500/20'
                : 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />

        {/* Right icon area */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Password visibility toggle */}
          {isPassword && value && (
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="text-gray-500 hover:text-gray-300 transition-colors p-0.5"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}

          {/* Validation status icon (non-password or after password toggle) */}
          {!isPassword && error && (
            <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {!isPassword && success && !error && (
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-400 font-medium auth-fade-in" role="alert">
          {error}
        </p>
      )}

      {/* Children slot (e.g. password strength meter) */}
      {children}
    </div>
  );
};

export default AuthInput;
