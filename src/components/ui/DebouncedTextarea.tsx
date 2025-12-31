import { useState, useEffect, useRef, forwardRef } from "react";
// Textarea is exported from Input.tsx, but TextareaProps is not exported, so we redefine or pick it
import { Textarea } from "./Input";

interface DebouncedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onDebouncedChange: (value: string) => void;
  debounceMs?: number;
  label?: string;
  error?: string;
}

export const DebouncedTextarea = forwardRef<HTMLTextAreaElement, DebouncedTextareaProps>(
  ({ value: initialValue, onDebouncedChange, debounceMs = 300, ...props }, ref) => {
    const [value, setValue] = useState(initialValue);
    const [isTyping, setIsTyping] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    // Sync with external value when not typing (e.g. initial load or external update)
    // We only sync if the external value is DIFFERENT from local,
    // and we are NOT currently typing (to avoid cursor jumps or conflicts)
    useEffect(() => {
      if (!isTyping && initialValue !== value) {
        setValue(initialValue);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialValue, isTyping]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      setIsTyping(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onDebouncedChange(newValue);
        setIsTyping(false);
      }, debounceMs);
    };

    // Clean up timeout
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    // Ensure we trigger update on blur to not miss any data if user clicks Save instantly
    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        onDebouncedChange(value);
        setIsTyping(false);
      }
      props.onBlur?.(e);
    };

    return (
      <Textarea {...props} ref={ref} value={value} onChange={handleChange} onBlur={handleBlur} />
    );
  }
);

DebouncedTextarea.displayName = "DebouncedTextarea";
