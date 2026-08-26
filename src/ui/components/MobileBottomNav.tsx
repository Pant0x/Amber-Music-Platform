"use client";

import { motion } from "framer-motion";
import { Home, Compass, Music, Heart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigationStore } from "@/store/usePlayerStore";

export function MobileBottomNav() {
  const { activeTab, setActiveTab } = useNavigationStore();

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "explore", icon: Compass, label: "Explore" },
    { id: "library", icon: Music, label: "Library" },
    { id: "liked", icon: Heart, label: "Liked" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border-primary md:hidden"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
              activeTab === item.id
                ? "text-amber-500"
                : "text-text-muted hover:text-text-primary"
            )}
            aria-label={item.label}
            aria-current={activeTab === item.id ? "page" : undefined}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </motion.nav>
  );
}