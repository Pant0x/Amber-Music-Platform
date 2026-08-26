"use client";

import { useSupabase } from "@/lib/supabase-provider";
import { motion } from "framer-motion";
import { Music, Loader2, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SignIn, SignUp, ForgotPassword, ResetPassword, VerifyOtp } from "./auth/AuthForms";

export function AuthOverlay({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn, signUp, signInWithOAuth, resetPassword, sendOtp, verifyOtp, signOut } = useSupabase();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot" | "reset" | "verify">("signin");
  const [resetToken, setResetToken] = useState("");

  // Check for reset password token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const type = params.get("type");
    if (token && type === "recovery") {
      setResetToken(token);
      setAuthMode("reset");
      setShowAuth(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return (
    <>
      {showAuth && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowAuth(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-strong rounded-2xl p-8 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
                <Music className="h-7 w-7 text-black" />
              </div>
              <span className="text-2xl font-bold text-text-primary">Amber Music</span>
            </div>
            {authMode === "signin" && (
              <SignIn
                onSubmit={handleSignIn}
                onSwitchToSignUp={() => setAuthMode("signup")}
                onForgotPassword={() => setAuthMode("forgot")}
              />
            )}
            {authMode === "signup" && (
              <SignUp
                onSubmit={handleSignUp}
                onSwitchToSignIn={() => setAuthMode("signin")}
              />
            )}
            {authMode === "forgot" && (
              <ForgotPassword
                onSubmit={handleForgotPassword}
                onBack={() => setAuthMode("signin")}
              />
            )}
            {authMode === "reset" && (
              <ResetPassword
                token={resetToken}
                onSubmit={handleResetPassword}
                onBack={() => setAuthMode("signin")}
              />
            )}
            {authMode === "verify" && (
              <VerifyOtp
                onSubmit={handleVerifyOtp}
                onBack={() => setAuthMode("signin")}
              />
            )}
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => handleOAuthSignIn("google")}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
              <button
                onClick={() => handleOAuthSignIn("discord")}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.38-.44.864-.623 1.25a18.27 18.27 0 0 0-5.436 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.675 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.083.083 0 0 0 .031.057 19.9 19.9 0 0 0 5.995 3.03.078.078 0 0 0 .084-.028c.266-.468.578-.98.832-1.487a19.472 19.472 0 0 0 5.944 0c.33.56.64 1.033.834 1.487a.077.077 0 0 0 .084.028 19.839 19.839 0 0 0 6.004-3.03.077.077 0 0 0 .032-.054c.464-4.965-.226-9.47-1.314-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Discord
              </button>
              <button
                onClick={() => handleOAuthSignIn("spotify")}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm5.521 17.34c-.672.436-1.512.695-2.401.695-1.3 0-2.277-.836-2.598-1.937-.297-1.003.135-1.967.961-2.453.853-.49 1.921-.688 3.114-.58 1.032.085 1.82.456 2.437 1.172.544.629.68 1.512.58 2.447-.09.927-.754 1.544-1.718 1.703zm1.247-3.52c.612-.79 1.037-1.87 1.037-3.033 0-1.588-.734-2.72-1.977-2.72-1.112 0-1.978.87-2.053 2.044-.058.878.278 1.55.821 2.05.608.56 1.448.824 2.172.659z" />
                </svg>
                Spotify
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      {children}
    </>
  );

  function handleSignIn(email: string, password: string) {
    return signIn(email, password);
  }

  function handleSignUp(email: string, password: string) {
    return signUp(email, password);
  }

  function handleForgotPassword(email: string) {
    return resetPassword(email);
  }

  function handleResetPassword(password: string) {
    return updatePassword(password);
  }

  function handleVerifyOtp(email: string, token: string) {
    return verifyOtp(email, token);
  }

  async function handleOAuthSignIn(provider: "google" | "discord" | "spotify") {
    const { error } = await signInWithOAuth(provider);
    if (error) {
      console.error("OAuth sign in error:", error);
    }
  }

  async function updatePassword(password: string) {
    const supabase = (await import("@/lib/supabase")).createSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  }
}