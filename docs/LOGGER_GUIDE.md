# 📝 Logger Guide

**Versão:** 1.0  
**Atualizado:** 2025-12-14

---

## 🎯 Visão Geral

O projeto possui duas ferramentas de logging:

1. **`Logger`** - Logging estruturado para produção/desenvolvimento
2. **`TradeDebugger`** - Debug visual específico para trades (dev only)

---

## 📦 Logger Básico

### Importação

```typescript
import { Logger } from "@/lib/logging/Logger";
```

### Uso

```typescript
// Criar instância com contexto
const logger = new Logger("TradeService");

// Níveis de log
logger.debug("Iniciando busca", { accountId });
logger.info("Trade carregado", { tradeId, strategy });
logger.warn("Campo opcional ausente", { field: "notes" });
logger.error("Falha ao salvar", { error: error.message });
```

### Output

```json
{
  "level": "INFO",
  "context": "TradeService",
  "message": "Trade carregado",
  "timestamp": "2025-12-14T23:00:00.000Z",
  "tradeId": "abc123",
  "strategy": "Pullback"
}
```

---

## 🔍 Logger.debugTrade (Estático)

Para debug rápido de objetos trade:

```typescript
import { Logger } from "@/lib/logging/Logger";

const trade = await getTrade(id);
Logger.debugTrade(trade, "TradeDetailPage");
```

### Output

```
🔍 Trade Debug (TradeDetailPage)
ID: 550e8400-e29b-41d4-a716-446655440000
User ID: abc123-def456
Full data: { id: '...', strategy: '...', ... }
✅ All required fields present
```

---

## 🎨 TradeDebugger (Visual)

Debug avançado com output estilizado no console:

### Importação

```typescript
import { TradeDebugger } from "@/lib/debug/tradeDebugger";
```

### Métodos

```typescript
// Log completo
TradeDebugger.log(trade, "TradeDetailPage");

// Comparar antes/depois
TradeDebugger.compare(oldTrade, newTrade);

// Log de performance
TradeDebugger.logPerformance("getTradeById", 87, 1);

// Validar estrutura
TradeDebugger.validate(trade);
```

### Output Visual

```
🔍 Trade Debugger [TradeDetailPage]
ID: 550e8400-e29b-41d4-a716-446655440000
UUID válido: ✅ Sim
User ID: abc123-def456-ghi789
Strategy: Pullback
Outcome: win
Created: 2025-12-14T22:30:00.000Z
Query Time: 87ms ✅
Full Object: { ... }
────────────────────────────────────────────────────────────
```

---

## 📋 Quando Usar Cada Um

| Situação                         | Ferramenta                       |
| -------------------------------- | -------------------------------- |
| Logging em serviços/repositories | `Logger`                         |
| Debug durante desenvolvimento    | `TradeDebugger.log()`            |
| Comparar mudanças em objetos     | `TradeDebugger.compare()`        |
| Medir performance de queries     | `TradeDebugger.logPerformance()` |
| Validar estrutura de dados       | `TradeDebugger.validate()`       |

---

## ⚠️ Importante

- `Logger` funciona em **produção e desenvolvimento**
- `TradeDebugger` só funciona em **desenvolvimento** (no-op em prod)
- Ambos são **SSR-safe** (verificam `typeof window`)

---

## 🚫 NÃO FAZER

```typescript
// ❌ BAD: console.log direto
console.log("trade:", trade);
console.error("ERROR!!!", error);

// ✅ GOOD: Logger estruturado
logger.info("Trade loaded", { tradeId: trade.id });
logger.error("Failed to load", { error: error.message });
```

---

## 📚 Arquivos

- `src/lib/logging/Logger.ts`
- `src/lib/debug/tradeDebugger.ts`
