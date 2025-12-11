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

// ===== EXPANDED HIERARCHY: HTF → Session → Condition → Tags → LTF → Quality =====
export interface BaseStats {
    wins: number;
    losses: number;
    pnl: number;
    winRate: number;
    avgRR: number | null;
    totalTrades: number;
}

export interface QualityMetric extends BaseStats {
    quality: string;
    icon: string;
}

export interface LtfExpandedMetric extends BaseStats {
    ltf: string;
    qualityBreakdown: QualityMetric[];
}

export interface TagExpandedMetric extends BaseStats {
    tagCombo: string;
    ltfBreakdown: LtfExpandedMetric[];
}

export interface ConditionMetric extends BaseStats {
    condition: string;
    icon: string;
    tagBreakdown: TagExpandedMetric[];
}

export interface SessionMetric extends BaseStats {
    session: string;
    icon: string;
    conditionBreakdown: ConditionMetric[];
}

export interface HtfExpandedMetric extends BaseStats {
    htf: string;
    sessionBreakdown: SessionMetric[];
}
