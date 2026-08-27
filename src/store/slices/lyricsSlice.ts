import type { StateCreator } from "zustand";
import type { LyricsData } from "../types";

export interface LyricsState {
  currentLyrics: LyricsData | null;
  loading: boolean;
  error: string | null;
  offset: number;
  fontScale: number;
  translationLanguage: string;
  showTranslation: boolean;
  setLyrics: (lyrics: LyricsData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOffset: (offset: number) => void;
  setFontScale: (scale: number) => void;
  setTranslationLanguage: (lang: string) => void;
  setShowTranslation: (show: boolean) => void;
  clearLyrics: () => void;
}

export const createLyricsSlice: StateCreator<
  LyricsState,
  [],
  [],
  LyricsState
> = (set) => ({
  currentLyrics: null,
  loading: false,
  error: null,
  offset: 0,
  fontScale: 1,
  translationLanguage: "en",
  showTranslation: false,

  setLyrics: (currentLyrics) => set({ currentLyrics, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setOffset: (offset) => set({ offset }),
  setFontScale: (fontScale) => set({ fontScale }),
  setTranslationLanguage: (translationLanguage) => set({ translationLanguage }),
  setShowTranslation: (showTranslation) => set({ showTranslation }),
  clearLyrics: () => set({ currentLyrics: null, error: null, offset: 0 }),
});