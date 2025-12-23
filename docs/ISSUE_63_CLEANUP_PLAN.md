# Plano de Limpeza - Issue #63: Remove Legacy Supabase Repositories

**Data da Auditoria:** 23/12/2025
**Objetivo:** Remover código legado e redudante após migração para Prisma.

## 📊 Tabela 1: Arquivos/Pastas Legacy

| Caminho                 | Status Atual | Ação                                               |
| :---------------------- | :----------- | :------------------------------------------------- |
| `src/lib/repositories/` | Existe       | **Migrar & Deletar**. Usado por services legados.  |
| `src/lib/prisma/`       | Não Existe   | ✅ Limpo                                           |
| `src/lib/supabase/`     | Existe       | Manter `server.ts` (Auth). Deletar `fragments.ts`. |

## 📊 Tabela 2: Services a Migrar (Prioridade Alta)

| Service Legacy                | Substituir Por            |
| :---------------------------- | :------------------------ |
| `services/core/account.ts`    | `app/actions/accounts.ts` |
| `services/journal/journal.ts` | `app/actions/journal.ts`  |
| `services/trades/trade.ts`    | `app/actions/trades.ts`   |

## 📊 Tabela 3: Testes a Atualizar

Testes que mockam diretamente `@supabase/supabase-js` devem ser reescritos para testar Server Actions ou Repositories.
Principais arquivos afetados:

- `__tests__/services/core/account.test.ts`
- `__tests__/services/journal/journalEntry.crud.test.ts`
- `__tests__/services/trades/trade.test.ts`

## ✅ Checklist de Execução

### Fase 1: Limpeza Segura (Imediato)

- [ ] Deletar `src/lib/supabase/fragments.ts` (Queries supérfluas)
- [ ] Limpar imports não usados em `src/lib/storage.ts`

### Fase 2: Migração de Services

- [ ] Refatorar usos de `services/core/account.ts`
- [ ] Refatorar usos de `services/journal/journal.ts`
- [ ] Refatorar usos de `services/trades/trade.ts`

### Fase 3: Limpeza Profunda

- [ ] Deletar pasta `src/services/` (módulos migrados)
- [ ] Deletar pasta `src/lib/repositories/`
- [ ] Atualizar testes quebrados pela remoção
