"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position?: "center" | "top-right" | "bottom-right";
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
};

export function FloatingPanel({ isOpen, onClose, title, children, position = "center", size = "md" }: FloatingPanelProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "glass-strong rounded-2xl shadow-2xl overflow-hidden",
            SIZE_CLASSES[size],
            "w-full max-h-[90vh] flex flex-col"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-xl">
            <h3 className="font-semibold text-text-primary">{title}</h3>
            <button onClick={onClose} className="btn-ghost h-8 w-8 p-0" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}