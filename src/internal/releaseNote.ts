// Release Notes
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ReleaseNote {
  version: string;
  date: string;
  notes: string;
  seen: boolean;
}

interface ReleaseNoteState {
  notes: ReleaseNote[];
  addNote: (note: ReleaseNote) => void;
  markSeen: (version: string) => void;
  getUnseen: () => ReleaseNote[];
}

export const useReleaseNotes = create<ReleaseNoteState>()(
  persist(
    (set, get) => ({
      notes: [],
      addNote: (note) =>
        set((state) => ({
          notes: [note, ...state.notes.filter((n) => n.version !== note.version)],
        })),
      markSeen: (version) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.version === version ? { ...n, seen: true } : n)),
        })),
      getUnseen: () => get().notes.filter((n) => !n.seen),
    }),
    {
      name: "amber-release-notes",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function markReleaseNoteSeen(version: string) {
  useReleaseNotes.getState().markSeen(version);
}

export function resolveReleaseNoteVersion() {
  // Returns the latest unseen release note version
  const unseen = useReleaseNotes.getState().getUnseen();
  return unseen[0]?.version || null;
}