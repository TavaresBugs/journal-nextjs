# 📋 Changelog

Todas as mudanças notáveis do projeto serão documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased]

### Em Progresso

- Melhoria contínua de testes unitários
- Otimizações de performance

---

## [1.3.0] - 2024-12-12

### ✨ Adicionado

- **Weekly Recap System**: Novo modo de review semanal com seleção múltipla de trades
  - Toggle entre Review Diário e Review Semanal usando componente Tabs moderno
  - Seletor de semana com visualização de datas
  - Multi-select de trades com estatísticas em tempo real (Win Rate, P&L)
  - Nova tabela `laboratory_recap_trades` para relacionamento many-to-many
  - Colunas adicionadas: `review_type`, `week_start_date`, `week_end_date`
- **Modal ampliado**: Recap modal expandido para 900px (desktop) / 95vw (mobile)
- **CustomCheckbox**: Integração do componente estilizado do checklist para seleção de trades
- **Textareas maiores**: Campos de análise expandidos para 5-6 linhas

### 🐛 Corrigido

- Win Rate agora calculado por P&L positivo (não dependente do campo `outcome`)
- Double-toggle corrigido no checkbox de seleção de trades

---

## [1.2.0] - 2024-12-11

### ✨ Adicionado

- **useBlockBodyScroll Hook**: Bloqueio robusto de scroll quando modais estão abertos
  - Usa técnica `position: fixed` para evitar scroll em iOS
  - Previne layout shift durante abertura/fechamento de modais
  - Aplicado em: Modal base, ImageLightbox, JournalEntryContent, JournalEntryForm
- **Image Lightbox Avançado**: Zoom completo com react-zoom-pan-pinch
  - Pinch-to-zoom nativo em mobile
  - Controles de zoom (+/-/reset) funcionais
  - Double-tap para reset de zoom
  - Pan livre quando imagem ampliada
  - Cursor dinâmico (grab quando zoomed)

### 🎨 Melhorado

- Scroll horizontal em tabelas de trades em mobile com fade gradient
- Botão de comentários responsivo (icon-only em mobile)
- Layout responsivo de Playbook/Relatórios melhorado

---

## [1.1.0] - 2024-12-10

### ✨ Adicionado

- **Validação Inteligente de Trades**:
  - Sistema dual de Errors (bloqueantes) vs Warnings (não-bloqueantes)
  - Validação de datas (sequência, range de anos)
  - Validação de preços (não-negativos, não-zero)
  - Validação de SL/TP por tipo de operação (LONG/SHORT)
  - Validação de Risk-Reward Ratio com níveis de severidade
  - Hook `useTradeValidation` para gerenciamento de estado
  - Mensagens de erro específicas por campo com acessibilidade

### 🐛 Corrigido

- **Timezone Bug**: Correção de conversão de timezone na edição de trades
  - Horários armazenados como strings naive (sem timezone)
  - Sistema interpreta horários como America/New_York
  - Badge de sessão de mercado (London-NY Overlap) funciona corretamente

---

## [1.0.1] - 2024-12-09

### ✨ Adicionado

- **Calendário Padronizado**: 42 células (6 semanas) em todos os meses
  - Dias de meses adjacentes com opacidade reduzida
  - Altura uniforme independente do mês navegado
- **Input Manual de Data/Hora**:
  - Input de data (DD/MM/AAAA) com validação em tempo real
  - Input de hora (HH:mm) com validação e máscara

### 🎨 Melhorado

- Responsividade geral do calendário
- Performance de renderização do calendário

---

## [1.0.0] - 2024-12-01

### 🎉 Lançamento Inicial

#### Core Features

- Gestão completa de trades (Long/Short)
- Journal Multi-Timeframe com screenshots
- Sistema de Playbooks
- Calendário de trading
- Gráficos com Recharts e Lightweight Charts

#### Sistema de Mentoria

- Convites via email
- Visualização do calendário do aluno
- Sistema de reviews e correções
- Notificações em tempo real

#### Admin Panel

- Dashboard administrativo
- Gestão de usuários com RBAC
- Approval workflow
- Audit logs

#### Import/Export

- NinjaTrader CSV
- MetaTrader HTML
- Excel/CSV export
- Backup JSON

---

## Legenda

| Emoji | Tipo        |
| ----- | ----------- |
| ✨    | Adicionado  |
| 🐛    | Corrigido   |
| 🎨    | Melhorado   |
| 🔧    | Alterado    |
| 🗑️    | Removido    |
| 🔒    | Segurança   |
| ⚡    | Performance |

---

**Mantido por:** [@TavaresBugs](https://github.com/TavaresBugs)
