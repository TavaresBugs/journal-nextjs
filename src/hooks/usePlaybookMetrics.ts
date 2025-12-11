import { useMemo } from 'react';
import type { Trade } from '@/types';
import {
    HtfNestedMetric,
    HtfExpandedMetric,
    TagComboMetric,
    LtfMetric,
    BaseStats,
    SessionMetric,
    ConditionMetric,
    TagExpandedMetric,
    LtfExpandedMetric,
    QualityMetric
} from '@/types/playbookTypes';
import {
    getTimeframePriority,
    getQualityIcon,
    getConditionIcon,
    getSessionIcon
} from '@/lib/utils/playbook';

// Build nested metrics: HTF -> Tag Combination -> LTF
function buildNestedMetrics(trades: Trade[]): HtfNestedMetric[] {
    const htfMap = new Map<string, Map<string, Map<string, { wins: number; losses: number; pnl: number; rMultiples: number[] }>>>();

    trades.forEach(trade => {
        const htf = trade.tfAnalise || 'N/A';
        const ltf = trade.tfEntrada || 'N/A';
        // Treat full tag combination as single unit (sorted alphabetically)
        const tagCombo = trade.tags
            ? trade.tags.split(',').map(t => t.trim()).filter(Boolean).sort().join(' + ')
            : 'Sem Confluências';
        const pnl = trade.pnl || 0;
        const isWin = trade.outcome === 'win';
        const isLoss = trade.outcome === 'loss';

        if (!htfMap.has(htf)) htfMap.set(htf, new Map());
        const tagMap = htfMap.get(htf)!;
        if (!tagMap.has(tagCombo)) tagMap.set(tagCombo, new Map());
        const ltfMap = tagMap.get(tagCombo)!;
        if (!ltfMap.has(ltf)) ltfMap.set(ltf, { wins: 0, losses: 0, pnl: 0, rMultiples: [] });

        const stats = ltfMap.get(ltf)!;
        if (isWin) stats.wins++;
        else if (isLoss) stats.losses++;
        stats.pnl += pnl;

        // Calculate R-Multiple: use rMultiple if available, otherwise calculate from stopLoss
        let rMultiple = trade.rMultiple;
        if (rMultiple === undefined || rMultiple === null) {
            // Calculate R based on entry/stop and pnl
            if (trade.entryPrice && trade.stopLoss && trade.lot && pnl !== 0) {
                const riskInPoints = Math.abs(trade.entryPrice - trade.stopLoss);
                if (riskInPoints > 0) {
                    // Risk in same unit as pnl (simplified: assume pnl is already in account currency)
                    // R-Multiple = actual return / expected risk (using pnl sign)
                    const expectedRisk = riskInPoints * trade.lot;
                    if (expectedRisk > 0) {
                        rMultiple = pnl / expectedRisk;
                    }
                }
            }
        }

        if (rMultiple !== undefined && rMultiple !== null && !isNaN(rMultiple)) {
            stats.rMultiples.push(rMultiple);
        }
    });

    const result: HtfNestedMetric[] = [];

    htfMap.forEach((tagMap, htf) => {
        let htfWins = 0, htfLosses = 0, htfPnl = 0;
        const htfRMultiples: number[] = [];
        const tagBreakdown: TagComboMetric[] = [];

        tagMap.forEach((ltfMap, tagCombo) => {
            let tagWins = 0, tagLosses = 0, tagPnl = 0;
            const tagRMultiples: number[] = [];
            const ltfBreakdown: LtfMetric[] = [];

            ltfMap.forEach((stats, ltf) => {
                tagWins += stats.wins;
                tagLosses += stats.losses;
                tagPnl += stats.pnl;
                tagRMultiples.push(...stats.rMultiples);

                const total = stats.wins + stats.losses;
                const avgRR = stats.rMultiples.length > 0
                    ? stats.rMultiples.reduce((a, b) => a + b, 0) / stats.rMultiples.length
                    : null;

                ltfBreakdown.push({
                    ltf,
                    wins: stats.wins,
                    losses: stats.losses,
                    pnl: stats.pnl,
                    winRate: total > 0 ? (stats.wins / total) * 100 : 0,
                    avgRR,
                    totalTrades: total
                });
            });

            ltfBreakdown.sort((a, b) => b.totalTrades - a.totalTrades);

            htfWins += tagWins;
            htfLosses += tagLosses;
            htfPnl += tagPnl;
            htfRMultiples.push(...tagRMultiples);

            const tagTotal = tagWins + tagLosses;
            const tagAvgRR = tagRMultiples.length > 0
                ? tagRMultiples.reduce((a, b) => a + b, 0) / tagRMultiples.length
                : null;

            tagBreakdown.push({
                tagCombo,
                wins: tagWins,
                losses: tagLosses,
                pnl: tagPnl,
                winRate: tagTotal > 0 ? (tagWins / tagTotal) * 100 : 0,
                avgRR: tagAvgRR,
                totalTrades: tagTotal,
                ltfBreakdown
            });
        });

        tagBreakdown.sort((a, b) => b.totalTrades - a.totalTrades);

        const htfTotal = htfWins + htfLosses;
        const htfAvgRR = htfRMultiples.length > 0
            ? htfRMultiples.reduce((a, b) => a + b, 0) / htfRMultiples.length
            : null;

        result.push({
            htf,
            wins: htfWins,
            losses: htfLosses,
            pnl: htfPnl,
            winRate: htfTotal > 0 ? (htfWins / htfTotal) * 100 : 0,
            avgRR: htfAvgRR,
            totalTrades: htfTotal,
            tagBreakdown
        });
    });

    result.sort((a, b) => getTimeframePriority(b.htf) - getTimeframePriority(a.htf));
    return result;
}

// ===== BUILD HIERARCHICAL METRICS: HTF → Session → Condition → Tags → LTF → Quality =====
function buildHierarchicalMetrics(trades: Trade[]): HtfExpandedMetric[] {
    // Type for the deepest stats accumulator
    type Stats = { wins: number; losses: number; pnl: number; rMultiples: number[] };

    // 6-level nested map: HTF → Session → Condition → TagCombo → LTF → Quality
    type QualityMap = Map<string, Stats>;
    type LtfMap = Map<string, QualityMap>;
    type TagMap = Map<string, LtfMap>;
    type ConditionMap = Map<string, TagMap>;
    type SessionMap = Map<string, ConditionMap>;
    type HtfMap = Map<string, SessionMap>;

    const htfMap: HtfMap = new Map();

    trades.forEach(trade => {
        const htf = trade.tfAnalise || 'N/A';
        const session = trade.session || 'N/A';
        const condition = trade.market_condition_v2 || 'N/A';
        const tagCombo = trade.tags
            ? (trade.tags === '#SemConfluencias' ? 'Sem Confluências' : trade.tags.split(',').map(t => t.trim()).filter(Boolean).sort().join(' + '))
            : 'Sem Confluências';
        const ltf = trade.tfEntrada || 'N/A';
        const quality = trade.entry_quality || 'N/A';
        const pnl = trade.pnl || 0;
        const isWin = trade.outcome === 'win';
        const isLoss = trade.outcome === 'loss';

        // Navigate/create the nested structure
        if (!htfMap.has(htf)) htfMap.set(htf, new Map());
        const sessionMap = htfMap.get(htf)!;
        if (!sessionMap.has(session)) sessionMap.set(session, new Map());
        const conditionMap = sessionMap.get(session)!;
        if (!conditionMap.has(condition)) conditionMap.set(condition, new Map());
        const tagMap = conditionMap.get(condition)!;
        if (!tagMap.has(tagCombo)) tagMap.set(tagCombo, new Map());
        const ltfMapLocal = tagMap.get(tagCombo)!;
        if (!ltfMapLocal.has(ltf)) ltfMapLocal.set(ltf, new Map());
        const qualityMap = ltfMapLocal.get(ltf)!;
        if (!qualityMap.has(quality)) qualityMap.set(quality, { wins: 0, losses: 0, pnl: 0, rMultiples: [] });

        const stats = qualityMap.get(quality)!;
        if (isWin) stats.wins++;
        else if (isLoss) stats.losses++;
        stats.pnl += pnl;

        // Calculate R-Multiple
        let rMultiple = trade.rMultiple;
        if (rMultiple === undefined || rMultiple === null) {
            if (trade.entryPrice && trade.stopLoss && trade.lot && pnl !== 0) {
                const riskInPoints = Math.abs(trade.entryPrice - trade.stopLoss);
                if (riskInPoints > 0) {
                    const expectedRisk = riskInPoints * trade.lot;
                    if (expectedRisk > 0) {
                        rMultiple = pnl / expectedRisk;
                    }
                }
            }
        }
        if (rMultiple !== undefined && rMultiple !== null && !isNaN(rMultiple)) {
            stats.rMultiples.push(rMultiple);
        }
    });

    // Helper to calculate aggregated stats
    const calcStats = (wins: number, losses: number, pnl: number, rMultiples: number[]): BaseStats => {
        const total = wins + losses;
        return {
            wins,
            losses,
            pnl,
            winRate: total > 0 ? (wins / total) * 100 : 0,
            avgRR: rMultiples.length > 0 ? rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length : null,
            totalTrades: total
        };
    };

    // Build the result from the nested maps
    const result: HtfExpandedMetric[] = [];

    htfMap.forEach((sessionMap, htf) => {
        let htfWins = 0, htfLosses = 0, htfPnl = 0;
        const htfRMultiples: number[] = [];
        const sessionBreakdown: SessionMetric[] = [];

        sessionMap.forEach((conditionMap, session) => {
            let sessWins = 0, sessLosses = 0, sessPnl = 0;
            const sessRMultiples: number[] = [];
            const conditionBreakdown: ConditionMetric[] = [];

            conditionMap.forEach((tagMap, condition) => {
                let condWins = 0, condLosses = 0, condPnl = 0;
                const condRMultiples: number[] = [];
                const tagBreakdown: TagExpandedMetric[] = [];

                tagMap.forEach((ltfMapLocal, tagCombo) => {
                    let tagWins = 0, tagLosses = 0, tagPnl = 0;
                    const tagRMultiples: number[] = [];
                    const ltfBreakdown: LtfExpandedMetric[] = [];

                    ltfMapLocal.forEach((qualityMap, ltf) => {
                        let ltfWins = 0, ltfLosses = 0, ltfPnl = 0;
                        const ltfRMultiples: number[] = [];
                        const qualityBreakdown: QualityMetric[] = [];

                        qualityMap.forEach((stats, quality) => {
                            ltfWins += stats.wins;
                            ltfLosses += stats.losses;
                            ltfPnl += stats.pnl;
                            ltfRMultiples.push(...stats.rMultiples);

                            qualityBreakdown.push({
                                quality,
                                icon: getQualityIcon(quality),
                                ...calcStats(stats.wins, stats.losses, stats.pnl, stats.rMultiples)
                            });
                        });

                        qualityBreakdown.sort((a, b) => b.totalTrades - a.totalTrades);
                        tagWins += ltfWins; tagLosses += ltfLosses; tagPnl += ltfPnl;
                        tagRMultiples.push(...ltfRMultiples);

                        ltfBreakdown.push({
                            ltf,
                            qualityBreakdown,
                            ...calcStats(ltfWins, ltfLosses, ltfPnl, ltfRMultiples)
                        });
                    });

                    ltfBreakdown.sort((a, b) => b.totalTrades - a.totalTrades);
                    condWins += tagWins; condLosses += tagLosses; condPnl += tagPnl;
                    condRMultiples.push(...tagRMultiples);

                    tagBreakdown.push({
                        tagCombo,
                        ltfBreakdown,
                        ...calcStats(tagWins, tagLosses, tagPnl, tagRMultiples)
                    });
                });

                tagBreakdown.sort((a, b) => b.totalTrades - a.totalTrades);
                sessWins += condWins; sessLosses += condLosses; sessPnl += condPnl;
                sessRMultiples.push(...condRMultiples);

                conditionBreakdown.push({
                    condition,
                    icon: getConditionIcon(condition),
                    tagBreakdown,
                    ...calcStats(condWins, condLosses, condPnl, condRMultiples)
                });
            });

            conditionBreakdown.sort((a, b) => b.totalTrades - a.totalTrades);
            htfWins += sessWins; htfLosses += sessLosses; htfPnl += sessPnl;
            htfRMultiples.push(...sessRMultiples);

            sessionBreakdown.push({
                session,
                icon: getSessionIcon(session),
                conditionBreakdown,
                ...calcStats(sessWins, sessLosses, sessPnl, sessRMultiples)
            });
        });

        sessionBreakdown.sort((a, b) => b.totalTrades - a.totalTrades);

        result.push({
            htf,
            sessionBreakdown,
            ...calcStats(htfWins, htfLosses, htfPnl, htfRMultiples)
        });
    });

    result.sort((a, b) => getTimeframePriority(b.htf) - getTimeframePriority(a.htf));
    return result;
}

export function usePlaybookMetrics(trades: Trade[]) {
    const nestedMetrics = useMemo(() => buildNestedMetrics(trades), [trades]);
    const hierarchicalMetrics = useMemo(() => buildHierarchicalMetrics(trades), [trades]);

    return {
        nestedMetrics,
        hierarchicalMetrics
    };
}
