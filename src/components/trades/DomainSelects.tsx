'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';

// ============================================
// SHARED TYPES
// ============================================

interface DatalistInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    warning?: string;
    className?: string;
}

// ============================================
// TIMEFRAME SELECT
// ============================================

const HTF_OPTIONS = ['Monthly', 'Weekly', 'Daily', 'H4', 'H1', 'M15'];
const LTF_OPTIONS = ['Daily', 'H4', 'H1', 'M15', 'M5', 'M3', 'M1'];

interface TimeframeSelectProps extends DatalistInputProps {
    type: 'htf' | 'ltf';
}

/**
 * Timeframe selection input with HTF or LTF options.
 */
export function TimeframeSelect({ 
    type, 
    label, 
    value, 
    onChange, 
    onBlur, 
    placeholder,
    required,
    error,
    className 
}: TimeframeSelectProps) {
    const options = type === 'htf' ? HTF_OPTIONS : LTF_OPTIONS;
    const listId = `tf-${type}-list`;
    
    return (
        <div className={className}>
            <Input
                label={label}
                list={listId}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                placeholder={placeholder || (type === 'htf' ? 'H4' : 'M15')}
                required={required}
                error={error}
                autoComplete="off"
            />
            <datalist id={listId}>
                {options.map((opt) => <option key={opt} value={opt} />)}
            </datalist>
        </div>
    );
}

// ============================================
// DIRECTION SELECT
// ============================================

type DirectionSelectProps = DatalistInputProps;

/**
 * Trade direction selection (Long/Short).
 */
export function DirectionSelect({ 
    label, 
    value, 
    onChange, 
    onBlur,
    placeholder,
    required,
    error,
    className 
}: DirectionSelectProps) {
    return (
        <div className={className}>
            <Input
                label={label}
                list="direction-list"
                value={value}
                onChange={(e) => onChange(e.target.value as 'Long' | 'Short')}
                onBlur={onBlur}
                placeholder={placeholder || 'Long/Short'}
                required={required}
                error={error}
                autoComplete="off"
            />
            <datalist id="direction-list">
                <option value="Long" />
                <option value="Short" />
            </datalist>
        </div>
    );
}

// ============================================
// MARKET CONDITION SELECT
// ============================================

export const MARKET_CONDITIONS = [
    '↔️ Lateralidade',
    '📈 Tendência de Alta', 
    '📉 Tendência de Baixa', 
    '⚡ Rompimento'
];

type MarketConditionSelectProps = DatalistInputProps;

/**
 * Market condition selection input.
 */
export function MarketConditionSelect({ 
    label, 
    value, 
    onChange, 
    onBlur,
    placeholder,
    required,
    error,
    className 
}: MarketConditionSelectProps) {
    return (
        <div className={className}>
            <Input
                label={label}
                list="market-conditions-list"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                placeholder={placeholder || 'Tendência, Lateral...'}
                required={required}
                error={error}
                autoComplete="off"
            />
            <datalist id="market-conditions-list">
                {MARKET_CONDITIONS.map((cond) => <option key={cond} value={cond} />)}
            </datalist>
        </div>
    );
}

// ============================================
// PD ARRAY SELECT
// ============================================

export const PD_ARRAY_OPTIONS = [
    { value: 'FVG', label: '👑 FVG' },
    { value: 'MB', label: '🛡️ Mitigation Block' },
    { value: 'OB', label: '📦 Order Block' },
    { value: 'BB', label: '💥 Breaker' },
    { value: 'PXH', label: '🔺 PXH' },
    { value: 'PXL', label: '🔻 PXL' },
    { value: 'PDH', label: '⬆️ PDH' },
    { value: 'PDL', label: '⬇️ PDL' },
];

interface PdArraySelectProps extends DatalistInputProps {
    icon?: string;
}

/**
 * PD Array selection input with icon support.
 */
export function PdArraySelect({ 
    label, 
    value, 
    onChange, 
    onBlur,
    placeholder,
    required,
    error,
    className 
}: PdArraySelectProps) {
    const selectedOption = PD_ARRAY_OPTIONS.find(opt => opt.value === value);
    
    return (
        <div className={`relative ${className || ''}`}>
            <Input
                label={label}
                list="pd-array-list"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                placeholder={placeholder || 'FVG, OB...'}
                required={required}
                error={error}
                autoComplete="off"
                className={selectedOption ? 'pl-8' : ''}
            />
            {selectedOption && (
                <div className="absolute left-2.5 top-[38px] -translate-y-1/2 text-sm">
                    {selectedOption.label.split(' ')[0]}
                </div>
            )}
            <datalist id="pd-array-list">
                {PD_ARRAY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </datalist>
        </div>
    );
}

// ============================================
// ENTRY QUALITY SELECT
// ============================================

export const ENTRY_QUALITY_OPTIONS = [
    '🌟 Picture Perfect ST',
    '✅ Nice ST',
    '➖ Normal ST',
    '⚠️ Ugly ST'
];

type EntryQualitySelectProps = DatalistInputProps;

/**
 * Entry quality evaluation input.
 */
export function EntryQualitySelect({ 
    label, 
    value, 
    onChange, 
    onBlur,
    placeholder,
    required,
    error,
    className 
}: EntryQualitySelectProps) {
    return (
        <div className={className}>
            <Input
                label={label}
                list="entry-quality-list"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                placeholder={placeholder || '🌟 Picture Perfect...'}
                required={required}
                error={error}
                autoComplete="off"
            />
            <datalist id="entry-quality-list">
                {ENTRY_QUALITY_OPTIONS.map((opt) => <option key={opt} value={opt} />)}
            </datalist>
        </div>
    );
}

// ============================================
// ASSET SELECT
// ============================================

interface AssetSelectProps extends DatalistInputProps {
    assets: { symbol: string }[];
}

/**
 * Asset/symbol selection input.
 */
export function AssetSelect({ 
    label, 
    value, 
    onChange, 
    onBlur,
    placeholder,
    required,
    error,
    assets,
    className 
}: AssetSelectProps) {
    return (
        <div className={className}>
            <Input
                label={label}
                list="assets-list"
                value={value}
                onChange={(e) => onChange(e.target.value.toUpperCase())}
                onBlur={onBlur}
                placeholder={placeholder || 'EURUSD'}
                required={required}
                error={error}
                autoComplete="off"
                className="uppercase"
            />
            <datalist id="assets-list">
                {assets.map((asset) => <option key={asset.symbol} value={asset.symbol} />)}
            </datalist>
        </div>
    );
}
