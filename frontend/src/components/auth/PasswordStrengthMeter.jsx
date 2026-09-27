import { validatePassword } from '../../utils/validators';

/**
 * PasswordStrengthMeter — Visual indicator of password complexity.
 * Shows a 4-segment bar and a checklist of requirements.
 * 
 * Props:
 *  - password (string) — current password value
 *  - show (bool) — whether to render (typically show only when password has value)
 */

const STRENGTH_CONFIG = {
  weak:        { label: 'Weak',        color: 'bg-red-500',    width: '25%',  textColor: 'text-red-400' },
  medium:      { label: 'Medium',      color: 'bg-orange-500', width: '50%',  textColor: 'text-orange-400' },
  strong:      { label: 'Strong',      color: 'bg-yellow-400', width: '75%',  textColor: 'text-yellow-400' },
  very_strong: { label: 'Very Strong', color: 'bg-green-500',  width: '100%', textColor: 'text-green-400' },
};

const REQUIREMENTS = [
  { key: 'minLength',     label: 'At least 8 characters' },
  { key: 'hasUppercase',  label: 'One uppercase letter' },
  { key: 'hasLowercase',  label: 'One lowercase letter' },
  { key: 'hasNumber',     label: 'One number' },
  { key: 'hasSpecial',    label: 'One special character' },
];

const PasswordStrengthMeter = ({ password, show = true }) => {
  if (!show || !password) return null;

  const { strength, checks } = validatePassword(password);
  const config = STRENGTH_CONFIG[strength];

  return (
    <div className="mt-2.5 auth-fade-in">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`strength-bar h-full ${config.color}`}
            style={{ width: config.width }}
          />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${config.textColor}`}>
          {config.label}
        </span>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {REQUIREMENTS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1.5">
            {checks[key] ? (
              <svg className="w-3 h-3 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`text-[10px] ${checks[key] ? 'text-gray-300' : 'text-gray-500'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
