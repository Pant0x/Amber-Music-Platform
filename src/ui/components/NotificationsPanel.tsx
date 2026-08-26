"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/usePlayerStore";

export function NotificationsPanel() {
  const { notifications, removeNotification } = useUIStore();
  const [open, setOpen] = useState(false);

  if (!open && notifications.length === 0) return null;

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const colors = {
    info: "border-info/30 bg-info/10 text-info",
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    error: "border-error/30 bg-error/10 text-error",
  };

  return (
    <div className="fixed top-16 right-4 z-40 w-80 md:w-96">
      <div className="flex items-center justify-between p-4 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-xl">
        <h3 className="font-semibold text-text-primary">Notifications</h3>
        <button onClick={() => setOpen(false)} className="btn-ghost h-8 w-8 p-0">
          <X className="h-5 w-5" />
        </button>
      </div>
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = icons[notification.type];
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={cn(
                "flex items-start gap-3 p-4 border-b border-border-primary",
                colors[notification.type]
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 text-text-muted hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}