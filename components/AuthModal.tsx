import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import TermsOfServiceModal from './TermsOfServiceModal';
import PrivacyPolicyModal from './PrivacyPolicyModal';

const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authError, setAuthError } = useAuth();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const displayError = authError || error;

  useEffect(() => {
    // When the modal is closed from the outside or reopened, reset local state.
    if (!isAuthModalOpen) {
      setError('');
      setMessage('');
      setIsSigningUp(false);
    }
  }, [isAuthModalOpen]);

  const handleAuthAction = async (e: FormEvent) => {
    e.preventDefault();

    if (!supabase) {
      setError('Authentication is not configured. Please contact support.');
      return;
    }

    setLoading(true);
    setAuthError('');
    setError('');
    setMessage('');

    try {
      if (isSigningUp) {
        if (!email.toLowerCase().endsWith('.edu')) {
          setError('Our rideshare network is currently open to verified students only. Please use your .edu email address to register.');
          setLoading(false);
          return;
        }
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phoneNumber,
            }
          }
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        handleClose();
      }
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setError('');
    setMessage('');
    setEmail('');
    setPassword('');
    setFullName('');
    setPhoneNumber('');
    setIsSigningUp(false);
    setAgreedToTerms(false);
    setAuthError('');
    closeAuthModal();
  };

  if (!isAuthModalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative">
          <button onClick={handleClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <div className="p-8">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
              {isSigningUp ? 'Create an Account' : 'Welcome Back'}
            </h2>
             <p className="text-center text-sm text-slate-500 mb-8">
              {isSigningUp ? 'Our rideshare network is currently open to verified students and staff. Please use your .edu email to register.' : 'Sign in to continue.'}
            </p>

            <form onSubmit={handleAuthAction} className="space-y-4">
              {isSigningUp && (
                <>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </>
              )}
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
               {isSigningUp && (
                <div className="flex items-start pt-2">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-xs">
                    <label htmlFor="terms" className="text-slate-600">
                      I agree to the{' '}
                      <button type="button" onClick={() => setShowTerms(true)} className="font-medium text-blue-500 hover:underline focus:outline-none">
                        Terms of Service
                      </button>{' '}
                      &{' '}
                      <button type="button" onClick={() => setShowPrivacy(true)} className="font-medium text-blue-500 hover:underline focus:outline-none">
                        Privacy Policy
                      </button>
                      .
                    </label>
                  </div>
                </div>
              )}
              {displayError && <p className="text-red-500 text-sm text-center !mt-2">{displayError}</p>}
              {message && <p className="text-green-500 text-sm text-center !mt-2">{message}</p>}
              <button
                type="submit"
                disabled={loading || (isSigningUp && !agreedToTerms)}
                className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? 'Processing...' : (isSigningUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>
            <p className="text-center text-sm text-slate-600 mt-6">
              {isSigningUp ? 'Already have an account? ' : "Don't have an account? "}
              <button onClick={() => { setIsSigningUp(!isSigningUp); setError(''); setAuthError(''); }} className="text-blue-500 hover:underline font-semibold">
                {isSigningUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
      <TermsOfServiceModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </>
  );
};

export default AuthModal;