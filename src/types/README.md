# 📐 Types

Definições TypeScript do **Trading Journal Pro**.

## 📁 Estrutura

```
types/
├── index.ts          # Tipos principais da aplicação
├── database.ts       # Tipos do banco de dados (snake_case)
├── assets.ts         # Tipos de ativos financeiros
├── playbookTypes.ts  # Tipos específicos de playbooks
└── utils.ts          # Tipos utilitários
```

## 📋 Arquivos

### `index.ts` - Tipos Principais

Contém os tipos principais usados em toda a aplicação (camelCase):

```typescript
// Entidades principais
export interface Trade { ... }
export interface TradeLite { ... }
export interface JournalEntry { ... }
export interface JournalImage { ... }
export interface LaboratoryRecap { ... }
export interface Playbook { ... }
export interface Account { ... }
export interface Settings { ... }

// Tipos de criação/atualização
export type CreateTradeData = Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTradeData = Partial<CreateTradeData>;
```

### `database.ts` - Tipos do Banco

Tipos que espelham as tabelas do Supabase (snake_case):

```typescript
export interface DBTrade {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  entry_price: number;
  // ... snake_case
}

export interface DBJournalEntry { ... }
export interface DBAccount { ... }
export interface DBSettings { ... }
```

### `assets.ts` - Tipos de Ativos

```typescript
export type AssetType = "forex" | "futures" | "stocks" | "crypto" | "indices" | "commodities";

export interface AssetConfig {
  id: string;
  symbol: string; // "EURUSD", "ES", "BTCUSD"
  name: string; // "Euro / US Dollar"
  type: AssetType;
  multiplier: number; // Contract size
  market: string; // "CME", "FX", "B3"
  icon: string;
  color: string;
  isDefault: boolean;
  isActive: boolean;
}
```

### `playbookTypes.ts` - Métricas de Playbook

```typescript
export interface BaseStats {
  wins: number;
  losses: number;
  pnl: number;
  winRate: number;
  avgRR: number | null;
  totalTrades: number;
}

export interface HtfExpandedMetric extends BaseStats {
  htf: string;
  conditionBreakdown: ConditionMetric[];
}

// Hierarquia: HTF → Condition → PD Array → Session → LTF → Tags
```

### `utils.ts` - Tipos Utilitários

```typescript
export type TradeOutcome = "win" | "loss" | "breakeven" | "pending";
export type TimeframeKey = "daily" | "h4" | "h1" | "m30" | "m15" | "m5";
```

## 🔄 Padrão DB ↔ App

### Convenção de Nomes

| Contexto     | Formato    | Exemplo                 |
| ------------ | ---------- | ----------------------- |
| Banco (DB\*) | snake_case | `user_id`, `created_at` |
| Aplicação    | camelCase  | `userId`, `createdAt`   |

### Mapeamento

```typescript
// Mapper: DB → App
function mapDBTradeToTrade(dbTrade: DBTrade): Trade {
  return {
    id: dbTrade.id,
    userId: dbTrade.user_id, // snake → camel
    accountId: dbTrade.account_id,
    entryPrice: Number(dbTrade.entry_price),
    createdAt: dbTrade.created_at,
    // ...
  };
}

// Mapper: App → DB
function mapTradeToDBTrade(trade: Trade): DBTrade {
  return {
    id: trade.id,
    user_id: trade.userId, // camel → snake
    account_id: trade.accountId,
    entry_price: trade.entryPrice,
    created_at: trade.createdAt,
    // ...
  };
}
```

## 📝 Padrões

### Tipos de Entidade

```typescript
// Entidade completa
export interface Entity {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Versão "lite" para listagens
export interface EntityLite {
  id: string;
  name: string;
}

// Dados para criação (sem campos gerados)
export type CreateEntityData = Omit<Entity, "id" | "createdAt" | "updatedAt">;

// Dados para atualização (partial)
export type UpdateEntityData = Partial<CreateEntityData>;
```

### Union Types para Estados

```typescript
export type TradeType = "Long" | "Short";
export type TradeOutcome = "win" | "loss" | "breakeven" | "pending";
export type EmotionalState = "confiante" | "neutro" | "ansioso" | "frustrado";
```

### Props de Componentes

```typescript
export interface ComponentProps {
  // Dados
  data: Entity;
  // Callbacks
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  // Estados
  isLoading?: boolean;
  disabled?: boolean;
  // Customização
  className?: string;
}
```

## ✅ Boas Práticas

1. **Prefixo DB para tipos de banco** - `DBTrade`, `DBJournalEntry`
2. **Sufixo Lite para versões resumidas** - `TradeLite`, `JournalEntryLite`
3. **Tipos de criação com Omit** - Remove campos gerados automaticamente
4. **Union types para enums** - Evita strings mágicas
5. **Exportar via index.ts** - Import limpo em toda aplicação

```typescript
// ✅ Bom: import centralizado
import type { Trade, TradeOutcome, CreateTradeData } from "@/types";

// ❌ Evite: import de arquivo específico
import type { Trade } from "@/types/index";
```

## 🔗 Referências

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook)
- [Supabase TypeScript](https://supabase.com/docs/reference/typescript-support)
- [ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
