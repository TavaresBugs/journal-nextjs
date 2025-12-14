# Migration Guide: Repository Pattern

## Overview
We are moving from direct `supabase` client calls in Services/Components to a **Repository Pattern**. This guide explains how to migrate existing code and write new code using this pattern.

## 1. Structure

*   **`src/lib/repositories/`**: Contains all repository classes.
*   **`BaseRepository`**: Provides generic CRUD (`getById`, `create`, `update`, `delete`).
*   **`Result<T, E>`**: Standard return type. Always checks `result.error`.

## 2. How to Use

### Instantiating
Repositories require a Supabase client instance.

```typescript
import { supabase } from '@/lib/supabase';
import { TradeRepository } from '@/lib/repositories/TradeRepository';

const tradeRepo = new TradeRepository(supabase);
```

### Reading Data

**Old Way:**
```typescript
const { data, error } = await supabase
  .from('trades')
  .select('*')
  .eq('id', id)
  .single();

if (error) throw error;
return mapTradeFromDB(data);
```

**New Way:**
```typescript
const result = await tradeRepo.getByIdDomain(id);

if (result.error) {
  // handle error (log, toast, return null)
  console.error(result.error.message);
  return null;
}

return result.data; // Already mapped to Domain Type
```

### Writing Data

**Old Way:**
```typescript
const { error } = await supabase.from('trades').insert(mapTradeToDB(trade));
```

**New Way:**
```typescript
const result = await tradeRepo.createDomain(trade);

if (result.error) {
  // handle error
}
```

## 3. Creating a New Repository

1.  Create `src/lib/repositories/MyEntityRepository.ts`.
2.  Extend `BaseRepository<DBMyEntity>`.
3.  Implement domain mapping helpers (`mapResult`, `mapListResult`) if needed.
4.  Add custom methods (e.g., `getByCategory`).

Example:
```typescript
export class JournalRepository extends BaseRepository<DBJournalEntry> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'journal_entries');
  }

  // Add specific methods here...
}
```

## 4. Error Handling
All errors are caught within the repository and returned as `AppError`.
You do **not** need to wrap calls in `try/catch` unless you are doing complex logic.

Check `result.error.code` (from `ErrorCode` enum) if you need specific handling (e.g., `DB_NOT_FOUND`).
