# Aumentar Cobertura de Testes para 70%

## 📊 Situação Atual

**Cobertura Atual** (24/12/2025):

- **Lines**: 57.39% (meta: 70%)
- **Functions**: 37.69% (meta: 70%)
- **Statements**: 41.25% (meta: 70%)
- **Branches**: 34.73% (meta: 55%)

**Testes Existentes**: 720 testes em 76 arquivos
**Arquivos de Código**: 322 arquivos (excluindo testes e código gerado)

## 🎯 Problema

Apesar de termos 720 testes, a cobertura está baixa porque **os testes estão concentrados em áreas específicas** enquanto grandes partes do código permanecem não testadas.

### ✅ Bem Testado (Alta Cobertura)

| Categoria                 | Arquivos de Teste | Cobertura Estimada |
| ------------------------- | ----------------- | ------------------ |
| **Repositories** (Prisma) | 12                | ~95% ⭐⭐⭐⭐⭐    |
| **Lib/Utils**             | 12                | ~85% ⭐⭐⭐⭐      |
| **Hooks**                 | 4                 | ~75% ⭐⭐⭐⭐      |
| **Middleware**            | 3                 | ~80% ⭐⭐⭐⭐      |

### ❌ Pouco/Não Testado (Baixa Cobertura)

| Categoria            | Cobertura    | Arquivos | Impacto na Cobertura Global |
| -------------------- | ------------ | -------- | --------------------------- |
| **Components React** | 3.3% (5/151) | 151      | 🔴 Crítico (-25%)           |
| **Stores Zustand**   | 0% (0/10)    | 10       | 🔴 Alto (-15%)              |
| **Server Actions**   | 15% (2/13)   | 13       | 🟠 Médio (-10%)             |
| **Pages**            | 0%           | ~25      | 🟡 Baixo (-5%)              |

## 📋 Plano de Ação

### Fase 1: Server Actions (2-3 dias) 🎯 +10%

**Prioridade**: Alta - Lógica de negócio crítica

Criar testes para as server actions não testadas:

- [ ] `src/app/actions/journal.ts` - CRUD de entradas de diário
- [ ] `src/app/actions/playbooks.ts` - Gerenciamento de playbooks
- [ ] `src/app/actions/mentor.ts` - Sistema de mentoria
- [ ] `src/app/actions/laboratory.ts` - Análises do laboratório
- [ ] `src/app/actions/reviews.ts` - Sistema de revisões
- [ ] `src/app/actions/routines.ts` - Rotinas diárias
- [ ] `src/app/actions/mental.ts` - Estados mentais
- [ ] `src/app/actions/community.ts` - Funcionalidades da comunidade
- [ ] `src/app/actions/share.ts` - Compartilhamento
- [ ] `src/app/actions/admin.ts` - Funções administrativas

**Padrão de Teste**:

```typescript
// Exemplo: journal.test.ts
import { vi, describe, it, expect, beforeEach } from "vitest";
import { createJournalEntry, updateJournalEntry, deleteJournalEntry } from "../journal";

const { mockJournalRepo, mockSupabase } = vi.hoisted(() => ({
  mockJournalRepo: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
  },
  mockSupabase: {
    auth: { getUser: vi.fn() },
  },
}));

vi.mock("@/lib/database/repositories", () => ({
  prismaJournalRepo: mockJournalRepo,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("Journal Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createJournalEntry", () => {
    it("should create journal entry", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      });
      mockJournalRepo.create.mockResolvedValue({
        data: { id: "j-1", title: "Test Entry" },
        error: null,
      });

      const result = await createJournalEntry({
        title: "Test Entry",
        accountId: "acc-1",
      });

      expect(mockJournalRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Entry",
          userId: "user-123",
        })
      );
      expect(result.id).toBe("j-1");
    });

    it("should throw on auth failure", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(createJournalEntry({ title: "Test", accountId: "acc-1" })).rejects.toThrow(
        "User not authenticated"
      );
    });

    it("should handle database errors", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      });
      mockJournalRepo.create.mockResolvedValue({
        data: null,
        error: { message: "DB Error" },
      });

      await expect(createJournalEntry({ title: "Test", accountId: "acc-1" })).rejects.toThrow(
        "DB Error"
      );
    });
  });
});
```

**Cobertura Esperada**: +10% (de 57% → 67%)

---

### Fase 2: Stores Zustand (3-4 dias) 🎯 +8%

**Prioridade**: Alta - Gerenciamento de estado crítico

Criar testes para os principais stores:

- [ ] `src/store/useTradeStore.ts` - Store de trades (crítico)
- [ ] `src/store/useJournalStore.ts` - Store de journal (crítico)
- [ ] `src/store/useAccountStore.ts` - Store de contas
- [ ] `src/store/usePlaybookStore.ts` - Store de playbooks
- [ ] `src/store/useLaboratoryStore.ts` - Store do laboratório
- [ ] `src/store/useMenteeDataStore.ts` - Store de mentoria
- [ ] `src/store/useSettingsStore.ts` - Store de configurações

**Padrão de Teste**:

```typescript
// Exemplo: useTradeStore.test.ts
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTradeStore } from "../useTradeStore";
import { vi } from "vitest";

vi.mock("@/actions/trades", () => ({
  fetchTrades: vi.fn(),
  createTrade: vi.fn(),
  updateTrade: vi.fn(),
  deleteTradePrisma: vi.fn(),
}));

describe("useTradeStore", () => {
  beforeEach(() => {
    useTradeStore.setState({
      trades: [],
      isLoading: false,
      error: null,
    });
  });

  describe("State Management", () => {
    it("should initialize with empty trades", () => {
      const { result } = renderHook(() => useTradeStore());

      expect(result.current.trades).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should update trades correctly", async () => {
      const { result } = renderHook(() => useTradeStore());
      const mockTrades = [
        { id: "t-1", symbol: "EURUSD", pnl: 100 },
        { id: "t-2", symbol: "GBPUSD", pnl: -50 },
      ];

      act(() => {
        result.current.setTrades(mockTrades);
      });

      expect(result.current.trades).toEqual(mockTrades);
    });
  });

  describe("fetchTrades", () => {
    it("should fetch and set trades", async () => {
      const mockFetch = vi.mocked(fetchTrades);
      mockFetch.mockResolvedValue({
        data: [{ id: "t-1", symbol: "EURUSD" }],
        count: 1,
      });

      const { result } = renderHook(() => useTradeStore());

      await act(async () => {
        await result.current.fetchTrades("acc-1", 1, 10);
      });

      await waitFor(() => {
        expect(result.current.trades).toHaveLength(1);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle fetch errors", async () => {
      const mockFetch = vi.mocked(fetchTrades);
      mockFetch.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useTradeStore());

      await act(async () => {
        await result.current.fetchTrades("acc-1", 1, 10);
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("Optimistic Updates", () => {
    it("should optimistically add trade", async () => {
      const { result } = renderHook(() => useTradeStore());
      const newTrade = { symbol: "EURUSD", pnl: 100 };

      const mockCreate = vi.mocked(createTrade);
      mockCreate.mockResolvedValue({ id: "t-new", ...newTrade });

      await act(async () => {
        await result.current.addTrade(newTrade);
      });

      await waitFor(() => {
        expect(result.current.trades).toContainEqual(
          expect.objectContaining({ id: "t-new", symbol: "EURUSD" })
        );
      });
    });
  });
});
```

**Cobertura Esperada**: +8% (de 67% → 75%)

---

### Fase 3: Componentes React Críticos (5-7 dias) 🎯 +5%

**Prioridade**: Média - Testar apenas componentes com lógica complexa

Focar em componentes com **lógica de negócio**, não apenas UI:

#### Trades (4 já testados, adicionar 3 mais)

- [x] `RiskRewardCards.tsx` ✅
- [x] `TradeCard.tsx` ✅
- [x] `TradeForm.tsx` ✅
- [x] `TradeModal.tsx` ✅
- [ ] `TradeFilters.tsx` - Lógica de filtros complexa
- [ ] `TradeStats.tsx` - Cálculos de estatísticas
- [ ] `TradeSummary.tsx` - Agregações

#### Journal (1 já testado, adicionar 3 mais)

- [x] `DayDetailModal.tsx` ✅
- [ ] `JournalEditor.tsx` - Editor de markdown + imagens
- [ ] `JournalForm.tsx` - Validações complexas
- [ ] `ReviewForm.tsx` - Lógica de review

#### Dashboard (adicionar 2)

- [ ] `AccountCard.tsx` - Cálculos de métricas
- [ ] `PerformanceChart.tsx` - Lógica de dados de chart

#### Playbook (adicionar 2)

- [ ] `PlaybookBuilder.tsx` - Lógica de construção de regras
- [ ] `RuleGroupEditor.tsx` - Validações de regras

#### Laboratory (adicionar 2)

- [ ] `BacktestResults.tsx` - Cálculos de backtest
- [ ] `StrategyAnalyzer.tsx` - Análise de estratégias

**Padrão de Teste**:

```typescript
// Exemplo: TradeFilters.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { TradeFilters } from "../TradeFilters";
import { vi } from "vitest";

describe("TradeFilters", () => {
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all filter options", () => {
    render(<TradeFilters onFilterChange={mockOnFilterChange} />);

    expect(screen.getByLabelText(/symbol/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date range/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/outcome/i)).toBeInTheDocument();
  });

  it("should call onFilterChange when symbol changes", () => {
    render(<TradeFilters onFilterChange={mockOnFilterChange} />);

    const symbolInput = screen.getByLabelText(/symbol/i);
    fireEvent.change(symbolInput, { target: { value: "EURUSD" } });

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: "EURUSD" })
    );
  });

  it("should apply multiple filters correctly", () => {
    render(<TradeFilters onFilterChange={mockOnFilterChange} />);

    fireEvent.change(screen.getByLabelText(/symbol/i), {
      target: { value: "EURUSD" }
    });
    fireEvent.change(screen.getByLabelText(/outcome/i), {
      target: { value: "WIN" }
    });

    expect(mockOnFilterChange).toHaveBeenLastCalledWith({
      symbol: "EURUSD",
      outcome: "WIN",
    });
  });

  it("should reset filters", () => {
    render(<TradeFilters onFilterChange={mockOnFilterChange} />);

    const resetButton = screen.getByRole("button", { name: /reset/i });
    fireEvent.click(resetButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({});
  });
});
```

**Cobertura Esperada**: +5% (de 75% → 80%)

---

### Fase 4: Otimização e Refinamento (2-3 dias) 🎯 -10%

**Prioridade**: Baixa - Ajustes finais

- [ ] Revisar testes existentes para aumentar cobertura de branches
- [ ] Adicionar edge cases não cobertos
- [ ] Testar error boundaries
- [ ] Testar loading states
- [ ] Aumentar cobertura de branches (de 34% → 55%)

**Cobertura Final Esperada**: 70%+ em todas as métricas

---

## 🎯 Meta Final

| Métrica        | Atual  | Meta | Ganho   |
| -------------- | ------ | ---- | ------- |
| **Lines**      | 57.39% | 70%+ | +12.61% |
| **Functions**  | 37.69% | 70%+ | +32.31% |
| **Statements** | 41.25% | 70%+ | +28.75% |
| **Branches**   | 34.73% | 55%+ | +20.27% |

## 📅 Timeline Estimado

**Total**: 12-17 dias (~3 semanas)

- **Fase 1** (Server Actions): 2-3 dias
- **Fase 2** (Stores): 3-4 dias
- **Fase 3** (Components): 5-7 dias
- **Fase 4** (Otimização): 2-3 dias

## 🚀 Próximos Passos

1. **Ajustar temporariamente os limites do vitest** para não bloquear CI:

   ```typescript
   // vitest.config.ts - Temporário
   coverage: {
     lines: 57,
     functions: 37,
     branches: 34,
     statements: 41,
   }
   ```

2. **Criar branch** `feature/increase-test-coverage`

3. **Implementar Fase 1** (Server Actions) - PR separado

4. **Implementar Fase 2** (Stores) - PR separado

5. **Implementar Fase 3** (Components críticos) - PRs separados por área

6. **Fase 4** (Otimização final)

7. **Atualizar limites finais** para 70% e fechar issue

## 💡 Boas Práticas

### Para Server Actions

- Sempre testar autenticação (com/sem user)
- Testar ownership checks
- Testar erros do banco de dados
- Testar validações de input

### Para Stores

- Testar estado inicial
- Testar mutations
- Testar async actions (loading, success, error)
- Testar optimistic updates
- Testar selectors/computed values

### Para Components

- Focar em componentes com **lógica**, não apenas UI
- Testar interações do usuário (clicks, input changes)
- Testar conditional rendering
- Testar edge cases (empty states, errors)
- **NÃO** testar componentes puramente apresentacionais

## 📚 Recursos

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Zustand Stores](https://docs.pmnd.rs/zustand/guides/testing)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing/vitest)

## ✅ Critérios de Sucesso

- [ ] Cobertura de lines ≥ 70%
- [ ] Cobertura de functions ≥ 70%
- [ ] Cobertura de statements ≥ 70%
- [ ] Cobertura de branches ≥ 55%
- [ ] CI/CD passando com novos limites
- [ ] Testes executando em < 15 segundos
- [ ] Zero testes flaky (instáveis)

---

**Labels**: `testing`, `coverage`, `priority: high`, `good first issue` (para fases específicas)
