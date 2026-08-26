"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Music, Heart, Download, Globe, Shield, Palette, Bell, Key, Monitor, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore, usePlaybackStore, useLyricsStore } from "@/store/usePlayerStore";
import { useTheme } from "@/components/providers/ThemeProvider";

const SETTINGS_SECTIONS = [
  {
    id: "general",
    label: "General",
    icon: Settings,
    items: [
      { key: "theme", label: "Theme", component: "ThemeSelector" },
      { key: "language", label: "Language", component: "LanguageSelector" },
      { key: "compactMode", label: "Compact mode", type: "toggle" },
      { key: "reducedMotion", label: "Reduced motion", type: "toggle" },
    ],
  },
  {
    id: "playback",
    label: "Playback",
    icon: Music,
    items: [
      { key: "crossfade", label: "Crossfade", type: "slider", min: 0, max: 12, step: 1 },
      { key: "playbackRate", label: "Default playback speed", type: "slider", min: 0.5, max: 2, step: 0.1 },
      { key: "autoPlay", label: "Auto-play next", type: "toggle" },
      { key: "gaplessPlayback", label: "Gapless playback", type: "toggle" },
    ],
  },
  {
    id: "audio",
    label: "Audio",
    icon: Volume2,
    items: [
      { key: "equalizer", label: "Equalizer", component: "EqualizerSettings" },
      { key: "audioQuality", label: "Audio quality", component: "QualitySelector" },
      { key: "outputDevice", label: "Output device", component: "DeviceSelector" },
      { key: "normalizeVolume", label: "Normalize volume", type: "toggle" },
    ],
  },
  {
    id: "lyrics",
    label: "Lyrics",
    icon: Heart,
    items: [
      { key: "fontScale", label: "Font size", type: "slider", min: 0.8, max: 1.5, step: 0.1 },
      { key: "translationLanguage", label: "Translation language", component: "LanguageSelector" },
      { key: "showTranslation", label: "Show translation by default", type: "toggle" },
      { key: "lyricsSource", label: "Preferred lyrics source", component: "SourceSelector" },
    ],
  },
  {
    id: "downloads",
    label: "Downloads",
    icon: Download,
    items: [
      { key: "downloadQuality", label: "Download quality", component: "QualitySelector" },
      { key: "maxCacheSize", label: "Max cache size", component: "CacheSizeSelector" },
      { key: "downloadOverWifiOnly", label: "Download over WiFi only", type: "toggle" },
      { key: "autoDeleteCache", label: "Auto-delete old downloads", type: "toggle" },
    ],
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    items: [
      { key: "accentColor", label: "Accent color", component: "ColorPicker" },
      { key: "showArtwork", label: "Show artwork in lists", type: "toggle" },
      { key: "animations", label: "Animations", type: "toggle" },
    ],
  },
  {
    id: "privacy",
    label: "Privacy & Security",
    icon: Shield,
    items: [
      { key: "hideExplicit", label: "Hide explicit content", type: "toggle" },
      { key: "analytics", label: "Share usage analytics", type: "toggle" },
      { key: "crashReports", label: "Send crash reports", type: "toggle" },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    items: [
      { key: "desktopNotifications", label: "Desktop notifications", type: "toggle" },
      { key: "songChangeNotifications", label: "Song change notifications", type: "toggle" },
      { key: "updateNotifications", label: "Update notifications", type: "toggle" },
    ],
  },
  {
    id: "shortcuts",
    label: "Keyboard Shortcuts",
    icon: Key,
    items: [
      { key: "globalShortcuts", label: "Enable global shortcuts", type: "toggle" },
      { key: "customShortcuts", label: "Customize shortcuts", component: "ShortcutEditor" },
    ],
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: Monitor,
    items: [
      { key: "hardwareAcceleration", label: "Hardware acceleration", type: "toggle" },
      { key: "clearCache", label: "Clear cache", component: "ClearCacheButton" },
      { key: "resetSettings", label: "Reset all settings", component: "ResetButton" },
      { key: "debugMode", label: "Debug mode", type: "toggle" },
    ],
  },
];

export function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { hideExplicit, setHideExplicit, compactMode, setCompactMode, reducedMotion, setReducedMotion } = useUIStore();
  const { crossfade, setCrossfade, playbackRate, setPlaybackRate } = usePlaybackStore();
  const { fontScale, setFontScale, translationLanguage, setTranslationLanguage, showTranslation, setShowTranslation } = useLyricsStore();
  const [activeSection, setActiveSection] = useState("general");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="flex h-12 items-center px-4 border-b border-border-primary bg-bg-secondary/80 backdrop-blur-xl">
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-48 flex-shrink-0 border-r border-border-primary bg-bg-secondary overflow-y-auto">
          <nav className="p-4 space-y-1">
            {SETTINGS_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-bg-hover",
                  activeSection === section.id
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                <section.icon className="h-5 w-5" />
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.items.map((item) => (
            <SettingItem key={item.key} item={item} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function SettingItem({ item }: { item: any }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { hideExplicit, setHideExplicit, compactMode, setCompactMode, reducedMotion, setReducedMotion } = useUIStore();
  const { crossfade, setCrossfade, playbackRate, setPlaybackRate } = usePlaybackStore();
  const { fontScale, setFontScale, translationLanguage, setTranslationLanguage, showTranslation, setShowTranslation } = useLyricsStore();

  const renderControl = () => {
    switch (item.type) {
      case "toggle": {
        const getValue = () => {
          switch (item.key) {
            case "hideExplicit": return hideExplicit;
            case "compactMode": return compactMode;
            case "reducedMotion": return reducedMotion;
            case "autoPlay": return true;
            case "gaplessPlayback": return true;
            case "normalizeVolume": return true;
            case "showTranslation": return showTranslation;
            case "downloadOverWifiOnly": return true;
            case "autoDeleteCache": return true;
            case "showArtwork": return true;
            case "animations": return true;
            case "analytics": return true;
            case "crashReports": return true;
            case "desktopNotifications": return true;
            case "songChangeNotifications": return true;
            case "updateNotifications": return true;
            case "globalShortcuts": return true;
            case "hardwareAcceleration": return true;
            case "debugMode": return false;
            default: return false;
          }
        };
        const setValue = (value: boolean) => {
          switch (item.key) {
            case "hideExplicit": setHideExplicit(value); break;
            case "compactMode": setCompactMode(value); break;
            case "reducedMotion": setReducedMotion(value); break;
            case "showTranslation": setShowTranslation(value); break;
            default: break;
          }
        };
        return (
          <label className="flex items-center justify-between cursor-pointer">
            <span>{item.label}</span>
            <input
              type="checkbox"
              checked={getValue()}
              onChange={(e) => setValue(e.target.checked)}
              className="w-5 h-5 rounded border-border-primary text-amber-500 focus:ring-amber-500"
            />
          </label>
        );
      }
      case "slider": {
        const getValue = () => {
          switch (item.key) {
            case "crossfade": return crossfade;
            case "playbackRate": return playbackRate;
            case "fontScale": return fontScale;
            default: return item.min;
          }
        };
        const setValue = (value: number) => {
          switch (item.key) {
            case "crossfade": setCrossfade(value); break;
            case "playbackRate": setPlaybackRate(value); break;
            case "fontScale": setFontScale(value); break;
            default: break;
          }
        };
        return (
          <div className="w-full max-w-xs">
            <input
              type="range"
              min={item.min}
              max={item.max}
              step={item.step}
              value={getValue()}
              onChange={(e) => setValue(parseFloat(e.target.value))}
              className="w-full h-2 appearance-none bg-bg-tertiary rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
            />
            <p className="text-sm text-text-muted mt-1">{getValue()}{item.key === "crossfade" ? "s" : item.key === "fontScale" ? "x" : ""}</p>
          </div>
        );
      }
      default: {
        if (item.key === "theme") {
          return (
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="input w-full max-w-xs"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          );
        }
        return (
          <button className="btn-secondary">Configure</button>
        );
      }
    }
  };

  return (
    <div className="mb-6 pb-6 border-b border-border-primary last:border-0">
      <h3 className="font-medium text-text-primary mb-2">{item.label}</h3>
      <div className="text-text-muted text-sm mb-3">{item.key} setting</div>
      {renderControl()}
    </div>
  );
}