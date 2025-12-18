import { z } from "zod";

export const journalImageSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().url(),
  timeframe: z.string(),
  displayOrder: z.number(),
});

export const journalSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)"),
  title: z.string().min(1, "Título é obrigatório"),
  asset: z.string().optional(),
  tradeId: z.string().uuid().optional(),
  emotion: z.string().optional(),
  analysis: z.string().optional(),
  notes: z.string().optional(),
  accountId: z.string().uuid("ID da conta inválido"),

  images: z.array(journalImageSchema).optional(),
});

export type JournalInput = z.infer<typeof journalSchema>;
