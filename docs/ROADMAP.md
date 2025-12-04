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

| Item                | Descrição                                          | Prioridade |
| ------------------- | -------------------------------------------------- | ---------- |
| Dashboard Admin     | Visão geral de usuários, métricas do sistema, logs | 🔴 Alta    |
| Gestão de Usuários  | CRUD de usuários, ativação/desativação             | 🔴 Alta    |
| Aprovação de Contas | Fluxo de whitelist para novos registros            | 🔴 Alta    |
| Roles & Permissões  | Admin, User, Guest com RBAC                        | 🔴 Alta    |
| Audit Logs          | Registro de ações críticas                         | 🔴 Alta    |

##### Tabelas Supabase necessárias:

```sql
-- users_extended (complementa auth.users)
CREATE TABLE users_extended (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending', -- pending, approved, suspended, banned
  role TEXT DEFAULT 'user',     -- admin, user, guest
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- audit_logs
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

| Item               | Descrição                         | Status       |
| ------------------ | --------------------------------- | ------------ |
| MFA (2FA)          | Autenticação multi-fator via TOTP | ⬜ Planejado |
| Session Management | Timeout, revogação de sessões     | ⬜ Planejado |
| Rate Limiting      | Proteção contra brute force       | ⬜ Planejado |
| IP Whitelisting    | Opcional para admin               | ⬜ Planejado |
| Password Policies  | Força mínima, expiração           | ⬜ Planejado |
| WAF/Headers        | CSP, CORS, segurança HTTP         | ⬜ Planejado |

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

### Fase 4: Social & Colaboração (Q4 2025)

**Objetivo:** Features de comunidade e mentoria.

#### 👥 Mentor Mode

- [ ] Convidar mentores para visualizar journals
- [ ] Comentários e feedback em trades
- [ ] Permissões granulares (view-only, can comment)
- [ ] Dashboard do mentor com visão consolidada

#### 🌐 Comunidade

- [ ] Perfis públicos opcionais
- [ ] Compartilhamento de playbooks
- [ ] Leaderboard (opt-in)
- [ ] Fórum de discussão

---

## 🔒 Checklist de Segurança

### Autenticação

- [ ] MFA com SMS (backup)
- [ ] Políticas de senha forte
- [ ] Bloqueio após tentativas falhas
- [ ] Recuperação de conta segura

### Autorização

- [ ] RBAC implementado
- [ ] Princípio do menor privilégio
- [ ] Revisão periódica de acessos
- [ ] Segregação admin/user

### Dados

- [ ] Encriptação em repouso (Supabase)
- [ ] Encriptação em trânsito (TLS 1.3)
- [ ] Backups encriptados
- [ ] Política de retenção

### Aplicação

- [ ] Headers de segurança (CSP, HSTS)
- [ ] Proteção CSRF
- [ ] Sanitização de inputs
- [ ] Rate limiting em APIs
- [ ] Logs de auditoria

### Compliance

- [ ] LGPD (Brasil)
- [ ] Termos de uso
- [ ] Política de privacidade
- [ ] Consentimento de cookies

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

## 📝 Notas

- Prioridades podem ser ajustadas conforme feedback
- Algumas features dependem de APIs externas
- Segurança sempre tem prioridade sobre features
- Testes de penetração recomendados antes de produção

---

**Mantido por:** [@TavaresBugs](https://github.com/TavaresBugs)
