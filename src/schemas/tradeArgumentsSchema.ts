/**
 * Trade Arguments Schema
 *
 * Zod validation schemas for PDArray (Prós e Contras) feature.
 */

import { z } from "zod";

export const addArgumentSchema = z.object({
  journalEntryId: z.string().uuid("ID do journal inválido"),
  type: z.enum(["pro", "contra"], {
    errorMap: () => ({ message: "Tipo deve ser 'pro' ou 'contra'" }),
  }),
  argument: z
    .string()
    .min(1, "Argumento não pode ser vazio")
    .max(500, "Máximo de 500 caracteres")
    .trim(),
});

export type AddArgumentInput = z.infer<typeof addArgumentSchema>;
