# Test Strategy - Trading Journal Pro

## 🎯 Philosophy

We aim for **Confidence** and **Maintainability**.

- Write tests that resemble how the application is used.
- Avoid testing implementation details.
- Prioritize integration tests for critical user flows.

---

## 🏗️ The Testing Pyramid

### 1. Unit Tests (Base) - Vitest

**Focus**: Individual functions, hooks, and isolated components.

- **Utils**: `src/lib/utils/*.ts`
- **Helpers**: `src/lib/calculations.ts`
- **Small Components**: `src/components/ui/*.tsx`

### 2. Integration Tests (Middle) - Vitest + React Testing Library

**Focus**: Interactions between components and services.

- **Forms**: `JournalEntryForm`, `ReviewForm`
- **Services**: `src/services/*.ts` (mocking Supabase)
- **Flows**: `EntryHeader` -> `LinkTradeModal`

### 3. E2E Tests (Top) - Playwright (Future)

**Focus**: Critical user journeys running in a real browser.

- Login -> Dashboard
- Import Trades -> Verify Grid

---

## 🛠️ Tools & Standards

### Frameworks

- **Runner**: Vitest (Fast, API compatible with Jest)
- **DOM Utils**: `@testing-library/react` & `@testing-library/user-event`
- **Mocks**: `vi.mock()` for modules, factories for data.

### Conventions

1. **Naming**: `*.test.ts` or `*.test.tsx`.
2. **Structure**: `src/__tests__` mirroring source structure by functionality.
3. **Pattern**: **AAA** (Arrange, Act, Assert).
   ```typescript
   it("should calculate profit correctly", () => {
     // Arrange
     const entry = 100;
     const exit = 110;

     // Act
     const result = calculatePnL(entry, exit);

     // Assert
     expect(result).toBe(10);
   });
   ```

### Mocking Guidelines

- **Supabase**: ALWAYS mock network calls. Use `createSupabaseMock` from `src/lib/tests/utils/mockBuilders.ts`.
- **Dates**: Fix system time if testing time-sensitive logic.
- **Components**: Shallow render complex children only if necessary.

---

## 📦 Directory Structure

```
src/
  __tests__/           # Test files
    components/        # Component tests
    services/          # Service integration tests
    hooks/             # Hook tests
    lib/               # Utility tests
  lib/
    tests/             # Test Utilities (Not tests themselves)
      utils/           # Helpers, Builders
      fixtures/        # Static Data
```

## ✅ Best Practices

- **Don't** test third-party libraries (e.g., don't test if Zod works, test YOUR schemas).
- **Do** test error states and edge cases.
- **Do** use `screen.getByRole` for accessibility-friendly queries.
