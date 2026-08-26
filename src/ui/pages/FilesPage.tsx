"use client";

import { motion } from "framer-motion";
import { Folder, Upload, Download, Music, Plus, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Local Files</h1>
        <button className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Add Folder
        </button>
      </div>

      <div className="card p-8 text-center">
        <Folder className="mx-auto h-16 w-16 text-text-muted mb-4" />
        <h2 className="text-xl font-medium text-text-primary mb-2">Local Files</h2>
        <p className="text-text-muted mb-4">Add folders to scan for local music files</p>
        <button className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Add Folder
        </button>
      </div>
    </motion.div>
  );
}