# Changelog

> Histórico de progresso e features implementadas no Trading Journal Pro.

---

## 📅 2025-12-22 — Prisma ORM Integration

**Branch:** `feature/prisma-integration`  
**Commit:** `3522cdd`  
**Stats:** 32 arquivos | +2134 | -310

### 🎯 Resumo

Integração completa do Prisma ORM com Server Actions, substituindo chamadas diretas ao Supabase por uma arquitetura mais robusta e type-safe.

### ✨ Features Adicionadas

#### 🔧 Server Actions (Nova Camada)

| Arquivo                   | Descrição                                   |
| ------------------------- | ------------------------------------------- |
| `src/actions/trades.ts`   | CRUD de trades via Prisma                   |
| `src/actions/journal.ts`  | CRUD de entradas do diário                  |
| `src/actions/playbook.ts` | CRUD de playbooks                           |
| `src/actions/accounts.ts` | Operações de contas (verificar trades, etc) |

#### 📸 Image Upload Service

| Arquivo                               | Descrição                                        |
| ------------------------------------- | ------------------------------------------------ |
| `src/services/journal/imageUpload.ts` | Upload de imagens client-side → Supabase Storage |
| `src/lib/prisma/storage.ts`           | Helpers para storage com Prisma                  |

#### 🗄️ Prisma Repositories

| Arquivo                | Mudança                                    |
| ---------------------- | ------------------------------------------ |
| `JournalRepository.ts` | +199 linhas: trade linking, image handling |
| `TradeRepository.ts`   | +63 linhas: melhorias no CRUD              |
| `RoutineRepository.ts` | **NOVO**: repositório para rotinas diárias |

#### 🏪 Zustand Stores (Refatoradas)

| Arquivo               | Mudança                                        |
| --------------------- | ---------------------------------------------- |
| `useJournalStore.ts`  | Image upload antes de salvar, reload após save |
| `useTradeStore.ts`    | Migração para Server Actions                   |
| `usePlaybookStore.ts` | Simplificação (-117, +117 linhas)              |
| `useAccountStore.ts`  | Expansão (+99 linhas)                          |

### 🐛 Bug Fixes

| Issue            | Descrição                                          |
| ---------------- | -------------------------------------------------- |
| Journal Save     | Imagens agora são upadas client-side antes do save |
| Trade Linking    | Trades vinculados corretamente na tabela junction  |
| Profit Factor    | Retorna ∞ quando não há perdas (antes: 0)          |
| Select Component | Removido prop `disabled` inválida                  |

### 🔌 Infraestrutura

| Arquivo                      | Descrição                            |
| ---------------------------- | ------------------------------------ |
| `src/lib/supabase/server.ts` | Cliente Supabase para Server Actions |
| `src/lib/prisma/index.ts`    | Melhorias no cliente Prisma          |
| `prisma/schema.prisma`       | Ajustes no schema                    |

---

## 📈 Roadmap de Próximos Passos

- [ ] Merge `feature/prisma-integration` → `main`
- [ ] Testes E2E para Server Actions
- [ ] Migração completa: remover chamadas Supabase client-side restantes
- [ ] Documentação de APIs
