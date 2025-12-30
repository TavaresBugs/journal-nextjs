# Prisma + Supabase Integration Guide

## Overview

O projeto agora suporta **dois tipos de repositories**:

- **Supabase** (original) - `@/lib/repositories`
- **Prisma** (novo, type-safe) - `@/lib/repositories/prisma`

Ambos podem ser usados simultaneamente. A migração é gradual.

---

## Comparação

| Feature        | Supabase  | Prisma                |
| -------------- | --------- | --------------------- |
| Type-safety    | Parcial   | ✅ Completa           |
| Autocompletion | Limitada  | ✅ Total              |
| RLS            | ✅ Nativo | ⚠️ Precisa middleware |
| Realtime       | ✅ Nativo | ❌ Não suportado      |
| Storage        | ✅ Nativo | ❌ Não suportado      |
| Auth           | ✅ Nativo | ❌ Não suportado      |

**Recomendação**: Use Prisma para queries complexas e type-safety. Mantenha Supabase para Auth, Storage, e Realtime.

---

## Usage

### Supabase (Original)

```typescript
import { TradeRepository } from "@/lib/repositories/TradeRepository";
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const repo = new TradeRepository(supabase);
const result = await repo.getByAccountId(accountId);
```

### Prisma (Type-safe)

```typescript
import { prismaTradeRepo } from "@/lib/repositories/prisma";

// Type-safe, autocompletion completo
const result = await prismaTradeRepo.getByAccountId(accountId, userId);
const metrics = await prismaTradeRepo.getDashboardMetrics(accountId, userId);
```

---

## Available Prisma Repositories

| Repository | Import               |
| ---------- | -------------------- |
| Trade      | `prismaTradeRepo`    |
| Journal    | `prismaJournalRepo`  |
| Account    | `prismaAccountRepo`  |
| Playbook   | `prismaPlaybookRepo` |

```typescript
import {
  prismaTradeRepo,
  prismaJournalRepo,
  prismaAccountRepo,
  prismaPlaybookRepo,
} from "@/lib/repositories/prisma";
```

---

## Setup Commands

```bash
# Pull schema from database
npx prisma db pull

# Generate Prisma Client
npx prisma generate

# Open visual database browser
npx prisma studio
```

---

## Environment Variables

```env
# .env (Session Pooler - recomendado)
DATABASE_URL="postgresql://postgres.xxx:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

---

## When to Use Each

| Use Case                   | Repository   |
| -------------------------- | ------------ |
| Simple CRUD                | Either       |
| Complex queries with joins | **Prisma**   |
| Dashboard aggregations     | **Prisma**   |
| Realtime subscriptions     | **Supabase** |
| File uploads               | **Supabase** |
| Auth checks                | **Supabase** |
