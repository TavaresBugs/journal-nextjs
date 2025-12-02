# Inventário do Projeto Legacy

## Estrutura de Arquivos

### HTML
- **Journal.html** (1276 linhas)
  - HTML principal com todos os modais e estrutura da UI
  - Modais: Criar Conta, Editar Trade, Configurações, Journal Entry, Day Detail
  - Dependência: Plotly.js CDN

### CSS
- **css/styles.css** - Estilos principais
- **css/fix-buttons.css** - Correções de botões

### JavaScript (11 arquivos)

#### Arquivos Modulares (Usar como fonte)
1. **accounts.js** (4.5KB) - Gerenciamento de contas
2. **calendar.js** (3.5KB) - Calendário de trades
3. **charts.js** (2.7KB) - Gráficos Plotly
4. **config.js** (2.2KB) - Configurações globais
5. **journal.js** (3.4KB) - Entradas de diário
6. **main.js** (1.6KB) - Inicialização
7. **storage.js** (9.5KB) - Persistência (localStorage + File System API)
8. **trades.js** (8.7KB) - Gerenciamento de trades
9. **ui.js** (4.6KB) - Funções de UI
10. **utils.js** (1.9KB) - Utilitários

#### Arquivo Monolítico (NÃO migrar diretamente)
11. **complete_app.js** (151KB, 3988 linhas)
    - ⚠️ Contém duplicação de funcionalidades dos arquivos modulares
    - Usar apenas para identificar código único não presente nos módulos

## Funcionalidades Identificadas

### ✅ Core Features

#### 1. Gerenciamento de Contas
- [ ] Criar nova carteira (nome, moeda, saldo, alavancagem, max DD)
- [ ] Listar carteiras
- [ ] Selecionar carteira ativa
- [ ] Editar saldo
- [ ] Deletar carteira

#### 2. Sistema de Trades
- [ ] Criar trade (ativo, direção, preços, lotes, TF, tags, estratégia)
- [ ] Editar trade existente
- [ ] Deletar trade
- [ ] Lista de trades com filtros
- [ ] Cálculo automático de P&L
- [ ] Trava de ativo (lock asset)
- [ ] Cálculo de resultado visual

#### 3. Journal Entries
- [ ] Criar entrada de diário
- [ ] Upload de imagens multi-timeframe (9 timeframes)
- [ ] Paste de imagens (Ctrl+V)
- [ ] Vincular trade à entrada
- [ ] Estado emocional
- [ ] Análise de timeframes
- [ ] Review do dia
- [ ] Visualização de imagens em modal
- [ ] Navegação entre imagens (carousel)

#### 4. Dashboard
- [ ] Métricas principais (P&L, win rate, etc)
- [ ] Tabs: Novo Trade, Lista, Calendário, Diário, Relatórios
- [ ] Gráficos interativos (Plotly)

#### 5. Calendário
- [ ] Visualização mensal de trades
- [ ] Indicação de dias com profit/loss
- [ ] Click em data abre modal de detalhes
- [ ] Modal de dia com lista de trades e métricas

#### 6. Rotinas Diárias
- [ ] Checklist: Aeróbico, Alimentação, Leitura, Meditação, PreMarket, Oração
- [ ] Persistência por data
- [ ] Visualização no modal de dia

#### 7. Configurações
- [ ] Listas customizadas (moedas, alavancagens)
- [ ] Ativos e multiplicadores
- [ ] Estratégias
- [ ] Setups
- [ ] Backup/Restore JSON

#### 8. Armazenamento
- [ ] Modo Browser (localStorage)
- [ ] Modo Folder (File System Access API)
- [ ] Estrutura de pastas por conta
- [ ] Salvamento de imagens locais

### 📦 Dependências Externas

- **Plotly.js** (v2.35.2) - Gráficos
- **DayJS** (implícito, usar na migração)

### 🔧 Bibliotecas Customizadas

Nenhuma identificada - código vanilla JavaScript

## Problemas de Arquitetura Identificados

### ❌ Issues

1. **Código Duplicado**
   - `complete_app.js` duplica funcionalidades dos módulos
   - Inconsistências entre versões

2. **Variáveis Globais**
   - Estado da aplicação espalhado em variáveis globais
   - Dificulta rastreamento e debug

3. **Acoplamento Forte**
   - Funções diretamente acopladas ao DOM
   - Dificulta testes unitários

4. **Sem Tipagem**
   - Ausência de TypeScript
   - Erros só aparecem em runtime

5. **Storage Não Abstrato**
   - Lógica de persistência misturada com lógica de negócio
   - Dificulta mudança de backend

## Plano de Ação

### 🚀 Prioridades

1. ✅ **Ignorar `complete_app.js`** - Usar módulos como fonte
2. ✅ **Criar Types** - Definir interfaces em TypeScript
3. ✅ **Abstrair Storage** - Camada unificada localStorage ↔️ Supabase
4. ✅ **Componentizar UI** - Converter modais e cards para React
5. [ ] **Migrar Funções** - Converter cada módulo JS para React/TS
6. [ ] **Implementar Rotas** - App Router do Next.js
7. [ ] **Integrar Supabase** - Database + Storage
8. [ ] **Testes** - Garantir paridade funcional

## Status de Migração

### Sprint 1: Setup e Análise ✅
- [x] Criar projeto Next.js
- [x] Instalar dependências
- [x] Criar estrutura de pastas
- [x] Documentar inventário legacy
- [x] Criar types TypeScript
- [x] Criar camada de storage
- [x] Criar funções de cálculo

### Sprint 2: Base e Estrutura 🔄
- [ ] Configurar Supabase (schema SQL)
- [ ] Criar componentes UI base
- [ ] Criar hooks customizados
- [ ] Configurar estado global (Zustand)

### Sprint 3: Migração de Funcionalidades
- [ ] Migrar accounts
- [ ] Migrar trades
- [ ] Migrar journal
- [ ] Migrar calendário

### Sprint 4: Features Avançadas
- [ ] Gráficos Plotly
- [ ] Backup/Restore
- [ ] Rotinas diárias
- [ ] Configurações

### Sprint 5: Agente IA
- [ ] API de análise
- [ ] API de sugestões
- [ ] UI do assistente

### Sprint 6: Testes e Deploy
- [ ] Testes automatizados
- [ ] Verificação manual
- [ ] Deploy Vercel
- [ ] Deploy Supabase
