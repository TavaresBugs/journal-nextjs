import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useBlockBodyScroll } from "@/hooks/useBlockBodyScroll";
import { IconActionButton } from "@/components/ui/IconActionButton";

describe("Hooks and UI Utils", () => {
    
  describe("useBlockBodyScroll", () => {
      // Mock window.scrollTo
      const originalScrollTo = window.scrollTo;
      
      beforeEach(() => {
        window.scrollTo = vi.fn();
        Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
        
        // Reset body styles
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
      });

      afterEach(() => {
        window.scrollTo = originalScrollTo;
        // Need to simulate component unmounting for cleanup? 
        // Test runner does this usually if we unmount manually.
      });

      it("should lock body scroll when open", () => {
          // We need a test component to use the hook
          const TestComponent = ({ open }: { open: boolean }) => {
              useBlockBodyScroll(open);
              return null;
          };

          const { unmount } = render(<TestComponent open={true} />);
          
          expect(document.body.style.overflow).toBe("hidden");
          expect(document.body.style.position).toBe("fixed");
          expect(document.body.style.top).toBe("-100px");
          
          unmount();
          
          expect(document.body.style.overflow).toBe("");
          expect(window.scrollTo).toHaveBeenCalledWith(0, 100);
      });

      it("should not lock if not open", () => {
          const TestComponent = ({ open }: { open: boolean }) => {
              useBlockBodyScroll(open);
              return null;
          };

          render(<TestComponent open={false} />);
          
          expect(document.body.style.overflow).toBe("");
      });

      it("should handle nested locks", () => {
          const TestComponent = ({ open }: { open: boolean }) => {
              useBlockBodyScroll(open);
              return null;
          };

          // Render first modal
          const { unmount: unmount1 } = render(<TestComponent open={true} />);
          expect(document.body.style.overflow).toBe("hidden");

          // Render second modal
          const { unmount: unmount2 } = render(<TestComponent open={true} />);
          expect(document.body.style.overflow).toBe("hidden"); // Still hidden

          // Unmount second (nested)
          unmount2();
          expect(document.body.style.overflow).toBe("hidden"); // Still hidden, count is 1

          // Unmount first
          unmount1();
          expect(document.body.style.overflow).toBe(""); // Released
      });
  });

  describe("IconActionButton", () => {
      it("should render with correct variant icon and title", () => {
          render(<IconActionButton variant="edit" />);
          expect(screen.getByRole("button")).toBeInTheDocument();
          // Title might be on button or svg? Component puts it on button title
          // The component uses title attribute on button
          expect(screen.getByTitle("Editar")).toBeInTheDocument();
      });

      it("should support custom title", () => {
          render(<IconActionButton variant="delete" title="Remover" />);
          expect(screen.getByTitle("Remover")).toBeInTheDocument();
      });

      it("should support sizes", () => {
          render(<IconActionButton variant="back" size="lg" />);
          const btn = screen.getByRole("button");
          // Check for padding class based on size config
          // lg -> p-3
          expect(btn).toHaveClass("p-3");
      });

      it("should call onClick", () => {
          const handleClick = vi.fn();
          render(<IconActionButton variant="close" onClick={handleClick} />);
          fireEvent.click(screen.getByRole("button"));
          expect(handleClick).toHaveBeenCalled();
      });
  });
});
