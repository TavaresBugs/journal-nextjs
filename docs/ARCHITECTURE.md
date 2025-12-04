# 🏗️ Arquitetura do Projeto

> Última atualização: Dezembro 2024

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
│   ├── auth/callback/      # OAuth callback
│   ├── dashboard/          # Página principal (protegida)
│   ├── login/              # Página de login
│   ├── share/[id]/         # Páginas públicas
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home/Dashboard
│   └── globals.css         # Estilos globais
│
├── components/
│   ├── ui/                 # Componentes base
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Tabs.tsx
│   │   └── Toast.tsx
│   │
│   ├── trades/             # Gestão de trades
│   │   ├── TradeForm.tsx
│   │   ├── TradeList.tsx
│   │   ├── TradeCalendar.tsx
│   │   └── TradeDetails.tsx
│   │
│   ├── journal/            # Journal entries
│   │   ├── JournalEntryModal.tsx
│   │   ├── DayDetailModal.tsx
│   │   └── ...
│   │
│   ├── charts/
│   │   ├── recharts/       # Win Rate, Distribution, Grid
│   │   └── lightweight/    # Equity Curve, Drawdown
│   │
│   ├── playbook/           # Gestão de playbooks
│   ├── accounts/           # Seletor de contas
│   ├── reports/            # Métricas e relatórios
│   └── shared/             # Páginas de compartilhamento
│
├── services/               # Camada de dados
│   ├── accountService.ts   # CRUD contas
│   ├── tradeService.ts     # CRUD trades
│   ├── journalService.ts   # CRUD journal
│   ├── routineService.ts   # Rotinas diárias
│   └── migrationService.ts # Migração de dados
│
├── store/                  # Estado global (Zustand)
│   ├── useAccountStore.ts
│   ├── useTradeStore.ts
│   ├── usePlaybookStore.ts
│   └── ...
│
├── hooks/                  # Custom hooks
│   ├── useAuth.ts
│   ├── useToast.ts
│   └── ...
│
├── lib/                    # Utilitários
│   ├── supabase.ts         # Cliente Supabase
│   ├── storage.ts          # Abstração de storage
│   ├── calculations.ts     # Métricas financeiras
│   └── utils.ts            # Helpers gerais
│
├── types/                  # TypeScript types
│   ├── index.ts
│   └── ...
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

## 🗄️ Database Schema

### Tabelas Principais

| Tabela            | Descrição             |
| ----------------- | --------------------- |
| `accounts`        | Carteiras de trading  |
| `trades`          | Operações registradas |
| `journal_entries` | Entradas de journal   |
| `playbooks`       | Estratégias/setups    |
| `daily_routines`  | Checklist diário      |

### Row Level Security (RLS)

Todas as tabelas têm políticas RLS que garantem:

- Usuários só acessam seus próprios dados
- Autenticação obrigatória para operações

---

## 🎨 Componentes UI

### Design System

| Componente | Variantes                                                            |
| ---------- | -------------------------------------------------------------------- |
| `Button`   | `default`, `outline`, `ghost`, `gradient-primary`, `gradient-danger` |
| `Card`     | `default`, `glass`                                                   |
| `Input`    | `default`, `textarea`                                                |
| `Modal`    | `default`, `fullscreen`                                              |
| `Tabs`     | `default`                                                            |

### Tema

- **Paleta:** Zorin OS (Blue-Grey + Mint)
- **Mode:** Dark only
- **Background:** Blur glassmorphism

---

## 📊 Gráficos

### Recharts (SVG)

- `WinRateChart` - Gauge de win rate
- `WinLossDistributionChart` - Barras de distribuição
- `MonthlyPerformanceGrid` - Heatmap mensal
- `WeekdayWinRateChart` - Performance por dia

### Lightweight Charts (Canvas)

- `EquityCurveLightweight` - Linha de capital
- `DrawdownChartLightweight` - Área de drawdown

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

| Pacote                  | Versão  | Uso             |
| ----------------------- | ------- | --------------- |
| `next`                  | 16.0.7  | Framework       |
| `react`                 | 19.2.1  | UI Library      |
| `@supabase/supabase-js` | 2.86.0  | Database        |
| `zustand`               | 5.0.9   | Estado          |
| `recharts`              | 3.5.1   | Gráficos SVG    |
| `lightweight-charts`    | 5.0.9   | Gráficos Canvas |
| `dayjs`                 | 1.11.19 | Datas           |
| `tailwindcss`           | 4.x     | Estilos         |
