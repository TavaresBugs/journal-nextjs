import React, { useId } from 'react';
import { cn } from '@/lib/utils/general';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    warning?: string;
}

export function Input({
    label,
    error,
    warning,
    className = '',
    ...props
}: InputProps) {
    const generatedId = useId();
    const id = props.id || generatedId;

    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label
                    htmlFor={id}
                    className="text-xs font-medium text-gray-400"
                >
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                id={id}
                className={cn(
                    // Glass base - Specific user requested color
                    "w-full px-3 h-12 bg-[#232b32] border rounded-lg",
                    // Text
                    "text-gray-100 text-sm placeholder-gray-500",
                    // Focus - Cyan focus to match DatePicker
                    "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200",
                    // Error/Warning state
                    error 
                        ? 'border-red-500 focus:ring-red-500' 
                        : warning 
                            ? 'border-amber-500 focus:ring-amber-500' 
                            : 'border-gray-700',
                    // Number input fixes
                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                    "[color-scheme:dark]",
                    "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:filter-invert",
                    className
                )}
                {...props}
            />
            {error && (
                <span className="text-xs text-red-400">{error}</span>
            )}
            {!error && warning && (
                <span className="text-xs text-amber-400">{warning}</span>
            )}
        </div>
    );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
    const generatedId = useId();
    const textareaId = props.id || generatedId;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={textareaId}
                    className="block text-sm font-medium text-gray-300 mb-2"
                >
                    {label}
                </label>
            )}
            <textarea
                id={textareaId}
                className={cn(
                    // Glass base - Specific user requested color
                    "w-full px-4 py-2.5 bg-[#232b32] border rounded-lg",
                    // Text
                    "text-gray-100 placeholder-gray-500",
                    // Focus - Cyan focus to match DatePicker
                    "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 resize-vertical",
                    // Error state
                    error ? "border-red-500" : "border-gray-700",
                    className
                )}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-sm text-red-400">{error}</p>
            )}
        </div>
    );
}
