# 💼 Trading Journal Pro - Next.js

Migração do Trading Journal de JavaScript vanilla para Next.js com TypeScript, Tailwind CSS e Supabase.

## 📋 Características

- ✅ **Multi-contas** - Gerenciamento de múltiplas carteiras
- ✅ **Gerenciamento de Trades** - Criar, editar, visualizar operações
- ✅ **Journal Multi-Timeframe** - Análise com imagens de 9 timeframes
- ✅ **Gráficos Interativos** - Visualização com Plotly.js
- ✅ **Calendário** - Visualização mensal de trades
- ✅ **Métricas** - P&L, win rate, profit factor, drawdown
- ✅ **Rotinas Diárias** - Checklist de hábitos
- ✅ **Backup/Restore** - Exportar e importar dados
- ✅ **Storage Híbrido** - localStorage ou Supabase

## 🚀 Começando

### Pré-requisitos

- Node.js >= 20.9.0 (recomendado)
- npm ou yarn
- Conta Supabase (opcional, para storage em nuvem)

### Instalação

```bash
# Clone o repositório
cd projeto-nextjs

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp env.example.txt .env.local
# Edite .env.local com suas credenciais Supabase

# Execute em desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 📁 Estrutura do Projeto

```
projeto-nextjs/
├── src/
│   ├── app/              # Rotas Next.js (App Router)
│   ├── components/       # Componentes React
│   │   ├── ui/          # Componentes base (Modal, Button, etc)
│   │   ├── trades/      # Componentes de trades
│   │   ├── journal/     # Componentes de journal
│   │   └── agent/       # Componentes do assistente IA
│   ├── lib/             # Lógica de negócio
│   │   ├── supabase.ts  # Cliente Supabase
│   │   ├── storage.ts   # Abstração de persistência
│   │   └── calculations.ts # Cálculos e métricas
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript types
│   └── store/           # Estado global (Zustand)
├── public/              # Assets estáticos
├── docs/                # Documentação
└── supabase/            # Migrations Supabase
```

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Estado:** Zustand
- **Gráficos:** Plotly.js
- **Datas:** DayJS

## 📊 Funcionalidades

### Contas
- Criar carteiras com nome, moeda, saldo inicial, alavancagem
- Definir max drawdown permitido
- Múltiplas contas simultâneas

### Trades
- Registrar trades com ativo, direção (Long/Short)
- Definir entry, stop loss, take profit
- Especificar timeframes de análise e entrada
- Tags de PDArrays (FVG, OB, BPR, etc)
- Estratégia e setup
- Cálculo automático de P&L

### Journal
- Análise visual multi-timeframe (9 timeframes)
- Upload de screenshots
- Paste direto de clipboard (Ctrl+V)
- Vincular trades
- Estado emocional e review

### Relatórios
- P&L total e por período
- Win rate e profit factor
- Drawdown atual e máximo
- Gráficos de evolução
- Distribuição por ativo

## 🔄 Migração de Dados

Para migrar dados do sistema legacy:

```bash
# 1. Exporte backup do sistema antigo
# 2. Execute o script de migração
npm run migrate:legacy

# Ou via interface web
# Ir para Configurações > Migração > Importar Backup
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes com coverage
npm run test:coverage

# Testes E2E
npm run test:e2e
```

## 📦 Build e Deploy

```bash
## Build de produção
npm run build

# Executar produção localmente
npm start

# Deploy no Vercel (recomendado)
npx vercel
```

### Configurar Supabase

1. Criar projeto em [supabase.com](https://supabase.com)
2. Executar migrations:
   ```bash
   npx supabase db push
   ```
3. Configurar variáveis de ambiente no Vercel

## 🤖 Assistente IA (Roadmap)

O assistente analisará automaticamente:
- Padrões em trades vencedores/perdedores
- Sugestões de melhoria
- Alertas de risco
- Refatorações de estratégia

## 📚 Documentação

- [Inventário Legacy](docs/legacy-inventory.md)
- [Plano de Implementação](docs/implementation-plan.md)
- [API Endpoints](docs/api-endpoints.md) (em breve)
- [Guia do Assistente IA](docs/ai-agent-guide.md) (em breve)

## 🐛 Issues

Encontrou um bug? Abra uma issue com:
- Descrição do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)

## 📝 License

Este projeto é privado e de uso pessoal.

---

**Status:** 🚧 Em desenvolvimento ativo - Sprint 1 completo
