# 🔧 Services

Camada de lógica de negócio do **Trading Journal Pro**.

## 📁 Estrutura

```
services/
├── admin/           # Serviços administrativos (sync, gestão)
├── analytics/       # Cálculos e análises de performance
├── community/       # Features da comunidade
├── core/            # Operações core (trades, autenticação)
├── journal/         # Gerenciamento de journal entries
├── mentor/          # Sistema de mentoria AI
└── trades/          # Importação e manipulação de trades
```

## 🏗️ Arquitetura

```
App → Hooks → Services → Repositories → Supabase
```

Os **services** são a camada intermediária entre os hooks React e os repositories de dados.

## 📋 Services Disponíveis

### `admin/`

Serviços para recursos administrativos do sistema.

### `analytics/`

Cálculos de métricas, win rate, drawdown, e análises estatísticas.

### `community/`

Features sociais e compartilhamento de trades.

### `core/`

Operações fundamentais como autenticação e CRUD de trades.

### `journal/`

Gerenciamento de entradas do diário de trading.

- Criação/edição de entradas
- Vinculação com trades
- Upload de imagens por timeframe

### `mentor/`

Sistema de mentoria com sugestões e análises.

### `trades/`

Importação de trades de múltiplas plataformas:

- MetaTrader 4/5 (CSV, HTML)
- NinjaTrader (CSV)
- Tradovate (PDF)
- Parseamento e normalização de dados

## 🔧 Padrões

### Estrutura de um Service

```typescript
// services/example/exampleService.ts
import { exampleRepository } from "@/lib/repositories";
import type { Example, CreateExampleData } from "@/types";

export async function createExample(data: CreateExampleData): Promise<Example> {
  // 1. Validações de negócio
  if (!data.name) throw new Error("Nome é obrigatório");

  // 2. Transformações
  const normalizedData = { ...data, name: data.name.trim() };

  // 3. Persistência via repository
  return exampleRepository.create(normalizedData);
}

export async function getExamples(userId: string): Promise<Example[]> {
  return exampleRepository.findByUser(userId);
}
```

### Organização por Domínio

Cada pasta de service agrupa funcionalidades relacionadas a um domínio específico.

### Tratamento de Erros

```typescript
try {
  const result = await repository.create(data);
  return { success: true, data: result };
} catch (error) {
  console.error("Error in service:", error);
  throw new Error("Falha ao criar registro");
}
```

## 🔗 Referências

- [ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
- [Repository Pattern](../lib/repositories/README.md)
- [Types](../types/README.md)
