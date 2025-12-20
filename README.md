# 📊 Trading Journal Pro

> Sistema completo de gerenciamento de trading journal com Next.js, TypeScript e Supabase, focado em traders profissionais.

[![CI](https://github.com/TavaresBugs/journal-nextjs/actions/workflows/ci.yml/badge.svg)](https://github.com/TavaresBugs/journal-nextjs/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green?logo=supabase)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-287%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/License-Private-red)]()

---

## 🎯 Visão Geral

Trading Journal Pro é uma plataforma completa para traders registrarem, analisarem e melhorarem sua performance de trading. Desenvolvida com as melhores práticas de engenharia de software, a aplicação oferece:

- 📈 **Gestão Completa de Trades** - CRUD, análise por timeframe, métricas avançadas
- 📓 **Journal Multi-Timeframe** - Diário de reflexões com anexos
- 📖 **Playbooks** - Estratégias documentadas e análise de performance
- 🗓️ **Calendário Visual** - Heat map de resultados
- 📊 **Dashboards** - Métricas em tempo real (equity curve, win rate, sharpe ratio)
- 👥 **Sistema de Mentoria** - Compartilhamento seguro entre mentor/mentorado
- 💰 **Calculadora de Impostos (BR)** - DARF automático para day trade
- 🔗 **Compartilhamento Público** - Links read-only via token

---

## 🚀 Features Principais

### ✅ Implementadas

- [x] CRUD completo de trades com validação
- [x] Upload de screenshots (WebP, quality 100%, -30% storage)
- [x] Journal entries com editor rico
- [x] Playbooks com análise HTF → LTF
- [x] Calendário com heat map
- [x] Dashboard multi-conta (real, demo, prop firm)
- [x] Sistema de mentoria com convites
- [x] Compartilhamento via token
- [x] Calculadora de impostos (day trade 20%)
- [x] Design System completo (20+ variantes de botões)
- [x] 287 testes automatizados (Vitest)

### 🔄 Em Desenvolvimento

- [ ] Integração com Forex Factory (calendário econômico)
- [ ] Análise de padrões com ML
- [ ] Mobile app (React Native)
- [ ] Integração com brokers (MetaTrader, TradingView)

---

## 🛠️ Stack Tecnológica

### Frontend

- **Framework:** Next.js 14+ (App Router)
- **Linguagem:** TypeScript (strict mode)
- **Estilização:** Tailwind CSS v3
- **UI Base:** shadcn/ui (customizado)
- **Ícones:** Lucide React
- **Formulários:** react-hook-form + zod
- **Gráficos:** Recharts
- **State:** Zustand + React Query

### Backend/Infra

- **BaaS:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **Deploy:** Vercel
- **Storage:** Supabase Storage (WebP images)
- **Auth:** Supabase Auth (JWT)

### Dev Tools

- **Testes:** Vitest (287 tests passing)
- **Linting:** ESLint + Prettier
- **Type Check:** TypeScript strict
- **Git Hooks:** Husky + lint-staged (pre-commit)
- **Git:** Commits atômicos, conventional commits

---

## 📁 Estrutura do Projeto

```
journal-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Rotas autenticadas
│   │   ├── dashboard/          # Dashboard principal
│   │   ├── trades/             # Gestão de trades
│   │   ├── journal/            # Journal entries
│   │   ├── playbook/           # Playbooks
│   │   ├── laboratory/         # Recaps experimentais
│   │   ├── calendario/         # Calendário heat map
│   │   ├── comunidade/         # Features sociais
│   │   ├── mentor/             # Sistema de mentoria
│   │   └── share/[token]/      # Compartilhamento público
│   │
│   ├── components/             # 📖 Ver README
│   │   ├── ui/                 # Design System (28 componentes)
│   │   ├── trades/             # Componentes de trade (24)
│   │   ├── journal/            # Componentes de journal (17)
│   │   ├── playbook/           # Componentes de playbook (10)
│   │   └── ...                 # 23 pastas de componentes
│   │
│   ├── services/               # 📖 Ver README
│   │   ├── admin/              # Serviços administrativos
│   │   ├── analytics/          # Cálculos e análises
│   │   ├── journal/            # Journal services
│   │   ├── trades/             # Trade services
│   │   └── ...                 # 7 domínios
│   │
│   ├── lib/
│   │   ├── repositories/       # 📖 Ver README (Repository Pattern)
│   │   ├── utils/              # Helpers gerais
│   │   ├── logger/             # Sistema de logging
│   │   └── supabase/           # Cliente Supabase
│   │
│   ├── hooks/                  # 📖 Ver README (15 hooks)
│   ├── store/                  # Zustand stores
│   ├── types/                  # 📖 Ver README (TypeScript types)
│   └── constants/              # Constantes globais
│
├── docs/                       # Documentação completa
├── scripts/                    # Scripts utilitários
├── tests/                      # Testes (671 passando)
└── supabase/migrations/        # Migrations do banco

~71 diretórios, ~195 arquivos, ~29.600 linhas
```

### 📖 Documentação por Pasta

| Pasta                   | README                                      | Descrição                         |
| ----------------------- | ------------------------------------------- | --------------------------------- |
| `src/components/`       | [📖 README](src/components/README.md)       | Componentes React e Design System |
| `src/services/`         | [📖 README](src/services/README.md)         | Lógica de negócio                 |
| `src/lib/repositories/` | [📖 README](src/lib/repositories/README.md) | Repository Pattern (Supabase)     |
| `src/hooks/`            | [📖 README](src/hooks/README.md)            | Custom hooks React                |
| `src/types/`            | [📖 README](src/types/README.md)            | Tipos TypeScript                  |

---

## 📊 Métricas do Projeto

### Código

- **Total de arquivos:** 195 (TS/TSX)
- **Total de linhas:** ~29.600 (reduzido de 31.400 após refatoração)
- **Componentes reutilizáveis:** 50+
- **Testes:** 287 passando
- **Coverage:** ~60%

### Refatoração Dezembro 2025

- **Linhas removidas:** 2.089 (duplicação)
- **Linhas criadas:** 316 (componentes reutilizáveis)
- **Saldo líquido:** -1.773 linhas (-6%)
- **ROI:** 6.6x (eliminação/criação)

### Performance

- **Bundle size:** ~2.1 MB (otimizado)
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Lighthouse Score:** 92/100

---

## 🎨 Design System

O projeto possui um Design System completo documentado em `docs/DESIGN_SYSTEM.md`:

- **Button:** 20 variantes (primary, secondary, ghost, danger, success, gradient, etc.)
- **IconActionButton:** 7 variantes (edit, delete, share, view, back, next, star)
- **Modal:** Sistema padronizado com footers reutilizáveis
- **Forms:** FormField, FormSection, FormRow
- **Cards:** Card, GlassCard, AssetBadge
- **Inputs:** Input, Select, Textarea, DateTimePicker

**Regras de Ouro:**

- ❌ Nunca usar `<button>` nativo
- ❌ Nunca criar modal com `div fixed`
- ✅ Sempre partir de componentes base
- ✅ Customização via variants (não classes inline)

---

## 🚀 Começando

### Pré-requisitos

- Node.js 18+
- npm/yarn/pnpm
- Conta Supabase
- Git

### Instalação

```
# Clone o repositório
git clone https://github.com/TavaresBugs/journal-nextjs.git
cd journal-nextjs

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Supabase

# Rode migrations
npm run db:migrate

# Inicie servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

### Variáveis de Ambiente

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Storage
NEXT_PUBLIC_STORAGE_BUCKET=journal-images
```

---

## 🧪 Testes

```
# Rodar todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Testes em watch mode
npm run test:watch

# Lint
npm run lint

# Type check
npm run type-check

# Performance (Lighthouse)
npx lhci autorun
```

### Performance (Lighthouse CI)

O projeto utiliza Lighthouse CI para garantir métricas de Core Web Vitals.
A configuração está em `lighthouserc.json` e roda automaticamente no GitHub Actions.

**Budgets definidos:**

- Performance: ≥ 75
- Accessibility: ≥ 90
- SEO: ≥ 90
- Best Practices: ≥ 85

---

## 📚 Documentação

### 🚀 Começando

| Documento                                     | Descrição                        |
| --------------------------------------------- | -------------------------------- |
| [🚀 Getting Started](docs/getting-started.md) | Setup inicial e primeiro projeto |
| [📋 Overview](docs/overview.md)               | Visão técnica geral do projeto   |
| [📖 Glossário](docs/glossary.md)              | Termos técnicos explicados       |

### 🏗️ Arquitetura & Design

| Documento                                 | Descrição                       |
| ----------------------------------------- | ------------------------------- |
| [🏗️ Arquitetura](docs/architecture.md)    | Diagramas C4, padrões, decisões |
| [🗄️ Database](docs/database.md)           | Schema, RLS policies, queries   |
| [🎨 Design System](docs/design-system.md) | Componentes UI, variantes       |

### 🔧 Desenvolvimento

| Documento                               | Descrição                             |
| --------------------------------------- | ------------------------------------- |
| [🧪 Testes](docs/testing.md)            | Estratégia, como escrever, inventário |
| [🔒 Segurança](docs/security.md)        | Auth, RLS, logging seguro             |
| [🤝 Contribuindo](docs/contributing.md) | Convenções, processo de PR            |
| [📝 Guia de Docs](docs/docs-guide.md)   | Como manter documentação              |

### 📋 Gestão

| Documento                                 | Descrição                  |
| ----------------------------------------- | -------------------------- |
| [🗺️ Roadmap](docs/roadmap.md)             | Planejamento futuro        |
| [📋 TODO](docs/todo.md)                   | Tarefas organizadas        |
| [✨ Features](docs/pending-features.md)   | Backlog de funcionalidades |
| [📋 Changelog](CHANGELOG.md)              | Histórico de versões       |
| [🚀 Deploy](docs/deployment-checklist.md) | Checklist de implantação   |

---

## 🤝 Contribuindo

Este é um projeto privado em desenvolvimento ativo. Para contribuir:

1. Crie uma branch: `git checkout -b feature/nome-feature`
2. Commit suas mudanças: `git commit -m 'feat: adiciona nova feature'`
3. Push para a branch: `git push origin feature/nome-feature`
4. Abra um Pull Request

**Convenções:**

- Commits: [Conventional Commits](https://www.conventionalcommits.org/)
- Code style: ESLint + Prettier (rodado automaticamente via Husky pre-commit)
- Testes: Obrigatórios para novas features

**Pre-commit Hooks:**

O projeto usa [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) para garantir qualidade do código antes de cada commit:

- Arquivos `.ts`, `.tsx`, `.js`, `.mjs` → ESLint --fix + Prettier
- Arquivos `.json`, `.md`, `.css` → Prettier

---

## 📝 Histórico de Versões

### v0.9.0 (Dezembro 2025) - Refatoração Massiva

- ✨ Novo Design System completo
- ♻️ Refatoração de ~2.000 linhas duplicadas
- 🎨 Padronização de Button, Modal, Forms
- 📝 Documentação completa criada
- ✅ 287 testes passando (+156 novos)

### v0.8.0 (Novembro 2025) - Otimizações

- 🖼️ Conversão automática para WebP (quality 100%)
- ⚡ Redução de 30% no storage
- 🐛 Correções de bugs críticos

Ver [CHANGELOG.md](CHANGELOG.md) completo.

---

## 📄 Licença

Projeto privado © 2025 @TavaresBugs

---

## 👨‍💻 Autor

**TavaresBugs**

- GitHub: [@TavaresBugs](https://github.com/TavaresBugs)
- Email: [seu-email@example.com]

---

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Desenvolvido com ☕ por @TavaresBugs**
