"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { createPortal } from "react-dom"

// Context to share state between components
interface SelectContextType {
  open: boolean
  setOpen: (open: boolean) => void
  value: string | undefined
  onValueChange: (value: string) => void
  placeholder?: string
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined)

const Select = ({
  children,
  value,
  onValueChange,
  open: controlledOpen,
  onOpenChange,
}: {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  // Ref for the trigger element to measure position
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const setOpen = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [isControlled, onOpenChange])

  // Close on click outside
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      // Check if click is inside the trigger container
      if (ref.current && ref.current.contains(target)) {
        return
      }
      // Check if click is inside the portaled SelectContent
      const selectContent = document.querySelector('[data-select-content]')
      if (selectContent && selectContent.contains(target)) {
        return
      }
      // If neither, close the dropdown
      setOpen(false)
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, setOpen])

  return (
    <SelectContext.Provider value={{ open: !!open, setOpen, value, onValueChange: onValueChange || (() => {}), triggerRef }}>
      <div ref={ref} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectGroup = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={className}>{children}</div>
}

const SelectValue = ({ placeholder, className }: { placeholder?: string; className?: string }) => {
  const context = React.useContext(SelectContext)
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
  )
}


const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  // Merge internal ref with forwarded ref
  const internalRef = context?.triggerRef
  
  return (
    <button
      ref={(node) => {
        // Handle both refs
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        if (internalRef) (internalRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }}
      type="button"
      onClick={() => context?.setOpen(!context.open)}
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 dark:border-slate-800 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { position?: "popper" | "item-aligned" }
>(({ className, children, position = "popper", ...props }, ref) => {
  const context = React.useContext(SelectContext)
  const [coords, setCoords] = React.useState<{ top: number; left: number; width: number } | null>(null)

  React.useLayoutEffect(() => {
    if (context?.open && context.triggerRef.current) {
        const updatePosition = () => {
            if (context.triggerRef.current) {
                const rect = context.triggerRef.current.getBoundingClientRect();
                // Use viewport-relative positions (works inside modals with scroll)
                setCoords({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: rect.width
                });
            }
        };
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true); // Capture phase to catch all scrolls
        
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }
  }, [context?.open]);

  if (!context?.open || !coords) return null

  return createPortal(
    <div
      ref={ref}
      data-select-content
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: coords.width,
        zIndex: 9999
      }}
      className={cn(
        "min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-md animate-in fade-in-0 zoom-in-95 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
        className
      )}
      {...props}
    >
      <div className="max-h-96 overflow-y-auto p-1 text-sm">
        {children}
      </div>
    </div>,
    document.body
  )
})
SelectContent.displayName = "SelectContent"

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = "SelectLabel"

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  const isSelected = context?.value === value

  return (
    <div
      ref={ref}
      onClick={(e) => {
        e.stopPropagation()
        context?.onValueChange(value)
        context?.setOpen(false)
      }}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-slate-800 dark:focus:bg-slate-800 dark:focus:text-slate-50 cursor-pointer",
        isSelected && "bg-slate-100 dark:bg-slate-800",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      <span className="truncate w-full text-left flex items-center">{children}</span>
    </div>
  )
})
SelectItem.displayName = "SelectItem"

const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-slate-100 dark:bg-slate-800", className)}
    {...props}
  />
))
SelectSeparator.displayName = "SelectSeparator"

// Mock Scroll buttons as they are implicit in native scroll or standard div scroll
const SelectScrollUpButton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => null;
const SelectScrollDownButton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => null;

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
}
