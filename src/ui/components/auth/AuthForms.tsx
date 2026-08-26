"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  onSubmit: (email: string, password: string) => Promise<{ error?: any }>;
  onSwitchToSignUp?: () => void;
  onSwitchToSignIn?: () => void;
  onForgotPassword?: () => void;
  onBack?: () => void;
  title: string;
  subtitle: string;
  submitLabel: string;
  switchLabel?: string;
  switchActionLabel?: string;
}

export function AuthForm({
  onSubmit,
  onSwitchToSignUp,
  onSwitchToSignIn,
  onForgotPassword,
  onBack,
  title,
  subtitle,
  submitLabel,
  switchLabel,
  switchActionLabel,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await onSubmit(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error.message || "Authentication failed");
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        <p className="mt-1 text-text-muted">{subtitle}</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-10"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
              Password
            </label>
            {onForgotPassword && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-amber-500 hover:text-amber-400"
              >
                Forgot password?
              </button>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10 pr-10"
              placeholder="••••••••"
              autoComplete={onSwitchToSignUp ? "new-password" : "current-password"}
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !email || !password}
        className="btn-primary w-full py-3"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Please wait...
          </>
        ) : (
          submitLabel
        )}
      </button>

      {(switchLabel && switchActionLabel) && (
        <p className="text-center text-text-muted">
          {switchLabel}
          <button
            type="button"
            onClick={onSwitchToSignUp || onSwitchToSignIn}
            className="ml-2 text-amber-500 hover:text-amber-400 font-medium"
          >
            {switchActionLabel}
          </button>
        </p>
      )}

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>
      )}
    </motion.form>
  );
}

export function SignIn({ onSubmit, onSwitchToSignUp, onForgotPassword }: {
  onSubmit: (email: string, password: string) => Promise<{ error?: any }>;
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
}) {
  return (
    <AuthForm
      onSubmit={onSubmit}
      onSwitchToSignUp={onSwitchToSignUp}
      onForgotPassword={onForgotPassword}
      title="Welcome back"
      subtitle="Sign in to your Amber Music account"
      submitLabel="Sign in"
      switchLabel="Don't have an account?"
      switchActionLabel="Sign up"
    />
  );
}

export function SignUp({ onSubmit, onSwitchToSignIn }: {
  onSubmit: (email: string, password: string) => Promise<{ error?: any }>;
  onSwitchToSignIn: () => void;
}) {
  return (
    <AuthForm
      onSubmit={onSubmit}
      onSwitchToSignIn={onSwitchToSignIn}
      title="Create account"
      subtitle="Join Amber Music Platform"
      submitLabel="Create account"
      switchLabel="Already have an account?"
      switchActionLabel="Sign in"
    />
  );
}

export function ForgotPassword({ onSubmit, onBack }: {
  onSubmit: (email: string) => Promise<{ error?: any }>;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await onSubmit(email);
    setLoading(false);
    if (result.error) {
      setError(result.error.message || "Failed to send reset email");
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <CheckCircle className="mx-auto h-16 w-16 text-success" />
        <h2 className="text-2xl font-bold text-text-primary">Check your email</h2>
        <p className="text-text-muted">
          We've sent a password reset link to <strong>{email}</strong>
        </p>
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </button>
      </motion.div>
    );
  }

  return (
    <AuthForm
      onSubmit={handleSubmit}
      onBack={onBack}
      title="Forgot password?"
      subtitle="Enter your email to receive a reset link"
      submitLabel="Send reset link"
    />
  );
}

export function ResetPassword({ token, onSubmit, onBack }: {
  token: string;
  onSubmit: (password: string) => Promise<{ error?: any }>;
  onBack: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    setLoading(true);
    const result = await onSubmit(password);
    setLoading(false);
    if (result.error) {
      setError(result.error.message || "Failed to reset password");
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary">Reset password</h2>
        <p className="mt-1 text-text-muted">Enter your new password</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
            New password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10 pr-10"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input pl-10 pr-10"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              required
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !password || !confirmPassword || password.length < 8}
        className="btn-primary w-full py-3"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Resetting...
          </>
        ) : (
          "Reset password"
        )}
      </button>

      <button type="button" onClick={onBack} className="btn-secondary w-full">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>
    </motion.form>
  );
}

export function VerifyOtp({ onSubmit, onBack }: {
  onSubmit: (email: string, token: string) => Promise<{ error?: any }>;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (step === "email") {
      const result = await onSubmit(email, "");
      setLoading(false);
      if (result.error) {
        setError(result.error.message || "Failed to send code");
      } else {
        setStep("otp");
      }
    } else {
      const result = await onSubmit(email, token);
      setLoading(false);
      if (result.error) {
        setError(result.error.message || "Invalid code");
      }
    }
  };

  if (step === "email") {
    return (
      <AuthForm
        onSubmit={handleSubmit}
        onBack={onBack}
        title="Verify email"
        subtitle="Enter your email to receive a verification code"
        submitLabel="Send code"
      />
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary">Enter code</h2>
        <p className="mt-1 text-text-muted">We sent a 6-digit code to <strong>{email}</strong></p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            type="text"
            maxLength={1}
            value={token[i] || ""}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) {
                const newToken = token.split("");
                newToken[i] = value;
                setToken(newToken.join(""));
                if (value && i < 5) {
                  (document.getElementById(`otp-${i + 1}`) as HTMLInputElement)?.focus();
                }
              }
            }}
            id={`otp-${i}`}
            className="w-12 h-12 text-center text-2xl font-bold input rounded-lg"
            inputMode="numeric"
            pattern="[0-9]*"
            disabled={loading}
            autoComplete="one-time-code"
          />
        ))}
      </div>

      <button
        type="submit"
        disabled={loading || token.length !== 6}
        className="btn-primary w-full py-3"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify"
        )}
      </button>

      <button type="button" onClick={onBack} className="btn-secondary w-full">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>
    </motion.form>
  );
}