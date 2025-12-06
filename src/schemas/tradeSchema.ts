import { z } from 'zod';

export const tradeSchema = z.object({
  symbol: z.string().min(1, 'Símbolo é obrigatório'),
  type: z.enum(['Long', 'Short']),
  entryPrice: z.number().positive('Preço de entrada deve ser positivo'),
  stopLoss: z.number().positive('Stop Loss deve ser positivo'),
  takeProfit: z.number().positive('Take Profit deve ser positivo'),
  exitPrice: z.number().positive('Preço de saída deve ser positivo').optional(),
  lot: z.number().positive('Lote deve ser positivo'),

  // Análise
  tfAnalise: z.string().optional(),
  tfEntrada: z.string().optional(),
  tags: z.string().optional(),
  strategy: z.string().optional(),
  setup: z.string().optional(),
  notes: z.string().optional(),

  // Datas
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  entryTime: z.string().optional(),
  exitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)').optional(),
  exitTime: z.string().optional(),

  // Resultado
  pnl: z.number().optional(),
  outcome: z.enum(['win', 'loss', 'breakeven', 'pending']).optional(),

  accountId: z.string().uuid('ID da conta inválido'),
});

export type TradeInput = z.infer<typeof tradeSchema>;
