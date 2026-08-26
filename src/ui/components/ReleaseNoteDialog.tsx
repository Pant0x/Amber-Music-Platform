"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReleaseNote {
  version: string;
  date: string;
  notes: string;
  seen: boolean;
}

export function ReleaseNoteDialog() {
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadReleaseNotes();
    checkNewRelease();
  }, []);

  async function loadReleaseNotes() {
    try {
      const response = await fetch("/api/release-notes");
      if (response.ok) {
        const data = await response.json();
        setReleaseNotes(data);
      }
    } catch (error) {
      console.error("Failed to load release notes:", error);
    }
  }

  function checkNewRelease() {
    const seenVersions = JSON.parse(localStorage.getItem("seenReleases") || "[]");
    const hasNew = releaseNotes.some((note) => !seenVersions.includes(note.version));
    if (hasNew) {
      setOpen(true);
    }
  }

  function markAsSeen(version: string) {
    const seenVersions = JSON.parse(localStorage.getItem("seenReleases") || "[]");
    if (!seenVersions.includes(version)) {
      localStorage.setItem("seenReleases", JSON.stringify([...seenVersions, version]));
    }
  }

  function handleClose() {
    releaseNotes.forEach((note) => markAsSeen(note.version));
    setOpen(false);
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-strong rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-border-primary">
            <h2 className="text-xl font-bold text-text-primary">What's New</h2>
            <button
              onClick={handleClose}
              className="btn-ghost h-8 w-8 p-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4">
            {releaseNotes.map((note) => (
              <motion.div
                key={note.version}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border-primary rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(expanded === note.version ? null : note.version)}
                  className="w-full flex items-center justify-between p-4 hover:bg-bg-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                      <span className="text-amber-500 font-bold text-sm">{note.version}</span>
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{note.version}</p>
                      <p className="text-sm text-text-muted">{new Date(note.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {expanded === note.version ? <ChevronUp className="h-5 w-5 text-text-muted" /> : <ChevronDown className="h-5 w-5 text-text-muted" />}
                </button>
                <AnimatePresence>
                  {expanded === note.version && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border-primary p-4 text-text-secondary prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: note.notes }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
          <div className="p-4 border-t border-border-primary flex justify-end">
            <button onClick={handleClose} className="btn-primary">
              Got it
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}