// Equalizer Settings
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface EqualizerBand {
  frequency: number;
  gain: number;
}

interface EqualizerPreset {
  name: string;
  bands: EqualizerBand[];
}

interface EqualizerSettings {
  enabled: boolean;
  bands: EqualizerBand[];
  preset: string | null;
  customPresets: EqualizerPreset[];
  setEnabled: (enabled: boolean) => void;
  setBandGain: (frequency: number, gain: number) => void;
  setPreset: (preset: string | null) => void;
  addCustomPreset: (preset: EqualizerPreset) => void;
  removeCustomPreset: (name: string) => void;
}

const DEFAULT_BANDS: EqualizerBand[] = [
  { frequency: 32, gain: 0 },
  { frequency: 64, gain: 0 },
  { frequency: 125, gain: 0 },
  { frequency: 250, gain: 0 },
  { frequency: 500, gain: 0 },
  { frequency: 1000, gain: 0 },
  { frequency: 2000, gain: 0 },
  { frequency: 4000, gain: 0 },
  { frequency: 8000, gain: 0 },
  { frequency: 16000, gain: 0 },
];

const PRESETS: EqualizerPreset[] = [
  {
    name: "Flat",
    bands: DEFAULT_BANDS.map((b) => ({ ...b, gain: 0 })),
  },
  {
    name: "Bass Boost",
    bands: [
      { frequency: 32, gain: 6 },
      { frequency: 64, gain: 6 },
      { frequency: 125, gain: 3 },
      { frequency: 250, gain: 0 },
      { frequency: 500, gain: 0 },
      { frequency: 1000, gain: 0 },
      { frequency: 2000, gain: 0 },
      { frequency: 4000, gain: 0 },
      { frequency: 8000, gain: 0 },
      { frequency: 16000, gain: 0 },
    ],
  },
  {
    name: "Treble Boost",
    bands: [
      { frequency: 32, gain: 0 },
      { frequency: 64, gain: 0 },
      { frequency: 125, gain: 0 },
      { frequency: 250, gain: 0 },
      { frequency: 500, gain: 0 },
      { frequency: 1000, gain: 0 },
      { frequency: 2000, gain: 3 },
      { frequency: 4000, gain: 6 },
      { frequency: 8000, gain: 6 },
      { frequency: 16000, gain: 6 },
    ],
  },
  {
    name: "Vocal",
    bands: [
      { frequency: 32, gain: -3 },
      { frequency: 64, gain: -2 },
      { frequency: 125, gain: 0 },
      { frequency: 250, gain: 2 },
      { frequency: 500, gain: 4 },
      { frequency: 1000, gain: 4 },
      { frequency: 2000, gain: 2 },
      { frequency: 4000, gain: 0 },
      { frequency: 8000, gain: -2 },
      { frequency: 16000, gain: -3 },
    ],
  },
];

export const useEqualizerSettings = create<EqualizerSettings>()(
  persist(
    (set) => ({
      enabled: false,
      bands: DEFAULT_BANDS,
      preset: "Flat",
      customPresets: [],
      setEnabled: (enabled) => set({ enabled }),
      setBandGain: (frequency, gain) =>
        set((state) => ({
          bands: state.bands.map((b) => (b.frequency === frequency ? { ...b, gain } : b)),
          preset: null,
        })),
      setPreset: (preset) => {
        const p = PRESETS.find((pre) => pre.name === preset);
        if (p) {
          set({ bands: p.bands, preset });
        }
      },
      addCustomPreset: (preset) =>
        set((state) => ({ customPresets: [...state.customPresets, preset] })),
      removeCustomPreset: (name) =>
        set((state) => ({
          customPresets: state.customPresets.filter((p) => p.name !== name),
        })),
    }),
    {
      name: "amber-equalizer",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useEqualizer() {
  return useEqualizerSettings((s) => ({
    enabled: s.enabled,
    bands: s.bands,
    preset: s.preset,
    presets: [...PRESETS, ...s.customPresets],
    setEnabled: s.setEnabled,
    setBandGain: s.setBandGain,
    setPreset: s.setPreset,
  }));
}

export class Equalizer {
  private static instance: Equalizer;
  private audioContext: AudioContext | null = null;
  private filters: BiquadFilterNode[] = [];

  static getInstance() {
    if (!Equalizer.instance) {
      Equalizer.instance = new Equalizer();
    }
    return Equalizer.instance;
  }

  static init() {
    const eq = Equalizer.getInstance();
    eq.init();
  }

  static getBands() {
    return useEqualizerSettings.getState().bands;
  }

  static setBands(bands: EqualizerBand[]) {
    useEqualizerSettings.getState().setBands(bands);
    const eq = Equalizer.getInstance();
    eq.updateFilters();
  }

  static setPreset(preset: string) {
    useEqualizerSettings.getState().setPreset(preset);
    const eq = Equalizer.getInstance();
    eq.updateFilters();
  }

  static getPresets() {
    return { presets: PRESETS };
  }

  private init() {
    if (typeof window !== "undefined") {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.createFilters();
    }
  }

  private createFilters() {
    if (!this.audioContext) return;
    this.filters = DEFAULT_BANDS.map((band) => {
      const filter = this.audioContext!.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = band.frequency;
      filter.Q.value = 1;
      filter.gain.value = band.gain;
      return filter;
    });
  }

  private updateFilters() {
    const { bands } = useEqualizerSettings.getState();
    this.filters.forEach((filter, i) => {
      if (bands[i]) {
        filter.gain.value = bands[i].gain;
      }
    });
  }

  connect(source: AudioNode, destination: AudioNode) {
    if (!this.audioContext) return source.connect(destination);

    let current: AudioNode = source;
    this.filters.forEach((filter) => {
      current.connect(filter);
      current = filter;
    });
    current.connect(destination);
    return destination;
  }
}