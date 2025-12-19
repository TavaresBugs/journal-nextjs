# 📋 Curadoria de Documentação - Relatório de Análise

> **Data:** 19 de Dezembro de 2025
> **Objetivo:** Mapear, organizar e unificar a documentação do Trading Journal Pro

---

## 📊 1. Mapeamento de Arquivos Existentes

### Arquivos na Raiz

| Arquivo        | Tamanho | Status   | Ação                                      |
| -------------- | ------- | -------- | ----------------------------------------- |
| `README.md`    | 10.9KB  | ✅ Ativo | **MANTER** - Atualizar com nova estrutura |
| `CHANGELOG.md` | -       | ✅ Ativo | **MANTER**                                |

### Arquivos em `docs/`

| Arquivo                   | Tamanho | Conteúdo                | Ação                         |
| ------------------------- | ------- | ----------------------- | ---------------------------- |
| `PROJETO_CONTEXTO.md`     | 9.6KB   | Visão geral técnica     | **UNIFICAR** → overview.md   |
| `ARCHITECTURE.md`         | 11.5KB  | Arquitetura e diagramas | **MANTER** → architecture.md |
| `DATABASE.md`             | 11.5KB  | Schema e RLS            | **MANTER**                   |
| `DESIGN_SYSTEM.md`        | 7.7KB   | Componentes UI          | **MANTER**                   |
| `CONTRIBUTING.md`         | 5.2KB   | Guia de contribuição    | **MANTER**                   |
| `GLOSSARIO.md`            | 4.8KB   | Termos explicados       | **MANTER** → glossary.md     |
| `TODO.md`                 | 4.6KB   | Tarefas pendentes       | **MANTER**                   |
| `ROADMAP.md`              | 5.3KB   | Planejamento            | **MANTER**                   |
| `PENDING_FEATURES.md`     | 5.3KB   | Backlog                 | **UNIFICAR** → features.md   |
| `DEPLOYMENT_CHECKLIST.md` | 10KB    | Deploy                  | **MANTER**                   |

### Arquivos de Testes (DUPLICAÇÃO IDENTIFICADA)

| Arquivo                | Tamanho | Conteúdo             | Ação                      |
| ---------------------- | ------- | -------------------- | ------------------------- |
| `TESTING_GUIDE.md`     | 1.9KB   | Como escrever testes | **UNIFICAR** → testing.md |
| `TESTING_STRATEGY.md`  | 2.5KB   | Filosofia de testes  | **UNIFICAR** → testing.md |
| `TESTING_INVENTORY.md` | 4.7KB   | Inventário de testes | **UNIFICAR** → testing.md |
| `TEST_PLAN.md`         | 1.3KB   | Plano de testes      | **UNIFICAR** → testing.md |

### Arquivos de Segurança (DUPLICAÇÃO IDENTIFICADA)

| Arquivo               | Tamanho | Conteúdo        | Ação                       |
| --------------------- | ------- | --------------- | -------------------------- |
| `SECURITY_AUDIT.md`   | 2KB     | Auditoria OWASP | **UNIFICAR** → security.md |
| `SECURITY_LOGGING.md` | 1.1KB   | Logging seguro  | **UNIFICAR** → security.md |

### Arquivos de Auditoria (CONTEÚDO INTERNO)

| Arquivo                         | Tamanho | Conteúdo               | Ação                    |
| ------------------------------- | ------- | ---------------------- | ----------------------- |
| `AUDITORIA_TECNICA_COMPLETA.md` | 22.8KB  | Auditoria 10 dimensões | **MOVER** → \_archive/  |
| `CLEANUP_AUDIT.md`              | 9.9KB   | Guia de limpeza        | **REMOVER** (concluído) |

### READMEs de Pastas (RECÉM CRIADOS)

| Arquivo     | Localização             | Ação          |
| ----------- | ----------------------- | ------------- |
| `README.md` | `src/components/`       | **MANTER**    |
| `README.md` | `src/services/`         | **MANTER**    |
| `README.md` | `src/hooks/`            | **MANTER**    |
| `README.md` | `src/types/`            | **MANTER**    |
| `README.md` | `src/lib/repositories/` | **MANTER**    |
| `README.md` | `supabase/`             | **VERIFICAR** |

---

## 🏗️ 2. Estrutura Proposta

```
Trading Journal Pro/
├── README.md                    # Entrada principal (leigo-friendly)
├── CHANGELOG.md                 # Histórico de versões
│
├── docs/
│   ├── getting-started.md       # 🆕 Como rodar o projeto
│   ├── overview.md              # 🆕 Visão técnica geral (unifica PROJETO_CONTEXTO)
│   ├── architecture.md          # Arquitetura e decisões (ARCHITECTURE.md)
│   ├── features.md              # 🆕 Funcionalidades (unifica PENDING_FEATURES)
│   ├── testing.md               # 🆕 Estratégia completa (unifica 4 arquivos)
│   ├── security.md              # 🆕 Segurança (unifica 2 arquivos)
│   ├── performance.md           # 🆕 Otimizações e métricas
│   ├── glossary.md              # Termos explicados (GLOSSARIO)
│   ├── contributing.md          # Como contribuir (CONTRIBUTING)
│   ├── docs-guide.md            # 🆕 Guia para manter docs
│   │
│   ├── database.md              # Schema e RLS
│   ├── design-system.md         # Componentes UI
│   ├── roadmap.md               # Planejamento
│   ├── todo.md                  # Tarefas pendentes
│   ├── deployment.md            # Checklist de deploy
│   │
│   └── _archive/                # Material histórico
│       ├── README.md            # Explica que é material legado
│       ├── AUDITORIA_TECNICA_COMPLETA.md
│       └── CLEANUP_AUDIT.md
```

---

## 🔄 3. Ações de Unificação

### 3.1 Testes → `docs/testing.md`

**Arquivos fonte:**

- `TESTING_GUIDE.md` (Como escrever testes)
- `TESTING_STRATEGY.md` (Filosofia)
- `TESTING_INVENTORY.md` (Inventário)
- `TEST_PLAN.md` (Plano)

**Status de cada parte:**
| Conteúdo | Fonte | Ação |
|----------|-------|------|
| Comandos npm | TESTING_GUIDE | ✅ Manter |
| Scaffold de teste | TESTING_GUIDE | ✅ Manter |
| Filosofia testing | TESTING_STRATEGY | ✅ Manter com simplificação |
| Pirâmide de testes | TESTING_STRATEGY | ✅ Manter |
| Inventário de arquivos | TESTING_INVENTORY | ⚠️ Atualizar métricas |
| Metas de coverage | TEST_PLAN | ✅ Manter atualizado |

### 3.2 Segurança → `docs/security.md`

**Arquivos fonte:**

- `SECURITY_AUDIT.md` (Auditoria OWASP)
- `SECURITY_LOGGING.md` (Logging seguro)

**Status:**
| Conteúdo | Fonte | Ação |
|----------|-------|------|
| Headers de segurança | SECURITY_AUDIT | ✅ Manter |
| Checklist OWASP | SECURITY_AUDIT | ✅ Manter |
| Helpers de logging | SECURITY_LOGGING | ✅ Manter |
| Chaves bloqueadas | SECURITY_LOGGING | ✅ Manter |

### 3.3 Overview → `docs/overview.md`

**Arquivos fonte:**

- `PROJETO_CONTEXTO.md`

**Status:**
| Conteúdo | Ação |
|----------|------|
| Resumo executivo | ✅ Simplificar para leigos |
| Stack tecnológica | ✅ Manter com explicações |
| Estrutura de pastas | ⚠️ Atualizar (usar READMEs de pasta) |
| Métricas | ⚠️ Atualizar para valores atuais |
| FAQ | ✅ Manter |

---

## 📝 4. Padrão Visual

### Heading Hierarchy

```markdown
# 📊 Título Principal (só 1 por arquivo)

## 🎯 Seção Principal

### Subseção

#### Detalhe (raro)
```

### Emojis por Categoria

| Categoria       | Emoji |
| --------------- | ----- |
| Visão geral     | 📋    |
| Arquitetura     | 🏗️    |
| Segurança       | 🔒    |
| Performance     | ⚡    |
| Testes          | 🧪    |
| Features        | ✨    |
| Boas práticas   | ✅    |
| Avisos          | ⚠️    |
| Erros/Problemas | ❌    |

### Callouts Padrão

```markdown
> **💡 Dica:** Use isso quando...

> **⚠️ Atenção:** Cuidado com...

> **📌 Nota:** Informação adicional...

> **🚀 Boas práticas:** Recomendamos...
```

### Tabelas

Usar para comparações, métricas, e listagens estruturadas.

### Código

- Sempre com sintaxe highlight
- Comentários explicativos
- Exemplos curtos e focados

---

## 📊 5. Métricas de Limpeza

| Métrica                         | Antes | Depois | Resultado |
| ------------------------------- | ----- | ------ | --------- |
| Arquivos em `/docs`             | 18    | 15     | -3 (17%)  |
| Arquivos duplicados de teste    | 4     | 1      | -3 (75%)  |
| Arquivos duplicados de security | 2     | 1      | -1 (50%)  |
| Total de arquivos md            | ~25   | ~17    | -8 (32%)  |

---

## ✅ 6. Checklist de Execução

### Fase 1: Unificação

- [ ] Criar `docs/testing.md` (unificar 4 arquivos)
- [ ] Criar `docs/security.md` (unificar 2 arquivos)
- [ ] Criar `docs/getting-started.md`
- [ ] Criar `docs/overview.md` (simplificar PROJETO_CONTEXTO)
- [ ] Criar `docs/features.md` (expandir PENDING_FEATURES)
- [ ] Criar `docs/performance.md`
- [ ] Criar `docs/docs-guide.md` (guia de contribuição de docs)

### Fase 2: Arquivamento

- [ ] Criar `docs/_archive/`
- [ ] Mover `AUDITORIA_TECNICA_COMPLETA.md`
- [ ] Mover arquivos antigos

### Fase 3: Remoção

- [ ] Remover `TESTING_GUIDE.md` (após unificação)
- [ ] Remover `TESTING_STRATEGY.md` (após unificação)
- [ ] Remover `TESTING_INVENTORY.md` (após unificação)
- [ ] Remover `TEST_PLAN.md` (após unificação)
- [ ] Remover `SECURITY_AUDIT.md` (após unificação)
- [ ] Remover `SECURITY_LOGGING.md` (após unificação)
- [ ] Remover `CLEANUP_AUDIT.md` (concluído)

### Fase 4: Atualização

- [ ] Atualizar README.md principal
- [ ] Atualizar links entre documentos
- [ ] Verificar links quebrados

---

**Próximo passo:** Criar os documentos unificados seguindo esta análise.
