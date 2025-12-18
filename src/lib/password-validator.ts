// ============================================
// PASSWORD VALIDATOR - Validação de força de senha
// ============================================

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
  score: number; // 0-100
}

const MIN_LENGTH = 8;

/**
 * Valida a força de uma senha
 * Regras:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 número
 * - (Bônus) Caracteres especiais
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  let score = 0;

  // Verificar comprimento mínimo
  if (password.length < MIN_LENGTH) {
    errors.push(`Mínimo de ${MIN_LENGTH} caracteres`);
  } else {
    score += 25;
    // Bônus para senhas mais longas
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
  }

  // Verificar letra maiúscula
  if (!/[A-Z]/.test(password)) {
    errors.push("Pelo menos 1 letra maiúscula");
  } else {
    score += 20;
  }

  // Verificar letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push("Pelo menos 1 letra minúscula");
  } else {
    score += 15;
  }

  // Verificar número
  if (!/[0-9]/.test(password)) {
    errors.push("Pelo menos 1 número");
  } else {
    score += 20;
  }

  // Verificar caracteres especiais (OBRIGATÓRIO)
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Pelo menos 1 caractere especial (!@#$%&*)");
  } else {
    score += 20;
  }

  // Calcular força
  let strength: "weak" | "medium" | "strong";
  if (score < 50) {
    strength = "weak";
  } else if (score < 75) {
    strength = "medium";
  } else {
    strength = "strong";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.min(score, 100),
  };
}

/**
 * Retorna a cor CSS para a barra de força
 */
export function getStrengthColor(strength: "weak" | "medium" | "strong"): string {
  switch (strength) {
    case "weak":
      return "#ef4444"; // red-500
    case "medium":
      return "#f59e0b"; // amber-500
    case "strong":
      return "#22c55e"; // green-500
  }
}

/**
 * Retorna o label traduzido para a força
 */
export function getStrengthLabel(strength: "weak" | "medium" | "strong"): string {
  switch (strength) {
    case "weak":
      return "Fraca";
    case "medium":
      return "Média";
    case "strong":
      return "Forte";
  }
}
