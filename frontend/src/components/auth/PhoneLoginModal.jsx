import { useState, useEffect, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/ToastProvider';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';

const PhoneLoginModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const recaptchaContainerRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);
  const confirmationResultRef = useRef(null);
  
  const { loginWithPhone } = useAuth();
  const { addToast } = useToast();

  // Cleanup recaptcha when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      setStep(1);
      setPhone('');
      setOtp('');
      setError(null);
    }
  }, [isOpen]);

  const initRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.');
        }
      });
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number with country code (e.g. +1234567890).');
      return;
    }

    setLoading(true);
    try {
      initRecaptcha();
      const appVerifier = recaptchaVerifierRef.current;
      
      // Ensure phone number has a + prefix for E.164 format
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      confirmationResultRef.current = confirmationResult;
      
      setStep(2);
      addToast({ type: 'success', title: 'OTP Sent', message: 'Please check your phone for the verification code.' });
    } catch (err) {
      console.error(err);
      setError(getFirebaseErrorMessage(err));
      // Reset recaptcha on error so user can try again
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResultRef.current.confirm(otp);
      const idToken = await result.user.getIdToken();
      
      await loginWithPhone(idToken);
      
      addToast({ type: 'success', title: 'Welcome!', message: 'Signed in successfully via phone.' });
      onClose(); // Parent component (Login/Signup) will auto-redirect based on user state
    } catch (err) {
      console.error(err);
      setError(getFirebaseErrorMessage(err) || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-md relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-2xl font-bold text-white mb-2">
          {step === 1 ? 'Continue with Phone' : 'Verify Phone Number'}
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          {step === 1 
            ? 'Enter your mobile number to receive a one-time password.' 
            : `We've sent a 6-digit code to ${phone}`
          }
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !phone}
              className="w-full btn-primary py-3.5 disabled:opacity-50 font-bold tracking-wide shadow-lg shadow-primary/20"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Verification Code</label>
              <input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all tracking-[0.5em] text-center font-mono text-xl disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full btn-primary py-3.5 disabled:opacity-50 font-bold tracking-wide shadow-lg shadow-primary/20"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={loading}
              className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors py-2"
            >
              Change Phone Number
            </button>
          </form>
        )}
        
        <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
      </div>
    </div>
  );
};

export default PhoneLoginModal;
