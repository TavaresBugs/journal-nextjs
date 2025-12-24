/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useLaboratoryStore } from "@/store/useLaboratoryStore";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
  },
}));

// Mock Server Actions
vi.mock("@/app/actions", () => ({
  getExperimentsAction: vi.fn(),
  createExperimentAction: vi.fn(),
  updateExperimentAction: vi.fn(),
  deleteExperimentAction: vi.fn(),
  addExperimentImagesAction: vi.fn(),
  getRecapsAction: vi.fn(),
  createRecapAction: vi.fn(),
  updateRecapAction: vi.fn(),
  deleteRecapAction: vi.fn(),
}));

import {
  getExperimentsAction,
  createExperimentAction,
  updateExperimentAction,
  deleteExperimentAction,
  getRecapsAction,
  createRecapAction,
  updateRecapAction,
  deleteRecapAction,
} from "@/app/actions";
import { supabase } from "@/lib/supabase";

describe("useLaboratoryStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLaboratoryStore.setState({
      experiments: [],
      recaps: [],
      experimentsLoaded: false,
      recapsLoaded: false,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should have initial state", () => {
    const state = useLaboratoryStore.getState();
    expect(state.experiments).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.experimentsLoaded).toBe(false);
  });

  describe("loadExperiments", () => {
    it("should load experiments successfully", async () => {
      const mockExperiments = [
        {
          id: "exp-1",
          user_id: "user-1",
          title: "Test Experiment",
          status: "em_aberto",
          promoted_to_playbook: false,
          created_at: new Date(),
          updated_at: new Date(),
          images: [],
        },
      ];

      vi.mocked(getExperimentsAction).mockResolvedValue(mockExperiments as unknown as any);

      await useLaboratoryStore.getState().loadExperiments();

      const state = useLaboratoryStore.getState();
      expect(state.experiments).toHaveLength(1);
      expect(state.experiments[0].title).toBe("Test Experiment");
      expect(state.isLoading).toBe(false);
      expect(state.experimentsLoaded).toBe(true);
    });

    it("should not re-fetch if already loaded", async () => {
      useLaboratoryStore.setState({ experimentsLoaded: true });
      await useLaboratoryStore.getState().loadExperiments();
      expect(getExperimentsAction).not.toHaveBeenCalled();
    });

    it("should handle load errors", async () => {
      vi.mocked(getExperimentsAction).mockRejectedValue(new Error("Failed to load"));

      await useLaboratoryStore.getState().loadExperiments();

      const state = useLaboratoryStore.getState();
      expect(state.error).toBe("Failed to load");
      expect(state.isLoading).toBe(false);
    });
  });

  describe("addExperiment", () => {
    it("should add an experiment", async () => {
      const newExperiment = {
        id: "exp-new",
        title: "New Exp",
        status: "em_aberto",
        created_at: new Date(),
        updated_at: new Date(),
        images: [],
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      } as unknown as any);

      vi.mocked(createExperimentAction).mockResolvedValue({
        success: true,
        experiment: newExperiment as unknown as any,
      });

      await useLaboratoryStore.getState().addExperiment({ title: "New Exp" });

      const state = useLaboratoryStore.getState();
      expect(state.experiments).toHaveLength(1);
      expect(state.experiments[0].id).toBe("exp-new");
    });
  });

  describe("removeExperiment", () => {
    it("should remove an experiment", async () => {
      useLaboratoryStore.setState({
        experiments: [{ id: "exp-1", title: "Exp 1" } as unknown as any],
      });

      vi.mocked(deleteExperimentAction).mockResolvedValue({ success: true });

      await useLaboratoryStore.getState().removeExperiment("exp-1");

      const state = useLaboratoryStore.getState();
      expect(state.experiments).toHaveLength(0);
    });
  });

  describe("loadRecaps", () => {
    it("should load recaps", async () => {
      const mockRecaps = [
        {
          id: "recap-1",
          title: "Weekly Recap",
          images: [],
        },
      ];

      vi.mocked(getRecapsAction).mockResolvedValue(mockRecaps as unknown as any);

      await useLaboratoryStore.getState().loadRecaps();

      const state = useLaboratoryStore.getState();
      expect(state.recaps).toHaveLength(1);
      expect(state.recapsLoaded).toBe(true);
    });
  });

  describe("updateExperiment", () => {
    it("should update an experiment", async () => {
      useLaboratoryStore.setState({
        experiments: [{ id: "exp-1", title: "Old Title", images: [] } as unknown as any],
      });

      vi.mocked(updateExperimentAction).mockResolvedValue({ success: true });

      await useLaboratoryStore.getState().updateExperiment({
        id: "exp-1",
        title: "New Title",
      });

      const state = useLaboratoryStore.getState();
      expect(state.experiments[0].title).toBe("New Title");
    });
  });

  describe("promoteToPlaybook", () => {
    it("should promote valid experiment to playbook", async () => {
      useLaboratoryStore.setState({
        experiments: [
          {
            id: "exp-1",
            title: "Pro Strat",
            status: "validado",
            promotedToPlaybook: false,
            images: [],
          } as unknown as any,
        ],
      });

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      } as unknown as any);

      // Mock playbook insert
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from as any).mockReturnValue({
        insert: insertMock,
      });

      vi.mocked(updateExperimentAction).mockResolvedValue({ success: true });

      await useLaboratoryStore.getState().promoteToPlaybook("exp-1");

      const state = useLaboratoryStore.getState();
      expect(state.experiments[0].promotedToPlaybook).toBe(true);
      expect(insertMock).toHaveBeenCalled();
    });

    it("should fail if experiment is not validated", async () => {
      useLaboratoryStore.setState({
        experiments: [
          {
            id: "exp-1",
            title: "Pro Strat",
            status: "em_aberto", // Not validated
            promotedToPlaybook: false,
          } as unknown as any,
        ],
      });

      await expect(useLaboratoryStore.getState().promoteToPlaybook("exp-1")).rejects.toThrow(
        "Only validated experiments can be promoted to Playbook"
      );
    });
  });

  describe("addRecap", () => {
    it("should add a recap", async () => {
      const newRecap = {
        id: "recap-new",
        title: "New Recap",
        createdAt: new Date(),
        images: [],
      };

      vi.mocked(createRecapAction).mockResolvedValue({
        success: true,
        recap: newRecap as unknown as any,
      });

      await useLaboratoryStore.getState().addRecap({ title: "New Recap" });

      const state = useLaboratoryStore.getState();
      expect(state.recaps).toHaveLength(1);
      expect(state.recaps[0].id).toBe("recap-new");
    });
  });

  describe("updateRecap", () => {
    it("should update a recap", async () => {
      useLaboratoryStore.setState({
        recaps: [{ id: "recap-1", title: "Old Title", images: [] } as unknown as any],
      });

      // updateRecap re-fetches recaps, so we need to mock getRecapsAction to return the updated list
      vi.mocked(updateRecapAction).mockResolvedValue({ success: true });
      vi.mocked(getRecapsAction).mockResolvedValue([
        { id: "recap-1", title: "Updated Title", images: [] } as unknown as any,
      ]);

      await useLaboratoryStore.getState().updateRecap({
        id: "recap-1",
        title: "Updated Title",
      });

      const state = useLaboratoryStore.getState();
      expect(state.recaps[0].title).toBe("Updated Title");
    });
  });

  describe("removeRecap", () => {
    it("should remove a recap", async () => {
      useLaboratoryStore.setState({
        recaps: [{ id: "recap-1", title: "Recap 1" } as unknown as any],
      });

      vi.mocked(deleteRecapAction).mockResolvedValue({ success: true });

      await useLaboratoryStore.getState().removeRecap("recap-1");

      const state = useLaboratoryStore.getState();
      expect(state.recaps).toHaveLength(0);
    });
  });
});
