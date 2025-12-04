# 🧪 Plano de Testes

> Última atualização: Dezembro 2024

## Stack de Testes

| Ferramenta          | Uso                               |
| ------------------- | --------------------------------- |
| **Vitest**          | Test runner (compatível com Jest) |
| **Testing Library** | Testes de componentes React       |
| **Happy DOM**       | DOM environment                   |

### Dependências Instaladas

```json
{
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/react": "^16.3.0",
  "@testing-library/user-event": "^14.6.1",
  "happy-dom": "^20.0.11"
}
```

---

## 📁 Estrutura de Testes

```
tests/
├── setup.ts                    # Configuração global
├── unit/
│   ├── lib/
│   │   ├── calculations.test.ts
│   │   ├── utils.test.ts
│   │   └── storage.test.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.test.tsx
│   │   │   ├── Modal.test.tsx
│   │   │   └── Input.test.tsx
│   │   ├── trades/
│   │   │   ├── TradeForm.test.tsx
│   │   │   └── TradeCalendar.test.tsx
│   │   ├── journal/
│   │   │   └── DayDetailModal.test.tsx
│   │   ├── charts/
│   │   │   ├── recharts/*.test.tsx
│   │   │   └── lightweight/*.test.tsx
│   │   └── playbook/
│   │       └── PlaybookGrid.test.tsx
│   ├── services/
│   │   ├── accountService.test.ts
│   │   ├── tradeService.test.ts
│   │   ├── journalService.test.ts
│   │   └── routineService.test.ts
│   └── stores/
│       ├── useAccountStore.test.ts
│       └── useTradeStore.test.ts
└── integration/
    ├── trade-workflow.test.tsx
    ├── journal-workflow.test.tsx
    └── playbook-workflow.test.tsx
```

---

## 🎯 Prioridades

### 🔴 Alta (Críticos)

| Módulo                | Meta Coverage | Descrição            |
| --------------------- | ------------- | -------------------- |
| `lib/calculations.ts` | 90%+          | Cálculos financeiros |
| `services/*`          | 85%+          | Camada de dados      |
| `stores/*`            | 85%+          | Estado global        |

### 🟡 Média (Importantes)

| Módulo                 | Meta Coverage | Descrição                |
| ---------------------- | ------------- | ------------------------ |
| `components/trades/*`  | 80%+          | Formulários e listagens  |
| `components/charts/*`  | 70%+          | Renderização de gráficos |
| `components/journal/*` | 75%+          | Modals e calendário      |

### 🟢 Baixa (Nice to have)

| Módulo                  | Meta Coverage | Descrição         |
| ----------------------- | ------------- | ----------------- |
| `components/ui/*`       | 60%+          | Componentes base  |
| `components/playbook/*` | 65%+          | CRUD de playbooks |

---

## 📝 Exemplos de Testes

### Cálculos Financeiros

```typescript
import { describe, test, expect } from "vitest";
import { calculateMetrics } from "@/lib/calculations";

describe("calculateMetrics", () => {
  test("calculates profit factor correctly", () => {
    const trades = [{ pnl: 100 }, { pnl: -50 }, { pnl: 200 }];
    // Profit Factor = 300 / 50 = 6.0
    expect(calculateMetrics(trades).profitFactor).toBe(6.0);
  });

  test("handles no losses (division by zero)", () => {
    const trades = [{ pnl: 100 }, { pnl: 200 }];
    expect(calculateMetrics(trades).profitFactor).toBe(Infinity);
  });

  test("handles empty trades array", () => {
    expect(calculateMetrics([]).winRate).toBe(0);
  });
});
```

### Componentes UI

```typescript
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  test("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  test("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("applies variant classes", () => {
    render(<Button variant="gradient-primary">Submit</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-gradient-to-r");
  });
});
```

### Services

```typescript
import { describe, test, expect, vi } from "vitest";
import { getTrades, saveTrade } from "@/services/tradeService";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe("tradeService", () => {
  test("getTrades returns array", async () => {
    const trades = await getTrades("account-id");
    expect(Array.isArray(trades)).toBe(true);
  });
});
```

---

## 🚀 Executando Testes

```bash
# Rodar todos os testes
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Arquivo específico
npm test -- calculations
```

---

## 🔄 CI/CD (GitHub Actions)

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

---

## ✅ Checklist de Implementação

### Fase 1: Setup

- [ ] Configurar Vitest (`vitest.config.ts`)
- [ ] Criar `tests/setup.ts`
- [ ] Adicionar scripts no `package.json`

### Fase 2: Testes Críticos

- [ ] `lib/calculations.test.ts`
- [ ] `services/tradeService.test.ts`
- [ ] `services/journalService.test.ts`
- [ ] `stores/useTradeStore.test.ts`

### Fase 3: Testes de Componentes

- [ ] `components/ui/Button.test.tsx`
- [ ] `components/ui/Modal.test.tsx`
- [ ] `components/trades/TradeForm.test.tsx`
- [ ] `components/journal/DayDetailModal.test.tsx`

### Fase 4: CI/CD

- [ ] Configurar GitHub Actions
- [ ] Adicionar badge de coverage
- [ ] Setup Codecov

---

## 📚 Recursos

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Happy DOM](https://github.com/capricorn86/happy-dom)
