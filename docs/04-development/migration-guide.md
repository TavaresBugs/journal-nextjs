# Guia de Migração e Estrutura de Pastas (Issue #65)

Este documento detalha o processo de migração e a nova estrutura de pastas implementada em Dezembro de 2025 para consolidar a camada de acesso a dados.

## ✅ Status da Migração (Completo - Dezembro 2025)

A migração de Supabase Client direto → Prisma ORM + Server Actions está **100% completa**.

### Serviços Migrados

| Serviço Antigo             | Novo Server Action     | Status |
| :------------------------- | :--------------------- | :----: |
| `core/account.ts`          | `actions/accounts.ts`  |   ✅   |
| `journal/journal.ts`       | `actions/journal.ts`   |   ✅   |
| `journal/routine.ts`       | `actions/routines.ts`  |   ✅   |
| `journal/review.ts`        | `actions/reviews.ts`   |   ✅   |
| `core/mental.ts`           | `actions/mental.ts`    |   ✅   |
| `admin/admin.ts`           | `actions/admin.ts`     |   ✅   |
| `mentor/invites/*.ts`      | `actions/mentor.ts`    |   ✅   |
| `community/playbook.ts`    | `actions/playbooks.ts` |   ✅   |
| `community/leaderboard.ts` | `actions/community.ts` |   ✅   |
| `trades/trade.ts`          | `actions/trades.ts`    |   ✅   |

---

## 📁 Estrutura de Dados Centralizada (`src/lib/database`)

```
src/lib/
└── database/             # ✅ Hub Central
    ├── client.ts         # Prisma Client Singleton
    ├── auth.ts           # Auth helpers (getCurrentUserId - SERVER ONLY)
    └── repositories/     # Prisma Implementations
        ├── AccountRepository.ts
        ├── AdminRepository.ts
        ├── CommunityRepository.ts
        ├── JournalRepository.ts
        ├── LaboratoryRepository.ts
        ├── MentalRepository.ts
        ├── MentorRepository.ts
        ├── PlaybookRepository.ts
        ├── ReviewRepository.ts
        ├── RoutineRepository.ts
        ├── SettingsRepository.ts
        ├── ShareRepository.ts
        └── TradeRepository.ts
```

### Server Actions (`src/app/actions/`)

| Action          | Descrição                              |
| :-------------- | :------------------------------------- |
| `accounts.ts`   | CRUD de contas + settings              |
| `admin.ts`      | Gestão de usuários + audit logs        |
| `community.ts`  | Leaderboard + Playbooks compartilhados |
| `journal.ts`    | Entradas do diário + imagens           |
| `laboratory.ts` | Recaps + experimentos                  |
| `mental.ts`     | Mental Hub + profiles + logs           |
| `mentor.ts`     | Invites + permissions + trade comments |
| `playbooks.ts`  | CRUD de playbooks pessoais             |
| `reviews.ts`    | Reviews de mentor/mentorado            |
| `routines.ts`   | Rotinas diárias                        |
| `share.ts`      | Compartilhamento público de journals   |
| `trades.ts`     | CRUD de trades                         |

---

## 🔐 Autenticação Client vs Server

> **IMPORTANTE**: A autenticação funciona diferente em componentes cliente e servidor.

| Contexto          | Função                     | Import                |
| :---------------- | :------------------------- | :-------------------- |
| Server Actions    | `getCurrentUserId()`       | `@/lib/database/auth` |
| Client Components | `getCurrentUserIdClient()` | `@/lib/supabase`      |

**Regra:** Nunca importe `@/lib/database/auth` em componentes cliente (`"use client"`).

---

## 📐 Imports Atualizados

| O que você quer? | Import Antigo               | **Novo Import**                   |
| :--------------- | :-------------------------- | :-------------------------------- |
| Prisma Client    | `@/lib/prisma`              | **`@/lib/database`**              |
| Auth (Server)    | `@/lib/prisma/auth`         | **`@/lib/database/auth`**         |
| Auth (Client)    | N/A                         | **`@/lib/supabase`**              |
| Repositories     | `@/lib/repositories/prisma` | **`@/lib/database/repositories`** |
| Server Actions   | `@/services/...`            | **`@/app/actions/...`**           |

---

## 📂 Services Restantes (Mínimos)

Após a migração, a pasta `services/` contém apenas lógica que **não pode** rodar no servidor:

```
src/services/
├── admin/migration.ts      # Migração localStorage → Supabase (browser)
├── analytics/              # Cálculos puros (sem DB)
├── core/forexScraper.ts    # Scraper de calendário
├── journal/imageUpload.ts  # Upload de imagens (browser)
└── trades/import.ts        # Parser de CSV/PDF (browser)
```

---

## 🛠️ Notas para Desenvolvedores

1. **Não use `prisma` diretamente em componentes.** Sempre use Server Actions.
2. **Repositories** devem retornar objetos de domínio, não objetos crus do Prisma.
3. **Services restantes** são apenas para lógica browser-side.

---

**Link Relacionado:** [Issue #65](https://github.com/TavaresBugs/journal-nextjs/issues/65)
