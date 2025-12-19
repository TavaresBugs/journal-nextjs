# Test Guide - How to Write Tests

## 🚀 Running Tests

### Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test src/__tests__/path/to/file.test.ts

# Run inside UI (watch mode)
npm run test:ui

# Watch mode (terminal)
npm run test:watch

# Generate Coverage
npm run test:coverage
```

## 📝 Writing a New Test

### 1. Where to put it?

- If testing `src/components/MyComponent.tsx`:
  -> `src/__tests__/components/MyComponent.test.tsx`
- If testing `src/services/myService.ts`:
  -> `src/__tests__/services/myService.test.ts`

### 2. Scaffold

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MyComponent } from "@/components/MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### 3. Using Data Fixtures

Don't create messy inline objects. Use shared fixtures.

```typescript
import { mockTrades } from "@/lib/tests/fixtures/tradeFixtures";
import { createMockTrade } from "@/lib/tests/utils/factories";

// standard
const trade = mockTrades.standard;

// custom
const bigWinner = createMockTrade({ pnl: 5000 });
```

### 4. Mocking Supabase

```typescript
import { createSupabaseMock } from "@/lib/tests/utils/mockBuilders";

const supabase = createSupabaseMock();
// ... usage in mocks
```

### 5. Common Patterns

**Testing Async Actions:**

```typescript
import { userEvent } from '@testing-library/user-event';

it('submits form', async () => {
  render(<Form />);
  const user = userEvent.setup();

  await user.click(screen.getByRole('button'));

  expect(handleSubmit).toHaveBeenCalled();
});
```

**Testing Hooks:**

```typescript
import { renderHook, act } from "@testing-library/react";

const { result } = renderHook(() => useCounter());

act(() => {
  result.current.increment();
});

expect(result.current.count).toBe(1);
```
