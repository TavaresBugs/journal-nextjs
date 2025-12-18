/**
 * Mental Hub Seed Data - Based on Jared Tendler's Method
 *
 * These profiles are pre-configured psychological patterns
 * commonly experienced by traders. Users can seed their
 * mental_profiles table with these during onboarding.
 */

export type MentalCategory =
  | "fear"
  | "greed"
  | "tilt"
  | "fomo"
  | "hesitation"
  | "overconfidence"
  | "discipline";
export type MentalZone = "A-Game" | "B-Game" | "C-Game";

export interface MentalSeedProfile {
  category: MentalCategory;
  description: string;
  zone: MentalZone;
  severity: number;
}

/**
 * Fear-based psychological patterns
 * Common in risk-averse traders who struggle with hesitation
 */
export const FEAR_SEEDS: MentalSeedProfile[] = [
  {
    category: "fear",
    description: "Aversão ao risco / Hesitação",
    zone: "C-Game",
    severity: 9,
  },
  {
    category: "fear",
    description: "Cortando trades cedo demais",
    zone: "C-Game",
    severity: 8,
  },
  {
    category: "fear",
    description: "Dúvida excessiva (Self-doubt)",
    zone: "C-Game",
    severity: 7,
  },
  {
    category: "fear",
    description: "Overthinking / Leitura excessiva do mercado",
    zone: "B-Game",
    severity: 5,
  },
  {
    category: "hesitation",
    description: "Paralisia por análise",
    zone: "C-Game",
    severity: 8,
  },
  {
    category: "fear",
    description: "Medo de perder dinheiro real",
    zone: "B-Game",
    severity: 6,
  },
];

/**
 * Greed-based psychological patterns
 * Common in aggressive traders who chase profits
 */
export const GREED_SEEDS: MentalSeedProfile[] = [
  {
    category: "fomo",
    description: "Perseguindo o preço (FOMO)",
    zone: "C-Game",
    severity: 9,
  },
  {
    category: "greed",
    description: "Operando baseado no PnL (não técnico)",
    zone: "C-Game",
    severity: 8,
  },
  {
    category: "greed",
    description: "Aumentando a mão sem planejamento",
    zone: "C-Game",
    severity: 10,
  },
  {
    category: "greed",
    description: "Focando apenas no lucro potencial",
    zone: "B-Game",
    severity: 5,
  },
  {
    category: "overconfidence",
    description: "Ignorando stops após sequência de wins",
    zone: "C-Game",
    severity: 9,
  },
  {
    category: "greed",
    description: "Não realizar parciais (deixando voltar)",
    zone: "B-Game",
    severity: 6,
  },
];

/**
 * Tilt-based psychological patterns
 * Emotional dysregulation and revenge trading
 */
export const TILT_SEEDS: MentalSeedProfile[] = [
  {
    category: "tilt",
    description: "Reagindo demais a cada tick",
    zone: "C-Game",
    severity: 8,
  },
  {
    category: "tilt",
    description: "Trade de Vingança (Revenge Trading)",
    zone: "C-Game",
    severity: 10,
  },
  {
    category: "tilt",
    description: "Forçando trades sem setup válido",
    zone: "C-Game",
    severity: 9,
  },
  {
    category: "tilt",
    description: "Quebrando regras após perda",
    zone: "C-Game",
    severity: 9,
  },
  {
    category: "tilt",
    description: "Aumentando lot size para recuperar",
    zone: "C-Game",
    severity: 10,
  },
  {
    category: "tilt",
    description: "Frustração com o mercado",
    zone: "B-Game",
    severity: 5,
  },
];

/**
 * Discipline-focused positive patterns
 * For tracking A-Game behavior development
 */
export const DISCIPLINE_SEEDS: MentalSeedProfile[] = [
  {
    category: "discipline",
    description: "Seguiu o plano de trading",
    zone: "A-Game",
    severity: 2,
  },
  {
    category: "discipline",
    description: "Respeitou o stop loss",
    zone: "A-Game",
    severity: 1,
  },
  {
    category: "discipline",
    description: "Esperou o setup completo",
    zone: "A-Game",
    severity: 2,
  },
  {
    category: "discipline",
    description: "Parou após atingir meta diária",
    zone: "A-Game",
    severity: 1,
  },
];

/**
 * All seeds combined for "full pack" import
 */
export const ALL_SEEDS: MentalSeedProfile[] = [
  ...FEAR_SEEDS,
  ...GREED_SEEDS,
  ...TILT_SEEDS,
  ...DISCIPLINE_SEEDS,
];

/**
 * Get seeds by category for selective import
 */
export function getSeedsByCategory(
  category: "fear" | "greed" | "tilt" | "all"
): MentalSeedProfile[] {
  switch (category) {
    case "fear":
      return FEAR_SEEDS;
    case "greed":
      return GREED_SEEDS;
    case "tilt":
      return TILT_SEEDS;
    case "all":
      return ALL_SEEDS;
    default:
      return [];
  }
}
