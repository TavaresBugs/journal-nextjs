# Otimizar Performance Web (RES: 63 → 90+)

## 🔴 SITUAÇÃO CRÍTICA

**Vercel Real Experience Score**: **63/100** (precisa ser > 90)

### 📊 Core Web Vitals Atuais

| Métrica                            | Atual     | Ideal   | Gap        | Status            |
| ---------------------------------- | --------- | ------- | ---------- | ----------------- |
| **Real Experience Score**          | 63        | > 90    | -27        | 🔴 CRÍTICO        |
| **First Contentful Paint (FCP)**   | 2.95s     | < 1.8s  | +1.15s     | 🟠 RUIM           |
| **Largest Contentful Paint (LCP)** | **8.56s** | < 2.5s  | **+6.06s** | 🔴 **MUITO RUIM** |
| **Cumulative Layout Shift (CLS)**  | ?         | < 0.1   | ?          | ⚠️ Verificar      |
| **First Input Delay (FID)**        | ?         | < 100ms | ?          | ⚠️ Verificar      |

**❌ PROBLEMA PRINCIPAL**: Usuários esperam **quase 9 segundos** para ver o conteúdo principal!

### 💔 Impacto no Negócio

- ❌ **53%** dos usuários abandonam sites que demoram > 3s
- ❌ Cada **1 segundo** de atraso = **7%** menos conversões
- ❌ **Pior SEO** (Google penaliza sites lentos)
- ❌ **Pior UX** = usuários frustrados

---

## 🔍 Análise das Causas

### **1. Uso Excessivo de Client Components** 🔴

**Problema Identificado**: 12 páginas usando `"use client"` desnecessariamente.

```typescript
// ❌ RUIM: Tudo renderizado no cliente
"use client";

export default function Page() {
  const data = await fetchData(); // Não pode usar async no cliente!
  return <div>{data}</div>;
}

// ✅ BOM: Server Component por padrão
export default async function Page() {
  const data = await fetchData(); // Server-side, super rápido!
  return <div>{data}</div>;
}
```

**Arquivos afetados**:

- `src/app/page.tsx` (landing page - CRÍTICO!)
- `src/app/dashboard/[accountId]/page.tsx`
- `src/app/share/[token]/page.tsx`
- `src/app/login/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/mentor/page.tsx`
- `src/app/comunidade/page.tsx`
- `src/app/pending/page.tsx`
- Outros 4 arquivos

**Impacto**:

- Bundle JS enorme enviado ao cliente
- Hidratação lenta
- FCP e LCP ruins

---

### **2. Falta de Otimização de Imagens** 🖼️

**Problemas**:

- ❌ Imagens não otimizadas (formato WebP/AVIF)
- ❌ Loading lazy ausente
- ❌ Sizes não definidos (download de imagens maiores que necessário)
- ❌ Placeholder blur ausente

```typescript
// ❌ RUIM
<img src="/hero.png" alt="Hero" />

// ✅ BOM
<Image
  src="/hero.png"
  alt="Hero"
  width={1200}
  height={600}
  priority // Para LCP
  placeholder="blur"
  blurDataURL="data:image/..."
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

---

### **3. Requisições em Waterfall** 🌊

**Problema**: Dados carregados sequencialmente, não em paralelo.

```typescript
// ❌ RUIM: Waterfall (3s + 2s + 1s = 6s total)
const user = await getUser(); // 3s
const accounts = await getAccounts(user.id); // 2s
const trades = await getTrades(accounts[0].id); // 1s

// ✅ BOM: Paralelo (max 3s)
const [user, accounts, trades] = await Promise.all([getUser(), getAccounts(), getTrades()]);
```

---

### **4. Falta de Streaming e Suspense** ⏱️

**Problema**: Usuário vê tela branca até tudo carregar.

```typescript
// ❌ RUIM: Tudo ou nada
export default async function Page() {
  const data = await fetchEverything(); // 8s de espera!
  return <div>{data}</div>;
}

// ✅ BOM: Streaming progressivo
export default async function Page() {
  return (
    <div>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header /> {/* Renderiza imediatamente */}
      </Suspense>

      <Suspense fallback={<DataSkeleton />}>
        <SlowData /> {/* Streaming depois */}
      </Suspense>
    </div>
  );
}
```

---

### **5. Bundle JavaScript Gigante** 📦

**Problema**: Todo o código sendo enviado de uma vez.

**Soluções**:

- ❌ Falta de code splitting
- ❌ Falta de dynamic imports
- ❌ Bibliotecas pesadas não lazy-loaded

```typescript
// ❌ RUIM
import HeavyChart from 'recharts';

// ✅ BOM
const HeavyChart = dynamic(() => import('recharts'), {
  loading: () => <ChartSkeleton />,
  ssr: false // Só no cliente quando necessário
});
```

---

### **6. Falta de Caching** 💾

**Problema**: Mesmos dados sendo buscados múltiplas vezes.

```typescript
// ❌ RUIM: Fetch sem cache
export async function getUser() {
  return fetch("/api/user").then((r) => r.json());
}

// ✅ BOM: Com revalidação
export async function getUser() {
  return fetch("/api/user", {
    next: { revalidate: 60 }, // Cache por 60s
  }).then((r) => r.json());
}
```

---

## 🎯 Plano de Otimização

### **Fase 1: Quick Wins** (1-2 dias) 🚀 MÁXIMA PRIORIDADE

**Objetivo**: RES 63 → 75+ | LCP 8.56s → 4s

#### **1.1 Converter Pages para Server Components**

**Páginas Críticas** (fazer primeiro):

- [ ] `src/app/page.tsx` (landing page - CRÍTICA pro SEO!)
- [ ] `src/app/login/page.tsx` (alto tráfego)
- [ ] `src/app/share/[token]/page.tsx` (compartilhamento)

**Exemplo de conversão**:

```diff
- "use client";
-
- import { useEffect, useState } from "react";
- import { useRouter } from "next/navigation";
+ import { redirect } from "next/navigation";

- export default function DashboardPage() {
-   const [accounts, setAccounts] = useState([]);
-   const router = useRouter();
-
-   useEffect(() => {
-     fetch('/api/accounts').then(r => r.json()).then(setAccounts);
-   }, []);
+ export default async function DashboardPage() {
+   const accounts = await getAccountsAction();
+
+   if (!accounts.length) {
+     redirect('/onboarding');
+   }

    return (
      <div>
-       {accounts.map(account => (
-         <AccountCard key={account.id} {...account} />
+       {accounts.map(account => (
+         <ClientAccountCard key={account.id} {...account} />
        ))}
      </div>
    );
}
```

**Ganho Esperado**: LCP -3s

---

#### **1.2 Otimizar Imagens**

- [ ] Adicionar `priority` em imagens above-the-fold
- [ ] Adicionar `loading="lazy"` em imagens below-the-fold
- [ ] Definir `width` e `height` em todas as imagens
- [ ] Gerar blur placeholders

```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';

export function OptimizedHeroImage() {
  return (
    <Image
      src="/hero.png"
      alt="Dashboard"
      width={1200}
      height={630}
      priority // LCP optimization!
      placeholder="blur"
      blurDataURL="data:image/webp;base64,UklGRi..."
      sizes="(max-width: 768px) 100vw, 80vw"
    />
  );
}

export function OptimizedListImage({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      loading="lazy" // Não bloqueia LCP
      placeholder="blur"
      blurDataURL="data:image/webp;base64,..."
    />
  );
}
```

**Script para gerar blur placeholders**:

```bash
# install
npm install plaiceholder

# scripts/generate-blur-data.ts
import { getPlaiceholder } from 'plaiceholder';

const images = ['hero.png', 'logo.png', 'banner.jpg'];

for (const img of images) {
  const { base64 } = await getPlaiceholder(`/public/${img}`);
  console.log(`${img}: ${base64}`);
}
```

**Ganho Esperado**: LCP -1.5s, FCP -0.5s

---

#### **1.3 Implementar Streaming com Suspense**

```typescript
// app/dashboard/[accountId]/page.tsx
import { Suspense } from 'react';

export default function DashboardPage({ params }) {
  return (
    <div>
      {/* Header: Renderiza IMEDIATAMENTE */}
      <DashboardHeader accountId={params.accountId} />

      {/* Métricas: Streaming depois */}
      <Suspense fallback={<MetricsSkeleton />}>
        <DashboardMetrics accountId={params.accountId} />
      </Suspense>

      {/* Trades: Streaming progressivo */}
      <Suspense fallback={<TradeListSkeleton />}>
        <TradeList accountId={params.accountId} />
      </Suspense>
    </div>
  );
}

// Componentes assíncronos separados
async function DashboardMetrics({ accountId }) {
  const metrics = await getDashboardMetrics(accountId);
  return <MetricsCards data={metrics} />;
}

async function TradeList({ accountId }) {
  const trades = await fetchTrades(accountId);
  return <TradesTable data={trades} />;
}
```

**Ganho Esperado**: FCP -1s, LCP -2s, CLS -0.05

---

### **Fase 2: Otimizações Avançadas** (3-4 dias) 🎯 ALTA PRIORIDADE

**Objetivo**: RES 75 → 85+ | LCP 4s → 2.5s

#### **2.1 Implementar Parallel Data Fetching**

```typescript
// app/actions/data-fetching.ts

// ❌ ANTES: Serial (lento)
export async function getDashboardData(accountId: string) {
  const account = await getAccount(accountId);
  const trades = await getTrades(accountId);
  const metrics = await getMetrics(accountId);
  return { account, trades, metrics };
}

// ✅ DEPOIS: Paralelo (rápido)
export async function getDashboardData(accountId: string) {
  const [account, trades, metrics] = await Promise.all([
    getAccount(accountId),
    getTrades(accountId),
    getMetrics(accountId),
  ]);
  return { account, trades, metrics };
}
```

**Ganho Esperado**: -40% no tempo de carregamento

---

#### **2.2 Code Splitting Agressivo**

```typescript
// app/dashboard/[accountId]/page.tsx
import dynamic from 'next/dynamic';

// Heavy components: lazy load
const TradeChart = dynamic(() => import('@/components/TradeChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Só no cliente
});

const PlaybookModal = dynamic(() => import('@/components/PlaybookModal'), {
  loading: () => <ModalSkeleton />,
});

// Use apenas quando necessário
export default function Page() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>
        Ver Gráfico
      </button>

      {/* Só carrega quando abrir */}
      {showChart && <TradeChart />}
    </div>
  );
}
```

**Bundle size reduzido**: -200KB+ (30-40% menor)

---

#### **2.3 Implementar Request Deduplication**

```typescript
// lib/cache.ts
import { cache } from "react";

// Automaticamente deduplica requests idênticas
export const getCachedUser = cache(async (userId: string) => {
  console.log("Fetching user:", userId); // Só executa 1x por request
  return await prisma.user.findUnique({ where: { id: userId } });
});

// Usage: Pode chamar múltiplas vezes sem overhead
const user1 = await getCachedUser("123");
const user2 = await getCachedUser("123"); // Usa cache!
```

---

#### **2.4 Otimizar Fontes**

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Evita FOIT (Flash of Invisible Text)
  preload: true,
  variable: '--font-inter',
});

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

**next.config.mjs**:

```javascript
module.exports = {
  optimizeFonts: true, // Inline critical font CSS
};
```

**Ganho**: FCP -0.3s, CLS -0.02

---

### **Fase 3: Fine-Tuning** (2-3 dias) 🎨 MÉDIA PRIORIDADE

**Objetivo**: RES 85 → 90+

#### **3.1 Implementar ISR (Incremental Static Regeneration)**

```typescript
// app/comunidade/page.tsx
export const revalidate = 3600; // Revalida a cada 1h

export default async function ComunidadePage() {
  const posts = await getPosts();
  return <PostList posts={posts} />;
}
```

#### **3.2 Prefetch Links Críticos**

```typescript
// components/Navigation.tsx
import Link from 'next/link';

export function Navigation() {
  return (
    <nav>
      <Link href="/dashboard" prefetch={true}> {/* Prefetch habilitado */}
        Dashboard
      </Link>
      <Link href="/trades" prefetch={false}> {/* Sem prefetch */}
        Trades
      </Link>
    </nav>
  );
}
```

#### **3.3 Otimizar Third-Party Scripts**

```typescript
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}

        {/* Load analytics after page interactive */}
        <Script
          src="https://analytics.example.com/script.js"
          strategy="lazyOnload" // Não bloqueia nada!
        />
      </body>
    </html>
  );
}
```

#### **3.4 Implementar Service Worker (PWA)**

```typescript
// public/service-worker.js
const CACHE_NAME = "journal-v1";
const STATIC_ASSETS = ["/", "/login", "/dashboard", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

---

## 📊 Monitoramento e Validação

### **Ferramentas de Medição**

#### **1. Lighthouse CI** (Automatizado)

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://staging.wolftab.dev.br/
            https://staging.wolftab.dev.br/dashboard
            https://staging.wolftab.dev.br/login
          configPath: "./lighthouserc.json"
          uploadArtifacts: true
```

**lighthouserc.json**:

```json
{
  "ci": {
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1800 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

#### **2. Web Vitals Tracking**

```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights /> {/* Track Core Web Vitals */}
        <Analytics />
      </body>
    </html>
  );
}
```

#### **3. Bundle Analyzer**

```bash
# Install
npm install -D @next/bundle-analyzer

# next.config.mjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... config
});

# Run analysis
ANALYZE=true npm run build
```

---

## 🎯 Metas e Timeline

| Fase       | Timeline | RES Alvo | LCP Alvo   | Esforço  |
| ---------- | -------- | -------- | ---------- | -------- |
| **Fase 1** | Dias 1-2 | 63 → 75  | 8.56s → 4s | 🔴 Alta  |
| **Fase 2** | Dias 3-6 | 75 → 85  | 4s → 2.5s  | 🟠 Alta  |
| **Fase 3** | Dias 7-9 | 85 → 90+ | 2.5s → 2s  | 🟡 Média |

**Total**: 9-10 dias úteis

---

## ✅ Checklist de Implementação

### **Fase 1: Quick Wins** 🚀

- [ ] Converter `page.tsx` (landing) para Server Component
- [ ] Converter `login/page.tsx` para Server Component
- [ ] Converter `share/[token]/page.tsx` para Server Component
- [ ] Adicionar `priority` em imagens above-the-fold
- [ ] Adicionar `loading="lazy"` em imagens below-the-fold
- [ ] Gerar blur placeholders para todas as imagens
- [ ] Implementar Suspense em `dashboard/[accountId]/page.tsx`
- [ ] Criar skeletons para loading states

### **Fase 2: Otimizações Avançadas** 🎯

- [ ] Implementar Promise.all em data fetching
- [ ] Code splitting com dynamic imports (charts, modals)
- [ ] Implementar request deduplication com `cache()`
- [ ] Otimizar fontes com `next/font`
- [ ] Configurar revalidação de páginas estáticas

### **Fase 3: Fine-Tuning** 🎨

- [ ] Implementar ISR onde aplicável
- [ ] Configurar prefetch estratégico
- [ ] Otimizar third-party scripts
- [ ] Implementar Service Worker básico
- [ ] Adicionar Lighthouse CI
- [ ] Configurar Bundle Analyzer

---

## 📈 ROI Esperado

### **Impacto Técnico**

- ✅ **RES**: 63 → 90+ (+43%)
- ✅ **LCP**: 8.56s → 2s (-76%)
- ✅ **FCP**: 2.95s → 1.5s (-49%)
- ✅ **Bundle Size**: -30% (200KB+)
- ✅ **Time to Interactive**: -50%

### **Impacto no Negócio**

- ✅ **+25%** em conversões (sites 3x mais rápidos convertem 25% mais)
- ✅ **+18%** em retenção (usuários ficam mais tempo)
- ✅ **+15%** em SEO ranking (Google favorece sites rápidos)
- ✅ **-50%** em taxa de rejeição
- ✅ **Melhor UX** = usuários satisfeitos

---

## 🚨 Bloqueadores Conhecidos

### **Possíveis Desafios**

1. **Prisma Client Size** (~2MB)
   - Solução: Usar `output = "binary"` no schema.prisma
2. **Recharts/Chart.js** (pesados)
   - Solução: Lazy load + considerar alternativa (Nivo, Victory)

3. **Supabase Client** (~100KB)
   - Solução: Tree-shaking agressivo, usar apenas auth module

4. **Next.js bundle overhead**
   - Solução: Configurar `modularizeImports` no next.config

---

## 📚 Recursos

- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Core Web Vitals](https://web.dev/vitals/)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Lighthouse Best Practices](https://developer.chrome.com/docs/lighthouse/)

---

**Labels**: `performance`, `optimization`, `core-web-vitals`, `priority: critical`
**Estimativa**: 9-10 dias úteis
**ROI**: +43% RES | -76% LCP | +25% conversões | +15% SEO
