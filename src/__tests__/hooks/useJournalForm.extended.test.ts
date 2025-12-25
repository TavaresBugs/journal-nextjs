import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useJournalForm, type JournalFormData } from "@/hooks/useJournalForm";

// Mock dayjs to control dates in tests
vi.mock("dayjs", async () => {
  const actual = await vi.importActual("dayjs");
  const mockDayjs = vi.fn(() => ({
    format: (fmt: string) => {
      if (fmt === "YYYY-MM-DD") return "2024-01-15";
      if (fmt === "DD/MM/YYYY") return "15/01/2024";
      return "2024-01-15";
    },
  }));

  // Preserve actual dayjs behavior but allow mocking
  return {
    ...actual,
    default: Object.assign(mockDayjs, actual),
  };
});

describe("useJournalForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useJournalForm());

      expect(result.current.formData.date).toBe("2024-01-15");
      expect(result.current.formData.title).toBe("Diário - 15/01/2024");
      expect(result.current.formData.asset).toBe("");
      expect(result.current.formData.emotion).toBe("");
      expect(result.current.formData.analysis).toBe("");
      expect(result.current.formData.technicalWins).toBe("");
      expect(result.current.formData.improvements).toBe("");
      expect(result.current.formData.errors).toBe("");
    });

    it("should initialize with provided initial data", () => {
      const initialData: Partial<JournalFormData> = {
        title: "Meu Diário Personalizado",
        asset: "EURUSD",
        emotion: "Confiante",
        analysis: "Análise técnica completa",
      };

      const { result } = renderHook(() => useJournalForm(initialData));

      expect(result.current.formData.title).toBe("Meu Diário Personalizado");
      expect(result.current.formData.asset).toBe("EURUSD");
      expect(result.current.formData.emotion).toBe("Confiante");
      expect(result.current.formData.analysis).toBe("Análise técnica completa");
      // Default values for non-provided fields
      expect(result.current.formData.date).toBe("2024-01-15");
      expect(result.current.formData.technicalWins).toBe("");
    });

    it("should merge initial data with defaults", () => {
      const initialData: Partial<JournalFormData> = {
        emotion: "Ansioso",
      };

      const { result } = renderHook(() => useJournalForm(initialData));

      expect(result.current.formData.emotion).toBe("Ansioso");
      expect(result.current.formData.date).toBe("2024-01-15");
      expect(result.current.formData.title).toBe("Diário - 15/01/2024");
    });
  });

  describe("updateField", () => {
    it("should update title field", () => {
      const { result } = renderHook(() => useJournalForm());

      act(() => {
        result.current.updateField("title", "Novo Título");
      });

      expect(result.current.formData.title).toBe("Novo Título");
    });

    it("should update asset field", () => {
      const { result } = renderHook(() => useJournalForm());

      act(() => {
        result.current.updateField("asset", "XAUUSD");
      });

      expect(result.current.formData.asset).toBe("XAUUSD");
    });

    it("should update emotion field", () => {
      const { result } = renderHook(() => useJournalForm());

      act(() => {
        result.current.updateField("emotion", "Calmo e focado");
      });

      expect(result.current.formData.emotion).toBe("Calmo e focado");
    });

    it("should update analysis field", () => {
      const { result } = renderHook(() => useJournalForm());

      act(() => {
        result.current.updateField("analysis", "Mercado em tendência de alta");
      });

      expect(result.current.formData.analysis).toBe("Mercado em tendência de alta");
    });

    it("should update technicalWins field", () => {
      const { result } = renderHook(() => useJournalForm());

      act(() => {
        result.current.updateField("technicalWins", "Identificação correta de suporte");
      });

      expect(result.current.formData.technicalWins).toBe("Identificação correta de suporte");
    });

    it("should update improvements field", () => {
      const { result } = renderHook(() => useJournalForm());

      act(() => {
        result.current.updateField("improvements", "Melhorar gestão de risco");
      });

      expect(result.current.formData.improvements).toBe("Melhorar gestão de risco");
    });

    it("should update errors field", () => {
      const { result } = renderHook(() => useJournalForm());

      act(() => {
        result.current.updateField("errors", "Entrada prematura no trade");
      });

      expect(result.current.formData.errors).toBe("Entrada prematura no trade");
    });

    it("should update multiple fields independently", () => {
      const { result } = renderHook(() => useJournalForm());

      act(() => {
        result.current.updateField("asset", "GBPUSD");
        result.current.updateField("emotion", "Confiante");
        result.current.updateField("analysis", "Breakout confirmado");
      });

      expect(result.current.formData.asset).toBe("GBPUSD");
      expect(result.current.formData.emotion).toBe("Confiante");
      expect(result.current.formData.analysis).toBe("Breakout confirmado");
    });

    it("should preserve other fields when updating one field", () => {
      const { result } = renderHook(() =>
        useJournalForm({
          asset: "EURUSD",
          emotion: "Calmo",
        })
      );

      act(() => {
        result.current.updateField("analysis", "Nova análise");
      });

      expect(result.current.formData.asset).toBe("EURUSD");
      expect(result.current.formData.emotion).toBe("Calmo");
      expect(result.current.formData.analysis).toBe("Nova análise");
    });
  });

  describe("resetForm", () => {
    it("should reset all fields to default values", () => {
      const { result } = renderHook(() => useJournalForm());

      // Set some values
      act(() => {
        result.current.updateField("title", "Custom Title");
        result.current.updateField("asset", "XAUUSD");
        result.current.updateField("emotion", "Stressed");
        result.current.updateField("analysis", "Some analysis");
      });

      // Reset
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData.date).toBe("2024-01-15");
      expect(result.current.formData.title).toBe("Diário - 15/01/2024");
      expect(result.current.formData.asset).toBe("");
      expect(result.current.formData.emotion).toBe("");
      expect(result.current.formData.analysis).toBe("");
      expect(result.current.formData.technicalWins).toBe("");
      expect(result.current.formData.improvements).toBe("");
      expect(result.current.formData.errors).toBe("");
    });

    it("should reset with custom defaults", () => {
      const { result } = renderHook(() => useJournalForm());

      const customDefaults: Partial<JournalFormData> = {
        asset: "USDJPY",
        emotion: "Neutro",
      };

      act(() => {
        result.current.resetForm(customDefaults);
      });

      expect(result.current.formData.asset).toBe("USDJPY");
      expect(result.current.formData.emotion).toBe("Neutro");
      // Other fields should be default
      expect(result.current.formData.date).toBe("2024-01-15");
      expect(result.current.formData.title).toBe("Diário - 15/01/2024");
    });
  });

  describe("prepareSubmission", () => {
    it("should prepare submission data with all fields", () => {
      const { result } = renderHook(() => useJournalForm());

      act(() => {
        result.current.updateField("date", "2024-02-20");
        result.current.updateField("title", "Diário de Hoje");
        result.current.updateField("asset", "EURUSD");
        result.current.updateField("emotion", "Confiante");
        result.current.updateField("analysis", "Mercado bullish");
        result.current.updateField("technicalWins", "Setup perfeito");
        result.current.updateField("improvements", "Reduzir lote");
        result.current.updateField("errors", "Entrada antecipada");
      });

      const submission = result.current.prepareSubmission();

      expect(submission.date).toBe("2024-02-20");
      expect(submission.title).toBe("Diário de Hoje");
      expect(submission.asset).toBe("EURUSD");
      expect(submission.emotion).toBe("Confiante");
      expect(submission.analysis).toBe("Mercado bullish");
    });

    it("should default asset to 'Diário' if empty", () => {
      const { result } = renderHook(() => useJournalForm());

      act(() => {
        result.current.updateField("asset", "");
      });

      const submission = result.current.prepareSubmission();

      expect(submission.asset).toBe("Diário");
    });

    it("should stringify review notes as JSON", () => {
      const { result } = renderHook(() => useJournalForm());

      act(() => {
        result.current.updateField("technicalWins", "Bom timing");
        result.current.updateField("improvements", "Maior paciência");
        result.current.updateField("errors", "SL muito apertado");
      });

      const submission = result.current.prepareSubmission();

      const notes = JSON.parse(submission.notes);
      expect(notes.technicalWins).toBe("Bom timing");
      expect(notes.improvements).toBe("Maior paciência");
      expect(notes.errors).toBe("SL muito apertado");
    });

    it("should handle empty review fields in notes", () => {
      const { result } = renderHook(() => useJournalForm());

      const submission = result.current.prepareSubmission();

      const notes = JSON.parse(submission.notes);
      expect(notes.technicalWins).toBe("");
      expect(notes.improvements).toBe("");
      expect(notes.errors).toBe("");
    });

    it("should preserve original formData after submission preparation", () => {
      const { result } = renderHook(() => useJournalForm());

      act(() => {
        result.current.updateField("asset", "XAUUSD");
      });

      result.current.prepareSubmission();

      // formData should not be mutated
      expect(result.current.formData.asset).toBe("XAUUSD");
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete journal entry workflow", () => {
      const { result } = renderHook(() => useJournalForm());

      // Fill form
      act(() => {
        result.current.updateField("title", "Sessão de Londres");
        result.current.updateField("asset", "GBPJPY");
        result.current.updateField("emotion", "Focado");
        result.current.updateField("analysis", "Londres abrindo forte");
        result.current.updateField("technicalWins", "Confirmação em M15");
        result.current.updateField("improvements", "Aguardar mais confluências");
        result.current.updateField("errors", "Nenhum");
      });

      // Prepare submission
      const submission = result.current.prepareSubmission();

      expect(submission.title).toBe("Sessão de Londres");
      expect(submission.asset).toBe("GBPJPY");
      expect(submission.emotion).toBe("Focado");

      // Reset for new entry
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData.title).toBe("Diário - 15/01/2024");
      expect(result.current.formData.asset).toBe("");
    });

    it("should handle editing existing entry", () => {
      const existingEntry: Partial<JournalFormData> = {
        date: "2024-01-10",
        title: "Entry Original",
        asset: "USDJPY",
        emotion: "Ansioso",
        analysis: "Análise original",
        technicalWins: "Wins originais",
        improvements: "Melhorias originais",
        errors: "Erros originais",
      };

      const { result } = renderHook(() => useJournalForm(existingEntry));

      // Verify loaded
      expect(result.current.formData.title).toBe("Entry Original");
      expect(result.current.formData.asset).toBe("USDJPY");

      // Edit
      act(() => {
        result.current.updateField("emotion", "Confiante");
        result.current.updateField("analysis", "Análise atualizada");
      });

      expect(result.current.formData.emotion).toBe("Confiante");
      expect(result.current.formData.analysis).toBe("Análise atualizada");
      // Original values preserved
      expect(result.current.formData.title).toBe("Entry Original");
    });
  });
});
