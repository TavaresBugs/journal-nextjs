'use client';

import React from 'react';
import { GlassCard } from './GlassCard';

// ============================================
// FORM SECTION
// ============================================

interface FormSectionProps {
    /** Icon emoji for the section header */
    icon?: string;
    /** Section title */
    title: string;
    /** Section content */
    children: React.ReactNode;
    /** Additional className for the section */
    className?: string;
}

/**
 * Form section with header and GlassCard wrapper.
 * Used to group related form fields together.
 * 
 * @example
 * <FormSection icon="📊" title="Market Conditions">
 *   <FormRow cols={3}>
 *     <Input label="Condition" ... />
 *     <Input label="Strategy" ... />
 *     <Input label="Setup" ... />
 *   </FormRow>
 * </FormSection>
 */
export function FormSection({ icon, title, children, className = '' }: FormSectionProps) {
    return (
        <GlassCard className={`p-4 ${className}`}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700/50">
                {icon && <span className="text-lg">{icon}</span>}
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{title}</h3>
            </div>
            <div className="space-y-3">
                {children}
            </div>
        </GlassCard>
    );
}

// ============================================
// FORM ROW
// ============================================

interface FormRowProps {
    /** Number of columns (1-4) */
    cols?: 1 | 2 | 3 | 4;
    /** Row content (form fields) */
    children: React.ReactNode;
    /** Additional className */
    className?: string;
    /** Gap size */
    gap?: 2 | 3 | 4;
}

const colClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
};

const gapClasses: Record<number, string> = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
};

/**
 * Form row for horizontal field layout.
 * Creates a responsive grid for form fields.
 * 
 * @example
 * <FormRow cols={3}>
 *   <Input label="Entry Price" ... />
 *   <Input label="Stop Loss" ... />
 *   <Input label="Take Profit" ... />
 * </FormRow>
 */
export function FormRow({ cols = 2, children, className = '', gap = 3 }: FormRowProps) {
    return (
        <div className={`grid ${colClasses[cols]} ${gapClasses[gap]} ${className}`}>
            {children}
        </div>
    );
}

// ============================================
// FORM GROUP
// ============================================

interface FormGroupProps {
    /** Label for the group */
    label?: string;
    /** Whether the field is required */
    required?: boolean;
    /** Error message */
    error?: string;
    /** Warning message */
    warning?: string;
    /** Group content */
    children: React.ReactNode;
    /** Additional className */
    className?: string;
}

/**
 * Form group wrapper with label, error, and warning support.
 * Used for custom elements that don't use the Input component.
 * 
 * @example
 * <FormGroup label="Tags" error={errors.tags}>
 *   <TagsInput value={tags} onChange={setTags} />
 * </FormGroup>
 */
export function FormGroup({ label, required, error, warning, children, className = '' }: FormGroupProps) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label className="text-xs font-medium text-gray-400">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            {children}
            {error && <span className="text-xs text-red-400">{error}</span>}
            {warning && !error && <span className="text-xs text-amber-400">{warning}</span>}
        </div>
    );
}
