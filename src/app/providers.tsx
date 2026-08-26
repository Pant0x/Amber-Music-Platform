"use client";

import { SupabaseProvider } from "@/lib/supabase-provider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PlayerProvider } from "@/components/providers/PlayerProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SupabaseProvider>
      <ThemeProvider>
        <PlayerProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </PlayerProvider>
      </ThemeProvider>
    </SupabaseProvider>
  );
}