"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, AlertCircle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpdateInfo {
  version: string;
  notes: string;
  date: string;
  url: string;
}

export function UpdateToast() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check for updates on mount
    checkForUpdate();
    const interval = setInterval(checkForUpdate, 60 * 60 * 1000); // Every hour
    return () => clearInterval(interval);
  }, []);

  async function checkForUpdate() {
    try {
      const response = await fetch("/api/admin/dashboard"); // Reuse admin endpoint
      if (response.ok) {
        const data = await response.json();
        if (data.updateAvailable) {
          setUpdate(data.update);
        }
      }
    } catch (error) {
      console.error("Update check failed:", error);
    }
  }

  if (!update || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 right-4 z-50 max-w-md"
      >
        <motion.div
          className="glass-strong rounded-xl p-4 shadow-xl border border-border-primary"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-1 mt-0.5">
              {update.version.includes("beta") ? (
                <AlertCircle className="h-6 w-6 text-amber-500" />
              ) : (
                <Info className="h-6 w-6 text-amber-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-primary">Update Available</p>
              <p className="text-sm text-text-muted mt-1">
                Version {update.version} is ready to install
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 text-text-muted hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => window.open(update.url, "_blank")}
              className="btn-primary flex-1 text-sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="btn-secondary flex-1 text-sm"
            >
              Later
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}