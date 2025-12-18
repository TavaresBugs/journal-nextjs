# 🏗️ Arquitetura do Projeto

> Última atualização: 18 de Dezembro 2025

## Visão Geral

O **Trading Journal Pro** é construído sobre três pilares arquiteturais:

1.  **Frontend First:** Next.js App Router para renderização híbrida (SSR/CSR).
2.  **Serverless Typesafe Database:** Supabase como backend-as-a-service, garantindo segurança via RLS e tipagem end-to-end.
3.  **Atomic Design System:** Interface construída com componentes granulares e reutilizáveis.

```mermaid
graph TB
    subgraph Frontend [Next.js App Router]
        A[Pages] --> B[Components]
        B --> C[Atomic UI (Button, Modal, FormField)]
        B --> D[Smart Components (TradeForm, JournalModal)]
    end

    subgraph State [State Management]
        D --> E[Zustand Stores (Global)]
        D --> F[React Query (Server State)]
    end

    subgraph Logic [Business Logic]
        F --> G[Services Layer]
        G --> H[Repositories Layer]
        H --> I[Validation (Zod)]
    end

    subgraph Backend [Supabase]
        G --> J[Supabase Client]
        J --> K[(PostgreSQL)]
        J --> L[Auth & RLS]
        J --> M[Storage]
    end
```

---

## 📂 Estrutura de Pastas (v2.0)

A estrutura foi reorganizada na refatoração de Dezembro/2025 para maximizar a reutilização.

```
src/
├── app/                    # Rotas (Next.js App Router)
│   ├── (auth)/             # Auth routes (login, callback)
│   ├── dashboard/          # [PROTECTED] Home do usuário
│   ├── trades/             # [PROTECTED] Gestão de trades
│   ├── journal/            # [PROTECTED] Diário
│   ├── ...
│
├── components/
│   ├── ui/                 # 🧱 DESIGN SYSTEM (Atomic)
│   │   ├── Button.tsx      # Core button component
│   │   ├── Modal.tsx       # Core modal component
│   │   ├── FormField.tsx   # Core input wrapper
│   │   └── ...
│   ├── trades/             # Componentes de domínio Trade
│   ├── journal/            # Componentes de domínio Journal
│   └── shared/             # Componentes compartilhados
│
├── lib/
│   ├── services/           # Regras de Negócio (ex: calc taxas)
│   ├── repositories/       # Acesso ao Banco (Supabase queries)
│   ├── utils/              # Helper functions
│   └── supabase/           # Configuração do cliente
│
├── hooks/                  # Logic hook reutilizáveis
├── store/                  # Estado global (Zustand)
└── types/                  # Types globais (TypeScript)
```

---

## 🏗️ Padrões de Código

### 1. Atomic Design System

Todo componente visual deve derivar dos primitivos em `components/ui`.

- **Button:** Única fonte de verdade para botões.
- **Modal:** Wrapper padrão para dialogs.
- **FormRow/FormField:** Estrutura padrão para formulários.

> **Regra:** Nunca estilizar um `<button>` ou `<div>` raw para UI elements padrão. Use os componentes `ui/`.

### 2. Service-Repository Pattern

Para separar lógica de negócio de acesso a dados:

- **Repository:** Executa queries no Supabase. Retorna `Result<T, Error>`.
- **Service:** Aplica regras de negócio (ex: cálculo de imposto) e chama repositórios.
- **Component:** Chama services via React Query hooks.

### 3. Zod Validation Everywhere

Validação ocorre em 3 níveis:

1. **Frontend:** React Hook Form + Zod resolve.
2. **DTO:** Services validam inputs com Zod.
3. **Database:** Constraints SQL e RLS.

---

## 🔄 Fluxos de Dados

### Trade Lifecycle

1.  **Input:** Usuário preenche `TradeForm`.
2.  **Validação:** `tradeSchema` valida dados.
3.  **Submit:** `useCreateTrade` (React Query) chama `tradeService.save`.
4.  **Service:** `tradeService` calcula PnL, R-Multiple e taxas.
5.  **Repository:** `tradeRepository` insere no Supabase.
6.  **Update:** React Query invalida cache e UI atualiza.

---

## 🛡️ Decisões Arquiteturais (ADRs)

### ADR-001: Next.js App Router

**Decisão:** Adotar App Router em vez de Pages Router.
**Motivo:** Melhor suporte a Server Components, Layouts aninhados e performance.

### ADR-002: Supabase como Backend

**Decisão:** Usar Supabase (BaaS) em vez de backend customizado (Nest/Express).
**Motivo:** Velocidade de desenvolvimento, Auth integrado, RLS poderoso para segurança multi-tenant.

### ADR-003: Zustand vs Context

**Decisão:** Zustand para estado global complexo (filtros, settings), React Query para server state.
**Motivo:** Menos boilerplate que Redux, menos re-renders que Context API puro.

### ADR-004: Tabela Polimórfica para Imagens

**Decisão:** Migrar de campos JSONB únicos para tabela `journal_images` (ou estrutura flexível em JSONB array) para Journal Entry.
**Motivo:** Permitir múltiplas imagens por timeframe e metadados associados.

### ADR-005: Unificação de Modais

**Decisão:** Criar um `Modal` base robusto em vez de múltiplos componentes de Dialog.
**Motivo:** Consistência de UX (fechamento, z-index, animações) e redução de código duplicado.
