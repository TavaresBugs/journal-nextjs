import React, { useId } from "react";
import { cn } from "@/lib/utils/general";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  warning?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, warning, className = "", ...props }, ref) => {
    const generatedId = useId();
    const id = props.id || generatedId;
    // Extract layout classes that need to be on the wrapper
    const hasFlexGrow = className.includes("flex-1");
    const heightMatch = className.match(/h-\d+/);
    const wrapperClasses = cn(
      "flex flex-col gap-1.5",
      hasFlexGrow && "flex-1",
      heightMatch && heightMatch[0]
    );

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-gray-400">
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            // Glass base - Specific user requested color
            "h-12 w-full rounded-lg border bg-[#232b32] px-3",
            // Text
            "text-sm text-gray-100 placeholder-gray-500",
            // Focus - Cyan focus to match DatePicker
            "transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none",
            // Error/Warning state
            error
              ? "border-red-500 focus:ring-red-500"
              : warning
                ? "border-amber-500 focus:ring-amber-500"
                : "border-gray-700",
            // Number input fixes
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            "scheme-dark",
            "[&::-webkit-calendar-picker-indicator]:filter-invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-400">{error}</span>}
        {!error && warning && <span className="text-xs text-amber-400">{warning}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    const generatedId = useId();
    const textareaId = props.id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="mb-2 block text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            // Glass base - Specific user requested color
            "w-full rounded-lg border bg-[#232b32] px-4 py-2.5",
            // Text
            "text-gray-100 placeholder-gray-500",
            // Focus - Cyan focus to match DatePicker
            "resize-vertical transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none",
            // Error state
            error ? "border-red-500" : "border-gray-700",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
