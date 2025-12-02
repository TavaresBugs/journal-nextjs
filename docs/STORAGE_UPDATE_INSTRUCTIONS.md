# INSTRUÇÕES PARA ATUALIZAÇÃO DO STORAGE.TS

## Mudanças Necessárias

O arquivo `src/lib/storage.ts` precisa ser atualizado para **remover o modo browser** e **adicionar user_id automaticamente** em todas as operações.

### 1. Remover tipo StorageMode

**Antes:**

```typescript
type StorageMode = "browser" | "supabase";
```

**Depois:**

```typescript
// Remover completamente - sempre usaremos Supabase
```

### 2. Adicionar user_id nos Mappers

**Atualizar `mapAccountFromDB`:**

```typescript
const mapAccountFromDB = (db: any): Account => ({
  id: db.id,
  userId: db.user_id, // ADICIONAR
  name: db.name,
  // ... resto dos campos
});
```

**Atualizar `mapAccountToDB`:**

```typescript
const mapAccountToDB = (app: Account): any => ({
  id: app.id,
  user_id: app.userId, // ADICIONAR
  name: app.name,
  // ... resto dos campos
});
```

**Repetir para todos os mappers:** Trade, JournalEntry, JournalImage, DailyRoutine, Settings

### 3. Atualizar assinaturas das funções

**Antes:**

```typescript
export async function getAccounts(
  mode: StorageMode = "browser"
): Promise<Account[]>;
```

**Depois:**

```typescript
export async function getAccounts(): Promise<Account[]>;
```

**Remover parâmetro `mode` de TODAS as funções:**

- getAccounts()
- getAccount(id)
- saveAccount(account)
- deleteAccount(id)
- getTrades(accountId)
- saveTrade(trade)
- deleteTrade(id)
- getJournalEntries(accountId)
- saveJournalEntry(entry)
- deleteJournalEntry(id)
- getDailyRoutines(accountId)
- saveDailyRoutine(routine)
- deleteDailyRoutine(id)
- getSettings(accountId?)
- saveSettings(settings)

### 4. Remover lógica de browser localStorage

**Antes:**

```typescript
export async function getAccounts(
  mode: StorageMode = "browser"
): Promise<Account[]> {
  if (mode === "browser") {
    const data = localStorage.getItem("tj_accounts");
    return data ? JSON.parse(data) : [];
  }

  const { data, error } = await supabase.from("accounts").select("*");
  // ...
}
```

**Depois:**

```typescript
export async function getAccounts(): Promise<Account[]> {
  // Obter user_id do usuário autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("User not authenticated");
    return [];
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id) // Filtrar por user_id
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }

  return data ? data.map(mapAccountFromDB) : [];
}
```

### 5. Adicionar user_id em operações de escrita

**saveAccount:**

```typescript
export async function saveAccount(account: Account): Promise<boolean> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("User not authenticated");
    return false;
  }

  // Garantir que o account tem o user_id correto
  const accountWithUser = {
    ...account,
    userId: user.id,
  };

  const { error } = await supabase
    .from("accounts")
    .upsert(mapAccountToDB(accountWithUser));

  // ...
}
```

### 6. Atualizar migrateLocalStorageToSupabase

Esta função deve ser mantida para permitir migração de dados antigos, mas agora ela deve:

1. Obter o user_id do usuário autenticado
2. Adicionar user_id a todos os registros migrados
3. Remover o parâmetro mode (sempre Supabase)

**Atualizar:**

```typescript
export async function migrateLocalStorageToSupabase(): Promise<boolean> {
    try {
        // Obter usuário autenticado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user

) {
            console.error('❌ User not authenticated');
            return false;
        }

        console.log('🚀 Starting migration to Supabase...');

        // Migrar accounts do localStorage
        const accountsData = localStorage.getItem('tj_accounts');
        const accounts: Account[] = accountsData ? JSON.parse(accountsData) : [];
        console.log(`Found ${accounts.length} accounts to migrate.`);

        for (const account of accounts) {
            // Adicionar userId
            await saveAccount({ ...account, userId: user.id });
        }

        // ... resto da migração
    }
}
```

## IMPORTANTE

Após essas mudanças:

1. As stores (useAccountStore, useTradeStore, useJournalStore) precisarão ser atualizadas para remover `storageMode`
2. Todos os componentes que chamam essas funções devem remover o parâmetro `mode`
3. A página principal deve ser atualizada para remover a opção de escolha de modo
