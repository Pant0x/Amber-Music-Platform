"use client";

import { useEffect, useRef, ReactNode } from "react";
import { usePlaybackStore, useUIStore, usePersistenceStore } from "@/store/usePlayerStore";
import { api } from "@/lib/api/client";

export function PlayerProvider({ children }: { children: ReactNode }) {
  const {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    volume,
    progress,
    duration,
    setProgress,
    setDuration,
    setIsPlaying,
    nextTrack,
    setCurrentTrack,
  } = usePlaybackStore();

  const { minimized } = useUIStore();
  const { lastOutputDevice } = usePersistenceStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime);
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (audio.loop) return;
      nextTrack();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    if (lastOutputDevice && typeof (audio as any).setSinkId === "function") {
      (audio as any).setSinkId(lastOutputDevice).catch(() => {});
    }

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
    };
  }, [volume, lastOutputDevice, setProgress, setDuration, setIsPlaying, nextTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
      const playTrack = async () => {
        try {
          const response = await api.youtube.resolve(currentTrack.title, currentTrack.channelTitle);
          if (response.videoId) {
            const streamUrl = `https://www.youtube.com/watch?v=${response.videoId}`;
            audio.src = streamUrl;
            audio.load();
            if (isPlaying) {
              await audio.play().catch(() => {});
            }
          }
        } catch (error) {
          console.error("Failed to load track:", error);
          nextTrack();
        }
      };
      playTrack();
    } else {
      audio.pause();
      audio.src = "";
    }
  }, [currentTrack, isPlaying, nextTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && isPlaying) {
      audio.play().catch(() => {});
    } else if (audio) {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && Math.abs(audio.currentTime - progress) > 1.5) {
      audio.currentTime = progress;
    }
  }, [progress]);

  return <>{children}</>;
}