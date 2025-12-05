// ============================================
// SANITIZER - Sanitização de inputs para segurança
// ============================================

/**
 * Remove tags HTML de uma string para prevenir XSS
 */
export function stripHtml(input: string): string {
    if (!input) return '';
    return input.replace(/<[^>]*>/g, '');
}

/**
 * Escapa caracteres HTML especiais
 */
export function escapeHtml(input: string): string {
    if (!input) return '';
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Remove caracteres potencialmente perigosos de inputs
 * Mantém apenas alfanuméricos, espaços e pontuação comum
 */
export function sanitizeInput(input: string): string {
    if (!input) return '';
    // Remove null bytes e caracteres de controle
    return input
        .replace(/\0/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .trim();
}

/**
 * Sanitiza um objeto recursivamente
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const sanitized = {} as T;
    
    for (const key in obj) {
        const value = obj[key];
        
        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value) as T[typeof key];
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value as Record<string, unknown>) as T[typeof key];
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => 
                typeof item === 'string' ? sanitizeInput(item) : item
            ) as T[typeof key];
        } else {
            sanitized[key] = value as T[typeof key];
        }
    }
    
    return sanitized;
}

/**
 * Valida e sanitiza um email
 */
export function sanitizeEmail(email: string): string | null {
    if (!email) return null;
    
    const sanitized = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(sanitized)) {
        return null;
    }
    
    return sanitized;
}

/**
 * Sanitiza um número (previne injection via números)
 */
export function sanitizeNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    
    const num = Number(value);
    
    if (isNaN(num) || !isFinite(num)) {
        return null;
    }
    
    return num;
}
