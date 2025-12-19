/**
 * Safe Error Helper
 *
 * Helper para extrair apenas informações seguras de erros,
 * evitando exposição de PII (dados pessoais identificáveis) em logs de produção.
 *
 * Uso:
 * ```typescript
 * // Antes (RUIM - pode expor PII)
 * console.error("Error loading data:", error);
 *
 * // Depois (BOM - seguro)
 * console.error("Error loading data:", safeError(error));
 * ```
 */

export interface SafeErrorResult {
  message: string;
  code?: string;
  name?: string;
}

/**
 * Extrai apenas informações seguras de um objeto de erro.
 * NÃO inclui stack traces, dados internos, ou qualquer PII potencial.
 */
export function safeError(error: unknown): SafeErrorResult {
  // Error padrão do JavaScript
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      // NÃO incluir: stack, cause, ou outros dados internos
    };
  }

  // Objeto com estrutura de erro (ex: erros do Supabase)
  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;
    return {
      message: String(e.message || e.error || "Unknown error"),
      code: e.code ? String(e.code) : undefined,
      name: e.name ? String(e.name) : undefined,
    };
  }

  // String simples
  if (typeof error === "string") {
    return { message: error };
  }

  // Fallback para tipos desconhecidos
  return { message: "Unknown error occurred" };
}

/**
 * Lista de chaves sensíveis que devem ser removidas de logs
 */
const SENSITIVE_KEYS = new Set([
  "email",
  "e-mail",
  "password",
  "senha",
  "token",
  "accessToken",
  "refreshToken",
  "access_token",
  "refresh_token",
  "session",
  "sessionId",
  "session_id",
  "cookie",
  "auth",
  "authorization",
  "secret",
  "key",
  "apiKey",
  "api_key",
  "credential",
  "credentials",
  "privateKey",
  "private_key",
  "user_id", // Pode ser PII dependendo do contexto
  "userId",
  "phone",
  "telefone",
  "cpf",
  "cnpj",
  "address",
  "endereco",
  "ip",
  "ipAddress",
  "ip_address",
]);

/**
 * Verifica se uma chave é sensível (case-insensitive)
 */
function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  for (const sensitive of SENSITIVE_KEYS) {
    if (lowerKey === sensitive.toLowerCase() || lowerKey.includes(sensitive.toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * Remove chaves sensíveis de um objeto de metadados.
 * Processa recursivamente objetos aninhados.
 *
 * @param meta Objeto de metadados a sanitizar
 * @param depth Profundidade máxima de recursão (padrão: 3)
 */
export function sanitizeMeta(
  meta: Record<string, unknown>,
  depth: number = 3
): Record<string, unknown> {
  if (depth <= 0) return { _truncated: true };

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    // Pular chaves sensíveis
    if (isSensitiveKey(key)) {
      result[key] = "[REDACTED]";
      continue;
    }

    // Processar objetos aninhados
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeMeta(value as Record<string, unknown>, depth - 1);
      continue;
    }

    // Arrays - sanitizar cada elemento se for objeto
    if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "object" && item !== null
          ? sanitizeMeta(item as Record<string, unknown>, depth - 1)
          : item
      );
      continue;
    }

    // Valores primitivos passam direto
    result[key] = value;
  }

  return result;
}
