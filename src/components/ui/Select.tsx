"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

// Context to share state between components
interface SelectContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string | undefined;
  onValueChange: (value: string) => void;
  placeholder?: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  setTriggerNode: (node: HTMLButtonElement | null) => void;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

const Select = ({
  children,
  value,
  onValueChange,
  open: controlledOpen,
  onOpenChange,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  // Ref for the trigger element to measure position
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange]
  );

  // Close on click outside
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is inside the trigger container
      if (ref.current && ref.current.contains(target)) {
        return;
      }
      // Check if click is inside the portaled SelectContent
      const selectContent = document.querySelector("[data-select-content]");
      if (selectContent && selectContent.contains(target)) {
        return;
      }
      // If neither, close the dropdown
      setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen]);

  // Callback to set trigger node (avoids mutating context ref directly)
  const setTriggerNode = React.useCallback((node: HTMLButtonElement | null) => {
    (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
  }, []);

  return (
    <SelectContext.Provider
      value={{
        open: !!open,
        setOpen,
        value,
        onValueChange: onValueChange || (() => {}),
        triggerRef,
        setTriggerNode,
      }}
    >
      <div ref={ref} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectGroup = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={className}>{children}</div>;
};

const SelectValue = ({ placeholder, className }: { placeholder?: string; className?: string }) => {
  const context = React.useContext(SelectContext);
  // Logic to display value usually happens in parent or Trigger extracts it differently.
  // Radix way: child of Trigger.

  // Since we don't have easy access to the *label* of the selected item here without traversing children,
  // we rely on the consumer passing the label OR we can try to find it.
  // However, most of our usage passes children to SelectValue, or relies on placeholder.

  // For this specific replacement, users often put conditional rendering inside Trigger:
  // {value ? ... : <SelectValue placeholder="..." />}

  // If this component is rendered, it generally means "show the placeholder" if no value, or "Show value".
  // Simplified:
  return (
    <span className={cn("block truncate", className)}>
      {context?.value || placeholder}
      {/* 
         Note: This is a simplification. Real Radix SelectValue can look up the label.
         In our current usage in TradeForm, we largely handle display logic manually 
         with `SelectValueWithIcon` or conditional rendering.
         Where `<SelectValue placeholder="..."/>` is used, it expects to show placeholder if empty.
      */}
    </span>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);

  return (
    <button
      ref={(node) => {
        // Handle forwarded ref
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        // Set trigger node via callback (not modifying context ref directly)
        context?.setTriggerNode(node);
      }}
      type="button"
      onClick={() => {
        if (props.disabled) return;
        context?.setOpen(!context.open);
      }}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-sm ring-offset-transparent placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 [&>span]:line-clamp-1",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { position?: "popper" | "item-aligned" }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ className, children, position = "popper", ...props }, ref) => {
  const context = React.useContext(SelectContext);
  const [coords, setCoords] = React.useState<{ top: number; left: number; width: number } | null>(
    null
  );

  React.useEffect(() => {
    if (context?.open && context.triggerRef.current) {
      let rafId: number;
      let debounceTimer: ReturnType<typeof setTimeout>;

      const updatePosition = () => {
        if (context.triggerRef.current) {
          const rect = context.triggerRef.current.getBoundingClientRect();
          setCoords({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
          });
        }
      };

      // Deferred initial position calculation for faster response
      rafId = requestAnimationFrame(updatePosition);

      // Debounced handler for scroll/resize events
      const debouncedUpdate = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          rafId = requestAnimationFrame(updatePosition);
        }, 16); // ~60fps
      };

      window.addEventListener("resize", debouncedUpdate);
      window.addEventListener("scroll", debouncedUpdate, true);

      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(debounceTimer);
        window.removeEventListener("resize", debouncedUpdate);
        window.removeEventListener("scroll", debouncedUpdate, true);
      };
    }
  }, [context?.open, context?.triggerRef]);

  if (!context?.open || !coords) return null;

  return createPortal(
    <div
      ref={ref}
      data-select-content
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        width: coords.width,
        zIndex: 9999,
      }}
      className={cn(
        "animate-in fade-in-0 zoom-in-95 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-md dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
        className
      )}
      {...props}
    >
      <div className="max-h-96 overflow-y-auto p-1 text-sm">{children}</div>
    </div>,
    document.body
  );
});
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />
  )
);
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  const isSelected = context?.value === value;

  return (
    <div
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        context?.onValueChange(value);
        context?.setOpen(false);
      }}
      className={cn(
        "relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none hover:bg-[#2a333a] data-disabled:pointer-events-none data-disabled:opacity-50",
        isSelected && "bg-[#2a333a]",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      <span className="flex w-full items-center truncate text-left">{children}</span>
    </div>
  );
});
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-slate-100 dark:bg-slate-800", className)}
      {...props}
    />
  )
);
SelectSeparator.displayName = "SelectSeparator";

// Mock Scroll buttons as they are implicit in native scroll or standard div scroll
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SelectScrollUpButton = (_props: React.HTMLAttributes<HTMLDivElement>) => null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SelectScrollDownButton = (_props: React.HTMLAttributes<HTMLDivElement>) => null;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
