# Test Plan - Trading Journal Pro

> Status: 640+ testes passando (Vitest)
> Cobertura: ~72.8% (Meta: 70%) - Atingida!
> Última atualização: 19/12/2025

---

## 🧪 Estratégia de Testes

### 1. Testes Unitários (Vitest)

Foco em regras de negócio, cálculos e utilitários.

- **Local:** `src/**/*.test.ts`
- **Execução:** `npm test`
- **Escopo:**
  - `src/lib/calculations.ts` (100% coberto)
  - `src/services/*` (Lógica de CRUD)
  - `src/utils/*` (Formatadores)

### 2. Testes de Integração

Foco em fluxos que envolvem múltiplos services ou componentes.

- **Local:** `tests/integration/*`
- **Escopo:**
  - Fluxo de criação de Trade + Journal
  - Importação de arquivos (NinjaTrader/MetaTrader)

### 3. Testes de UI (Component Testing)

Verificação de renderização e interações básicas.

- **Ferramenta:** `@testing-library/react`
- **Escopo:**
  - Modais (Abertura/Fechamento)
  - Formulários (Validação Zod)

---

## 🎯 Metas de Qualidade (Q1 2026)

- [ ] Atingir 80% de cobertura de código.
- [ ] Implementar Testes E2E (Playwright) para fluxos críticos:
  - Login -> Dashboard
  - Criar Trade -> Ver no Grid
  - Importar CSV -> Validar Dados

---

## 🛠️ Comandos

```bash
# Rodar todos os testes
npm test

# Modo Watch (Desenvolvimento)
npm run test:watch

# Relatório de Cobertura
npm run test:coverage
```
