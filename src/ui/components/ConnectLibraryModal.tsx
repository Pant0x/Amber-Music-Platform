import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CloseIcon, RefreshIcon, CheckIcon, LoginIcon } from "@/ui/icons";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { supabase } from "../../lib/supabaseClient";
import { libraryController, useLibraryState } from "../../player/playerStore";
import { useAuthProfile } from "../../lib/authProfile";

interface ConnectLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectLibraryModal({ isOpen, onClose }: ConnectLibraryModalProps) {
  const libraryState = useLibraryState();
  const { profile } = useAuthProfile();
  const [cookieInput, setCookieInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const isConnected = libraryState.status === "ready" && Boolean(libraryState.library?.account);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSyncFromCloud = async () => {
    setIsSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      if (!supabase) {
        throw new Error("Cloud service is not configured.");
      }

      const { data } = await supabase.auth.getSession();
      const remoteCookie = data?.session?.user?.user_metadata?.yt_music_cookie;

      if (!remoteCookie || typeof remoteCookie !== "string" || remoteCookie.trim().length === 0) {
        throw new Error(
          "No YouTube Music session found in your cloud profile yet. Open the OpenTune desktop app on your PC to auto-sync, or paste your cookie below.",
        );
      }

      await libraryController.setManualCookie(remoteCookie);
      setSuccess("Successfully connected and synced YouTube Music library!");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveCookie = async () => {
    const trimmed = cookieInput.trim();
    if (!trimmed) {
      setError("Please paste a valid YouTube Music cookie.");
      return;
    }

    setIsSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      await libraryController.setManualCookie(trimmed);
      setSuccess("Successfully connected to YouTube Music!");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load library with this session.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      await libraryController.setManualCookie(null);
      setSuccess("Disconnected from YouTube Music.");
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnect failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="connect-library-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="relative w-full max-w-lg rounded-3xl bg-card border border-border/40 shadow-2xl overflow-hidden p-6 sm:p-7"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute top-4 right-4 z-20 flex size-8 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-foreground hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={18} />
          </button>

          <div className="flex flex-col items-center mb-6 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary mb-3">
              <LoginIcon size={24} />
            </div>
            <h2 id="connect-library-modal-title" className="text-xl font-bold text-foreground">
              {isConnected ? "YouTube Music Connected" : "Connect YouTube Music Library"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {isConnected
                ? "Your YouTube Music playlists, favorites, and recommendations are synced."
                : "Sync your playlists, liked songs, and personalized Egyptian & international mixes directly into OpenTune Web."}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-destructive/15 border border-destructive/20 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/20 p-3 text-xs text-emerald-400">
              <CheckIcon size={16} />
              <span>{success}</span>
            </div>
          )}

          {isConnected ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                  <CheckIcon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {libraryState.library?.account?.name || "Active Session"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {libraryState.library?.playlists.length ?? 0} playlists &bull;{" "}
                    {libraryState.library?.likedSongs.length ?? 0} liked songs
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={isSyncing}
                  onClick={() => void handleSyncFromCloud()}
                  className="flex-1 rounded-xl text-xs"
                >
                  <RefreshIcon size={14} className={isSyncing ? "animate-spin mr-1.5" : "mr-1.5"} />
                  Resync from Cloud
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={isSyncing}
                  onClick={() => void handleDisconnect()}
                  className="rounded-xl text-xs text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Option 1: Cloud Sync */}
              {profile && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Option 1: Sync from OpenTune Desktop
                    </span>
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    If you use OpenTune Desktop on your PC, it automatically syncs your session to your account.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    disabled={isSyncing}
                    onClick={() => void handleSyncFromCloud()}
                    className="w-full rounded-xl text-xs font-semibold py-2.5"
                  >
                    {isSyncing ? (
                      <>
                        <Loader variant="spinner" size={14} className="mr-2" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshIcon size={14} className="mr-1.5" />
                        Sync from OpenTune Desktop
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Option 2: Paste Cookie */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {profile ? "Option 2: Paste YouTube Music Cookie" : "Paste YouTube Music Cookie"}
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Paste your YouTube Music session cookie directly:
                </p>
                <textarea
                  value={cookieInput}
                  onChange={(e) => setCookieInput(e.target.value)}
                  placeholder="SAPISID=...; __Secure-3PAPISID=...; etc."
                  rows={3}
                  disabled={isSyncing}
                  className="w-full rounded-xl bg-background/90 p-3 text-xs font-mono text-foreground outline-none border border-border/40 focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none placeholder:text-muted-foreground/40"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={isSyncing || !cookieInput.trim()}
                  onClick={() => void handleSaveCookie()}
                  className="w-full rounded-xl text-xs font-semibold py-2.5 hover:border-primary/40 hover:bg-primary/10 transition-all"
                >
                  {isSyncing ? "Connecting..." : "Connect Session Cookie"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
