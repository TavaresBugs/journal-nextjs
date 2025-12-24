# Implementar Testes E2E Automatizados com Playwright

## 📊 Situação Atual

Atualmente o projeto possui:

- ✅ **720 testes unitários** com 57% de cobertura
- ✅ **Testes de integração** para repositories e server actions
- ❌ **Nenhum teste E2E** automatizado
- ❌ **Nenhum teste de API** para endpoints críticos
- ❌ **Testes manuais** para validar fluxos completos

**Problema**: Regressões em fluxos críticos (auth, imports, CRUD) só são detectadas em produção.

## 🎯 Objetivo

Implementar uma **estratégia de testes automatizados em camadas** para:

- ✅ Detectar regressões **antes** do merge (smoke tests em cada PR)
- ✅ Validar fluxos completos **diariamente** (regression suite)
- ✅ Cobrir features secundárias **semanalmente**
- ✅ Reduzir bugs em produção em **70%+**
- ✅ Dar confiança para refatorações

## 🏗️ Arquitetura Proposta

### **Pirâmide de Testes**

```
        🔺 E2E Secundários (semanal)
       /  \  Playbooks, Admin, Mentoria
      /    \  ~30 min | 10% dos testes
     /______\
    / E2E    \ Regressão (diário)
   / Críticos \ Trades, Journal, Auth
  /__________\ ~15 min | 20% dos testes
 /            \
/ SMOKE TESTS  \ (cada PR)
\______________/ Auth + Fluxos básicos
/  Unit/API    \ ~3 min | 10% dos testes
\______________/
    70% - Já implementado (720 testes)
```

### **Por que Playwright?**

| Critério                | Playwright                 | Cypress             |
| ----------------------- | -------------------------- | ------------------- |
| **Next.js/RSC Support** | ⭐⭐⭐⭐⭐                 | ⭐⭐⭐              |
| **Multi-browser**       | ✅ Chrome, Firefox, Safari | ❌ Só Chrome (paid) |
| **API Testing**         | ✅ Built-in                | ❌ Requer plugin    |
| **TypeScript**          | ⭐⭐⭐⭐⭐                 | ⭐⭐⭐⭐            |
| **Performance**         | ⭐⭐⭐⭐⭐                 | ⭐⭐⭐⭐            |
| **Setup de Test Data**  | ⭐⭐⭐⭐⭐                 | ⭐⭐⭐              |
| **Paralelização**       | ✅ Excelente               | ✅ Bom              |

**Decisão**: **Playwright** por melhor suporte a Next.js e API testing integrado.

---

## 📋 Plano de Implementação

### **Fase 1: Setup + Smoke Tests** (Semana 1) 🎯 CRÍTICO

**Objetivo**: Testes que rodam **< 3 min** em cada PR e bloqueiam merge se falharem.

**Prioridade**: 🔴 MÁXIMA

#### Tarefas

- [ ] **1.1** Instalar e configurar Playwright

  ```bash
  npm install -D @playwright/test
  npx playwright install
  ```

- [ ] **1.2** Criar estrutura de testes

  ```
  tests/
  ├── e2e/
  │   └── smoke/
  │       ├── auth.spec.ts
  │       ├── accounts.spec.ts
  │       ├── trades-basic.spec.ts
  │       └── journal-basic.spec.ts
  ├── fixtures/
  │   ├── users.ts
  │   ├── test-data.ts
  │   └── helpers.ts
  └── playwright.config.ts
  ```

- [ ] **1.3** Configurar test data strategy

  ```typescript
  // fixtures/users.ts
  export const TEST_USERS = {
    admin: { email: "admin@test.wolftab.dev", role: "admin" },
    user: { email: "user@test.wolftab.dev", role: "user" },
    pending: { email: "pending@test.wolftab.dev", status: "pending" },
    mentor: { email: "mentor@test.wolftab.dev", role: "mentor" },
  };

  // fixtures/helpers.ts
  export async function resetDatabase() {
    await prisma.trade.deleteMany();
    await prisma.journal.deleteMany();
    await prisma.account.deleteMany({ where: { isTestData: true } });
  }

  export async function seedTestUser(role: string) {
    return await prisma.user.create({
      data: TEST_USERS[role],
    });
  }
  ```

- [ ] **1.4** Implementar 5 smoke tests críticos

#### **Smoke Test 1: Auth Flow** (auth.spec.ts)

```typescript
import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("user can login and logout", async ({ page }) => {
    await page.goto("/login");

    // Login
    await page.fill('[name="email"]', "user@test.wolftab.dev");
    await page.fill('[name="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText("Minhas Carteiras")).toBeVisible();

    // Logout
    await page.click('[aria-label="Sair"]');
    await expect(page).toHaveURL("/login");
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/login");

    await page.fill('[name="email"]', "wrong@test.com");
    await page.fill('[name="password"]', "wrongpass");
    await page.click('button[type="submit"]');

    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible();
  });
});
```

#### **Smoke Test 2: Account Creation** (accounts.spec.ts)

```typescript
test("user can create new account", async ({ page }) => {
  await loginAs(page, "user@test.wolftab.dev");

  await page.goto("/");
  await page.click('button:has-text("Nova Carteira")');

  await page.fill('[name="name"]', "Test Account");
  await page.fill('[name="initialBalance"]', "10000");
  await page.selectOption('[name="currency"]', "USD");
  await page.click('button[type="submit"]');

  await expect(page.getByText("Test Account")).toBeVisible();
  await expect(page.getByText("US$ 10.000,00")).toBeVisible();
});
```

#### **Smoke Test 3: Trade Creation** (trades-basic.spec.ts)

```typescript
test("user can create basic trade", async ({ page, request }) => {
  // Setup: Create account via API (faster)
  const account = await request.post("/api/accounts", {
    data: { name: "Test Account", initialBalance: 10000 },
  });

  await page.goto(`/dashboard/${account.id}`);
  await page.click('button:has-text("Novo Trade")');

  await page.fill('[name="symbol"]', "EURUSD");
  await page.selectOption('[name="type"]', "LONG");
  await page.fill('[name="entryPrice"]', "1.1000");
  await page.fill('[name="lot"]', "0.01");
  await page.click('button[type="submit"]');

  await expect(page.getByText("EURUSD")).toBeVisible();
});
```

#### **Smoke Test 4: Journal Entry** (journal-basic.spec.ts)

```typescript
test("user can create journal entry", async ({ page, request }) => {
  const account = await createTestAccount(request);

  await page.goto(`/dashboard/${account.id}`);
  await page.click('[href="/journal"]');
  await page.click('button:has-text("Nova Entrada")');

  await page.fill('[name="title"]', "Test Journal Entry");
  await page.fill('[name="content"]', "This is a test entry");
  await page.click('button[type="submit"]');

  await expect(page.getByText("Test Journal Entry")).toBeVisible();
});
```

#### **Smoke Test 5: Dashboard Metrics** (accounts.spec.ts)

```typescript
test("dashboard shows correct metrics", async ({ page, request }) => {
  // Setup: Create account with trades via API
  const account = await createTestAccount(request);
  await createTestTrade(request, account.id, { pnl: 100 });
  await createTestTrade(request, account.id, { pnl: -50 });

  await page.goto(`/dashboard/${account.id}`);

  await expect(page.getByText("US$ 10.050,00")).toBeVisible(); // Balance
  await expect(page.getByText("+US$ 50,00")).toBeVisible(); // PnL
  await expect(page.getByText("2")).toBeVisible(); // Total trades
});
```

- [ ] **1.5** Integrar smoke tests no GitHub Actions

  ```yaml
  # .github/workflows/smoke-tests.yml
  name: Smoke Tests

  on:
    pull_request:
      branches: [main, develop]

  jobs:
    smoke:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-node@v3
        - run: npm ci
        - run: npx playwright install
        - run: npm run test:smoke
          env:
            DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
            NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
            NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  ```

**Critérios de Sucesso Fase 1**:

- ✅ 5 smoke tests rodando em < 3 minutos
- ✅ Integrado no CI/CD (bloqueia PR se falhar)
- ✅ 0 falsos positivos (testes estáveis)

---

### **Fase 2: Testes de Regressão - Trades** (Semana 2) 🎯 ALTO

**Objetivo**: Cobertura completa de CRUD de trades + **importação** (área crítica).

**Prioridade**: 🟠 ALTA

#### Tarefas

- [ ] **2.1** CRUD Completo de Trades
  - Create (via formulário)
  - Read (listagem + paginação)
  - Update (edição)
  - Delete (com confirmação)

- [ ] **2.2** ⚠️ **CRÍTICO**: Testes de Importação

  ```typescript
  test.describe("Trade Import", () => {
    test("import trades from CSV", async ({ page }) => {
      await page.goto("/trades/import");

      const csvFile = "./fixtures/test-trades.csv";
      await page.setInputFiles('input[type="file"]', csvFile);
      await page.click('button:has-text("Importar")');

      await expect(page.getByText("10 trades importados")).toBeVisible();
      await page.goto("/trades");
      await expect(page.getByText("EURUSD")).toBeVisible();
    });

    test("import trades from PDF (Tradovate)", async ({ page }) => {
      const pdfFile = "./fixtures/tradovate-report.pdf";
      await page.setInputFiles('input[type="file"]', pdfFile);
      await page.click('button:has-text("Importar")');

      await expect(page.getByText(/trades importados/)).toBeVisible();
    });

    test("reject invalid CSV format", async ({ page }) => {
      const invalidFile = "./fixtures/invalid.csv";
      await page.setInputFiles('input[type="file"]', invalidFile);

      await expect(page.getByText(/formato inválido/i)).toBeVisible();
    });
  });
  ```

- [ ] **2.3** Filtros e Busca
  - Filtrar por símbolo
  - Filtrar por data
  - Filtrar por resultado (WIN/LOSS)
  - Paginação

- [ ] **2.4** Sincronização de Balance

  ```typescript
  test("balance updates automatically after trade", async ({ page }) => {
    const initialBalance = await page.getByTestId("account-balance").textContent();

    await createTrade(page, { pnl: 100 });

    await expect(page.getByTestId("account-balance")).not.toHaveText(initialBalance);
    await expect(page.getByTestId("account-balance")).toContainText("10.100");
  });
  ```

**Critérios de Sucesso Fase 2**:

- ✅ CRUD completo testado
- ✅ Import CSV/PDF funcionando (0 regressões)
- ✅ Filtros e paginação validados
- ✅ Suite rodando em < 10 minutos

---

### **Fase 3: Regressão Journal + Roles** (Semana 3) 🎯 MÉDIO

**Prioridade**: 🟠 MÉDIA

#### Tarefas

- [ ] **3.1** CRUD de Journal
  - Criar entrada
  - Editar entrada
  - Upload de imagens
  - Link com trades

- [ ] **3.2** Testes de Roles e Permissions

  ```typescript
  test.describe("Role-Based Access Control", () => {
    test("admin can access admin panel", async ({ page }) => {
      await loginAs(page, TEST_USERS.admin);
      await page.goto("/admin");
      await expect(page).toHaveURL("/admin");
    });

    test("regular user cannot access admin panel", async ({ page }) => {
      await loginAs(page, TEST_USERS.user);
      await page.goto("/admin");
      await expect(page).toHaveURL("/dashboard"); // Redirected
    });

    test("pending user sees pending page", async ({ page }) => {
      await loginAs(page, TEST_USERS.pending);
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/pending");
      await expect(page.getByText(/aguardando aprovação/i)).toBeVisible();
    });

    test("mentor can view mentee data", async ({ page }) => {
      await loginAs(page, TEST_USERS.mentor);
      await page.goto("/mentor/dashboard");
      await expect(page.getByText("Alunos")).toBeVisible();
    });
  });
  ```

- [ ] **3.3** Share Links
  - Gerar link de compartilhamento
  - Acessar via link público
  - Expiração de links

**Critérios de Sucesso Fase 3**:

- ✅ Journal CRUD completo
- ✅ Todos os roles testados
- ✅ Share links funcionando

---

### **Fase 4: Features Secundárias** (Semana 4) 🎯 BAIXO

**Prioridade**: 🟡 BAIXA

#### Tarefas

- [ ] **4.1** Playbooks
  - Criar playbook
  - Editar regras
  - Testar filtros

- [ ] **4.2** Mental Hub
  - Estados mentais
  - Histórico

- [ ] **4.3** Admin Panel
  - Gerenciamento de usuários
  - Audit logs

**Critérios de Sucesso Fase 4**:

- ✅ Features secundárias cobertas
- ✅ Suite completa rodando em < 30 min

---

## 🔧 Estrutura Final

```
tests/
├── e2e/
│   ├── smoke/                    # < 3 min (PR)
│   │   ├── auth.spec.ts
│   │   ├── accounts.spec.ts
│   │   ├── trades-basic.spec.ts
│   │   ├── journal-basic.spec.ts
│   │   └── dashboard.spec.ts
│   ├── regression/               # < 15 min (diário)
│   │   ├── trades/
│   │   │   ├── crud.spec.ts
│   │   │   ├── import-csv.spec.ts     # CRÍTICO
│   │   │   ├── import-pdf.spec.ts     # CRÍTICO
│   │   │   ├── filters.spec.ts
│   │   │   └── balance-sync.spec.ts
│   │   ├── journal/
│   │   │   ├── crud.spec.ts
│   │   │   ├── image-upload.spec.ts
│   │   │   └── trade-linking.spec.ts
│   │   └── permissions/
│   │       ├── roles.spec.ts
│   │       └── share-links.spec.ts
│   └── secondary/                # < 30 min (semanal)
│       ├── playbook.spec.ts
│       ├── mental-hub.spec.ts
│       └── admin.spec.ts
├── api/                          # Testes de API rápidos
│   ├── trades.api.spec.ts
│   ├── accounts.api.spec.ts
│   └── auth.api.spec.ts
├── fixtures/
│   ├── users.ts
│   ├── trades.ts
│   ├── test-data/
│   │   ├── test-trades.csv
│   │   ├── tradovate-report.pdf
│   │   └── invalid.csv
│   └── helpers.ts
└── playwright.config.ts
```

---

## 📊 Distribuição de Testes

| Camada               | Qtd Testes | Tempo  | Frequência  | % Total |
| -------------------- | ---------- | ------ | ----------- | ------- |
| **Unit/Integration** | 720        | ~30s   | Cada commit | 70%     |
| **API Tests**        | 50         | ~1min  | Cada PR     | 5%      |
| **Smoke E2E**        | 5-10       | ~3min  | Cada PR     | 10%     |
| **Regression E2E**   | 30-40      | ~15min | Diário      | 10%     |
| **Secondary E2E**    | 10-15      | ~30min | Semanal     | 5%      |

**Total**: ~850 testes automatizados

---

## ⚙️ Configuração Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ["html"],
    ["json", { outputFile: "test-results.json" }],
    ["github"], // GitHub Actions annotations
  ],

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "smoke",
      testDir: "./tests/e2e/smoke",
      timeout: 30_000,
    },
    {
      name: "regression",
      testDir: "./tests/e2e/regression",
      timeout: 60_000,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 🚀 Scripts NPM

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:smoke": "playwright test --project=smoke",
    "test:regression": "playwright test --project=regression",
    "test:api": "playwright test tests/api",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug"
  }
}
```

---

## 📈 Métricas de Sucesso

### **Após Fase 1 (Smoke Tests)**

- ✅ 0 bugs críticos em produção (auth, criar conta)
- ✅ Tempo de feedback < 5 min em PRs
- ✅ Confiança para fazer merge

### **Após Fase 2 (Regressão Trades)**

- ✅ 0 regressões em imports (CSV/PDF)
- ✅ 0 bugs em CRUD de trades
- ✅ Feedback diário automático

### **Após Fase 3 (Journal + Roles)**

- ✅ Cobertura completa de permissions
- ✅ 0 bugs em compartilhamento

### **Após Fase 4 (Completo)**

- ✅ 850+ testes automatizados
- ✅ Redução de 70%+ em bugs de produção
- ✅ Deploy com confiança

---

## ⚠️ Armadilhas a Evitar

### **❌ NÃO FAZER**

1. **Não fazer E2E para tudo**
   - Mantém a pirâmide: 70% unit, 20% integration/API, 10% E2E

2. **Não usar dados reais**
   - Sempre usar DB de teste isolado

3. **Não fazer testes lentos**
   - Smoke > 5 min = vai ser ignorado

4. **Não usar selectors frágeis**

   ```typescript
   // ❌ Frágil
   await page.click(".css-xyz123");

   // ✅ Robusto
   await page.click('[data-testid="create-trade-btn"]');
   await page.click('button:has-text("Criar Trade")');
   ```

5. **Não usar waits arbitrários**

   ```typescript
   // ❌ Frágil e lento
   await page.waitForTimeout(5000);

   // ✅ Robusto e rápido
   await page.waitForSelector('[data-testid="trade-list"]');
   await expect(page.getByText("EURUSD")).toBeVisible();
   ```

### **✅ FAZER**

1. **Use test data helpers**

   ```typescript
   // Setup via API (10x mais rápido)
   await createTestAccount(api);
   await createTestTrades(api, 10);
   ```

2. **Isole testes**

   ```typescript
   beforeEach(async () => {
     await resetTestData();
   });
   ```

3. **Use Page Objects para código reutilizável**
   ```typescript
   class LoginPage {
     async login(email: string, password: string) {
       await this.emailInput.fill(email);
       await this.passwordInput.fill(password);
       await this.submitButton.click();
     }
   }
   ```

---

## 🎯 Próximos Passos

1. **Aprovar este plano** ✅
2. **Criar branch** `feature/e2e-automation`
3. **Implementar Fase 1** (1 semana)
4. **Criar PR com smoke tests**
5. **Iterar fases 2-4** conforme capacidade

---

## 📚 Recursos

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing/playwright)
- [Test Data Strategy](https://martinfowler.com/articles/practical-test-pyramid.html)

---

**Labels**: `testing`, `e2e`, `playwright`, `automation`, `quality`, `priority: high`
**Estimativa Total**: 4 semanas (40-60 horas)
**ROI**: Redução de 70%+ em bugs + Economia de 10+ horas/semana em testes manuais
