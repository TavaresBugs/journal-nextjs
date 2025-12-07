# 🏗️ Arquitetura do Projeto

> Última atualização: 06 de Dezembro 2024

## Visão Geral

```mermaid
graph TB
    subgraph Frontend
        A[Next.js App Router] --> B[React Components]
        B --> C[Zustand Stores]
        C --> D[Services Layer]
    end

    subgraph Backend
        D --> E[Supabase Client]
        E --> F[(PostgreSQL)]
        E --> G[Auth]
        E --> H[Storage]
    end
```

---

## 📂 Estrutura de Pastas

```
src/
├── app/                    # Next.js App Router
│   ├── admin/              # Painel Admin (protegido)
│   ├── auth/callback/      # OAuth callback
│   ├── dashboard/          # Página principal (protegida)
│   ├── mentor/             # Painel do Mentor (protegido)
│   ├── comunidade/         # Leaderboard e Playbooks
│   ├── login/              # Página de login
│   ├── pending/            # Aprovação pendente
│   ├── privacidade/        # Política de privacidade
│   ├── termos/             # Termos de uso
│   ├── share/[id]/         # Páginas públicas
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home/Dashboard
│   └── globals.css         # Estilos globais
│
├── components/
│   ├── ui/                 # Componentes base
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── CircularProgress.tsx
│   │   ├── CookieConsent.tsx  # LGPD/GDPR
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Tabs.tsx
│   │   └── Toast.tsx
│   │
│   ├── trades/             # Gestão de trades
│   ├── journal/            # Journal entries
│   ├── import/             # Importação de dados
│   ├── notifications/      # Sistema de notificações
│   ├── settings/           # Configurações do usuário
│   ├── tax/                # Relatórios fiscais
│   │
│   ├── charts/
│   │   ├── recharts/       # Gráficos SVG
│   │   └── lightweight/    # Gráficos Canvas
│   │
│   ├── playbook/           # Gestão de playbooks
│   ├── accounts/           # Seletor de contas
│   ├── reports/            # Métricas e relatórios
│   ├── mentor/             # Componentes de mentoria
│   └── shared/             # Páginas de compartilhamento
│
├── services/               # Camada de dados
│   ├── accountService.ts   # CRUD contas
│   ├── tradeService.ts     # CRUD trades
│   ├── journalService.ts   # CRUD journal
│   ├── routineService.ts   # Rotinas diárias
│   ├── migrationService.ts # Migração de dados
│   ├── adminService.ts     # Gestão admin/auditoria
│   ├── exportService.ts    # Exportação Excel/CSV
│   ├── importService.ts    # Importação de dados
│   ├── taxService.ts       # Cálculos fiscais
│   ├── reportService.ts    # Geração de relatórios
│   └── reviewService.ts    # Reviews de mentor
│
├── schemas/                # Validação com Zod
│   ├── authSchema.ts       # Validação de auth
│   ├── tradeSchema.ts      # Validação de trades
│   └── journalSchema.ts    # Validação de journal
│
├── store/                  # Estado global (Zustand)
│   ├── useAccountStore.ts
│   ├── useTradeStore.ts
│   ├── usePlaybookStore.ts
│   ├── useJournalStore.ts
│   └── useSettingsStore.ts
│
├── hooks/                  # Custom hooks
│   ├── useAuth.ts          # Autenticação
│   ├── useDayStats.ts      # Estatísticas do dia
│   ├── useError.ts         # Tratamento de erros
│   ├── useImageUpload.ts   # Upload de imagens
│   └── useJournalForm.ts   # Form do journal
│
├── lib/                    # Utilitários
│   ├── supabase.ts         # Cliente Supabase
│   ├── auth.ts             # Helpers de autenticação
│   ├── storage.ts          # Abstração de storage
│   ├── calculations.ts     # Métricas financeiras
│   ├── errors.ts           # Custom errors
│   ├── sanitizer.ts        # Sanitização de dados
│   ├── shareUtils.ts       # Utils de compartilhamento
│   └── utils.ts            # Helpers gerais
│
├── types/                  # TypeScript types
│   ├── index.ts
│   ├── database.ts
│   └── utils.ts
│
├── contexts/               # React contexts
│   └── AuthContext.tsx
│
├── constants/              # Constantes
│   └── timeframes.ts
│
└── middleware.ts           # Proteção de rotas
```

---

## 🔄 Fluxo de Dados

```
User Action
    ↓
Component (React)
    ↓
Store (Zustand)
    ↓
Service (accountService, tradeService, etc.)
    ↓
Supabase Client
    ↓
PostgreSQL (com RLS)
```

---

## 🔄 Fluxos Principais

### Trade Lifecycle

```mermaid
stateDiagram-v2
    [*] --> New
    New --> Open: Create Trade (Manual)
    New --> Open: Import (CSV/HTML)

    state Open {
        [*] --> Active
        Active --> Closed: Add Exit Price/Date
    }

    Closed --> [*]

    note right of Open
        Calcula PnL, RR
        e Métricas auto
    end note
```

### Journal Entry Lifecycle

```mermaid
sequenceDiagram
    participant User
    participant Modal as JournalEntryModal
    participant Store as JournalStore
    participant DB as Supabase
    participant Storage as Supabase Storage

    User->>Modal: Open Entry
    alt Create New
        User->>Modal: Fill Form (Title, Emotion, Notes)
        opt Upload Images
            User->>Modal: Select Files
            Modal->>Storage: Upload per Timeframe
            Storage-->>Modal: Public URLs
        end
        Modal->>Store: addEntry(data)
        Store->>DB: Insert
    else Edit Existing
        Modal->>Store: updateEntry(id, changes)
        Store->>DB: Update
    end
```

### Import Workflow (NinjaTrader/MetaTrader)

```mermaid
flowchart TD
    A[Upload CSV/HTML] --> B{Detect Type}
    B -->|NinjaTrader| C[Parse CSV (`;` sep)]
    B -->|MetaTrader| D[Parse HTML Table]

    C --> E[Normalize Data]
    D --> E

    E --> F{Map Symbols}
    F -->|MNQ -> MNQ| G[cleanSymbol()]

    G --> H[Convert Timezone]
    H --> I[Preview Table]

    I --> J[Confirm Import]
    J --> K[Batch Insert Operations]
```

---

## 🗄️ Database Schema

### Tabelas Principais

| Tabela            | Descrição             |
| ----------------- | --------------------- |
| `accounts`        | Carteiras de trading  |
| `trades`          | Operações registradas |
| `journal_entries` | Entradas de journal   |
| `playbooks`       | Estratégias/setups    |
| `daily_routines`  | Checklist diário      |
| `mentor_invites`  | Convites de mentoria  |
| `mentor_reviews`  | Feedbacks de mentor   |
| `users_extended`  | Perfis e roles        |
| `audit_logs`      | Logs de segurança     |

### Row Level Security (RLS)

Todas as tabelas têm políticas RLS que garantem:

- Usuários só acessam seus próprios dados
- Autenticação obrigatória para operações
- **Mentor Mode:** Mentores acessam dados de mentorados apenas se houver permissão explícita na tabela `mentor_account_permissions`.

---

## 👥 Mentor System

O sistema de mentoria permite que usuários experientes analisem o progresso de outros traders.

### Arquitetura de Permissões

```mermaid
graph LR
    A[Mentor] -->|Convite| B(MentorInvite)
    B -->|Aceite| C[Mentorado]
    C -->|Permissão| D[MentorAccountPermissions]
    D -->|Define| E[CanViewTrades / CanViewJournal]

    A -->|Query com Join| F[Trades do Mentorado]
    F -.->|RLS Policy| D
```

### Componentes Chave

| Componente | Função |
|Data Provider|`MentorContext` (Selected Account, Permissions)|
|UI|`StudentCalendarModal`, `MenteeJournalReviewModal`|
|Service|`inviteService`, `reviewService`|

### Fluxo de Review

1. **Mentor** visualiza dia do aluno (`StudentCalendarModal`).
2. **Mentor** cria review (`reviewService.createReview`).
3. **Notificação** é gerada para o aluno.
4. **Aluno** clica na notificação -> Deep link abre o dia correspondente.

---

## 🔔 Sistema de Notificações

Sistema de polling inteligente para atualizações em tempo real (simulado).

```mermaid
sequenceDiagram
    participant User
    participant Bell as NotificationBell
    participant Service as ReviewService
    participant DB as Supabase

    loop Every 30s
        Bell->>Service: getUnreadReviews()
        Service->>DB: Select count(*) where !read
        DB-->>Service: unread_count
        Service-->>Bell: Notification[]
    end

    User->>Bell: Click Notification
    Bell->>User: Redirect (Deep Link)
    User->>DB: Mark as Read (on view)
```

- **Tipos de Notificação:** `invite`, `announcement`, `feedback`.
- **Handling:** `NotificationsModal` gerencia a exibição e ações (ex: aceitar convite, ver feedback).

---

## 🛡️ Admin System

Painel administrativo para gestão segura da plataforma.

- **Role-Based Access Control (RBAC):** Roles `admin`, `user`, `guest` definidos em `users_extended`.
- **Audit Logging:** Ações críticas (ban, approve, delete) são logadas em `audit_logs`.
- **Approval Flow:** Novos usuários ficam com status `pending` até aprovação manual.

---

## 🌐 Comunidade & Leaderboard

### Leaderboard Opt-in

O leaderboard é **opt-in**. O usuário deve habilitar explicitamente a exibição de seus dados.

- Tabela: `leaderboard_opt_in`
- View: `leaderboard_entries` (agregação materializada ou view complexa para performance)

### Playbooks Compartilhados

- Tabela: `shared_playbooks`
- Sistema de likes/stars e downloads (clones) de estratégias.

---

## 🎨 Componentes UI

### Design System

| Componente         | Variáveis                                                            |
| ------------------ | -------------------------------------------------------------------- |
| `Button`           | `default`, `outline`, `ghost`, `gradient-primary`, `gradient-danger` |
| `Card`             | `default`, `glass`                                                   |
| `Input`            | `default`, `textarea`                                                |
| `Modal`            | `default`, `fullscreen`                                              |
| `Tabs`             | `default`                                                            |
| `CircularProgress` | Indicadores circulares de progresso                                  |
| `CookieConsent`    | Banner LGPD/GDPR                                                     |

### Tema

- **Paleta:** Zorin OS (Blue-Grey + Mint)
- **Mode:** Dark only
- **Background:** Blur glassmorphism

---

## 📊 Gráficos

### Recharts (SVG)

- `WinLossDistributionChart` - Barras de distribuição
- `MonthlyPerformanceGrid` - Heatmap mensal
- `WeekdayWinRateChart` - Performance por dia da semana
- `AssetPerformanceChart` - Performance por ativo
- `RMultipleDistributionChart` - Distribuição de R-múltiplos
- `StrategyPieChart` - Pizza de estratégias

### Lightweight Charts (Canvas)

- `EquityCurveLightweight` - Linha de capital
- `DrawdownChartLightweight` - Área de drawdown
- `PerformanceTimelineLightweight` - Timeline de performance
- `LightweightChartWrapper` - Wrapper reutilizável

---

## ✅ Schema Validation

Validação de dados com **Zod** em todas as camadas da aplicação.

```mermaid
flowchart LR
    A[User Input] --> B{Zod Schema}
    B --> |Valid| C[Service Call]
    B --> |Invalid| D[Error Display]

    subgraph Schemas
        E[authSchema]
        F[tradeSchema]
        G[journalSchema]
    end
```

| Schema          | Campos Principais                         |
| --------------- | ----------------------------------------- |
| `authSchema`    | Email, password, confirmação              |
| `tradeSchema`   | Symbol, entry/exit price, quantity, dates |
| `journalSchema` | Title, emotion, notes, images             |

---

## 💰 Sistema de Taxas/Impostos

Cálculos fiscais automáticos para operações de day trade e swing trade.

```mermaid
flowchart TD
    A[Trades Fechados] --> B[taxService]
    B --> C{Tipo de Operação}
    C --> |Day Trade| D[20% sobre lucro]
    C --> |Swing Trade| E[15% sobre lucro]
    D --> F[Relatório Fiscal]
    E --> F
    F --> G[Export PDF/Excel]
```

- **Day Trade:** Operações abertas e fechadas no mesmo dia (20% IR)
- **Swing Trade:** Operações com mais de um dia (15% IR)
- **Isenção:** Vendas até R$ 20.000/mês em swing trade

---

## 📤 Export/Import Flow

### Importação

```mermaid
flowchart TD
    A[Upload CSV/HTML] --> B{Detect Type}
    B --> |NinjaTrader| C["Parse CSV (`;` sep)"]
    B --> |MetaTrader| D[Parse HTML Table]
    C --> E[Normalize Data]
    D --> E
    E --> F[Convert Timezone]
    F --> G[Preview Table]
    G --> H[Confirm Import]
    H --> I[Batch Insert]
```

### Exportação

```mermaid
flowchart LR
    A[Select Data] --> B[exportService]
    B --> C{Format}
    C --> |Excel| D[ExcelJS]
    C --> |CSV| E[CSV String]
    D --> F[Download]
    E --> F
```

**Formatos suportados:**

- **Import:** NinjaTrader CSV, MetaTrader HTML
- **Export:** Excel (.xlsx), CSV, PDF (relatórios)

---

## 🔐 Autenticação

```
Login Page
    ↓
Supabase Auth (Google OAuth)
    ↓
/auth/callback (troca código por sessão)
    ↓
Middleware verifica sessão
    ↓
Dashboard (protegido)
```

---

## 📦 Dependências Principais

| Pacote                     | Versão        | Uso                |
| -------------------------- | ------------- | ------------------ |
| `next`                     | 16.0.7        | Framework          |
| `react`                    | 19.2.1        | UI Library         |
| `@supabase/supabase-js`    | 2.86.0        | Database           |
| `@supabase/ssr`            | 0.8.0         | SSR Auth           |
| `zustand`                  | 5.0.9         | Estado             |
| `recharts`                 | 3.5.1         | Gráficos SVG       |
| `lightweight-charts`       | 5.0.9         | Gráficos Canvas    |
| `dayjs`                    | 1.11.19       | Datas              |
| `date-fns` / `date-fns-tz` | 4.1.0 / 3.2.0 | Datas com timezone |
| `zod`                      | 3.23.8        | Validação schemas  |
| `exceljs`                  | 4.4.0         | Export Excel       |
| `xlsx`                     | 0.18.5        | Leitura planilhas  |
| `tailwindcss`              | 4.x           | Estilos            |
| `vitest`                   | 2.1.9         | Testes unitários   |
