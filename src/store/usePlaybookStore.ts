import { create } from "zustand";
import type { Playbook } from "@/types";
import { fetchPlaybooks, createPlaybook, updatePlaybook, deletePlaybook } from "@/actions/playbook";

interface PlaybookStore {
  playbooks: Playbook[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPlaybooks: () => Promise<void>;
  addPlaybook: (playbook: Omit<Playbook, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updatePlaybook: (playbook: Playbook) => Promise<void>;
  removePlaybook: (id: string) => Promise<void>;
}

export const usePlaybookStore = create<PlaybookStore>((set, get) => ({
  playbooks: [],
  isLoading: false,
  error: null,

  loadPlaybooks: async () => {
    set({ isLoading: true, error: null });

    try {
      const playbooks = await fetchPlaybooks();
      set({ playbooks, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error loading playbooks:", error);
      set({ error: message, isLoading: false });
    }
  },

  addPlaybook: async (playbookData) => {
    set({ isLoading: true, error: null });

    try {
      // Optimistic update
      const tempId = crypto.randomUUID();
      const newPlaybook: Playbook = {
        ...playbookData,
        id: tempId,
        accountId: playbookData.accountId || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        playbooks: [newPlaybook, ...state.playbooks],
        isLoading: false,
      }));

      const created = await createPlaybook(playbookData);

      // Update with real data if returned
      if (created) {
        set((state) => ({
          playbooks: state.playbooks.map((p) => (p.id === tempId ? created : p)),
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error adding playbook:", error);
      set({ error: message, isLoading: false });
      // Rollback via reload
      get().loadPlaybooks();
    }
  },

  updatePlaybook: async (playbook) => {
    set({ isLoading: true, error: null });

    try {
      const updatedPlaybook = {
        ...playbook,
        updatedAt: new Date().toISOString(),
      };

      set({
        playbooks: get().playbooks.map((p) => (p.id === playbook.id ? updatedPlaybook : p)),
        isLoading: false,
      });

      await updatePlaybook(updatedPlaybook);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error updating playbook:", error);
      set({ error: message, isLoading: false });
      get().loadPlaybooks();
    }
  },

  removePlaybook: async (id) => {
    set({ isLoading: true, error: null });

    try {
      set({
        playbooks: get().playbooks.filter((p) => p.id !== id),
        isLoading: false,
      });

      await deletePlaybook(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error removing playbook:", error);
      set({ error: message, isLoading: false });
      get().loadPlaybooks();
    }
  },
}));
