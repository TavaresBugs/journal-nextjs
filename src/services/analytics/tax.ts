import { Trade } from '@/types';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export interface TaxableTrade extends Trade {
    brokerageFee: number;
    exchangeFee: number; // Emolumentos + Liquidação
    taxes: number; // ISS + outros
    irrf: number; // Dedo-duro (1%)
    netResult: number;
    isDayTrade: boolean;
}

export interface TaxCalculation {
    month: string; // 'YYYY-MM'
    grossProfit: number;
    costs: number; // Soma de todas as taxas
    netResult: number; // grossProfit - costs
    accumulatedLoss: number; // Prejuízo de meses anteriores
    taxableBasis: number; // netResult - accumulatedLoss (se > 0)
    irrfDeduction: number; // Soma dos 1% retidos
    taxDue: number; // (taxableBasis * 0.20) - irrfDeduction
    dayTradeLossCarryForward: number; // Prejuízo a carregar para o próximo mês
}

export interface DARFModel {
    code: string; // '6015'
    period: string; // 'YYYY-MM-DD' (último dia do mês)
    dueDate: string; // Último dia útil do mês seguinte
    amount: number;
}

export interface TaxCostsConfig {
    defaultBrokerageFee: number;
    defaultExchangeFeePct: number; // % sobre volume financeiro
    defaultTaxesPct: number; // % sobre corretagem (ISS)
}

/**
 * Identifica Day Trades em uma lista de trades.
 * Critério: Compra e venda do mesmo ativo, na mesma corretora, no mesmo dia.
 * Como o objeto Trade já representa uma operação fechada, verificamos se entryDate === exitDate.
 */
export function identifyDayTrades(trades: Trade[]): Trade[] {
    return trades.filter(trade => {
        if (!trade.exitDate) return false;
        // Compara apenas a data YYYY-MM-DD
        return trade.entryDate === trade.exitDate;
    });
}

/**
 * Calcula o volume financeiro aproximado de um trade.
 * Nota: Como Trade tem entryPrice, exitPrice e lot, mas não o valor do contrato/multiplicador,
 * o cálculo exato da taxa B3 (que depende do volume financeiro total) pode precisar de mais dados.
 * Vamos assumir uma aproximação ou que o usuário insere os custos.
 *
 * Se o usuário fornecer custos padrão, aplicamos aqui.
 */
export function enrichTradesWithCosts(
    trades: Trade[],
    config: TaxCostsConfig
): TaxableTrade[] {
    return trades.map(trade => {
        const isDT = trade.entryDate === trade.exitDate;

        // Se não for Day Trade, não calculamos custos de DT, mas retornamos como TaxableTrade
        // A lógica de IR de Swing Trade é diferente (isenção 20k), mas aqui focamos em Day Trade.

        // Custos padrão
        const brokerage = config.defaultBrokerageFee;
        const taxes = brokerage * (config.defaultTaxesPct / 100);

        // Emolumentos dependem do volume. Sem multiplicador do contrato, é difícil estimar.
        // Vamos deixar 0 se não tivermos como calcular, ou usar um valor fixo se o usuário quiser.
        // O ideal é o usuário editar na tabela.
        // Vamos assumir que exchangeFeePct é sobre o RESULTADO BRUTO apenas como placeholder
        // se não tivermos volume, mas isso estaria errado.
        // Melhor: Deixar 0 e o usuário preenche, ou assumir volume = preço * lote (para ações).
        // Para futuros, precisaria do multiplicador.
        // Vamos deixar 0 por padrão para segurança.
        const exchangeFee = 0;

        // IRRF (Dedo-duro)
        // 1% sobre o lucro positivo
        let irrf = 0;
        const grossPnl = trade.pnl || 0;
        if (isDT && grossPnl > 0) {
            irrf = grossPnl * 0.01;
        }

        const totalCosts = brokerage + taxes + exchangeFee;

        return {
            ...trade,
            brokerageFee: brokerage,
            exchangeFee: exchangeFee,
            taxes: taxes,
            irrf: irrf,
            netResult: grossPnl - totalCosts,
            isDayTrade: isDT
        };
    });
}

/**
 * Calcula o imposto mensal para Day Trade.
 */
export function calculateMonthlyTax(
    month: string, // 'YYYY-MM'
    trades: TaxableTrade[],
    previousLoss: number
): TaxCalculation {
    // Filtrar apenas Day Trades do mês
    const dayTrades = trades.filter(t => t.isDayTrade && t.exitDate?.startsWith(month));

    let grossProfit = 0;
    let totalCosts = 0;
    let totalIrrf = 0;

    dayTrades.forEach(t => {
        grossProfit += (t.pnl || 0);
        const tradeCosts = t.brokerageFee + t.exchangeFee + t.taxes;
        totalCosts += tradeCosts;
        // IRRF conta como "crédito" para abater do imposto devido, não como custo dedutível da base de cálculo
        // A lei diz: IRRF será deduzido do imposto sobre a renda líquida do mês.
        // Então ele não reduz o lucro líquido, ele reduz o imposto final.
        // EXCETO: Se o IRRF foi pago, ele saiu do bolso?
        // Geralmente: Base = (Bruto - Taxas). Imposto = Base * 20%. A Pagar = Imposto - IRRF.
        totalIrrf += t.irrf;
    });

    const netResult = grossProfit - totalCosts;

    // Compensação de prejuízos
    // Compensação de prejuízos
    let taxableBasis = 0;
    let accumulatedLoss = previousLoss;

    if (netResult > 0) {
        if (accumulatedLoss > 0) {
            if (netResult >= accumulatedLoss) {
                taxableBasis = netResult - accumulatedLoss;
                accumulatedLoss = 0;
            } else {
                accumulatedLoss -= netResult;
                taxableBasis = 0;
            }
        } else {
            taxableBasis = netResult;
        }
    } else {
        // Prejuízo no mês, soma ao acumulado
        // netResult é negativo, então subtraimos (somamos o valor absoluto)
        accumulatedLoss += Math.abs(netResult);
    }

    let taxDue = 0;
    if (taxableBasis > 0) {
        taxDue = taxableBasis * 0.20;
        // Deduzir IRRF
        taxDue -= totalIrrf;
        if (taxDue < 0) {
            // Se IRRF for maior que imposto devido, sobra crédito para meses seguintes?
            // Para Day Trade, IRRF pode ser compensado.
            // Se o imposto a pagar for menor que o retido, o saldo de IRRF retido pode ser compensado?
            // Sim, pode ser compensado com imposto devido de meses subsequentes ou restituído.
            // Para simplificar, deixamos negativo indicando crédito, ou zeramos e avisamos.
            // A lei permite compensar IRRF. Vamos manter o valor real.
        }
    }

    return {
        month,
        grossProfit,
        costs: totalCosts,
        netResult,
        accumulatedLoss, // O que sobrou de prejuízo para o PRÓXIMO mês
        taxableBasis,
        irrfDeduction: totalIrrf,
        taxDue,
        dayTradeLossCarryForward: accumulatedLoss
    };
}

export function generateDARFData(calculation: TaxCalculation): DARFModel {
    // Vencimento: Último dia útil do mês subsequente
    const [year, month] = calculation.month.split('-').map(Number);

    // Mês seguinte
    let dueYear = year;
    let dueMonth = month + 1;
    if (dueMonth > 12) {
        dueMonth = 1;
        dueYear++;
    }

    // Último dia do mês seguinte
    const lastDayOfDueMonth = dayjs(`${dueYear}-${dueMonth}-01`).endOf('month');

    // Ajustar para dia útil (simplificado: se for sab/dom, antecipa ou adia? A regra é até o ultimo dia útil. Se cair fds, antecipa)
    // Vamos usar uma lógica simples: se for Sábado(6), -1 dia. Se Domingo(0), -2 dias.
    let dueDate = lastDayOfDueMonth;
    const dayOfWeek = dueDate.day();
    if (dayOfWeek === 6) dueDate = dueDate.subtract(1, 'day');
    if (dayOfWeek === 0) dueDate = dueDate.subtract(2, 'day');

    return {
        code: '6015',
        period: dayjs(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD'),
        dueDate: dueDate.format('YYYY-MM-DD'),
        amount: Math.max(0, calculation.taxDue) // Só gera DARF se valor > 0. Se < 10 reais, acumula (regra geral), mas aqui retornamos o valor calculado.
    };
}
