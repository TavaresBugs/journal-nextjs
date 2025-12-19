# 🧪 Testes

> **Status:** 671+ testes passando
> **Framework:** Vitest + React Testing Library
> **Coverage:** ~72.8%

Este documento unifica toda a documentação de testes do projeto: estratégia, como escrever testes, e inventário.

---

## 📋 Índice

- [Filosofia](#-filosofia)
- [Comandos Rápidos](#-comandos-rápidos)
- [Estrutura de Testes](#-estrutura-de-testes)
- [Como Escrever Testes](#-como-escrever-testes)
- [Padrões e Convenções](#-padrões-e-convenções)
- [Fixtures e Factories](#-fixtures-e-factories)
- [Mocking](#-mocking)
- [Inventário de Testes](#-inventário-de-testes)
- [Metas de Qualidade](#-metas-de-qualidade)

---

## 🎯 Filosofia

Buscamos **confiança** e **manutenibilidade**:

1. **Escreva testes que simulem o uso real** - Como o usuário interage
2. **Evite testar detalhes de implementação** - Teste comportamentos, não código interno
3. **Priorize testes de integração** - Cobrem mais valor com menos código

### A Pirâmide de Testes

```
       ┌─────────┐
       │  E2E    │  ← Poucos (fluxos críticos)
      ┌┴─────────┴┐
      │Integration │  ← Muitos (services + components)
     ┌┴───────────┴┐
     │   Unit      │  ← Fundação (utils, calculations)
     └─────────────┘
```

| Tipo           | Ferramentas         | Foco                           |
| -------------- | ------------------- | ------------------------------ |
| **Unit**       | Vitest              | Funções puras, cálculos, utils |
| **Integração** | Vitest + RTL        | Services, forms, fluxos        |
| **E2E**        | Playwright (futuro) | Jornadas do usuário            |

---

## 🚀 Comandos Rápidos

```bash
# Executar todos os testes
npm test

# Teste específico
npm test src/__tests__/components/MyComponent.test.tsx

# Modo watch (desenvolvimento)
npm run test:watch

# Interface visual
npm run test:ui

# Coverage report
npm run test:coverage
```

---

## 📁 Estrutura de Testes

```
src/
├── __tests__/                   # Arquivos de teste
│   ├── components/              # Testes de componentes
│   │   ├── ui/                  # Design System
│   │   ├── journal/             # Componentes de journal
│   │   ├── playbook/            # Componentes de playbook
│   │   └── laboratory/          # Componentes de recaps
│   ├── services/                # Testes de services
│   ├── hooks/                   # Testes de hooks
│   └── lib/                     # Testes de utils
│
├── lib/tests/                   # Utilitários de teste (NÃO são testes)
│   ├── fixtures/                # Dados estáticos
│   │   ├── tradeFixtures.ts     # Trades mock
│   │   └── journalFixtures.ts   # Journal entries mock
│   └── utils/
│       ├── factories.ts         # Factory functions
│       └── mockBuilders.ts      # Builders para mocks
```

### Onde colocar meu teste?

- Testando `src/components/MyComponent.tsx`?
  → `src/__tests__/components/MyComponent.test.tsx`

- Testando `src/services/myService.ts`?
  → `src/__tests__/services/myService.test.ts`

- Testando `src/hooks/useMyHook.ts`?
  → `src/__tests__/hooks/useMyHook.test.ts`

---

## ✍️ Como Escrever Testes

### Estrutura Básica

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MyComponent } from "@/components/MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Padrão AAA (Arrange-Act-Assert)

```typescript
it("should calculate profit correctly", () => {
  // Arrange - Configurar dados
  const entry = 100;
  const exit = 110;

  // Act - Executar ação
  const result = calculatePnL(entry, exit);

  // Assert - Verificar resultado
  expect(result).toBe(10);
});
```

### Testando Interações

```typescript
import { userEvent } from "@testing-library/user-event";

it("submits form correctly", async () => {
  render(<Form />);
  const user = userEvent.setup();

  // Preencher campo
  await user.type(screen.getByLabelText("Nome"), "John");

  // Clicar no botão
  await user.click(screen.getByRole("button", { name: "Enviar" }));

  // Verificar resultado
  expect(handleSubmit).toHaveBeenCalledWith({ name: "John" });
});
```

### Testando Hooks

```typescript
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "@/hooks/useCounter";

it("should increment counter", () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

### Testando Async

```typescript
it("should fetch data", async () => {
  render(<DataComponent />);

  // Esperar dados carregarem
  expect(await screen.findByText("Loaded")).toBeInTheDocument();
});
```

---

## 📐 Padrões e Convenções

### Nomenclatura

| Tipo    | Formato                             | Exemplo                    |
| ------- | ----------------------------------- | -------------------------- |
| Arquivo | `*.test.ts(x)`                      | `Button.test.tsx`          |
| Suite   | `describe("NomeComponente/Função")` | `describe("Button")`       |
| Caso    | `it("should...")`                   | `it("should submit form")` |

### Queries do Testing Library

Prefira queries em ordem de prioridade:

```typescript
// ✅ Preferível - Acessível
screen.getByRole("button", { name: "Submit" });
screen.getByLabelText("Email");

// 🟡 Aceitável
screen.getByText("Hello World");
screen.getByPlaceholderText("Digite aqui");

// ⚠️ Evitar quando possível
screen.getByTestId("submit-button");
```

### Boas Práticas

✅ **FAÇA:**

- Teste comportamentos, não implementações
- Use `userEvent` em vez de `fireEvent`
- Espere elementos com `findBy*` para async
- Use factories para dados de teste

❌ **NÃO FAÇA:**

- Testar bibliotecas externas (Zod, React Query)
- Usar seletores CSS complexos
- Criar dados inline em cada teste
- Ignorar mensagens de erro do console

---

## 🏭 Fixtures e Factories

### Usando Fixtures Prontos

```typescript
import { mockTrades } from "@/lib/tests/fixtures/tradeFixtures";

it("should display winner trade", () => {
  render(<TradeCard trade={mockTrades.winner} />);
  // ...
});
```

### Usando Factories para Customização

```typescript
import { createMockTrade } from "@/lib/tests/utils/factories";

it("should display big winner", () => {
  const bigWinner = createMockTrade({
    pnl: 5000,
    outcome: "win",
  });

  render(<TradeCard trade={bigWinner} />);
  // ...
});
```

### Factory Disponíveis

| Factory                             | Uso                          |
| ----------------------------------- | ---------------------------- |
| `createMockTrade(overrides)`        | Criar trade com customização |
| `createMockJournalEntry(overrides)` | Criar journal entry          |
| `createMockActiveTrade(overrides)`  | Trade sem exit               |

---

## 🎭 Mocking

### Mockando Supabase

```typescript
import { createSupabaseMock } from "@/lib/tests/utils/mockBuilders";

vi.mock("@/lib/supabase/supabase", () => ({
  createClient: () => createSupabaseMock(),
}));
```

### Mockando Componentes

```typescript
vi.mock("@/components/HeavyComponent", () => ({
  HeavyComponent: () => <div data-testid="heavy-component">Mocked</div>,
}));
```

### Mockando Hooks

```typescript
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "123", email: "test@example.com" },
    loading: false,
  }),
}));
```

---

## 📊 Inventário de Testes

### Por Categoria

| Categoria      | Arquivos | Testes | Status     |
| -------------- | -------- | ------ | ---------- |
| **Components** | 15       | ~180   | ✅ Coberto |
| **Services**   | 12       | ~200   | ✅ Coberto |
| **Hooks**      | 8        | ~100   | ✅ Coberto |
| **Lib/Utils**  | 10       | ~120   | ✅ Coberto |
| **Total**      | 45       | 671+   | ✅         |

### Destaques

| Arquivo                      | Descrição             | Status       |
| ---------------------------- | --------------------- | ------------ |
| `JournalEntryForm.test.tsx`  | Formulário de journal | ✅ 4 testes  |
| `PlaybookFormModal.test.tsx` | Modal de playbook     | ✅ 12 testes |
| `RecapFormModal.test.tsx`    | Modal de recap        | ✅ 16 testes |
| `importService.test.ts`      | Parsers de importação | ✅ Estável   |
| `calculations.test.ts`       | Cálculos financeiros  | ✅ 100%      |

---

## 🎯 Metas de Qualidade

### Atuais

| Métrica           | Atual | Meta  |
| ----------------- | ----- | ----- |
| Testes passando   | 671+  | 700+  |
| Coverage          | 72.8% | 75%   |
| Tempo de execução | ~15s  | < 30s |

### Futuras (Q1 2026)

- [ ] Atingir 80% de coverage
- [ ] Implementar E2E com Playwright
- [ ] Fluxos críticos cobertos:
  - Login → Dashboard
  - Criar Trade → Ver no Grid
  - Importar CSV → Validar Dados

---

## 🔗 Referências

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [userEvent](https://testing-library.com/docs/user-event/intro)
