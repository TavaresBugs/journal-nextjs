# 📂 Supabase Database Setup

## Estrutura

```
supabase/
└── migrations/
    ├── 001_schema.sql        # Todas as tabelas e indexes
    ├── 002_functions.sql     # Funções, triggers e views
    └── 003_rls_policies.sql  # Row Level Security policies
```

## 🚀 Ordem de Execução

Execute no SQL Editor do Supabase na ordem:

```
1. 001_schema.sql       → Cria 19 tabelas + indexes + storage bucket
2. 002_functions.sql    → Cria funções, triggers e leaderboard view
3. 003_rls_policies.sql → Configura todas as políticas RLS
```

## 📋 Conteúdo por Arquivo

### 001_schema.sql

| Categoria     | Tabelas                                                                          |
| ------------- | -------------------------------------------------------------------------------- |
| **Core**      | accounts, trades, journal_entries, daily_routines, settings                      |
| **Journal**   | journal_entry_trades, journal_images                                             |
| **Admin**     | users_extended, audit_logs, user_settings                                        |
| **Mentor**    | mentor_invites, trade_comments, mentor_reviews, mentor_account_permissions       |
| **Community** | playbooks, shared_playbooks, playbook_stars, shared_journals, leaderboard_opt_in |

### 002_functions.sql

- `auth_uid()` - Wrapper otimizado para auth.uid()
- `is_admin()` - Verifica se usuário é admin
- `is_mentor_of()` - Verifica relação mentor/aluno
- `can_mentor_access_account()` - Permissão por carteira
- `calculate_market_session()` - Trigger para sessão de trading
- `handle_new_user()` - Trigger para novos usuários
- `toggle_playbook_star()` - Dar/remover star em playbooks
- `get_user_journal_streak()` - Calcula streak de dias
- `accept_mentor_invite()` - Aceitar convite de mentoria
- `leaderboard_view` - View do ranking

### 003_rls_policies.sql

- Políticas RLS para todas as 19 tabelas
- Políticas de storage para bucket de imagens
- Usa `auth_uid()` para melhor performance
- Consolidado (sem redundâncias)

## ⚠️ Notas Importantes

1. **Idempotente**: Todos os arquivos usam `IF NOT EXISTS` e `DROP POLICY IF EXISTS`
2. **Ordem**: Respeite a ordem 001 → 002 → 003
3. **Performance**: Políticas usam `public.auth_uid()` com cache

## 📅 Última Atualização

2024-12-08 - Consolidação de 32 arquivos em 3
