# 📈 Trading Journal Pro

Um diário de trading profissional construído com Next.js 16, React 19 e Supabase.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Vitest](https://img.shields.io/badge/Tests-Vitest-729B1B?logo=vitest)
![Zod](https://img.shields.io/badge/Validation-Zod-3068B7)

---

## 📊 Status do Projeto

| Área              | Status          | Detalhes                               |
| ----------------- | --------------- | -------------------------------------- |
| **Core Features** | ✅ Completo     | Trades, Journal, Playbooks, Calendário |
| **Mentor System** | ✅ Completo     | Convites, visualização, reviews        |
| **Admin Panel**   | ✅ Completo     | RBAC, Audit logs, Aprovação            |
| **Import/Export** | ✅ Completo     | NinjaTrader, MetaTrader, Excel         |
| **Laboratory**    | ✅ Completo     | Recaps diários e semanais              |
| **Testes**        | 🟡 Em progresso | Vitest configurado, cobertura básica   |
| **AI Features**   | 📋 Planejado    | Roadmap Q2 2025                        |

> **17/17 Tasks Jules concluídas** • Última atualização: Dezembro 2024

### 🆕 Features Recentes (v1.3.0)

- ✅ **Weekly Recap System** - Review semanal com multi-select de trades
- ✅ **Validação Inteligente** - Errors vs Warnings com mensagens específicas
- ✅ **Image Lightbox** - Zoom com pinch-to-zoom e pan livre
- ✅ **Bloqueio de Scroll** - Hook reutilizável para modais
- ✅ **Calendário Padronizado** - 42 células, input manual de data/hora
- ✅ **Timezone Fix** - Horários como NY time, badge de sessão correto

---

## ✨ Features

### 📊 Gestão de Trades

- Registro completo de operações (Long/Short)
- Múltiplos timeframes de análise
- Cálculo automático de P&L, RR e métricas
- Tags de PDArrays (FVG, OB, BPR, etc)
- **Import:** NinjaTrader CSV, MetaTrader HTML
- **Export:** Excel, CSV, Backup JSON

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

- **Recharts:** Win Rate, Distribuição, Grid Mensal, Performance por Ativo
- **Lightweight Charts:** Curva de Capital, Drawdown, Timeline
- Métricas avançadas: Profit Factor, Expectancy, Sharpe Ratio

### 👥 Sistema de Mentoria

- Convites via email entre mentor/mentorado
- Visualização do calendário do aluno
- Sistema de reviews e correções
- Notificações em tempo real

### 💰 Calculadora de Impostos (BR)

- Day Trade: 20% sobre lucro
- Swing Trade: 15% (isenção até R$20k/mês)
- Relatórios fiscais exportáveis

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

| Categoria       | Tecnologia                   |
| --------------- | ---------------------------- |
| **Framework**   | Next.js 16 (App Router)      |
| **UI**          | React 19, TypeScript 5       |
| **Estilização** | Tailwind CSS 4               |
| **Database**    | Supabase (PostgreSQL + RLS)  |
| **Auth**        | Supabase Auth (Google OAuth) |
| **Estado**      | Zustand 5                    |
| **Validação**   | Zod                          |
| **Gráficos**    | Recharts, Lightweight Charts |
| **Testes**      | Vitest                       |
| **Datas**       | Day.js, date-fns             |

---

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Rotas Next.js (App Router)
│   ├── admin/              # Painel Admin (protegido)
│   ├── auth/callback/      # OAuth callback
│   ├── dashboard/          # Página principal
│   ├── mentor/             # Painel do Mentor
│   ├── comunidade/         # Playbooks globais e Leaderboard
│   ├── pending/            # Aguardando aprovação
│   ├── privacidade/        # Política de privacidade
│   ├── termos/             # Termos de uso
│   └── share/              # Páginas públicas
├── components/
│   ├── ui/                 # Componentes base
│   ├── trades/             # Formulários de trade
│   ├── journal/            # Journal modals
│   ├── charts/             # Recharts + Lightweight
│   ├── mentor/             # Sistema de mentoria
│   ├── notifications/      # Notificações
│   ├── import/             # Importação de dados
│   ├── tax/                # Relatórios fiscais
│   └── playbook/           # Gestão de playbooks
├── services/               # Camada de dados
│   ├── accountService.ts   # CRUD contas
│   ├── tradeService.ts     # CRUD trades
│   ├── journalService.ts   # CRUD journal
│   ├── importService.ts    # Import NinjaTrader/MT
│   ├── exportService.ts    # Export Excel/CSV
│   ├── taxService.ts       # Cálculos fiscais
│   └── adminService.ts     # Gestão admin
├── schemas/                # Validação Zod
├── store/                  # Zustand stores
├── hooks/                  # Custom React hooks
├── lib/                    # Utilitários
└── types/                  # TypeScript types
```

> 📐 Para arquitetura completa, veja [ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 🚀 Começando

### Pré-requisitos

- Node.js >= 20.9.0
- npm, yarn ou bun
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
- **RBAC:** Roles admin, user, guest
- **Audit Logs:** Registro de ações críticas
- **CSP/CORS:** Headers de segurança configurados
- Middleware de proteção de rotas
- Validação de dados com Zod

---

## 📦 Scripts

```bash
npm run dev      # Desenvolvimento
npm run build    # Build de produção
npm run start    # Executar produção
npm run lint     # ESLint
npm test         # Executar testes (Vitest)
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

| Tabela            | Descrição             |
| ----------------- | --------------------- |
| `accounts`        | Carteiras de trading  |
| `trades`          | Operações registradas |
| `journal_entries` | Entradas de journal   |
| `playbooks`       | Estratégias/setups    |
| `daily_routines`  | Checklist diário      |
| `users_extended`  | Roles e status        |
| `mentor_invites`  | Convites de mentoria  |
| `mentor_reviews`  | Feedbacks de mentor   |
| `audit_logs`      | Logs de segurança     |

### Migrations

```bash
npx supabase db push
```

---

## 🚀 Próximos Passos

### 🔴 Alta Prioridade

- [ ] Testar import NinjaTrader com arquivo real
- [ ] Deploy migração `017_add_trade_costs.sql` em produção
- [ ] Verificar fluxo completo em produção

### 🟡 Média Prioridade

- [ ] Drag & Drop para reordenar regras de playbook
- [ ] Gráfico MFE/MAE (dispersão de trades)
- [ ] Carousel de imagens no journal
- [ ] Templates de playbooks (ICT, SMC, Price Action)

### 🟢 Backlog

- [ ] AI: Análise de padrões comportamentais
- [ ] AI: Alertas de desvio de regras
- [ ] Internacionalização (EN/ES)
- [ ] App Mobile (React Native)
- [ ] Trade Replay com controle de velocidade

> 📋 Lista completa em [TODO.md](docs/TODO.md) e [ROADMAP.md](docs/ROADMAP.md)

---

## 🚢 Deploy

### Vercel (Recomendado)

```bash
npx vercel
```

Configure as variáveis de ambiente no dashboard do Vercel.

---

## 📚 Documentação

| Documento                               | Descrição                                      |
| --------------------------------------- | ---------------------------------------------- |
| [📐 Arquitetura](docs/ARCHITECTURE.md)  | Estrutura completa, fluxos de dados, diagramas |
| [🗺️ Roadmap](docs/ROADMAP.md)           | Análise competitiva, roadmap até Q4 2025       |
| [🗄️ Database](docs/DATABASE.md)         | Schema completo, tabelas, RLS policies         |
| [📋 Changelog](CHANGELOG.md)            | Histórico de versões e mudanças                |
| [🚧 Features](docs/PENDING_FEATURES.md) | Features pendentes por prioridade              |
| [📋 TODO](docs/TODO.md)                 | Tarefas do dia-a-dia                           |
| [🤖 Jules Tasks](docs/JULES_TASKS.md)   | Histórico das 17 tasks automatizadas           |
| [🔒 Security](docs/SECURITY_AUDIT.md)   | Auditoria de segurança                         |
| [🧪 Testes](docs/TEST_PLAN.md)          | Plano de testes e Vitest config                |

---

## 💡 Sugestões de Melhorias Futuras

### Performance

- [ ] Implementar Server Components para páginas estáticas
- [ ] Adicionar cache com React Query/SWR
- [ ] Lazy loading de gráficos pesados

### UX

- [ ] Onboarding guiado para novos usuários
- [ ] Atalhos de teclado (hotkeys)
- [ ] Modo de entrada rápida de trades

### Integrações

- [ ] Webhook para TradingView alerts
- [ ] Sync automático com B3 (CEI)
- [ ] API pública para desenvolvedores

### Comunidade

- [ ] Sistema de rating de playbooks
- [ ] Filtros avançados no leaderboard
- [ ] Challenges/competições mensais

---

## 📝 License

Projeto privado - Uso pessoal.

---

**Desenvolvido com ☕ por [@TavaresBugs](https://github.com/TavaresBugs)**
