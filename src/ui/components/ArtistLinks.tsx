"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ArtistNavigationContextType {
  currentArtist: string | null;
  setCurrentArtist: (artist: string | null) => void;
  artistStack: string[];
  pushArtist: (artist: string) => void;
  popArtist: () => void;
  clearStack: () => void;
}

const ArtistNavigationContext = createContext<ArtistNavigationContextType | null>(null);

export function ArtistNavigationProvider({ children }: { children: ReactNode }) {
  const [currentArtist, setCurrentArtist] = useState<string | null>(null);
  const [artistStack, setArtistStack] = useState<string[]>([]);

  const pushArtist = (artist: string) => {
    if (currentArtist) {
      setArtistStack((prev) => [...prev, currentArtist]);
    }
    setCurrentArtist(artist);
  };

  const popArtist = () => {
    setArtistStack((prev) => {
      const last = prev[prev.length - 1];
      if (last) {
        setCurrentArtist(last);
        return prev.slice(0, -1);
      }
      return prev;
    });
  };

  const clearStack = () => {
    setArtistStack([]);
    setCurrentArtist(null);
  };

  return (
    <ArtistNavigationContext.Provider
      value={{
        currentArtist,
        setCurrentArtist,
        artistStack,
        pushArtist,
        popArtist,
        clearStack,
      }}
    >
      {children}
    </ArtistNavigationContext.Provider>
  );
}

export function useArtistNavigation() {
  const context = useContext(ArtistNavigationContext);
  if (!context) {
    throw new Error("useArtistNavigation must be used within ArtistNavigationProvider");
  }
  return context;
}