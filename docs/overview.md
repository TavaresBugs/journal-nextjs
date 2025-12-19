# 📋 Contexto do Projeto - Trading Journal Pro

> **Objetivo:** Documento de referência completo para desenvolvedores e agentes de IA.
> **Público-alvo:** Desenvolvedores iniciantes a avançados
> **Última atualização:** 18 de Dezembro de 2025

---

## 🎯 Resumo Executivo (TL;DR)

**Trading Journal Pro** é uma aplicação web para traders profissionais registrarem, analisarem e melhorarem sua performance. Construída com Next.js 14+, TypeScript e Supabase, oferece gestão de trades, diário psicológico, playbooks de estratégias e sistema de mentoria.

---

## 📚 O que é o Projeto?

### Para Quem?

- **Traders ativos** (Day Trade, Swing, Position)
- **Mentores** que acompanham alunos
- **Prop Firms** para avaliação de traders

### O que Resolve?

1. **Falta de registro:** Trades perdidos na memória
2. **Falta de análise:** Sem métricas de performance
3. **Falta de disciplina:** Sem playbooks documentados
4. **Isolamento:** Sem feedback de mentores

### Diferenciais

| Feature                 | Trading Journal Pro | Concorrência |
| ----------------------- | ------------------- | ------------ |
| Multi-Timeframe Journal | ✅ Nativo           | ❌ Limitado  |
| Playbooks Estratégicos  | ✅ Completo         | ❌ Básico    |
| Sistema de Mentoria     | ✅ Integrado        | ❌ Externo   |
| Calendário Econômico    | ✅ Forex Factory    | ❌ Não       |

---

## 🛠️ Stack Tecnológica

### Frontend

| Tecnologia       | Versão           | Justificativa                             |
| ---------------- | ---------------- | ----------------------------------------- |
| **Next.js**      | 14+ (App Router) | SSR, layouts aninhados, Server Components |
| **TypeScript**   | 5.0+ (strict)    | Tipagem forte, menos bugs                 |
| **Tailwind CSS** | v3               | Produtividade, design consistente         |
| **shadcn/ui**    | Customizado      | Base de componentes premium               |
| **React Query**  | v5               | Cache, sincronização servidor             |
| **Zustand**      | v4               | Estado global simples                     |

> **Por que não Redux?** Zustand oferece menos boilerplate e integra melhor com React Query para separar estado local/servidor.

### Backend (BaaS)

| Tecnologia   | Uso                            |
| ------------ | ------------------------------ |
| **Supabase** | PostgreSQL, Auth, Storage, RLS |
| **Vercel**   | Deploy, Edge Functions         |

> **Por que Supabase?** Auth integrado, RLS para multi-tenant, Storage para imagens, tudo em um lugar.

### Ferramentas de Desenvolvimento

| Ferramenta            | Função                          |
| --------------------- | ------------------------------- |
| **Vitest**            | Testes unitários (287 passando) |
| **ESLint + Prettier** | Formatação e linting            |
| **Husky**             | Git hooks (pre-commit)          |

---

## 📂 Estrutura de Pastas

```
journal-nextjs/
├── src/
│   ├── app/                    # 🚀 ROTAS (Next.js App Router)
│   │   ├── (auth)/             # Rotas autenticadas (grupo)
│   │   ├── dashboard/          # 📊 Home do usuário
│   │   ├── trades/             # 📈 Gestão de operações
│   │   ├── journal/            # 📓 Diário de trading
│   │   ├── playbook/           # 📖 Estratégias
│   │   ├── laboratory/         # 🧪 Recaps experimentais
│   │   ├── calendario/         # 🗓️ Heatmap de resultados
│   │   ├── mentor/             # 👥 Sistema de mentoria
│   │   └── share/[token]/      # 🔗 Compartilhamento público
│   │
│   ├── components/
│   │   ├── ui/                 # 🧱 DESIGN SYSTEM (fonte da verdade)
│   │   │   ├── Button.tsx      # 20 variantes
│   │   │   ├── Modal.tsx       # Base para modais
│   │   │   ├── FormField.tsx   # Inputs padronizados
│   │   │   └── ...             # 28 componentes base
│   │   ├── trades/             # Componentes de Trade (10)
│   │   ├── journal/            # Componentes de Journal (12)
│   │   ├── playbook/           # Componentes de Playbook (10)
│   │   ├── charts/             # Gráficos (13)
│   │   └── shared/             # Compartilhados (10)
│   │
│   ├── lib/
│   │   ├── repositories/       # 📦 Acesso a dados (Supabase queries)
│   │   ├── services/           # ⚙️ Lógica de negócio
│   │   ├── utils/              # 🔧 Helpers
│   │   └── supabase/           # 🔌 Cliente Supabase
│   │
│   ├── hooks/                  # 🪝 Custom Hooks (15)
│   ├── store/                  # 🗃️ Zustand Stores (6)
│   ├── types/                  # 📝 TypeScript Types (5)
│   └── schemas/                # ✅ Zod Schemas (3)
│
├── docs/                       # 📚 Documentação (18 arquivos)
├── supabase/migrations/        # 🗄️ Migrations (20)
└── scripts/                    # 🛠️ Scripts utilitários (11)
```

---

## 📊 Métricas do Projeto

### Código (Dezembro 2025)

| Métrica                   | Valor         |
| ------------------------- | ------------- |
| Total de arquivos         | ~195 (TS/TSX) |
| Total de linhas           | ~29.600       |
| Componentes reutilizáveis | 50+           |
| Testes passando           | 287           |
| Coverage estimado         | ~60%          |

### Refatoração v0.9.0

| Métrica          | Valor              |
| ---------------- | ------------------ |
| Linhas removidas | 2.089 (duplicação) |
| Linhas criadas   | 316 (componentes)  |
| Saldo líquido    | -1.773 (-6%)       |
| ROI              | 6.6x               |

---

## 🏗️ Arquitetura em Camadas

```
┌─────────────────────────────────────────┐
│  CAMADA 1: PÁGINAS (App Router)         │  ← Orquestração
│  Ex: dashboard/page.tsx                 │
└─────────────────────────────────────────┘
              ↓ (usa)
┌─────────────────────────────────────────┐
│  CAMADA 2: COMPONENTES                  │  ← UI & Interação
│  Ex: TradeForm, JournalModal            │
└─────────────────────────────────────────┘
              ↓ (usa)
┌─────────────────────────────────────────┐
│  CAMADA 3: HOOKS                        │  ← Estado & Side Effects
│  Ex: useTrades, useJournal              │
└─────────────────────────────────────────┘
              ↓ (usa)
┌─────────────────────────────────────────┐
│  CAMADA 4: REPOSITORIES                 │  ← Acesso a Dados
│  Ex: tradeRepository.findByUser()       │
└─────────────────────────────────────────┘
              ↓ (usa)
┌─────────────────────────────────────────┐
│  CAMADA 5: SUPABASE                     │  ← Infraestrutura
│  PostgreSQL + Auth + Storage            │
└─────────────────────────────────────────┘
```

> **Regra:** Cada camada só pode chamar a camada imediatamente abaixo.

---

## 🛡️ Regras de Desenvolvimento

### ✅ FAÇA

1. **Usar componentes de `ui/`** para toda UI
2. **Tipar tudo** com TypeScript (sem `any`)
3. **Validar** inputs com Zod
4. **Testar** novas funcionalidades
5. **Documentar** decisões importantes

### ❌ NÃO FAÇA

1. **Usar `<button>` nativo** → Use `Button`
2. **Criar modal com `div fixed`** → Use `Modal`
3. **Confiar no frontend para segurança** → RLS no banco
4. **Duplicar código** → Extraia para componente/hook
5. **Commitar código não testado** → Rode `npm test` antes

---

## ❓ FAQ - Perguntas Frequentes

**P: Por que Supabase e não backend customizado?**
R: Velocidade de desenvolvimento. Auth, RLS e Storage prontos. Para um projeto com 1-2 devs, BaaS é a escolha certa.

**P: Por que App Router e não Pages Router?**
R: Server Components, melhor performance, layouts aninhados. É o futuro do Next.js.

**P: Onde fica a lógica de negócio?**
R: Em `src/lib/services/`. Repositories apenas buscam dados, services aplicam regras.

**P: Como adicionar um novo componente UI?**
R: Crie em `src/components/ui/`, exporte em `index.ts`, documente em `design-system.md`.

---

## 🔗 Referências

- [architecture.md](./architecture.md) - Arquitetura detalhada com diagramas
- [database.md](./database.md) - Schema e RLS policies
- [design-system.md](./design-system.md) - Catálogo de componentes
- [roadmap.md](./roadmap.md) - Plano de evolução
- [contributing.md](./contributing.md) - Guia de contribuição

---

**Mantido por:** [@TavaresBugs](https://github.com/TavaresBugs)
**Versão atual:** v0.9.0 (Dezembro 2025)
