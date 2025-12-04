# Plano de Testes Automatizados

## Por que Bun? ✅

**Sim, usar Bun é uma excelente escolha!**

### Vantagens do Bun:

- ⚡ **20-100x mais rápido** que Jest
- 🎯 **Suporte nativo** para TypeScript/TSX (sem configuração)
- 🔋 **Built-in** (não precisa instalar bibliotecas extras)
- 🎨 **API compatível** com Jest (fácil migração)
- 📦 **Menor overhead** de dependências

### Comparação:

```
Jest:     ~5-10s para rodar 50 testes
Bun:      ~0.5-1s para rodar 50 testes
Vitest:   ~2-3s para rodar 50 testes
```

---

## Setup Inicial

### 1. Instalar Bun (se não tiver)

```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Inicializar Testes

```bash
bun add -d @testing-library/react @testing-library/jest-dom
bun add -d @testing-library/user-event happy-dom
```

### 3. Criar arquivo de configuração

Criar `bunfig.toml`:

```toml
[test]
preload = ["./tests/setup.ts"]
```

Criar `tests/setup.ts`:

```typescript
import { expect } from "bun:test";
import "@testing-library/jest-dom";
```

---

## Estrutura de Testes

```
tests/
├── setup.ts                          # Configuração global
├── unit/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── CircularProgress.test.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── Input.test.tsx
│   │   ├── trades/
│   │   │   ├── TradeForm.test.tsx
│   │   │   ├── TradeCalendar.test.tsx
│   │   │   └── DayTradesTable.test.tsx
│   │   ├── playbook/
│   │   │   └── PlaybookGrid.test.tsx
│   │   └── reports/
│   │       └── Charts.test.tsx
│   ├── lib/
│   │   ├── calculations.test.ts
│   │   ├── storage.test.ts
│   │   └── utils.test.ts
│   └── stores/
│       ├── useAccountStore.test.ts
│       └── useTradeStore.test.ts
└── integration/
    ├── trade-workflow.test.tsx       # Criar → Editar → Deletar
    ├── journal-workflow.test.tsx     # Criar journal entry
    ├── playbook-workflow.test.tsx    # CRUD de playbooks
    └── reports-generation.test.tsx   # Gerar relatórios
```

---

## Prioridades de Testes

### 🔴 **Prioridade ALTA** (Críticos)

#### 1. Cálculos Financeiros (`lib/calculations.test.ts`)

```typescript
import { describe, test, expect } from "bun:test";
import { calculateMetrics, formatCurrency } from "@/lib/calculations";

describe("Calculations", () => {
  test("calculates profit factor correctly", () => {
    const trades = [{ pnl: 100 }, { pnl: -50 }, { pnl: 200 }];
    // Profit Factor = Total Wins / Total Losses
    // = 300 / 50 = 6.0
    expect(calculateMetrics(trades).profitFactor).toBe(6.0);
  });

  test("handles division by zero", () => {
    const trades = [{ pnl: 100 }, { pnl: 200 }]; // Only wins
    expect(calculateMetrics(trades).profitFactor).toBe(Infinity);
  });
});
```

#### 2. Trade Duration (`DayTradesTable.test.tsx`)

```typescript
test("calculates duration with date and time", () => {
  const trade = {
    entryDate: "2024-01-01",
    entryTime: "09:00",
    exitDate: "2024-01-01",
    exitTime: "10:30",
  };

  const duration = calculateDuration(trade);
  expect(duration).toBe("01:30:00");
});
```

#### 3. PlaybookGrid Metrics

```typescript
test("displays win rate with correct color", () => {
  const { getByText } = render(<PlaybookGrid playbooks={mockPlaybooks} />);

  const winRate = getByText("75%");
  expect(winRate).toHaveClass("text-green-400"); // >= 70%
});
```

---

### 🟡 **Prioridade MÉDIA** (Importantes)

#### 4. Chart Rendering

```typescript
test("renders all 9 charts", () => {
  const { container } = render(<Charts trades={mockTrades} />);

  expect(container.querySelectorAll(".recharts-wrapper")).toHaveLength(9);
});
```

#### 5. Responsive Layouts

```typescript
test("calendar shows 3 columns on mobile", () => {
  // Mock mobile viewport
  global.innerWidth = 375;

  const { container } = render(<TradeCalendar />);
  expect(container.querySelector(".grid")).toHaveClass("grid-cols-3");
});
```

#### 6. Form Validation

```typescript
test("validates required fields", async () => {
  const { getByText, getByLabelText } = render(<TradeForm />);

  const submitButton = getByText("Registrar Trade");
  await userEvent.click(submitButton);

  expect(getByText("Campo obrigatório")).toBeInTheDocument();
});
```

---

### 🟢 **Prioridade BAIXA** (Nice to have)

#### 7. Tooltip Interactions

#### 8. Animations

#### 9. Accessibility (A11y)

---

## Executando Testes

### Rodar todos os testes

```bash
bun test
```

### Rodar testes específicos

```bash
bun test calculations
bun test --watch          # Watch mode
bun test --coverage       # Com cobertura
```

### CI/CD (GitHub Actions)

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
```

---

## Metas de Cobertura

| Módulo                          | Meta | Prioridade |
| ------------------------------- | ---- | ---------- |
| `lib/calculations.ts`           | 90%+ | 🔴 Alta    |
| `components/reports/Charts.tsx` | 70%+ | 🟡 Média   |
| `components/trades/*`           | 80%+ | 🔴 Alta    |
| `components/ui/*`               | 60%+ | 🟢 Baixa   |
| `stores/*`                      | 85%+ | 🔴 Alta    |

---

## Checklist de Implementação

### Fase 1: Setup

- [ ] Instalar Bun
- [ ] Adicionar dependências de teste
- [ ] Criar arquivos de configuração (`bunfig.toml`, `tests/setup.ts`)
- [ ] Criar estrutura de pastas

### Fase 2: Testes Críticos (Prioridade Alta)

- [ ] `lib/calculations.test.ts`
- [ ] `components/journal/day-detail/DayTradesTable.test.tsx`
- [ ] `components/playbook/PlaybookGrid.test.tsx`
- [ ] `stores/useTradeStore.test.ts`

### Fase 3: Testes Importantes (Prioridade Média)

- [ ] `components/reports/Charts.test.tsx`
- [ ] `components/trades/TradeForm.test.tsx`
- [ ] `components/trades/TradeCalendar.test.tsx`
- [ ] Integration tests básicos

### Fase 4: Testes Complementares (Prioridade Baixa)

- [ ] Testes de UI components
- [ ] Testes de acessibilidade
- [ ] Testes E2E completos

### Fase 5: CI/CD

- [ ] Configurar GitHub Actions
- [ ] Adicionar badge de cobertura
- [ ] Configurar pre-commit hooks

---

## Exemplo Completo

```typescript
// tests/unit/components/ui/CircularProgress.test.tsx
import { describe, test, expect } from "bun:test";
import { render } from "@testing-library/react";
import { CircularProgress } from "@/components/ui/CircularProgress";

describe("CircularProgress", () => {
  test("renders with correct percentage", () => {
    const { container } = render(<CircularProgress percentage={75} />);

    expect(container.querySelector("text")).toHaveTextContent("75%");
  });

  test("applies custom colors", () => {
    const { container } = render(
      <CircularProgress percentage={50} color="#22c55e" />
    );

    const circle = container.querySelector("circle[stroke='#22c55e']");
    expect(circle).toBeInTheDocument();
  });

  test("handles 0% and 100%", () => {
    const { rerender, container } = render(<CircularProgress percentage={0} />);
    expect(container.querySelector("text")).toHaveTextContent("0%");

    rerender(<CircularProgress percentage={100} />);
    expect(container.querySelector("text")).toHaveTextContent("100%");
  });
});
```

---

## Recursos

- 📖 [Bun Test Docs](https://bun.sh/docs/cli/test)
- 🧪 [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- 🎯 [Bun Examples](https://github.com/oven-sh/bun/tree/main/test)
