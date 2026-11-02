import React, { useState } from 'react';
import { AdminUser } from '../../types';
import { loginWithGoogle, logoutAdmin } from '../../firebase/authService';
import { auth } from '../../firebase/firebase';
import { Shield, Lock, AlertCircle, ArrowLeft, UserX, RefreshCw } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (admin: AdminUser) => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToStore,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorizedEmail, setUnauthorizedEmail] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setUnauthorizedEmail(null);
    try {
      const admin = await loginWithGoogle();
      if (admin) {
        onLoginSuccess(admin);
      } else {
        const attemptedEmail = auth.currentUser?.email;
        if (attemptedEmail) {
          setUnauthorizedEmail(attemptedEmail);
        }
        setError(
          'Access Denied: The Google Account you authenticated with is not registered as an authorized dealership administrator.'
        );
        // Automatically sign out from unauthorized Firebase auth session
        await logoutAdmin();
      }
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      const errCode = errObj?.code || '';

      if (errCode === 'auth/unauthorized-domain') {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your Vercel domain';
        setError(
          `Unauthorized Domain (${currentHost}): Firebase Auth requires this domain to be whitelisted. Go to Firebase Console > Authentication > Settings > Authorized Domains and add "${currentHost}".`
        );
      } else if (errCode === 'auth/popup-closed-by-user' || errCode === 'auth/cancelled-popup-request') {
        // User closed or dismissed popup before completing sign-in
        setError('Google Sign-In was cancelled before completion. Click below to try again.');
      } else if (errCode === 'auth/popup-blocked') {
        setError('The sign-in popup was blocked by your browser settings. Please allow popups for this site and try again.');
      } else if (errCode === 'auth/network-request-failed') {
        setError('Network error during authentication. Please check your internet connection and try again.');
      } else {
        console.warn('Google authentication issue:', errObj?.message || err);
        setError(errObj?.message || 'Authentication could not be completed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(229,37,42,0.18),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_120%,rgba(15,17,21,0.9),rgba(10,12,16,1))] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Back Link */}
        <button
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 text-xs font-mono text-[#94A3B8] hover:text-[#ECE5D8] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Vault</span>
        </button>

        <div className="bg-[#171922] border border-white/[0.12] rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-11 h-11 rounded-lg bg-[#E5252A]/10 border border-[#E5252A]/30 flex items-center justify-center text-[#E5252A] shadow-[0_0_15px_rgba(229,37,42,0.2)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold tracking-wider text-[#E5252A] uppercase">
                Apex Security Gateway
              </div>
              <h2 className="font-display font-black text-xl text-[#ECE5D8] tracking-tight">
                Operations Administration
              </h2>
            </div>
          </div>

          <p className="text-xs text-[#94A3B8] leading-relaxed mb-6 font-sans">
            Authentication required. Access to the vehicle management telemetry registry and customer leads is restricted exclusively to authorized dealership administrators.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-500/40 rounded-lg space-y-2 text-xs text-red-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
              {unauthorizedEmail && (
                <div className="mt-2 pt-2 border-t border-red-500/20 text-[11px] font-mono text-red-300 flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5 text-red-400" />
                  <span>Attempted account: <strong>{unauthorizedEmail}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Primary Action: Verified Google Sign In (NO SHORTCUTS) */}
          <div className="space-y-4 mb-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-[#0F1115] font-sans font-bold text-xs py-3.5 px-4 rounded transition-all cursor-pointer shadow-lg hover:shadow-white/10 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#0F1115]" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{loading ? 'Verifying Google Credentials...' : 'Sign in with Authorized Google Account'}</span>
            </button>
          </div>


          {/* Security Footer */}
          <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#94A3B8]/70">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Strict Google OAuth 2.0 • Firebase Role-Based Access Control</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
