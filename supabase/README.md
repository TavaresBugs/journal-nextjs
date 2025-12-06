# 📂 Supabase SQL Organization

## Estrutura

```
supabase/
└── sql/                 # 📚 Scripts SQL (organizado por categoria)
    ├── core/            # Schema base (accounts, trades, journal, routines, settings)
    │   ├── 000_init_schema.sql
    │   └── 001_storage_setup.sql
    │
    ├── features/        # Funcionalidades
    │   ├── 002_playbooks.sql
    │   ├── 003_shared_journals.sql
    │   └── 010_global_playbooks.sql
    │
    ├── admin/           # Sistema de admin
    │   └── 004_admin_system.sql
    │
    ├── mentor/          # Sistema mentor/aluno
    │   ├── 005_mentor_mode.sql
    │   ├── 012_add_mentor_role.sql
    │   └── 016_mentor_reviews.sql
    │
    ├── community/       # Comunidade (leaderboard, shared playbooks)
    │   ├── 006_community.sql
    │   ├── 009_community_stats.sql
    │   └── 011_fix_streak_calculation.sql
    │
    ├── costs/           # Commission/swap em trades
    │   └── 017_add_trade_costs.sql
    │
    └── fixes/           # Correções de RLS e bugs
        ├── 007_fix_mentor_schema.sql
        ├── 008_fix_rls_permissions.sql
        ├── 013_fix_mentee_rls.sql
        ├── 014_fix_rls_using_jwt.sql
        ├── 015_allow_public_user_names.sql
        └── 018_fix_playbooks_cascade.sql
```

## 🚀 Ordem de Execução (Instalação Limpa)

Execute na ordem numérica:

1. `sql/core/000_init_schema.sql`
2. `sql/core/001_storage_setup.sql`
3. `sql/features/002_playbooks.sql`
4. `sql/features/003_shared_journals.sql`
5. `sql/admin/004_admin_system.sql`
6. `sql/mentor/005_mentor_mode.sql`
7. `sql/community/006_community.sql`
8. `sql/fixes/007_fix_mentor_schema.sql`
9. `sql/fixes/008_fix_rls_permissions.sql`
10. `sql/community/009_community_stats.sql`
11. `sql/features/010_global_playbooks.sql`
12. `sql/community/011_fix_streak_calculation.sql`
13. `sql/mentor/012_add_mentor_role.sql`
14. `sql/fixes/013_fix_mentee_rls.sql`
15. `sql/fixes/014_fix_rls_using_jwt.sql`
16. `sql/fixes/015_allow_public_user_names.sql`
17. `sql/mentor/016_mentor_reviews.sql`
18. `sql/costs/017_add_trade_costs.sql`
19. `sql/fixes/018_fix_playbooks_cascade.sql`

## 📋 Descrição por Categoria

| Categoria     | Descrição                                                                |
| ------------- | ------------------------------------------------------------------------ |
| **core**      | Schema base: accounts, trades, journal_entries, daily_routines, settings |
| **features**  | Playbooks, journals compartilháveis                                      |
| **admin**     | Painel admin, users_extended, audit logs                                 |
| **mentor**    | Sistema mentor/aluno, convites, reviews                                  |
| **community** | Playbooks públicos, leaderboard, estatísticas                            |
| **costs**     | Commission e swap em trades                                              |
| **fixes**     | Correções de RLS, esquema, e bugs                                        |
