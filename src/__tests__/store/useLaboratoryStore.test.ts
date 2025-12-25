import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLaboratoryStore } from "@/store/useLaboratoryStore";

// Mock Supabase
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockGetUser = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
    from: () => ({
      insert: mockInsert,
    }),
  },
}));

// Mock Image Compression
vi.mock("@/lib/utils/imageCompression", () => ({
  compressToWebP: vi.fn().mockResolvedValue({
    webp: new Blob([""], { type: "image/webp" }),
    compressedSizeWebP: 100,
    originalSize: 200,
  }),
}));

// Mock Actions
const { mockActions } = vi.hoisted(() => {
  return {
    mockActions: {
      getExperimentsAction: vi.fn(),
      createExperimentAction: vi.fn(),
      updateExperimentAction: vi.fn(),
      deleteExperimentAction: vi.fn(),
      addExperimentImagesAction: vi.fn(),
      getRecapsAction: vi.fn(),
      createRecapAction: vi.fn(),
      updateRecapAction: vi.fn(),
      deleteRecapAction: vi.fn(),
    },
  };
});

vi.mock("@/app/actions", () => mockActions);

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

    // Default Supabase mocks
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "http://url" } });
    mockInsert.mockResolvedValue({ error: null });
  });

  describe("loadExperiments", () => {
    it("should load experiments", async () => {
      mockActions.getExperimentsAction.mockResolvedValue([
        { id: "e-1", title: "Exp 1", status: "em_aberto", images: [] },
      ]);

      await useLaboratoryStore.getState().loadExperiments();

      const state = useLaboratoryStore.getState();
      expect(state.experiments).toHaveLength(1);
      expect(state.experiments[0].title).toBe("Exp 1");
      expect(state.experimentsLoaded).toBe(true);
    });

    it("should handle error", async () => {
      mockActions.getExperimentsAction.mockRejectedValue(new Error("Err"));
      await useLaboratoryStore.getState().loadExperiments();
      expect(useLaboratoryStore.getState().error).toBe("Err");
    });
  });

  describe("addExperiment", () => {
    it("should add experiment", async () => {
      mockActions.createExperimentAction.mockResolvedValue({
        success: true,
        experiment: { id: "e-new", title: "New", status: "em_aberto", images: [] },
      });

      await useLaboratoryStore.getState().addExperiment({ title: "New" });

      expect(useLaboratoryStore.getState().experiments).toHaveLength(1);
    });

    it("should upload images if provided", async () => {
      mockActions.createExperimentAction.mockResolvedValue({
        success: true,
        experiment: { id: "e-img", title: "Img Exp", status: "em_aberto", images: [] },
      });
      mockActions.addExperimentImagesAction.mockResolvedValue({
        success: true,
        images: [{ imageUrl: "http://url", id: "img-1" }],
      });

      const file = new File([""], "test.png", { type: "image/png" });
      await useLaboratoryStore.getState().addExperiment({ title: "Img" }, [file]);

      expect(mockUpload).toHaveBeenCalled();
      expect(mockActions.addExperimentImagesAction).toHaveBeenCalled();
    });
  });

  describe("updateExperiment", () => {
    it("should update experiment", async () => {
      // Setup initial state
      useLaboratoryStore.setState({
        experiments: [
          {
            id: "e-1",
            title: "Old",
            status: "em_aberto",
            userId: "u-1",
            promotedToPlaybook: false,
            createdAt: "",
            updatedAt: "",
            images: [],
          },
        ],
      });

      mockActions.updateExperimentAction.mockResolvedValue({ success: true });

      await useLaboratoryStore.getState().updateExperiment({
        id: "e-1",
        title: "Updated",
      });

      const exp = useLaboratoryStore.getState().experiments[0];
      expect(exp.title).toBe("Updated");
    });
  });

  describe("removeExperiment", () => {
    it("should remove experiment", async () => {
      useLaboratoryStore.setState({
        experiments: [
          {
            id: "e-1",
            title: "",
            status: "em_aberto",
            userId: "",
            promotedToPlaybook: false,
            createdAt: "",
            updatedAt: "",
            images: [],
          },
        ],
      });
      mockActions.deleteExperimentAction.mockResolvedValue({ success: true });

      await useLaboratoryStore.getState().removeExperiment("e-1");
      expect(useLaboratoryStore.getState().experiments).toHaveLength(0);
    });
  });

  describe("promoteToPlaybook", () => {
    it("should promote validated experiment", async () => {
      useLaboratoryStore.setState({
        experiments: [
          {
            id: "e-valid",
            title: "Val",
            status: "validado",
            userId: "u-1",
            promotedToPlaybook: false,
            createdAt: "",
            updatedAt: "",
            images: [],
          },
        ],
      });

      // Mock update action to return success
      mockActions.updateExperimentAction.mockResolvedValue({ success: true });

      await useLaboratoryStore.getState().promoteToPlaybook("e-valid");

      expect(mockInsert).toHaveBeenCalled(); // Supabase insert
      expect(useLaboratoryStore.getState().experiments[0].promotedToPlaybook).toBe(true);
    });

    it("should fail if not validated", async () => {
      useLaboratoryStore.setState({
        experiments: [
          {
            id: "e-invalid",
            title: "Inv",
            status: "em_aberto",
            userId: "u-1",
            promotedToPlaybook: false,
            createdAt: "",
            updatedAt: "",
            images: [],
          },
        ],
      });
      await expect(useLaboratoryStore.getState().promoteToPlaybook("e-invalid")).rejects.toThrow(
        "Only validated experiments"
      );
    });
  });

  describe("loadRecaps", () => {
    it("should load recaps", async () => {
      mockActions.getRecapsAction.mockResolvedValue([{ id: "r-1", title: "Recap 1" }]);
      await useLaboratoryStore.getState().loadRecaps();
      expect(useLaboratoryStore.getState().recaps).toHaveLength(1);
    });
  });

  describe("addRecap", () => {
    it("should add recap", async () => {
      mockActions.createRecapAction.mockResolvedValue({
        success: true,
        recap: { id: "r-new", title: "New Recap" },
      });

      await useLaboratoryStore.getState().addRecap({ title: "New Recap" });
      expect(useLaboratoryStore.getState().recaps).toHaveLength(1);
    });
  });

  describe("removeRecap", () => {
    it("should remove recap", async () => {
      useLaboratoryStore.setState({
        recaps: [
          {
            id: "r-1",
            userId: "u-1",
            tradeIds: [],
            title: "R1",
            images: [],
            createdAt: "",
            reviewType: "daily",
          },
        ],
      });
      mockActions.deleteRecapAction.mockResolvedValue({ success: true });
      await useLaboratoryStore.getState().removeRecap("r-1");
      expect(useLaboratoryStore.getState().recaps).toHaveLength(0);
    });
  });
});
