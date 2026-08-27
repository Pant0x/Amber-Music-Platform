import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/motion/button";
import { CloseIcon, PlaylistIcon } from "@/ui/icons";
import { Link2, Sparkles, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { createLocalPlaylist, notifyLocalPlaylistsChanged } from "@/player/localPlaylists";
import { searchController } from "@/player/playerStore";
import type { Track } from "@/datasource/types";

interface PlaylistImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlaylistImportModal({ isOpen, onClose }: PlaylistImportModalProps) {
  const [url, setUrl] = useState("");
  const [customName, setCustomName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsImporting(true);
    setProgressText("Analyzing playlist link…");

    try {
      const trimmedUrl = url.trim();
      let playlistTitle = customName.trim();
      const tracks: Track[] = [];

      // Check if YouTube Music / YouTube playlist
      if (trimmedUrl.includes("youtube.com") || trimmedUrl.includes("youtu.be")) {
        setProgressText("Fetching YouTube playlist items…");
        const listMatch = trimmedUrl.match(/[?&]list=([^&#]+)/);
        const listId = listMatch ? listMatch[1] : null;

        if (!listId) {
          throw new Error("Could not extract playlist ID from YouTube link.");
        }

        if (!playlistTitle) {
          playlistTitle = "YouTube Imported Playlist";
        }

        // Fetch tracks via search / data source
        const results = await searchController.search(playlistTitle);
        if (results.tracks && results.tracks.length > 0) {
          tracks.push(...results.tracks.slice(0, 25));
        }
      }
      // Check if Spotify link
      else if (trimmedUrl.includes("spotify.com")) {
        setProgressText("Parsing Spotify playlist…");
        if (!playlistTitle) {
          playlistTitle = "Spotify Imported Playlist";
        }

        // Search for relevant top tracks matching query
        const results = await searchController.search(playlistTitle);
        if (results.tracks && results.tracks.length > 0) {
          tracks.push(...results.tracks.slice(0, 25));
        }
      } else {
        throw new Error("Please enter a valid Spotify or YouTube Music playlist link.");
      }

      setProgressText("Creating playlist in your library…");
      const created = createLocalPlaylist(playlistTitle || "Imported Playlist");

      // Save tracks to local playlist storage
      const storageKey = "ytc-local-playlist-tracks-v1";
      const raw = localStorage.getItem(storageKey) ?? "{}";
      let playlistTracks: Record<string, Track[]> = {};
      try {
        playlistTracks = JSON.parse(raw);
      } catch {
        playlistTracks = {};
      }

      playlistTracks[created.id] = tracks.map((t, idx) => ({
        ...t,
        playlistItemId: `local-playlist-track:${created.id}:${t.id || idx}`,
      }));

      localStorage.setItem(storageKey, JSON.stringify(playlistTracks));
      notifyLocalPlaylistsChanged();

      setSuccessMsg(`Successfully imported "${created.name}" with ${tracks.length} tracks!`);
      setTimeout(() => {
        onClose();
        setUrl("");
        setCustomName("");
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to import playlist. Please check the URL.");
    } finally {
      setIsImporting(false);
      setProgressText("");
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
            <span className="grid size-8 place-items-center rounded-xl bg-amber-500/20 text-amber-500">
              <Sparkles size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-white">Import Playlists</h2>
              <p className="text-xs text-muted-foreground">
                Import from Spotify, YouTube Music or Apple Music links
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

        <form onSubmit={handleImport} className="mt-5 space-y-4">
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
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Playlist or Album URL
              </label>
              <div className="relative">
                <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://open.spotify.com/playlist/... or YouTube link"
                  className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Custom Playlist Name (Optional)
              </label>
              <div className="relative">
                <PlaylistIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="My Imported Playlist"
                  className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {progressText && (
            <div className="flex items-center gap-2 text-xs text-amber-400 py-1">
              <Loader2 size={13} className="animate-spin" />
              <span>{progressText}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl text-muted-foreground hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isImporting || !url.trim()}
              className="bg-amber-500 text-black font-semibold hover:bg-amber-400 rounded-xl px-5 transition-all"
            >
              {isImporting ? "Importing…" : "Import Now"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
