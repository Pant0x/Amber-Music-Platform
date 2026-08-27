import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSupabase } from "@/lib/supabase-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/motion/button";
import { CloseIcon, LoginIcon, UserIcon } from "@/ui/icons";
import { Mail, Lock, LogOut, CheckCircle, AlertCircle } from "lucide-react";

interface SupabaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseAuthModal({ isOpen, onClose }: SupabaseAuthModalProps) {
  const { user, loading, signIn, signUp, signInWithOAuth, signOut } = useSupabase();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg("Signed in successfully!");
          setTimeout(onClose, 800);
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg("Account created! Check your email to confirm registration.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "google" | "discord" | "spotify") => {
    setErrorMsg(null);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to sign in with ${provider}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161618] p-6 shadow-2xl text-foreground"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-primary/20 text-primary">
              <UserIcon size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-white">
                {user ? "Your Cloud Account" : mode === "signin" ? "Sign In to Amber" : "Create Amber Account"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {user ? "Connected via Supabase" : "Sync your playlists, likes and history across devices"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {user ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3.5 border border-white/5">
              <div className="grid size-11 place-items-center rounded-full bg-primary/20 text-primary font-bold text-lg">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user.email}</p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={12} /> Supabase Auth Active
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Connected Services
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-white/5 py-2 px-3 text-xs font-medium hover:bg-white/10 transition-colors"
                >
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth("discord")}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-white/5 py-2 px-3 text-xs font-medium hover:bg-white/10 transition-colors"
                >
                  <span>Discord</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth("spotify")}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-white/5 py-2 px-3 text-xs font-medium hover:bg-white/10 transition-colors"
                >
                  <span>Spotify</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut();
                  onClose();
                }}
                className="flex items-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/20"
              >
                <LogOut size={14} />
                Sign Out
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
                <CheckCircle size={14} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-black font-semibold hover:bg-primary/90 rounded-xl py-2.5 transition-all"
            >
              {isSubmitting ? "Processing…" : mode === "signin" ? "Sign In" : "Create Account"}
            </Button>

            <div className="relative my-4 text-center">
              <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-white/10" />
              <span className="relative bg-[#161618] px-2 text-[11px] font-medium uppercase text-muted-foreground">
                Or continue with
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs font-medium text-white hover:bg-white/10 transition-colors"
              >
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => handleOAuth("discord")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs font-medium text-white hover:bg-white/10 transition-colors"
              >
                <span>Discord</span>
              </button>
              <button
                type="button"
                onClick={() => handleOAuth("spotify")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs font-medium text-white hover:bg-white/10 transition-colors"
              >
                <span>Spotify</span>
              </button>
            </div>

            <div className="pt-2 text-center text-xs text-muted-foreground">
              {mode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setErrorMsg(null);
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setErrorMsg(null);
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
