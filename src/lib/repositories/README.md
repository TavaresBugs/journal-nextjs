# 📦 Repositories

Implementação do **Repository Pattern** para acesso a dados.

## 🏗️ Arquitetura

```
App → Hooks → Services → Repositories → Supabase
```

Os repositories são a camada de abstração entre a lógica de negócio e o banco de dados Supabase.

## 📁 Estrutura

```
repositories/
├── BaseRepository.ts              # Classe abstrata base
├── TradeRepository.ts             # Operações de trades (completo)
├── economicEvents.repository.ts   # Eventos do calendário econômico
├── index.ts                       # Barrel export
├── types.ts                       # Tipos compartilhados
└── __tests__/                     # Testes unitários
```

## 📋 Repositories Disponíveis

| Repository                 | Descrição                          | Status          |
| -------------------------- | ---------------------------------- | --------------- |
| `BaseRepository`           | Classe abstrata com operações CRUD | ✅ Implementado |
| `TradeRepository`          | Trades e operações financeiras     | ✅ Implementado |
| `EconomicEventsRepository` | Calendário econômico               | ✅ Implementado |
| `JournalRepository`        | Entradas do diário                 | 📋 Planejado    |
| `PlaybookRepository`       | Playbooks e regras                 | 📋 Planejado    |

## 🔧 Como Usar

### Importação

```typescript
import { tradeRepository, economicEventsRepository } from "@/lib/repositories";

// Buscar trades do usuário
const trades = await tradeRepository.getByAccountId(accountId);

// Buscar eventos econômicos
const events = await economicEventsRepository.getByWeek(weekStart, weekEnd);
```

### Operações Básicas

```typescript
// CREATE
const newTrade = await tradeRepository.create(tradeData);

// READ
const trade = await tradeRepository.getById(tradeId);
const trades = await tradeRepository.getByAccountId(accountId);

// UPDATE
const updated = await tradeRepository.update(tradeId, { pnl: 150 });

// DELETE
await tradeRepository.delete(tradeId);
```

## 🏛️ BaseRepository

Classe abstrata que fornece operações CRUD genéricas:

```typescript
abstract class BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // Operações base
  async getById(id: string): Promise<T | null>;
  async create(data: Partial<T>): Promise<T>;
  async update(id: string, data: Partial<T>): Promise<T>;
  async delete(id: string): Promise<void>;

  // Query builder
  protected query(): SupabaseQueryBuilder<T>;
}
```

## 📝 Como Criar um Novo Repository

### 1. Defina os tipos

```typescript
// types/database.ts
export interface DBNewEntity {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
```

### 2. Crie o repository

```typescript
// lib/repositories/NewEntityRepository.ts
import { BaseRepository } from "./BaseRepository";
import type { DBNewEntity } from "@/types/database";

export class NewEntityRepository extends BaseRepository<DBNewEntity> {
  constructor() {
    super("new_entities"); // Nome da tabela no Supabase
  }

  // Métodos customizados
  async getByUserId(userId: string): Promise<DBNewEntity[]> {
    const { data, error } = await this.query()
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async search(query: string): Promise<DBNewEntity[]> {
    const { data, error } = await this.query().ilike("name", `%${query}%`);

    if (error) throw error;
    return data || [];
  }
}

// Singleton export
export const newEntityRepository = new NewEntityRepository();
```

### 3. Exporte no barrel

```typescript
// lib/repositories/index.ts
export { tradeRepository } from "./TradeRepository";
export { economicEventsRepository } from "./economicEvents.repository";
export { newEntityRepository } from "./NewEntityRepository"; // ← Adicione
```

## ✅ Benefícios do Padrão

| Benefício                          | Descrição                                 |
| ---------------------------------- | ----------------------------------------- |
| **Separação de responsabilidades** | Lógica de dados isolada da UI             |
| **Reutilização**                   | `BaseRepository` elimina código duplicado |
| **Testabilidade**                  | Fácil mockar para testes unitários        |
| **Abstração**                      | Mudanças no Supabase não afetam services  |
| **Type Safety**                    | TypeScript garante tipos corretos         |

## 🧪 Testes

```typescript
// __tests__/TradeRepository.test.ts
import { tradeRepository } from "../TradeRepository";

describe("TradeRepository", () => {
  it("should create a trade", async () => {
    const trade = await tradeRepository.create({
      symbol: "EURUSD",
      type: "Long",
      entryPrice: 1.1,
      // ...
    });

    expect(trade.id).toBeDefined();
    expect(trade.symbol).toBe("EURUSD");
  });
});
```

## 🔗 Referências

- [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)
- [Supabase Client](https://supabase.com/docs/reference/javascript)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
