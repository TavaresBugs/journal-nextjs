"use client";

import { useState, useEffect, useRef, forwardRef } from "react";
import { Input } from "./Input";

interface DebouncedInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  value: string;
  onDebouncedChange: (value: string) => void;
  debounceMs?: number;
  label?: string;
  error?: string;
}

/**
 * Input component with built-in debounce to prevent excessive re-renders.
 * Updates local state immediately for smooth typing, but only propagates
 * changes to parent after debounce delay.
 */
export const DebouncedInput = forwardRef<HTMLInputElement, DebouncedInputProps>(
  ({ value: externalValue, onDebouncedChange, debounceMs = 300, ...props }, ref) => {
    const [localValue, setLocalValue] = useState(externalValue);
    const [isTyping, setIsTyping] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    // Sync with external value when not typing
    useEffect(() => {
      if (!isTyping && externalValue !== localValue) {
        setLocalValue(externalValue);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [externalValue, isTyping]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      setIsTyping(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onDebouncedChange(newValue);
        setIsTyping(false);
      }, debounceMs);
    };

    // Clean up timeout on unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    // Trigger immediate update on blur to not lose data
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        onDebouncedChange(localValue);
        setIsTyping(false);
      }
      props.onBlur?.(e);
    };

    return (
      <Input {...props} ref={ref} value={localValue} onChange={handleChange} onBlur={handleBlur} />
    );
  }
);

DebouncedInput.displayName = "DebouncedInput";
