import React, { useId } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({
    label,
    error,
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
                </label>
            )}
            <input
                id={id}
                className={cn(
                    // Glass base - dark transparent background
                    "w-full px-3 py-2 bg-black/20 backdrop-blur-sm border rounded-lg",
                    // Text
                    "text-gray-200 text-sm placeholder-gray-500",
                    // Focus - Green accent ring
                    "focus:outline-none focus:ring-1 focus:ring-[#00c853] focus:border-transparent transition-all duration-200",
                    // Error state
                    error ? 'border-red-500' : 'border-white/10',
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
                    // Glass base - dark transparent background
                    "w-full px-4 py-2.5 bg-black/20 backdrop-blur-sm border rounded-lg",
                    // Text
                    "text-gray-200 placeholder-gray-500",
                    // Focus - Green accent ring
                    "focus:outline-none focus:ring-1 focus:ring-[#00c853] focus:border-transparent transition-all duration-200 resize-vertical",
                    // Error state
                    error ? "border-red-500" : "border-white/10",
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
