/**
 * Firebase Error Code → User-Friendly Message Mapper
 * Never exposes internal error details to the user.
 */

const FIREBASE_ERROR_MAP = {
  // Authentication errors
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password. Please try again.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/weak-password': 'Password is too weak. Use at least 8 characters with mixed case, numbers, and symbols.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'Network error. Please check your internet connection.',
  'auth/internal-error': 'An unexpected error occurred. Please try again.',
  'auth/invalid-api-key': 'Configuration error. Please contact support.',
  'auth/app-deleted': 'Configuration error. Please contact support.',
  'auth/invalid-user-token': 'Your session has expired. Please sign in again.',
  'auth/user-token-expired': 'Your session has expired. Please sign in again.',
  'auth/requires-recent-login': 'Please sign in again to complete this action.',
  'auth/credential-already-in-use': 'This credential is already linked to another account.',
  'auth/account-exists-with-different-credential': 'An account already exists with a different sign-in method. Try a different method.',
  
  // Google-specific
  'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
  'auth/popup-blocked': 'Pop-up was blocked by your browser. Please allow pop-ups for this site.',
  'auth/cancelled-popup-request': 'Only one sign-in window can be open at a time.',
  'auth/unauthorized-domain': 'This domain is not authorized. Please contact support.',
  
  // Phone-specific (kept for future use)
  'auth/invalid-phone-number': 'Please enter a valid phone number.',
  'auth/missing-phone-number': 'Phone number is required.',
  'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
  'auth/captcha-check-failed': 'Security verification failed. Please refresh and try again.',
  'auth/invalid-verification-code': 'Invalid verification code. Please try again.',
  'auth/code-expired': 'Verification code has expired. Please request a new one.',
};

/**
 * Get a user-friendly error message from a Firebase error.
 * @param {Error|Object} error - Firebase error object
 * @returns {string} User-friendly error message
 */
export function getFirebaseErrorMessage(error) {
  if (!error) return 'An unexpected error occurred.';

  // Extract error code from Firebase error
  const code = error?.code || error?.errorCode || '';
  
  if (FIREBASE_ERROR_MAP[code]) {
    return FIREBASE_ERROR_MAP[code];
  }

  // Backend API error (axios)
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Generic Firebase message (cleaned up)
  if (error?.message) {
    // Don't expose raw Firebase messages — return generic
    if (error.message.includes('Firebase') || error.message.includes('auth/')) {
      return 'Authentication failed. Please try again.';
    }
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

export default getFirebaseErrorMessage;
