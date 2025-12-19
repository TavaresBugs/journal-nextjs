# Test Utilities & Fixtures

This directory contains shared resources for the testing ecosystem. **These are NOT test files.**

## 📂 Structure

- **`utils/`**: Helper functions and mock builders.
  - `mockBuilders.ts`: Standard mocks (e.g., Supabase, Window APIs).
  - `factories.ts`: Functions to generate dynamic data objects (trades, journals).
  - `testHelpers.ts`: Async helpers, date manipulators.

- **`fixtures/`**: Static data sets.
  - `tradeFixtures.ts`: Common trade scenarios (winner, loser, etc.).
  - `userFixtures.ts`: Mock users and profiles.
  - `journalFixtures.ts`: Mock journal entries.

## 🚀 Usage

Import these using the `@/lib/tests/` alias (once configured in tsconfig) or relative paths.

### Example in a test file:

```typescript
import { createMockTrade } from "../../../lib/tests/utils/factories";
import { mockUser } from "../../../lib/tests/fixtures/userFixtures";

describe("TradeLogic", () => {
  it("calculates risk", () => {
    const trade = createMockTrade({ user_id: mockUser.id });
    // ...
  });
});
```

## 📊 Coverage Status (Manual Map)

_Last Updated: Dec 19, 2025_

| Module       | Status | Notes                                        |
| ------------ | ------ | -------------------------------------------- |
| `utils/*`    | 100%   | Configured for exclusion in coverage reports |
| `fixtures/*` | 100%   | Static data                                  |
