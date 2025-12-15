# 🧪 Testing Guide

**Versão:** 1.0  
**Atualizado:** 2025-12-14  
**Framework:** Vitest + Testing Library

---

## 🎯 Visão Geral

O projeto usa **Vitest** para testes. Atualmente temos **287 testes** passando.

---

## 📦 Comandos

```bash
# Rodar todos os testes
npm test

# Rodar testes específicos
npm test -- TradeRepository
npm test -- production-smoke

# Watch mode (dev)
npm test -- --watch

# Com coverage
npm test -- --coverage

# Testes de um arquivo específico
npm test -- src/lib/__tests__/unit/TradeRepository.test.ts
```

---

## 📁 Estrutura de Testes

```
src/
├── __tests__/                    # Testes globais
│   ├── schemas/                  # Validação de schemas
│   └── services/                 # Testes de serviços
│       └── journal/
│           ├── journalEntry.crud.test.ts
│           ├── journalEntry.business.test.ts
│           └── journalEntry.validation.test.ts
│
└── lib/
    └── __tests__/                # Testes de lib
        ├── unit/
        │   └── TradeRepository.test.ts
        ├── integration/
        │   └── backward-compat.test.ts
        ├── performance.test.ts
        └── production-smoke.test.ts
```

---

## 🧪 Tipos de Testes

### 1. Unit Tests (Mock)

Testam lógica isolada com mocks do Supabase:

```typescript
import { vi, describe, it, expect } from "vitest";
import { TradeRepository } from "@/lib/repositories/TradeRepository";

describe("TradeRepository", () => {
  it("should return trades for valid account", async () => {
    const mockSupabase = createMockSupabase({ trades: [mockTrade] });
    const repo = new TradeRepository(mockSupabase);

    const result = await repo.getByAccount("account-1");

    expect(result.data).toHaveLength(1);
    expect(result.error).toBeNull();
  });
});
```

### 2. Integration Tests

Testam compatibilidade com código existente:

```typescript
describe("Backward Compatibility", () => {
  it("should return same data format as legacy queries", async () => {
    const legacyResult = await legacyGetTrades();
    const repoResult = await repo.getByAccount(accountId);

    expect(repoResult.data).toMatchObject(legacyResult);
  });
});
```

### 3. Performance Tests

Validam benchmarks de tempo:

```typescript
describe("Performance", () => {
  it("should complete query in under 500ms", async () => {
    const start = performance.now();
    await repo.getByAccount(accountId, { limit: 100 });
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(500);
  });
});
```

### 4. Production Smoke Tests

Testam contra banco real (requer `.env.local`):

```typescript
// src/lib/__tests__/production-smoke.test.ts
describe("Production Performance", () => {
  it("should query trades efficiently", async () => {
    const { data, error } = await supabase
      .from("trades")
      .select("id, strategy")
      .limit(100);

    expect(error).toBeNull();
  });
});
```

---

## 🔧 Setup de Testes

### Mock do Supabase

```typescript
// Criar mock completo
const createMockSupabase = (options) => {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: options.data, error: null }),
    }),
  };
};
```

### Arquivo de Setup

```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock do next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

// Mock do Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: { ... }
}))
```

---

## 📋 Convenções

1. **Nomenclatura:** `*.test.ts` ou `*.spec.ts`
2. **Localização:** `__tests__/` próximo ao código testado
3. **Descrição:** Use `describe` para agrupar, `it` para casos
4. **AAA Pattern:** Arrange, Act, Assert

```typescript
it("should do something", () => {
  // Arrange
  const input = "test";

  // Act
  const result = myFunction(input);

  // Assert
  expect(result).toBe("expected");
});
```

---

## ⚡ Dicas

```bash
# Rodar apenas testes que mudaram
npm test -- --changed

# Rodar em paralelo (mais rápido)
npm test -- --parallel

# Ver output detalhado
npm test -- --reporter=verbose
```

---

## 📊 Coverage Atual

```
✅ Repositories: 100%
✅ Services: ~80%
✅ Schemas: 100%
⚠️ Components: ~30% (TODO)
```

---

## 📚 Arquivos Importantes

- `vitest.config.ts` - Configuração
- `src/__tests__/setup.ts` - Setup global
- `src/lib/__tests__/` - Testes de lib
