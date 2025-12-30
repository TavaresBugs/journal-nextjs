# 📝 Guia de Documentação

> **Objetivo:** Manter a documentação organizada, atualizada e consistente

Este guia ensina como criar, organizar e atualizar documentação no Trading Journal Pro.

---

## 📋 Índice

- [Estrutura de Documentação](#-estrutura-de-documentação)
- [Padrão Visual](#-padrão-visual)
- [Como Criar Novo Documento](#-como-criar-novo-documento)
- [Como Atualizar Documentos](#-como-atualizar-documentos)
- [Evitando Duplicação](#-evitando-duplicação)
- [Referenciando Documentos](#-referenciando-documentos)

---

## 📁 Estrutura de Documentação

### Documentos Principais (`docs/`)

| Arquivo              | Propósito               | Público         |
| -------------------- | ----------------------- | --------------- |
| `getting-started.md` | Primeiro contato, setup | Iniciantes      |
| `overview.md`        | Visão técnica geral     | Todos           |
| `architecture.md`    | Arquitetura e decisões  | Intermediário+  |
| `features.md`        | Funcionalidades do app  | Todos           |
| `testing.md`         | Testes e qualidade      | Desenvolvedores |
| `security.md`        | Práticas de segurança   | Desenvolvedores |
| `performance.md`     | Otimizações             | Desenvolvedores |
| `glossary.md`        | Termos técnicos         | Todos           |
| `contributing.md`    | Como contribuir         | Contribuidores  |
| `database.md`        | Schema e RLS            | Backend         |
| `design-system.md`   | Componentes UI          | Frontend        |
| `roadmap.md`         | Planejamento            | Gestão          |
| `todo.md`            | Tarefas pendentes       | Equipe          |
| `deployment.md`      | Deploy checklist        | DevOps          |

### READMEs de Pasta

Cada pasta complexa tem seu próprio `README.md`:

| Pasta                   | README | Propósito                   |
| ----------------------- | ------ | --------------------------- |
| `src/components/`       | ✅     | Design System e componentes |
| `src/services/`         | ✅     | Lógica de negócio           |
| `src/hooks/`            | ✅     | Custom hooks                |
| `src/types/`            | ✅     | Tipos TypeScript            |
| `src/lib/repositories/` | ✅     | Repository Pattern          |

### Arquivo Morto (`docs/_archive/`)

Documentos históricos que não são mais ativos, mas têm valor de referência.

---

## 🎨 Padrão Visual

### Hierarquia de Títulos

```markdown
# 📊 Título Principal

(Apenas 1 por arquivo)

## 🎯 Seção Principal

(Divisões maiores)

### Subseção

(Detalhes)

#### Detalhe Específico

(Raramente usado)
```

### Emojis por Categoria

| Categoria     | Emoji | Uso                |
| ------------- | ----- | ------------------ |
| Visão geral   | 📋    | Índices, resumos   |
| Arquitetura   | 🏗️    | Estrutura, design  |
| Segurança     | 🔒    | Auth, RLS          |
| Performance   | ⚡    | Otimizações        |
| Testes        | 🧪    | Testing            |
| Features      | ✨    | Funcionalidades    |
| Boas práticas | ✅    | Recomendações      |
| Avisos        | ⚠️    | Cuidados           |
| Erros         | ❌    | Problemas          |
| Dicas         | 💡    | Sugestões          |
| Notas         | 📌    | Informações extras |

### Callouts

Use blockquotes com emojis para destacar informações:

```markdown
> **💡 Dica:** Use isso quando você quiser simplificar...

> **⚠️ Atenção:** Cuidado ao modificar este arquivo porque...

> **📌 Nota:** Esta funcionalidade requer configuração adicional.

> **✅ Boas práticas:** Recomendamos sempre validar inputs...
```

### Tabelas

Use para comparações, listas estruturadas e métricas:

```markdown
| Métrica  | Antes | Depois |
| -------- | ----- | ------ |
| Testes   | 400   | 671    |
| Coverage | 60%   | 72%    |
```

### Código

- **Sempre** com sintaxe highlight
- Comentários explicativos quando necessário
- Exemplos curtos e focados

```typescript
// ✅ Bom - exemplo claro
const result = calculatePnL(entry, exit);

// ❌ Ruim - muito longo
const result = someVeryLongFunctionName(param1, param2, param3, param4);
```

---

## ✍️ Como Criar Novo Documento

### 1. Verifique se Já Existe

Antes de criar, procure se já existe documentação sobre o tema:

```bash
# Buscar por palavra-chave
grep -r "seu-tema" docs/
grep -r "seu-tema" src/**/README.md
```

### 2. Escolha o Local Correto

| Se é sobre...            | Coloque em...                       |
| ------------------------ | ----------------------------------- |
| Feature geral do app     | `docs/features.md` (adicione seção) |
| Componente específico    | `src/components/README.md`          |
| Novo serviço             | `src/services/README.md`            |
| Novo hook                | `src/hooks/README.md`               |
| Tipo/Interface           | `src/types/README.md`               |
| Processo (deploy, teste) | Novo arquivo em `docs/`             |

### 3. Use o Template

```markdown
# 📊 Título do Documento

> **Última atualização:** [Data]
> **Status:** [Ativo/Rascunho]

Descrição breve do que este documento cobre (2-3 linhas).

---

## 📋 Índice

- [Seção 1](#seção-1)
- [Seção 2](#seção-2)

---

## 🎯 Seção 1

Conteúdo...

---

## 🔧 Seção 2

Conteúdo...

---

## 🔗 Referências

- [Documento Relacionado](./outro-doc.md)
```

### 4. Adicione ao Índice

Se criou novo arquivo em `docs/`, atualize:

1. `README.md` principal (seção de Documentação)
2. Links em documentos relacionados

---

## 🔄 Como Atualizar Documentos

### Quando Atualizar

- ✅ Após adicionar/remover funcionalidade
- ✅ Após mudar arquitetura
- ✅ Após refatoração significativa
- ✅ Quando encontrar informação desatualizada
- ✅ Após resolver issue relacionada

### Checklist de Atualização

1. [ ] Alteração está correta tecnicamente?
2. [ ] Links estão funcionando?
3. [ ] Exemplos de código estão compilando?
4. [ ] Data de "última atualização" está correta?
5. [ ] Métricas/números estão atualizados?

### Atualizando Métricas

Quando atualizar números (testes, coverage, etc.), busque a fonte de verdade:

```bash
# Contagem de testes
npm test 2>&1 | grep "passed"

# Coverage
npm run test:coverage

# Linhas de código
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l
```

---

## 🚫 Evitando Duplicação

### Regra de Ouro

> **Cada informação deve estar em UM lugar apenas.**

Se você precisa referenciar algo que já está documentado, **faça um link**, não copie.

### Identificando Duplicação

| Sinal                                  | Ação                                              |
| -------------------------------------- | ------------------------------------------------- |
| Mesma explicação em 2+ lugares         | Consolidar em 1 lugar, linkar nos outros          |
| Arquivo antigo e novo sobre mesmo tema | Unificar no mais recente                          |
| README de pasta repete doc principal   | README foca em "como usar", doc foca em "o que é" |

### Estratégia de Consolidação

```markdown
## Testes

Para informações completas sobre testes, veja [testing.md](./testing.md).

---

❌ Evitar: Copiar todo o conteúdo de testing.md aqui
```

---

## 🔗 Referenciando Documentos

### Links Relativos

Use sempre caminhos relativos:

```markdown
<!-- ✅ Correto -->

[Arquitetura](./architecture.md)
[Componentes](../src/components/README.md)

<!-- ❌ Errado -->

[Arquitetura](https://github.com/.../docs/architecture.md)
[Arquitetura](/docs/architecture.md)
```

### Seções Internas

Link para seções específicas:

```markdown
Veja a seção de [Rate Limiting](./security.md#-rate-limiting).
```

### Tabela de Links

Para documentos com muitas referências, use uma tabela no final:

```markdown
## 🔗 Referências

| Documento                            | Descrição              |
| ------------------------------------ | ---------------------- |
| [overview.md](./overview.md)         | Visão geral do projeto |
| [architecture.md](./architecture.md) | Arquitetura            |
```

---

## ✅ Checklist Final

Antes de fazer commit de documentação:

- [ ] Verificar ortografia
- [ ] Testar todos os links
- [ ] Verificar formatação no preview
- [ ] Atualizar data de "última atualização"
- [ ] Adicionar ao índice se for arquivo novo
- [ ] Não há duplicação com outros docs

---

## 📊 Métricas de Documentação

| Métrica                  | Valor    | Meta   |
| ------------------------ | -------- | ------ |
| Arquivos em `docs/`      | 15       | -      |
| READMEs de pasta         | 5        | 5+     |
| Última atualização geral | Dez/2025 | Mensal |
| Cobertura de features    | ~90%     | 100%   |

---

**Dúvidas?** Abra uma issue com label `documentation`.
