# 📈 Trading Journal Pro

Um diário de trading profissional construído com Next.js 16, React 19 e Supabase.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

---

## ✨ Features

### 📊 Gestão de Trades

- Registro completo de operações (Long/Short)
- Múltiplos timeframes de análise
- Cálculo automático de P&L, RR e métricas
- Tags de PDArrays (FVG, OB, BPR, etc)

### 📓 Journal Multi-Timeframe

- Upload de screenshots por timeframe (9 TFs disponíveis)
- Paste direto do clipboard (Ctrl+V)
- Anotações de acertos, erros e melhorias
- Estado emocional e review

### 📖 Playbooks

- Criação de estratégias detalhadas
- Regras organizadas: Mercado, Entrada, Saída
- Vinculação de trades a playbooks
- Tracking de performance por estratégia

### 🗓️ Calendário

- Visualização mensal de trades
- Indicadores visuais de Win/Loss
- Detalhes do dia com modal interativo
- Checklist de rotinas diárias

### 📈 Gráficos & Métricas

- **Recharts:** Win Rate, Distribuição, Grid Mensal
- **Lightweight Charts:** Curva de Capital, Drawdown
- Métricas avançadas: Profit Factor, Expectancy, Sharpe Ratio

### 💼 Multi-Contas

- Gerenciamento de múltiplas carteiras
- Controle de saldo e alavancagem
- Max drawdown configurável

### 🔗 Compartilhamento

- Páginas públicas de journal entries
- Preview de imagens com lightbox
- Formatação rica de notas

---

## 🛠️ Stack Tecnológico

| Categoria       | Tecnologia                              |
| --------------- | --------------------------------------- |
| **Framework**   | Next.js 16 (App Router)                 |
| **UI**          | React 19, TypeScript 5                  |
| **Estilização** | Tailwind CSS 4                          |
| **Database**    | Supabase (PostgreSQL)                   |
| **Auth**        | Supabase Auth (Google OAuth)            |
| **Estado**      | Zustand 5                               |
| **Gráficos**    | Recharts, Lightweight Charts, Plotly.js |
| **Datas**       | Day.js                                  |

---

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Rotas Next.js (App Router)
│   ├── auth/              # Callback OAuth
│   ├── dashboard/         # Página principal
│   ├── login/             # Autenticação
│   └── share/             # Páginas públicas
├── components/
│   ├── ui/                # Button, Modal, Input, Card, Tabs, Toast
│   ├── trades/            # TradeForm, TradeList, TradeDetails
│   ├── journal/           # JournalModal, DayDetailModal, Calendar
│   ├── charts/            # Recharts + Lightweight Charts
│   ├── playbook/          # Gestão de playbooks
│   ├── accounts/          # Seletor de contas
│   └── shared/            # Páginas de compartilhamento
├── services/              # Camada de dados
│   ├── accountService.ts  # CRUD de contas
│   ├── tradeService.ts    # CRUD de trades
│   ├── journalService.ts  # CRUD de journal entries
│   ├── routineService.ts  # Rotinas diárias
│   └── migrationService.ts # Migração de dados
├── store/                 # Zustand stores
├── hooks/                 # Custom React hooks
├── lib/                   # Utilitários e config
├── types/                 # TypeScript types
└── contexts/              # React contexts
```

---

## 🚀 Começando

### Pré-requisitos

- Node.js >= 20.9.0
- npm ou yarn
- Conta Supabase

### Instalação

```bash
# Clone o repositório
git clone https://github.com/TavaresBugs/journal-nextjs.git
cd journal-nextjs

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp env.example.txt .env.local
# Edite .env.local com suas credenciais Supabase

# Execute em desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

---

## 🔐 Segurança

- **Supabase Auth** com Google OAuth
- **Row Level Security (RLS)** para isolamento de dados por usuário
- Middleware de proteção de rotas
- Tratamento robusto de erros de autenticação

---

## 📦 Scripts

```bash
npm run dev      # Desenvolvimento
npm run build    # Build de produção
npm run start    # Executar produção
npm run lint     # ESLint
```

---

## 🎨 Design

- Tema escuro inspirado no Zorin OS
- Paleta Blue-Grey + Mint
- Gradientes premium e animações suaves
- Design responsivo (Mobile-first)
- Background com blur glassmorphism

---

## 🗄️ Database

### Tabelas Principais

- `accounts` - Carteiras de trading
- `trades` - Operações registradas
- `journal_entries` - Entradas de journal
- `playbooks` - Estratégias/setups
- `daily_routines` - Checklist diário

### Migrations

```bash
npx supabase db push
```

---

## 🚢 Deploy

### Vercel (Recomendado)

```bash
npx vercel
```

Configure as variáveis de ambiente no dashboard do Vercel.

---

## 📚 Documentação

| Documento                                      | Descrição                                         |
| ---------------------------------------------- | ------------------------------------------------- |
| [Arquitetura](docs/ARCHITECTURE.md)            | Estrutura do projeto, fluxo de dados, componentes |
| [Roadmap](docs/ROADMAP.md)                     | Análise competitiva e plano de evolução           |
| [Features Pendentes](docs/PENDING_FEATURES.md) | Roadmap e funcionalidades planejadas              |
| [Plano de Testes](docs/TEST_PLAN.md)           | Estratégia de testes e exemplos                   |

---

## 📝 License

Projeto privado - Uso pessoal.

---

**Desenvolvido com ☕ por [@TavaresBugs](https://github.com/TavaresBugs)**
