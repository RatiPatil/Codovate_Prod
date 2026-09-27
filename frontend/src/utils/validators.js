/**
 * Auth Validation Utilities
 * Pure functions for real-time form validation.
 * All validators return null on success, or an error message string.
 */

// ─── Username ────────────────────────────────────────────
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const USERNAME_MIN = 4;
const USERNAME_MAX = 25;

export function validateUsername(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Username is required.';
  if (trimmed.length < USERNAME_MIN) return `Username must be at least ${USERNAME_MIN} characters.`;
  if (trimmed.length > USERNAME_MAX) return `Username must be at most ${USERNAME_MAX} characters.`;
  if (/\s/.test(trimmed)) return 'Username must not contain spaces.';
  if (!USERNAME_REGEX.test(trimmed)) return 'Only letters, numbers, and underscores are allowed.';
  return null;
}

// ─── Email ───────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Email is required.';
  if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid email address.';
  return null;
}

// ─── Password ────────────────────────────────────────────
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 64;

/**
 * Returns { error: string|null, strength: 'weak'|'medium'|'strong'|'very_strong', checks: {} }
 */
export function validatePassword(value) {
  const checks = {
    minLength: (value || '').length >= PASSWORD_MIN,
    maxLength: (value || '').length <= PASSWORD_MAX,
    hasUppercase: /[A-Z]/.test(value || ''),
    hasLowercase: /[a-z]/.test(value || ''),
    hasNumber: /[0-9]/.test(value || ''),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(value || ''),
  };

  // Compute strength score (0-4)
  let score = 0;
  if (checks.minLength) score++;
  if (checks.hasUppercase && checks.hasLowercase) score++;
  if (checks.hasNumber) score++;
  if (checks.hasSpecial) score++;

  const strength = score <= 1 ? 'weak' : score === 2 ? 'medium' : score === 3 ? 'strong' : 'very_strong';

  // Error message
  let error = null;
  if (!value) {
    error = 'Password is required.';
  } else if (!checks.minLength) {
    error = `Password must be at least ${PASSWORD_MIN} characters.`;
  } else if (!checks.maxLength) {
    error = `Password must be at most ${PASSWORD_MAX} characters.`;
  } else if (!checks.hasUppercase) {
    error = 'Password must contain at least one uppercase letter.';
  } else if (!checks.hasLowercase) {
    error = 'Password must contain at least one lowercase letter.';
  } else if (!checks.hasNumber) {
    error = 'Password must contain at least one number.';
  } else if (!checks.hasSpecial) {
    error = 'Password must contain at least one special character.';
  }

  return { error, strength, checks };
}

// ─── Confirm Password ───────────────────────────────────
export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return 'Please confirm your password.';
  if (password !== confirmPassword) return 'Passwords do not match.';
  return null;
}

// ─── Sanitize ────────────────────────────────────────────
export function sanitizeInput(value) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
