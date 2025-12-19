# 🧹 Auditoria de Limpeza de Documentação

> **Data:** 19 de Dezembro de 2025
> **Objetivo:** Mapear e classificar arquivos .md para KEEP/ARCHIVE/REMOVE

---

## 📊 Visão Geral

| Métrica                | Valor                     |
| ---------------------- | ------------------------- |
| **Total .md (docs/)**  | 20 + 1 (tech-debt/)       |
| **Total .md (raiz)**   | 4                         |
| **Scripts**            | 11                        |
| **Subpastas em docs/** | 2 (examples/, tech-debt/) |

---

## 🔍 Passo 1: Mapeamento de Referências

### Arquivos .md na Raiz

| Arquivo               | Referenciado em? | Útil?  | Comentário               |
| --------------------- | ---------------- | ------ | ------------------------ |
| `README.md`           | -                | ✅ Sim | Entrada do projeto       |
| `CHANGELOG.md`        | README.md        | ✅ Sim | Histórico de versões     |
| `CHANGELOG_v1.4.0.md` | Nenhum           | Dúvida | Versão antiga específica |
| `MANUAL_TECNICO.md`   | Nenhum           | ❌ Não | Duplicado/desatualizado  |

### Arquivos .md em docs/

| Arquivo                   | Referenciado em?    | Útil?  | Comentário                  |
| ------------------------- | ------------------- | ------ | --------------------------- |
| `PROJETO_CONTEXTO.md`     | README.md           | ✅ Sim | **Fonte de verdade**        |
| `ARCHITECTURE.md`         | README.md           | ✅ Sim | **Fonte de verdade**        |
| `DATABASE.md`             | README.md           | ✅ Sim | **Fonte de verdade**        |
| `DESIGN_SYSTEM.md`        | README.md           | ✅ Sim | **Fonte de verdade**        |
| `ROADMAP.md`              | README.md           | ✅ Sim | **Fonte de verdade**        |
| `TODO.md`                 | README.md           | ✅ Sim | **Fonte de verdade**        |
| `PENDING_FEATURES.md`     | README.md           | ✅ Sim | **Fonte de verdade**        |
| `GLOSSARIO.md`            | README.md           | ✅ Sim | **Novo, útil**              |
| `CONTRIBUTING.md`         | README.md           | ✅ Sim | **Novo, útil**              |
| `DEPLOYMENT_CHECKLIST.md` | Nenhum              | ✅ Sim | Útil para deploys           |
| `TESTING_GUIDE.md`        | Nenhum              | ✅ Sim | Referência de testes        |
| `TEST_PLAN.md`            | README.md           | ✅ Sim | Plano de testes             |
| `SECURITY_AUDIT.md`       | README.md           | ✅ Sim | Auditoria de segurança      |
| `LOGGER_GUIDE.md`         | FRONTEND_AUDIT.md   | Dúvida | Útil, mas pouco acessado    |
| `MIGRATION_GUIDE.md`      | FRONTEND_AUDIT.md   | Dúvida | Repository pattern intro    |
| `AUDIT_REPORT.md`         | Nenhum              | Dúvida | Backend audit histórico     |
| `FRONTEND_AUDIT.md`       | Nenhum              | ❌ Não | Plano já concluído (v0.9.0) |
| `UI_REFACTOR_ROADMAP.md`  | Nenhum              | ❌ Não | Plano já concluído (v0.9.0) |
| `TECH_STACK_NOTICE.md`    | Nenhum              | ❌ Não | Aviso antigo de stack       |
| `JULES_TASKS.md`          | Nenhum (foi README) | Dúvida | Histórico de tarefas Jules  |

### Subpastas

| Pasta/Arquivo                               | Referenciado? | Útil?  | Comentário                 |
| ------------------------------------------- | ------------- | ------ | -------------------------- |
| `docs/examples/`                            | Nenhum        | ❌ Não | Arquivos de teste antigos  |
| `docs/tech-debt/recap-link-fk-evolution.md` | Nenhum        | Dúvida | Valor histórico de decisão |

### Arquivos Diversos

| Arquivo                            | Útil?        | Comentário              |
| ---------------------------------- | ------------ | ----------------------- |
| `src/lib/supabase/SCHEMA_NOTES.md` | ❌ Não       | Notas antigas de schema |
| `supabase/README.md`               | ⚠️ Verificar | Instruções supabase     |

---

## 🏷️ Passo 2: Classificação KEEP / ARCHIVE / REMOVE

### ✅ KEEP (Manter)

| Arquivo                        | Justificativa          |
| ------------------------------ | ---------------------- |
| `README.md`                    | Entrada do projeto     |
| `CHANGELOG.md`                 | Histórico oficial      |
| `docs/PROJETO_CONTEXTO.md`     | Fonte de verdade #1    |
| `docs/ARCHITECTURE.md`         | Fonte de verdade #2    |
| `docs/DATABASE.md`             | Fonte de verdade #3    |
| `docs/DESIGN_SYSTEM.md`        | Fonte de verdade #4    |
| `docs/ROADMAP.md`              | Fonte de verdade #5    |
| `docs/TODO.md`                 | Fonte de verdade #6    |
| `docs/PENDING_FEATURES.md`     | Fonte de verdade #7    |
| `docs/GLOSSARIO.md`            | Referência útil        |
| `docs/CONTRIBUTING.md`         | Guia de contribuição   |
| `docs/DEPLOYMENT_CHECKLIST.md` | Essencial para deploys |
| `docs/TESTING_GUIDE.md`        | Referência de testes   |
| `docs/TEST_PLAN.md`            | Plano de testes        |
| `docs/SECURITY_AUDIT.md`       | Auditoria de segurança |

### 📦 ARCHIVE (Mover para `docs/_archive/`)

| Arquivo                                     | Justificativa                         |
| ------------------------------------------- | ------------------------------------- |
| `CHANGELOG_v1.4.0.md`                       | Versão específica, valor histórico    |
| `docs/AUDIT_REPORT.md`                      | Backend audit, decisões históricas    |
| `docs/JULES_TASKS.md`                       | Histórico de tarefas Jules            |
| `docs/LOGGER_GUIDE.md`                      | Útil mas pouco acessado               |
| `docs/MIGRATION_GUIDE.md`                   | Repository pattern, referência legada |
| `docs/tech-debt/recap-link-fk-evolution.md` | Decisão de arquitetura histórica      |

### 🗑️ REMOVE (Deletar)

| Arquivo                            | Justificativa               | Risco |
| ---------------------------------- | --------------------------- | ----- |
| `MANUAL_TECNICO.md`                | Duplicado, desatualizado    | Baixo |
| `docs/FRONTEND_AUDIT.md`           | Plano já concluído (v0.9.0) | Baixo |
| `docs/UI_REFACTOR_ROADMAP.md`      | Plano já concluído (v0.9.0) | Baixo |
| `docs/TECH_STACK_NOTICE.md`        | Aviso antigo, irrelevante   | Baixo |
| `docs/examples/` (pasta inteira)   | Arquivos de teste antigos   | Baixo |
| `src/lib/supabase/SCHEMA_NOTES.md` | Notas antigas substituídas  | Baixo |

---

## ⚠️ Passo 3: Análise de Riscos

### Arquivos Marcados para REMOVE

| Arquivo                  | Risco | Mitigação                                         |
| ------------------------ | ----- | ------------------------------------------------- |
| `MANUAL_TECNICO.md`      | Baixo | Verificar se não há referências em wikis externas |
| `FRONTEND_AUDIT.md`      | Baixo | Plano concluído, sem valor futuro                 |
| `UI_REFACTOR_ROADMAP.md` | Baixo | Plano concluído, sem valor futuro                 |
| `TECH_STACK_NOTICE.md`   | Baixo | Aviso de stack antigo                             |
| `docs/examples/`         | Baixo | Arquivos de teste, não são referenciados          |
| `SCHEMA_NOTES.md`        | Baixo | DATABASE.md é a fonte de verdade agora            |

**Nenhum arquivo marcado para REMOVE contém:**

- Decisões arquiteturais críticas (movidas para ARCHITECTURE.md)
- Informações únicas não documentadas em outro lugar
- Referências ativas de código ou scripts

---

## ✅ Passo 4: Checklist de Limpeza

```markdown
## Checklist de Limpeza de Documentação

### Preparação

- [ ] Criar pasta `docs/_archive/`
- [ ] Criar `docs/_archive/README.md` explicando que é material legado

### Arquivamento

- [ ] Mover `CHANGELOG_v1.4.0.md` → `docs/_archive/`
- [ ] Mover `docs/AUDIT_REPORT.md` → `docs/_archive/`
- [ ] Mover `docs/JULES_TASKS.md` → `docs/_archive/`
- [ ] Mover `docs/LOGGER_GUIDE.md` → `docs/_archive/`
- [ ] Mover `docs/MIGRATION_GUIDE.md` → `docs/_archive/`
- [ ] Mover `docs/tech-debt/` → `docs/_archive/tech-debt/`

### Remoção

- [ ] Deletar `MANUAL_TECNICO.md`
- [ ] Deletar `docs/FRONTEND_AUDIT.md`
- [ ] Deletar `docs/UI_REFACTOR_ROADMAP.md`
- [ ] Deletar `docs/TECH_STACK_NOTICE.md`
- [ ] Deletar `docs/examples/` (pasta inteira)
- [ ] Deletar `src/lib/supabase/SCHEMA_NOTES.md`

### Validação

- [ ] Rodar `grep -r "MANUAL_TECNICO" .` para verificar referências
- [ ] Rodar `grep -r "FRONTEND_AUDIT" .` para verificar referências
- [ ] Rodar `grep -r "UI_REFACTOR" .` para verificar referências
- [ ] Verificar que README.md não tem links quebrados

### Commit

- [ ] `git add -A`
- [ ] `git commit -m "docs: cleanup unused markdown files and create archive"`
```

---

## 📊 Passo 5: Métricas de Limpeza

| Métrica                  | Antes | Depois | Diferença |
| ------------------------ | ----- | ------ | --------- |
| **Arquivos .md docs/**   | 21    | 15     | -6 (29%)  |
| **Arquivos .md raiz**    | 4     | 2      | -2 (50%)  |
| **Total .md relevantes** | 25    | 17     | -8 (32%)  |

### Classificação Final

| Categoria   | Quantidade |
| ----------- | ---------- |
| **KEEP**    | 15         |
| **ARCHIVE** | 6          |
| **REMOVE**  | 6          |

### 📚 Fontes de Verdade Oficiais (após limpeza)

1. `docs/PROJETO_CONTEXTO.md` - Contexto geral
2. `docs/ARCHITECTURE.md` - Arquitetura
3. `docs/DATABASE.md` - Banco de dados
4. `docs/DESIGN_SYSTEM.md` - Componentes UI
5. `docs/ROADMAP.md` - Planejamento
6. `docs/TODO.md` - Tarefas
7. `docs/PENDING_FEATURES.md` - Backlog

---

## 🎯 Recomendação Final

**Executar limpeza imediatamente.** Todos os arquivos marcados para REMOVE são:

- Não referenciados
- Desatualizados ou substituídos
- Sem valor futuro

O arquivamento preserva valor histórico sem poluir a documentação ativa.

---

**Autor:** Auditoria Automatizada
**Data:** 19 de Dezembro de 2025
