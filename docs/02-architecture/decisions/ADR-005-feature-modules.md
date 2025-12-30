# ADR-005: Organização por Feature Modules

> **Status:** Aceito  
> **Data:** 30 de Dezembro de 2025  
> **Decisores:** @TavaresBugs

---

## Contexto

O projeto cresceu para ~55.000 linhas com 300+ arquivos. A estrutura original separava código por tipo técnico:

```
src/
├── components/
│   ├── mental/
│   ├── trades/
│   └── ...
├── hooks/
│   ├── useMentalHub.ts
│   ├── useTradeMetrics.ts
│   └── ...
├── constants/
│   ├── mental.ts
│   ├── assetIcons.ts
│   └── ...
```

**Problemas:**

1. Imports longos e confusos
2. Difícil entender o que pertence a qual domínio
3. Acoplamento implícito entre arquivos distantes
4. Onboarding de devs lento

---

## Decisão

Adotar organização **Feature Modules** onde cada domínio de negócio é um módulo autocontido:

```
src/features/
├── mental/
│   ├── components/
│   ├── hooks/
│   ├── constants/
│   └── index.ts         # Barrel export
├── trades/
│   ├── hooks/
│   ├── constants/
│   └── index.ts
├── dashboard/
│   └── index.ts         # Re-exports
└── ...
```

---

## Alternativas Consideradas

### Opção A: Manter Estrutura Atual

**Prós:** Sem esforço de migração  
**Contras:** Problemas continuam crescendo  
**Decisão:** ❌ Rejeitado

### Opção B: Feature Modules Completos

**Prós:** Modularidade total, cada feature é independente  
**Contras:** Muito esforço, duplicação de código  
**Decisão:** ❌ Rejeitado (muito radical)

### Opção C: Feature Modules Híbridos (ESCOLHIDO)

**Prós:**

- Migração incremental
- Re-exports mantêm compatibilidade
- Código compartilhado permanece em `src/hooks/`

**Contras:**

- Dois lugares para hooks (feature vs global)
- Precisa de documentação clara

**Decisão:** ✅ Aprovado

---

## Implementação

### Estrutura Final

```
src/features/
├── mental/              # Módulo completo (components + hooks + constants)
├── dashboard/           # Re-exports de @/hooks
├── trades/              # Hooks + constants específicos
├── playbook/            # Re-exports
├── mentor/              # Re-exports
├── journal/             # Re-exports
├── community/           # Re-exports
└── admin/               # Re-exports
```

### Padrão de Barrel Export

```typescript
// src/features/mental/index.ts
export * from "./components";
export * from "./hooks";
export * from "./constants";
```

### Como Usar

```typescript
// ✅ Correto: importar da feature
import { MentalButton, useMentalHub } from "@/features/mental";
import { ASSET_OPTIONS, useTradeMetrics } from "@/features/trades";

// ❌ Evitar: importar diretamente (ainda funciona, mas não preferível)
import { MentalButton } from "@/components/mental/MentalButton";
```

---

## Consequências

### Positivas

1. **Organização clara:** Código de cada domínio está junto
2. **Imports simples:** `@/features/mental` em vez de caminhos longos
3. **Onboarding rápido:** Dev entende estrutura imediatamente
4. **Encapsulamento:** Feature pode evoluir independentemente

### Negativas

1. **Migração necessária:** Esforço inicial (~2-3h)
2. **Dois lugares para hooks:** Feature-specific vs global
3. **Documentação:** Precisa explicar onde colocar código novo

### Neutras

1. **Compatibilidade:** Imports antigos ainda funcionam
2. **Testes:** Não precisam mudar

---

## Decisões de Follow-up

1. [ ] Migrar mais componentes para features (trades, journal)
2. [ ] Documentar em contributing.md
3. [ ] Lint rule para preferir imports de features

---

## Referências

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Bulletproof React](https://github.com/alan2207/bulletproof-react)
- [Next.js Project Structure](https://nextjs.org/docs/app/building-your-application/routing/colocation)
