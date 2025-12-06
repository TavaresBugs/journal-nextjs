# 🗺️ Roadmap - Trading Journal Pro

> Última atualização: Dezembro 2024
> Baseado em análise comparativa com Tradezilla, Tradervue, Edgewonk e Trademetria

---

## 📊 Análise Competitiva

### Principais Concorrentes

| Plataforma      | Preço      | Destaques                                                |
| --------------- | ---------- | -------------------------------------------------------- |
| **Tradezilla**  | $29-49/mês | Trade Replay, Zella Score, 50+ relatórios, Backtesting   |
| **Tradervue**   | $29-49/mês | 80+ brokers, Community sharing, Exit Analysis            |
| **Edgewonk**    | $169/ano   | Monte Carlo, Psicologia trading, Customização extrema    |
| **Trademetria** | $0-29/mês  | 140+ brokers, AI Coach, PnL Simulator, Beginner-friendly |

### Features que NÃO temos (Gap Analysis)

| Feature             | Tradezilla | Tradervue | Edgewonk | Trademetria | Prioridade |
| ------------------- | ---------- | --------- | -------- | ----------- | ---------- |
| Trade Replay        | ✅         | ❌        | ❌       | ❌          | 🔴 Alta    |
| Auto-import Brokers | ✅ 20+     | ✅ 80+    | ✅       | ✅ 140+     | 🔴 Alta    |
| Backtesting         | ✅         | ❌        | ❌       | ✅          | 🟡 Média   |
| AI/Coach            | ❌         | ❌        | ❌       | ✅          | 🔴 Alta    |
| Mentor Mode         | ✅         | ✅        | ❌       | ❌          | 🟡 Média   |
| Monte Carlo         | ❌         | ❌        | ✅       | ❌          | 🟢 Baixa   |
| Community           | ❌         | ✅        | ❌       | ❌          | 🟢 Baixa   |
| Exit Analysis       | ❌         | ✅        | ✅       | ❌          | 🟡 Média   |

---

## 🎯 Roadmap por Fase

### Fase 1: Fundação & Segurança (Q1 2025)

**Objetivo:** Preparar a plataforma para múltiplos usuários com segurança robusta.

#### 🔐 Painel de Administrador

| Item                | Descrição                                          | Status       |
| ------------------- | -------------------------------------------------- | ------------ |
| Dashboard Admin     | Visão geral de usuários, métricas do sistema, logs | ✅ Concluído |
| Gestão de Usuários  | CRUD de usuários, ativação/desativação             | ✅ Concluído |
| Aprovação de Contas | Fluxo de whitelist para novos registros            | ✅ Concluído |
| Roles & Permissões  | Admin, User, Guest com RBAC                        | ✅ Concluído |
| Audit Logs          | Registro de ações críticas                         | ✅ Concluído |

##### Tabelas Supabase necessárias: ✅ Implementadas

> Ver `supabase/migrations/004_admin_system.sql` para detalhes completos.

```sql
-- users_extended (complementa auth.users) ✅
CREATE TABLE users_extended (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending', -- pending, approved, suspended, banned
  role TEXT DEFAULT 'user',     -- admin, user, guest
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- audit_logs ✅
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,          -- login, create_trade, delete_account, etc.
  resource_type TEXT,            -- trade, account, journal_entry
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 🛡️ Segurança

| Item                | Descrição                      | Status       |
| ------------------- | ------------------------------ | ------------ |
| Session Management  | Timeout, refresh automático    | ✅ Concluído |
| Rate Limiting       | Proteção contra brute force    | ✅ Concluído |
| Password Policies   | Força mínima, validação visual | ✅ Concluído |
| WAF/Headers         | CSP, CORS, segurança HTTP      | ✅ Concluído |
| ~~MFA (2FA)~~       | ~~Removido do escopo~~         | —            |
| ~~IP Whitelisting~~ | ~~Removido do escopo~~         | —            |

---

### Fase 2: Features Premium (Q2 2025)

**Objetivo:** Adicionar features que diferenciam dos concorrentes.

#### 🔄 Trade Replay

Reviva trades históricos com controle de velocidade:

- [ ] Player de candles com controle de velocidade (1x, 2x, 5x, 10x)
- [ ] Marcação de Entry/Exit/SL/TP no gráfico
- [ ] Anotações durante o replay
- [ ] Integração com Lightweight Charts

#### 📥 Auto-Import de Brokers

| Broker              | Método  | Prioridade |
| ------------------- | ------- | ---------- |
| MetaTrader 4/5      | API/CSV | 🔴 Alta    |
| TradingView         | Webhook | 🔴 Alta    |
| Binance             | API     | 🟡 Média   |
| Interactive Brokers | API     | 🟡 Média   |
| XP/Rico/Clear       | CSV     | 🟡 Média   |

#### 🤖 AI Coach

- [ ] Análise de padrões em trades vencedores
- [ ] Detecção de vieses comportamentais
- [ ] Alertas proativos de risco
- [ ] Sugestões personalizadas de melhoria
- [ ] Integração com LLM (OpenAI/Claude)

#### 🧮 Calculadora de Impostos Brasil

Cálculo automático de IR para operações de trading:

- [ ] Day Trade: 20% sobre lucro líquido (sem isenção)
- [ ] Swing Trade: 15% sobre lucro (isenção até R$ 20k/mês em ações)
- [ ] Cálculo de prejuízo acumulado para compensação
- [ ] DARF mensal com código de barras
- [ ] Relatório anual para declaração IRPF
- [ ] Suporte: Ações, FIIs, ETFs, BDRs, Opções, Futuros, Crypto
- [ ] Integração com B3 (CEI/Área do Investidor)

---

### Fase 3: Análises Avançadas (Q3 2025)

**Objetivo:** Analytics de nível institucional.

#### 📈 Métricas Avançadas

| Métrica                | Descrição                             |
| ---------------------- | ------------------------------------- |
| Exit Analysis          | Impacto de diferentes pontos de saída |
| MFE/MAE Analysis       | Maximum Favorable/Adverse Excursion   |
| Monte Carlo Simulation | Projeção de cenários                  |
| Time Analysis          | Performance por hora/dia/sessão       |
| Correlation Matrix     | Correlação entre ativos               |

#### 🔙 Backtesting

- [ ] Teste de estratégias em dados históricos
- [ ] Comparação de playbooks
- [ ] Otimização de parâmetros
- [ ] Relatório de performance simulada

---

### Fase 4: Social & Colaboração (Q4 2025) 🚧 EM PROGRESSO

**Objetivo:** Features de comunidade e mentoria completa.

#### 👥 Mentor Mode

##### Sistema de Convites ✅

- [x] Mentor pode convidar mentorados por email
- [x] Mentorado recebe notificação de convite
- [x] Aceitar/Rejeitar convites
- [x] Tabela de convites enviados/recebidos
- [x] Cancelar/Revogar convites

##### Visualização do Mentor 📋 PRÓXIMO

| Feature                   | Descrição                                      | Status       |
| ------------------------- | ---------------------------------------------- | ------------ |
| **StudentCalendarModal**  | Mentor visualiza calendário completo do aluno  | ✅ Concluído |
| **Seletor de Aluno**      | Dropdown para alternar entre mentorados        | 🔴 Pendente  |
| **Trade Detail View**     | Mentor pode clicar em trades para ver detalhes | 🔴 Pendente  |
| **Permissões Granulares** | Níveis: view-only, can-comment, full-analysis  | 🟡 Parcial   |

##### Sistema de Correções/Comentários 📋 PRÓXIMO

| Feature              | Descrição                           | Status      |
| -------------------- | ----------------------------------- | ----------- |
| **TradeReviewModal** | Modal para mentor escrever correção | 🔴 Pendente |
| **CommentThread**    | Thread de comentários por trade     | 🔴 Pendente |
| **Tipos de Review**  | Correção, Sugestão, Comentário      | 🔴 Pendente |
| **Rating por Trade** | Opcional: 1-5 estrelas              | 🟢 Futuro   |

##### Visualização do Aluno 📋 PRÓXIMO

| Feature                    | Descrição                          | Status      |
| -------------------------- | ---------------------------------- | ----------- |
| **Tab "Correções"**        | Nova aba no NotificationsModal     | 🔴 Pendente |
| **Badge em Trades**        | Indicador de trades com correções  | 🔴 Pendente |
| **Thread no Trade Detail** | Ver correções no contexto do trade | 🔴 Pendente |
| **Marcar como Lido**       | Sistema de read/unread             | 🔴 Pendente |

##### Tabelas Supabase necessárias:

```sql
-- mentor_reviews (correções e comentários)
CREATE TABLE mentor_reviews (
    id UUID PRIMARY KEY,
    mentor_id UUID REFERENCES auth.users(id),
    mentee_id UUID REFERENCES auth.users(id),
    trade_id UUID REFERENCES trades(id),
    review_type TEXT,  -- 'correction' | 'comment' | 'suggestion'
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ
);
```

#### 🌐 Comunidade

- [x] Compartilhamento de playbooks
- [x] Leaderboard (opt-in)
- [x] Cards com estatísticas do autor
- [ ] Filtros de playbooks (por ativo, win rate, etc)
- ~~[ ] Perfis públicos opcionais~~ - Removido
- ~~[ ] Fórum de discussão~~ - Removido

---

## 🔒 Checklist de Segurança

### Autenticação

- ~~[ ] MFA com SMS (backup)~~ - Removido do escopo
- [x] Políticas de senha forte
- [x] Bloqueio após tentativas falhas (Rate Limiting)
- [ ] Recuperação de conta segura

### Autorização

- [x] RBAC implementado
- [x] Princípio do menor privilégio
- [ ] Revisão periódica de acessos
- [x] Segregação admin/user

### Dados

- [ ] Encriptação em repouso (Supabase)
- [ ] Encriptação em trânsito (TLS 1.3)
- [ ] Backups encriptados
- [ ] Política de retenção

### Aplicação

- [x] Headers de segurança (CSP, HSTS)
- [x] Proteção CSRF (Next.js built-in)
- [x] Sanitização de inputs
- [x] Rate limiting em APIs
- [x] Logs de auditoria

### Compliance

- [x] LGPD (Brasil) - Página de privacidade
- [x] Termos de uso
- [x] Política de privacidade
- [x] Consentimento de cookies

---

## 📅 Timeline Estimado

```
Q1 2025 ─────────────────────────────────────────
│
├─ Jan: Painel Admin (Dashboard, User Management)
├─ Fev: Aprovação de Contas, Roles, Audit Logs
└─ Mar: MFA, Session Management, Rate Limiting

Q2 2025 ─────────────────────────────────────────
│
├─ Abr: Trade Replay (MVP)
├─ Mai: Auto-Import (MT4/MT5, TradingView)
└─ Jun: AI Coach (Análise básica)

Q3 2025 ─────────────────────────────────────────
│
├─ Jul: Exit Analysis, MFE/MAE
├─ Ago: Monte Carlo, Time Analysis
└─ Set: Backtesting (MVP)

Q4 2025 ─────────────────────────────────────────
│
├─ Out: Mentor Mode
├─ Nov: Perfis públicos, Sharing
└─ Dez: Comunidade, Leaderboard
```

---

## 💡 Ideias Futuras (Backlog)

- [ ] App Mobile (React Native/Expo)
- [ ] Extensão Chrome para logging rápido
- [ ] Integração com TradingView widgets
- [ ] Notificações push/email
- [ ] Webhooks para integrações
- [ ] API pública para desenvolvedores
- [ ] White-label para prop firms
- [ ] Relatórios PDF automatizados
- [ ] Dark/Light mode toggle
- [ ] Internacionalização (EN, ES)

---

## ✅ Já Implementadas (Bônus)

Estas funcionalidades foram desenvolvidas além do roadmap original:

| Feature                   | Status       | Arquivo/Local                                         |
| ------------------------- | ------------ | ----------------------------------------------------- |
| Google OAuth              | ✅ Concluído | `src/lib/auth.ts`, `useAuth` hook                     |
| GitHub OAuth              | ✅ Concluído | `src/lib/auth.ts`, `useAuth` hook                     |
| Sistema de Playbooks      | ✅ Concluído | `src/components/playbook/*`                           |
| Gráficos Recharts         | ✅ Concluído | `src/components/charts/recharts/*`                    |
| Lightweight Charts        | ✅ Concluído | `src/components/charts/lightweight/*`                 |
| Compartilhamento Journals | ✅ Concluído | `src/app/share/*`, migration 003                      |
| Dark Mode                 | ✅ Concluído | CSS com tema Zorin                                    |
| Page de Pendentes         | ✅ Concluído | `src/app/pending/page.tsx`                            |
| Middleware de Auth        | ✅ Concluído | `src/middleware.ts`                                   |
| **Mentor Invites**        | ✅ Concluído | `src/services/mentor/inviteService.ts`                |
| **Painel do Mentor**      | ✅ Concluído | `src/app/mentor/page.tsx`                             |
| **StudentCalendarModal**  | ✅ Concluído | `src/components/mentor/StudentCalendarModal.tsx`      |
| **NotificationBell**      | ✅ Concluído | `src/components/notifications/NotificationBell.tsx`   |
| **NotificationsModal**    | ✅ Concluído | `src/components/notifications/NotificationsModal.tsx` |
| **Comunidade/Playbooks**  | ✅ Concluído | `src/app/comunidade/page.tsx`                         |
| **Leaderboard**           | ✅ Concluído | `src/services/community/leaderboardService.ts`        |
| **Validação Zod**         | ✅ Concluído | `src/schemas/*`                                       |
| **Testes Unitários**      | ✅ Concluído | `src/**/*.test.ts`, `vitest.config.mts`               |
| **Security Audit**        | ✅ Concluído | `docs/SECURITY_AUDIT.md`                              |
| **Export Backup Local**   | ✅ Concluído | `src/services/exportService.ts`                       |

---

## 📝 Notas

- Prioridades podem ser ajustadas conforme feedback
- Algumas features dependem de APIs externas
- Segurança sempre tem prioridade sobre features
- Testes de penetração recomendados antes de produção

---

**Mantido por:** [@TavaresBugs](https://github.com/TavaresBugs)
