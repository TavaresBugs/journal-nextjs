# 🔒 Segurança

> **Score de Auditoria:** 8.0/10 ✅
> **Última Revisão:** Dezembro 2025
> **Padrão:** OWASP Top 10

Este documento descreve as práticas de segurança implementadas no Trading Journal Pro.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Autenticação](#-autenticação)
- [Autorização (RLS)](#-autorização-rls)
- [Headers de Segurança](#-headers-de-segurança)
- [Rate Limiting](#-rate-limiting)
- [Logging Seguro](#-logging-seguro)
- [Checklist OWASP](#-checklist-owasp)
- [Boas Práticas](#-boas-práticas)

---

## 🎯 Visão Geral

### Arquitetura de Segurança

```
┌────────────────────────────────────────────────┐
│                   CLIENTE                       │
│  (Browser com HTTPS)                           │
└──────────────────────┬─────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────┐
│              MIDDLEWARE (Next.js)              │
│  ✓ Rate Limiting (5 tentativas/15min)          │
│  ✓ Validação de UUID                           │
│  ✓ Proteção de rotas admin                     │
│  ✓ Refresh automático de sessão               │
└──────────────────────┬─────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────┐
│              SUPABASE (Backend)                 │
│  ✓ Auth com JWT                                │
│  ✓ RLS (Row Level Security)                    │
│  ✓ Queries parametrizadas                      │
│  ✓ Storage com ACL                             │
└────────────────────────────────────────────────┘
```

---

## 🔐 Autenticação

### Sistema

Usamos **Supabase Auth** com JWT:

- Login por email/senha
- Sessões com refresh automático
- Tokens JWT validados no servidor

### Middleware de Auth

**Localização:** `src/middleware.ts`

```typescript
// Rotas que requerem autenticação
const protectedRoutes = ["/dashboard", "/trades", "/journal", "/playbook"];

// Rotas que requerem role admin
const adminRoutes = ["/admin"];
```

### Proteção de Rotas Admin

```typescript
// Middleware verifica role do usuário
if (adminRoutes.some((route) => pathname.startsWith(route))) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}
```

---

## 🔐 Prisma Ownership Policy

### Princípio

Todas as queries Prisma sensíveis **DEVEM** filtrar por `userId` para garantir que usuários só acessem seus próprios dados. Esta política complementa o RLS do Supabase.

### Padrão Seguro

```typescript
// ✅ SEGURO: userId obrigatório no compound where
async getById(id: string, userId: string) {
  const item = await prisma.items.findFirst({
    where: {
      id,
      user_id: userId,  // Filtro na query
    },
  });

  if (!item) {
    return { error: "Not found" };
  }
  return item;
}
```

### Repositórios Protegidos

| Repositório          | Métodos Protegidos                              |
| -------------------- | ----------------------------------------------- |
| `AccountRepository`  | `getById`, `update`, `delete`, `updateBalance`  |
| `TradeRepository`    | `getById`, `getByAccountId`, `update`, `delete` |
| `JournalRepository`  | `getById`, `delete`, `save`                     |
| `PlaybookRepository` | `getById`, `update`, `delete`                   |

### Checklist para Novas Features

- [ ] `findUnique` substituído por `findFirst` com compound where?
- [ ] `userId` é **obrigatório** (não opcional)?
- [ ] Server Actions passam `userId` para os repositórios?
- [ ] Operações de `update` e `delete` verificam ownership?

> **Referência:** Issue #80 - Garantir ownership em queries Prisma

---

## 🛡️ Autorização (RLS)

### O que é RLS?

**Row Level Security** é como um "filtro automático" no banco de dados. Cada usuário só vê seus próprios dados, mesmo que a query tente buscar tudo.

> **💡 Analogia:** É como um prédio de apartamentos onde cada morador tem uma chave que só abre seu apartamento.

### Policies Implementadas

**Trades:**

```sql
-- Usuário só vê seus próprios trades
CREATE POLICY "Users can only see their trades"
ON trades FOR SELECT
USING (auth.uid() = user_id);

-- Usuário só pode criar trades para si
CREATE POLICY "Users can only insert their trades"
ON trades FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Tabelas com RLS:**

| Tabela            | SELECT     | INSERT     | UPDATE     | DELETE     |
| ----------------- | ---------- | ---------- | ---------- | ---------- |
| `trades`          | ✅ user_id | ✅ user_id | ✅ user_id | ✅ user_id |
| `journal_entries` | ✅ user_id | ✅ user_id | ✅ user_id | ✅ user_id |
| `playbooks`       | ✅ user_id | ✅ user_id | ✅ user_id | ✅ user_id |
| `accounts`        | ✅ user_id | ✅ user_id | ✅ user_id | ✅ user_id |

---

## 🛡️ Headers de Segurança

**Configurados em:** `next.config.mjs`

```javascript
const securityHeaders = [
  // Previne clickjacking
  { key: "X-Frame-Options", value: "DENY" },

  // Previne MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Ativa proteção XSS
  { key: "X-XSS-Protection", value: "1; mode=block" },

  // Controla referrer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // HSTS - força HTTPS
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // CSP - controla recursos carregados
  { key: "Content-Security-Policy", value: "..." },

  // Permissions Policy
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
```

---

## ⏱️ Rate Limiting

### Configuração

**Backend:** Upstash Redis com `@upstash/ratelimit`

**Localização:** `src/lib/ratelimit.ts` + `src/middleware.ts`

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const loginRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "journal:login",
});
```

### Comportamento

1. **Login:** 5 tentativas por IP a cada 15 minutos
2. **Após limite:** Retorna redirect com headers `X-RateLimit-*` e `Retry-After`
3. **Reset:** Automático via sliding window (Upstash)
4. **Persistência:** ✅ Mantém estado entre deploys e cold starts

### Headers HTTP

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 2024-01-01T12:15:00.000Z
Retry-After: 300
```

### Variáveis de Ambiente

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxx...
```

> **✅ Nota:** O rate limit usa Upstash Redis, garantindo persistência em ambientes serverless/edge. Analytics disponível no dashboard Upstash.

---

## 📝 Logging Seguro

### Problema

Logs podem expor dados sensíveis (PII - Personally Identifiable Information):

```typescript
// ❌ PERIGOSO - pode expor dados sensíveis
console.error("Error:", error);
console.log("User data:", userData);
```

### Solução

Use os helpers de logging seguro:

```typescript
import { safeError, sanitizeMeta, Logger } from "@/lib/logging";

// ✅ SEGURO - extrai apenas message e code
console.error("Error:", safeError(error));

// ✅ SEGURO - remove chaves sensíveis
console.log("Meta:", sanitizeMeta(userData));

// ✅ MELHOR - usa Logger seguro
const logger = new Logger("MyComponent");
logger.errorSafe("Failed to load", error, { context: "profile" });
```

### Chaves Bloqueadas

O sanitizador remove automaticamente:

| Categoria       | Chaves                                                        |
| --------------- | ------------------------------------------------------------- |
| **Auth**        | `password`, `token`, `session`, `accessToken`, `refreshToken` |
| **Credentials** | `apiKey`, `secret`, `credential`, `cookie`, `auth`            |
| **PII**         | `email`, `phone`, `cpf`, `ip`, `user_id`                      |

### Checklist de Auditoria

Antes de cada commit, verifique:

- [ ] Nenhum `console.error(error)` sem sanitização
- [ ] Dados de usuário nunca logados diretamente
- [ ] Tokens e sessões nunca expostos em logs

---

## ✅ Checklist OWASP Top 10

| #   | Vulnerabilidade           | Status | Implementação             |
| --- | ------------------------- | ------ | ------------------------- |
| A01 | Broken Access Control     | ✅     | RLS + Middleware          |
| A02 | Cryptographic Failures    | ✅     | Supabase gerencia         |
| A03 | Injection                 | ✅     | Queries parametrizadas    |
| A04 | Insecure Design           | ✅     | Arquitetura sólida        |
| A05 | Security Misconfiguration | ✅     | Headers configurados      |
| A06 | Vulnerable Components     | 🟡     | Auditar deps regularmente |
| A07 | Auth Failures             | ✅     | Rate limit + JWT          |
| A08 | Data Integrity            | ✅     | RLS                       |
| A09 | Logging Failures          | ✅     | Sentry + safe logging     |
| A10 | SSRF                      | ✅     | N/A para arquitetura      |

---

## 🚀 Boas Práticas

### Para Desenvolvedores

✅ **FAÇA:**

- Valide UUIDs em rotas dinâmicas
- Use RLS para todas as tabelas
- Sanitize logs antes de enviar
- Use `NEXT_PUBLIC_` apenas para dados públicos

❌ **NÃO FAÇA:**

- Expor `SERVICE_ROLE_KEY` no cliente
- Logar objetos de erro inteiros
- Confiar apenas em validação frontend
- Usar chaves sequenciais para IDs públicos

### Validação de UUID

```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (!UUID_REGEX.test(accountId)) {
  redirect("/dashboard");
}
```

### Variáveis de Ambiente

```typescript
// ✅ Seguro - Pode ser exposta no cliente
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

// ❌ NUNCA expor no cliente
SUPABASE_SERVICE_ROLE_KEY=...  // Apenas server-side
```

---

## 📊 Métricas de Segurança

| Métrica              | Valor                 |
| -------------------- | --------------------- |
| Headers de segurança | 7/7 configurados      |
| Tabelas com RLS      | 100%                  |
| Rate limiting        | 5 req/15min           |
| UUID validation      | Todas rotas dinâmicas |
| PII em logs          | 0 exposições          |

---

## 🔗 Referências

- [OWASP Top 10](https://owasp.org/Top10/)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [architecture.md](./architecture.md) - Arquitetura do projeto
- [database.md](./database.md) - Schema e RLS policies
