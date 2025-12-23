# 🤖 Contexto do Projeto para Agentes de IA

> **Versão:** 1.1
> **Data:** 23 de Dezembro de 2025
> **Objetivo:** Fornecer contexto completo para agentes de IA ou novos desenvolvedores

---

## 📋 TL;DR (Resumo Executivo)

**Trading Journal Pro** é uma aplicação web para traders profissionais:

- **Stack:** Next.js 14+ (App Router), TypeScript, Supabase, Tailwind CSS
- **Propósito:** Registrar trades, analisar performance, manter diário psicológico
- **Complexidade:** ~55.000 linhas, 300+ arquivos, 15 hooks, 28 componentes UI
- **Testes:** 671+ passando (Vitest)
- **Arquitetura:** Frontend-First com BaaS (Backend as a Service)

---

## 🎯 1. O que é o Projeto?

### 1.1 Problema que Resolve

Traders profissionais precisam:

1. **Registrar trades** com detalhes (entrada, saída, P&L, screenshots)
2. **Analisar performance** (win rate, drawdown, métricas por estratégia)
3. **Manter disciplina** com playbooks de trading
4. **Documentar emoções** em diário psicológico
5. **Receber feedback** de mentores

### 1.2 Principais Funcionalidades

| Feature              | Descrição                            | Localização      |
| -------------------- | ------------------------------------ | ---------------- |
| **Dashboard**        | Métricas em tempo real, equity curve | `/dashboard`     |
| **Trades**           | CRUD de operações, importação CSV    | `/trades`        |
| **Journal**          | Diário com screenshots por timeframe | `/journal`       |
| **Playbooks**        | Estratégias com regras e análise     | `/playbook`      |
| **Laboratory**       | Recaps diários/semanais              | `/laboratory`    |
| **Calendário**       | Heat map de resultados               | `/calendario`    |
| **Mentoria**         | Sistema mentor/mentorado             | `/mentor`        |
| **Impostos**         | Cálculo DARF day trade (BR)          | `/tax`           |
| **Compartilhamento** | Links públicos read-only             | `/share/[token]` |

### 1.3 Usuários-Alvo

- **Traders Day Trade** - Operações intraday
- **Traders Swing** - Operações de dias/semanas
- **Mentores** - Acompanham alunos
- **Prop Firms** - Avaliam traders

---

## 🛠️ 2. Stack Tecnológica

### 2.1 Frontend

| Tecnologia       | Versão | Uso                         |
| ---------------- | ------ | --------------------------- |
| **Next.js**      | 14+    | Framework React, App Router |
| **TypeScript**   | 5+     | Tipagem estrita             |
| **Tailwind CSS** | 3.x    | Estilização                 |
| **React Query**  | 5.x    | Cache de dados do servidor  |
| **Zustand**      | 5.x    | Estado global               |
| **Recharts**     | 3.x    | Gráficos                    |
| **Zod**          | 3.x    | Validação de schemas        |

### 2.2 Backend (BaaS)

| Tecnologia   | Uso                            |
| ------------ | ------------------------------ |
| **Supabase** | PostgreSQL, Auth, Storage, RLS |
| **Vercel**   | Deploy, Edge Functions         |

### 2.3 Testes e Qualidade

| Ferramenta                | Uso                         |
| ------------------------- | --------------------------- |
| **Vitest**                | Testes unitários/integração |
| **React Testing Library** | Testes de componentes       |
| **ESLint + Prettier**     | Linting e formatação        |
| **Husky**                 | Git hooks (pre-commit)      |
| **Sentry**                | Error tracking              |

---

## 📁 3. Estrutura do Projeto

```
journal-nextjs/
├── src/
│   ├── app/                     # Pages Next.js (App Router)
│   │   ├── dashboard/           # Dashboard principal
│   │   ├── trades/              # Gestão de trades
│   │   ├── journal/             # Diário
│   │   ├── playbook/            # Playbooks
│   │   ├── laboratory/          # Recaps
│   │   ├── calendario/          # Calendário heat map
│   │   ├── mentor/              # Sistema de mentoria
│   │   ├── admin/               # Painel admin
│   │   └── share/[token]/       # Compartilhamento público
│   │
│   ├── components/              # Componentes React (📖 README.md)
│   │   ├── ui/                  # Design System (28 componentes)
│   │   ├── trades/              # Formulário de trades (24)
│   │   ├── journal/             # Componentes de journal (17)
│   │   ├── playbook/            # Componentes de playbook (10)
│   │   ├── charts/              # Gráficos (13)
│   │   └── shared/              # Compartilhados (10)
│   │
│   ├── services/                # Lógica de negócio (📖 README.md)
│   │   ├── admin/               # Serviços administrativos
│   │   ├── analytics/           # Cálculos e análises
│   │   ├── journal/             # Journal CRUD
│   │   ├── trades/              # Trade CRUD, importação
│   │   └── mentor/              # Sistema de mentoria
│   │
│   ├── hooks/                   # Custom hooks (📖 README.md)
│   │   ├── useAuth.ts           # Autenticação
│   │   ├── useDashboardData.ts  # Dados do dashboard
│   │   ├── useImageUpload.ts    # Upload de imagens
│   │   └── ... (15 hooks)
│   │
│   ├── lib/
│   │   ├── database/            # 🆕 Camada de Dados (Issue #65)
│   │   │   ├── client.ts        # Prisma Client
│   │   │   ├── repositories/    # Repository Pattern Implementations
│   │   │   └── types.ts         # Generic Repository types
│   │   ├── supabase/            # Cliente Supabase Legacy
│   │   └── utils/               # Utilitários
│   │
│   ├── types/                   # TypeScript types (📖 README.md)
│   ├── store/                   # Zustand stores (6)
│   └── schemas/                 # Zod schemas
│
├── docs/                        # Documentação (15 arquivos)
├── supabase/migrations/         # Migrations do banco
└── scripts/                     # Scripts utilitários
```

### 3.1 Fluxo de Camadas

```
Pages → Components → Hooks → Services → Repositories → DB (Prisma/Supabase)
```

**Regra:** Cada camada só importa da camada abaixo.

---

## 🏗️ 4. Arquitetura e Padrões

### 4.1 Padrões Implementados

| Padrão            | Localização                 | Descrição                     |
| ----------------- | --------------------------- | ----------------------------- |
| **Repository**    | `src/lib/database/repos...` | Abstração de acesso a dados   |
| **Service Layer** | `src/services/`             | Lógica de negócio             |
| **Custom Hooks**  | `src/hooks/`                | Lógica React reutilizável     |
| **Design System** | `src/components/ui/`        | Componentes base padronizados |

### 4.2 Segurança

- **RLS (Row Level Security)** - Cada usuário só vê seus dados
- **Auth Middleware** - Proteção de rotas
- **Rate Limiting** - 5 tentativas/15min por IP
- **Security Headers** - CSP, HSTS, X-Frame-Options

### 4.3 Performance

- **React Query** - Cache e revalidação
- **useMemo/useCallback** - Memoização em forms grandes
- **WebP** - Conversão automática de imagens
- **Server Components** - Menos JavaScript no cliente

---

## 📊 5. Métricas Atuais

### 5.1 Código

| Métrica             | Valor         |
| ------------------- | ------------- |
| Total de arquivos   | ~300 (TS/TSX) |
| Total de linhas     | ~55.000       |
| Componentes UI      | 28            |
| Custom hooks        | 15            |
| Domínios de service | 7             |
| Zustand stores      | 6             |

### 5.2 Qualidade

| Métrica           | Valor |
| ----------------- | ----- |
| Testes passando   | 671+  |
| Coverage          | ~72%  |
| Lint errors       | 0     |
| TypeScript strict | ✅    |

### 5.3 Arquivos Grandes (atenção)

| Arquivo                 | Linhas | Nota                |
| ----------------------- | ------ | ------------------- |
| `TradeForm.tsx`         | ~777   | Formulário complexo |
| `PlaybookFormModal.tsx` | ~595   | Modal com DnD       |
| `JournalEntryForm.tsx`  | ~535   | Form com imagens    |
| `TradeList.tsx`         | ~518   | Lista complexa      |

---

## 📝 6. Convenções de Código

### 6.1 Nomenclatura

| Item        | Convenção                         | Exemplo            |
| ----------- | --------------------------------- | ------------------ |
| Componentes | PascalCase                        | `TradeForm.tsx`    |
| Hooks       | camelCase com `use`               | `useTradeForm.ts`  |
| Services    | camelCase                         | `tradeService.ts`  |
| Types       | PascalCase, prefixo DB para banco | `Trade`, `DBTrade` |
| Arquivos    | camelCase ou kebab-case           | `trade-utils.ts`   |

### 6.2 Imports

```typescript
// ✅ Usar aliases
import { Button } from "@/components/ui";
import { useTrades } from "@/hooks/useTrades";

// ❌ Evitar imports relativos longos
import { Button } from "../../../components/ui";
```

### 6.3 Componentes

```typescript
// Estrutura padrão
"use client";

import { useCallback, useMemo } from 'react';

interface Props { ... }

export function MyComponent({ prop }: Props) {
  // hooks primeiro
  // handlers memoizados
  // JSX
}
```

---

## 🧪 7. Testes

### 7.1 Estrutura

```
src/__tests__/
├── components/     # Testes de componentes
├── services/       # Testes de services
├── hooks/          # Testes de hooks
└── lib/            # Testes de utils
```

### 7.2 Comandos

```bash
npm test                    # Todos os testes
npm test -- path/to/file    # Teste específico
npm run test:watch          # Watch mode
npm run test:coverage       # Com coverage
```

### 7.3 Fixtures

```typescript
import { mockTrades } from "@/lib/tests/fixtures/tradeFixtures";
import { createMockTrade } from "@/lib/tests/utils/factories";
```

---

## 🔗 8. Documentação Disponível

| Documento                                     | Descrição             |
| --------------------------------------------- | --------------------- |
| [getting-started.md](docs/getting-started.md) | Setup inicial         |
| [architecture.md](docs/architecture.md)       | Arquitetura detalhada |
| [testing.md](docs/testing.md)                 | Estratégia de testes  |
| [security.md](docs/security.md)               | Práticas de segurança |
| [STRUCTURE.md](docs/FOLDER_STRUCTURE.md)      | Estrutura de Pastas   |
| [contributing.md](docs/contributing.md)       | Como contribuir       |

### READMEs de Pastas

- `src/components/README.md`
- `src/services/README.md`
- `src/hooks/README.md`
- `src/types/README.md`
- `src/lib/database/README.md` (Em breve)

---

## 🚨 9. Pontos de Atenção

### 9.1 Cuidados

1. **RLS Policies** - Sempre validar segurança no banco
2. **TypeScript** - Não usar `any`, manter strict mode
3. **Testes** - Rodar antes de commit (`npm test`)
4. **Memoização** - Forms grandes usam useCallback/useMemo

### 9.2 Dívida Técnica Conhecida

| Item                        | Prioridade | Issue                      |
| --------------------------- | ---------- | -------------------------- |
| TradeForm grande            | P2         | Dividir em sub-componentes |
| useDashboardData grande     | P2         | Dividir em hooks menores   |
| SelectCustom vs SelectRadix | P2         | Consolidar                 |

### 9.3 Não Mexer Sem Entender

- `src/middleware.ts` - Auth e rate limiting
- `src/lib/database/` - Camada crítica de dados
- Tabelas com RLS no Supabase

---

## 🎯 10. Issues Abertas Relevantes

Para ver o trabalho pendente, consulte:

- [docs/todo.md](docs/todo.md) - Tarefas organizadas por prioridade
- [docs/pending-features.md](docs/pending-features.md) - Backlog de features

---

## 💡 11. Dicas para Agentes de IA

1. **Antes de editar**, verifique a estrutura existente
2. **Use os componentes do Design System** (`src/components/ui/`)
3. **Siga os padrões** de nomenclatura e organização
4. **Rode os testes** após mudanças (`npm test`)
5. **Consulte os READMEs** de cada pasta importante
6. **Mantenha TypeScript strict** - Sem `any`
7. **Memoize handlers** em componentes grandes

---

**Mantido por:** [@TavaresBugs](https://github.com/TavaresBugs)
**Última atualização:** 23 de Dezembro de 2025
