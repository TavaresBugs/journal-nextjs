import * as ExcelJS from 'exceljs';
import { Trade } from '@/types';
import { getTrades } from './tradeService';
import { parseISO, isWithinInterval, format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportMetrics {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    totalPnL: number;
    bestTrade: number;
    worstTrade: number;
}

interface MonthlyMetrics {
    month: string;
    trades: number;
    wins: number;
    losses: number;
    pnl: number;
    winRate: number;
}

/**
 * Generates an Excel report for a given period and account.
 * @param accountId - The account ID to fetch trades for.
 * @param startDate - Start date of the report period.
 * @param endDate - End date of the report period.
 * @returns Promise that resolves to a Blob containing the Excel file.
 */
export async function generateReport(accountId: string, startDate: Date, endDate: Date): Promise<Blob> {
    const allTrades = await getTrades(accountId);

    // Filter trades by date range
    const trades = allTrades.filter(t => {
        if (!t.entryDate) return false;
        const date = parseISO(t.entryDate);
        return isWithinInterval(date, { start: startDate, end: endDate });
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Trading Journal';
    workbook.created = new Date();

    // ---------------------------------------------------------
    // SHEET 1: RESUMO
    // ---------------------------------------------------------
    const summarySheet = workbook.addWorksheet('Resumo');

    // Calculate metrics
    const metrics = calculateReportMetrics(trades);

    summarySheet.columns = [
        { header: 'Métrica', key: 'metric', width: 20 },
        { header: 'Valor', key: 'value', width: 20 },
    ];

    const periodStr = `${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`;

    summarySheet.addRows([
        { metric: 'Período do Relatório', value: periodStr },
        { metric: 'Total de Trades', value: metrics.totalTrades },
        { metric: 'Win Rate', value: metrics.winRate / 100 }, // Stored as decimal for formatting
        { metric: 'Profit Factor', value: metrics.profitFactor },
        { metric: 'Lucro/Prejuízo Total', value: metrics.totalPnL },
        { metric: 'Melhor Trade', value: metrics.bestTrade },
        { metric: 'Pior Trade', value: metrics.worstTrade },
    ]);

    // Format numbers
    // Win Rate
    summarySheet.getRow(4).getCell(2).numFmt = '0.00%';

    // Profit Factor
    summarySheet.getRow(5).getCell(2).numFmt = '0.00';

    // Money columns
    const moneyRows = [6, 7, 8]; // PnL, Best, Worst
    moneyRows.forEach(rowIndex => {
        summarySheet.getRow(rowIndex).getCell(2).numFmt = '"$"#,##0.00;[Red]\-"$"#,##0.00';
    });

    // Styling headers
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // ---------------------------------------------------------
    // SHEET 2: TRADES
    // ---------------------------------------------------------
    const tradesSheet = workbook.addWorksheet('Trades');

    tradesSheet.columns = [
        { header: 'Data', key: 'date', width: 12 },
        { header: 'Ativo', key: 'symbol', width: 10 },
        { header: 'Direção', key: 'type', width: 8 },
        { header: 'Entrada', key: 'entry', width: 12 },
        { header: 'Saída', key: 'exit', width: 12 },
        { header: 'Resultado', key: 'pnl', width: 12 },
        { header: '%', key: 'percent', width: 10 },
    ];

    // Header styling
    tradesSheet.getRow(1).font = { bold: true };
    tradesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' } // Blue header
    };
    tradesSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    trades.forEach(trade => {
        const pnl = trade.pnl || 0;
        // Simple % calc based on price movement
        let percent = 0;
        if (trade.entryPrice && trade.exitPrice) {
            if (trade.type === 'Long') {
                percent = (trade.exitPrice - trade.entryPrice) / trade.entryPrice;
            } else {
                percent = (trade.entryPrice - trade.exitPrice) / trade.entryPrice;
            }
        }

        const row = tradesSheet.addRow({
            date: format(parseISO(trade.entryDate), 'dd/MM/yyyy'),
            symbol: trade.symbol,
            type: trade.type,
            entry: trade.entryPrice,
            exit: trade.exitPrice || 0,
            pnl: pnl,
            percent: percent
        });

        // Conditional formatting
        const pnlCell = row.getCell('pnl');
        pnlCell.numFmt = '"$"#,##0.00;[Red]\-"$"#,##0.00';
        if (pnl > 0) {
            pnlCell.font = { color: { argb: 'FF008000' } }; // Green
        } else if (pnl < 0) {
            pnlCell.font = { color: { argb: 'FFFF0000' } }; // Red
        }

        const percentCell = row.getCell('percent');
        percentCell.numFmt = '0.00%';
        if (percent > 0) {
            percentCell.font = { color: { argb: 'FF008000' } };
        } else if (percent < 0) {
            percentCell.font = { color: { argb: 'FFFF0000' } };
        }
    });

    // ---------------------------------------------------------
    // SHEET 3: MENSAL
    // ---------------------------------------------------------
    const monthlySheet = workbook.addWorksheet('Mensal');

    monthlySheet.columns = [
        { header: 'Mês', key: 'month', width: 15 },
        { header: 'Trades', key: 'trades', width: 10 },
        { header: 'Wins', key: 'wins', width: 10 },
        { header: 'Losses', key: 'losses', width: 10 },
        { header: 'P/L', key: 'pnl', width: 15 },
        { header: 'Win Rate', key: 'winRate', width: 12 },
    ];

    monthlySheet.getRow(1).font = { bold: true };
    monthlySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF9BBB59' } // Greenish header
    };
    monthlySheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    const monthlyData = calculateMonthlyMetrics(trades);

    monthlyData.forEach(m => {
        const row = monthlySheet.addRow({
            month: m.month,
            trades: m.trades,
            wins: m.wins,
            losses: m.losses,
            pnl: m.pnl,
            winRate: m.winRate / 100 // Excel expects 0-1 for percentage format
        });

        const pnlCell = row.getCell('pnl');
        pnlCell.numFmt = '"$"#,##0.00;[Red]\-"$"#,##0.00';
        if (m.pnl > 0) pnlCell.font = { color: { argb: 'FF008000' } };
        else if (m.pnl < 0) pnlCell.font = { color: { argb: 'FFFF0000' } };

        const winRateCell = row.getCell('winRate');
        winRateCell.numFmt = '0.00%';
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Triggers a download of the Excel file in the browser.
 * @param blob - The Blob containing the Excel file.
 * @param filename - The name of the file to be downloaded.
 */
export function downloadExcel(blob: Blob, filename: string): void {
    if (typeof window === 'undefined') return;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// ---------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------

function calculateReportMetrics(trades: Trade[]): ReportMetrics {
    const wins = trades.filter(t => t.outcome === 'win').length;
    const losses = trades.filter(t => t.outcome === 'loss').length;
    const totalTrades = trades.length;

    const validTradesCount = wins + losses;
    const winRate = validTradesCount > 0 ? (wins / validTradesCount) * 100 : 0;

    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    const winningTrades = trades.filter(t => t.outcome === 'win');
    const losingTrades = trades.filter(t => t.outcome === 'loss');

    const avgWin = winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
        : 0;

    const avgLoss = losingTrades.length > 0
        ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length)
        : 0;

    const profitFactor = avgLoss > 0 ? (avgWin * wins) / (avgLoss * losses) : 0;

    const sortedByPnL = [...trades].sort((a, b) => (b.pnl || 0) - (a.pnl || 0));
    const bestTrade = sortedByPnL.length > 0 ? (sortedByPnL[0].pnl || 0) : 0;
    const worstTrade = sortedByPnL.length > 0 ? (sortedByPnL[sortedByPnL.length - 1].pnl || 0) : 0;

    return {
        totalTrades,
        winRate,
        profitFactor,
        totalPnL,
        bestTrade,
        worstTrade
    };
}

function calculateMonthlyMetrics(trades: Trade[]): MonthlyMetrics[] {
    const groups: Record<string, Trade[]> = {};

    trades.forEach(t => {
        if (!t.entryDate) return;
        const date = parseISO(t.entryDate);
        const key = format(date, 'yyyy-MM'); // Key for sorting
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
    });

    const metrics: MonthlyMetrics[] = Object.keys(groups).sort().map(key => {
        const monthlyTrades = groups[key];
        const date = parse(key, 'yyyy-MM', new Date());
        const monthName = format(date, 'MMMM yyyy', { locale: ptBR });

        // Use first letter uppercase
        const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        const wins = monthlyTrades.filter(t => t.outcome === 'win').length;
        const losses = monthlyTrades.filter(t => t.outcome === 'loss').length;
        const validTradesCount = wins + losses;
        const winRate = validTradesCount > 0 ? (wins / validTradesCount) * 100 : 0;
        const pnl = monthlyTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

        return {
            month: formattedMonth,
            trades: monthlyTrades.length,
            wins,
            losses,
            pnl,
            winRate
        };
    });

    return metrics;
}
