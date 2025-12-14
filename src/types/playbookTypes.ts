import type { Trade } from '@/types';

export interface PlaybookReviewTabProps {
    trades: Trade[];
    currency: string;
}

export type ViewMode = 'htf' | 'heatmap' | 'report';

// Nested metrics interface: HTF -> Tag Combo -> LTF (legacy for heatmap)
export interface LtfMetric {
    ltf: string;
    wins: number;
    losses: number;
    pnl: number;
    winRate: number;
    avgRR: number | null;
    totalTrades: number;
}

export interface TagComboMetric {
    tagCombo: string;
    pdArray?: string; // Most common PD Array in this combo
    wins: number;
    losses: number;
    pnl: number;
    winRate: number;
    avgRR: number | null;
    totalTrades: number;
    ltfBreakdown: LtfMetric[];
}

export interface HtfNestedMetric {
    htf: string;
    wins: number;
    losses: number;
    pnl: number;
    winRate: number;
    avgRR: number | null;
    totalTrades: number;
    tagBreakdown: TagComboMetric[];
}

// ===== EXPANDED HIERARCHY: HTF → Condition → PD Array → Session → LTF → Tags =====
export interface BaseStats {
    wins: number;
    losses: number;
    pnl: number;
    winRate: number;
    avgRR: number | null;
    totalTrades: number;
}

export interface TagMetric extends BaseStats {
    tagCombo: string;
}

export interface LtfExpandedMetric extends BaseStats {
    ltf: string;
    tagBreakdown: TagMetric[];
}

export interface SessionMetric extends BaseStats {
    session: string;
    icon: string;
    ltfBreakdown: LtfExpandedMetric[];
}

export interface PdArrayExpandedMetric extends BaseStats {
    pdArray: string;
    icon: string;
    sessionBreakdown: SessionMetric[];
}

export interface ConditionMetric extends BaseStats {
    condition: string;
    icon: string;
    pdArrayBreakdown: PdArrayExpandedMetric[];
}

export interface HtfExpandedMetric extends BaseStats {
    htf: string;
    conditionBreakdown: ConditionMetric[];
}
