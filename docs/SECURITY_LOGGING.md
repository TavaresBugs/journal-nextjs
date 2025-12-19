# Política de Logging Seguro

Este documento define as práticas de logging seguro para evitar exposição de PII (dados pessoais identificáveis) em produção.

## ✅ Helpers Disponíveis

### `safeError(error)`

Extrai apenas informações seguras de objetos de erro.

```typescript
import { safeError } from "@/lib/logging/safeError";

// ❌ RUIM - pode expor dados sensíveis
console.error("Error:", error);

// ✅ BOM - extrai apenas message e code
console.error("Error:", safeError(error));
```

### `sanitizeMeta(obj)`

Remove chaves sensíveis de objetos de metadados.

### `Logger.errorSafe()`

Método do Logger que sanitiza automaticamente.

```typescript
const logger = new Logger("MyComponent");
logger.errorSafe("Failed to load", error, { context: "user profile" });
```

## 🚫 Chaves Bloqueadas

- `email`, `password`, `token`, `session`
- `accessToken`, `refreshToken`, `apiKey`
- `cookie`, `auth`, `secret`, `credential`
- `user_id`, `phone`, `cpf`, `ip`

## 📋 Checklist de Auditoria

Antes de fazer commit, verifique:

- [ ] Nenhum `console.error(error)` sem sanitização
- [ ] Dados de usuário nunca logados diretamente
- [ ] Tokens e sessões nunca expostos em logs
