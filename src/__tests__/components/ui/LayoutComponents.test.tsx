import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ModalFooterActions } from "@/components/ui/ModalFooterActions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Tabs, TabPanel } from "@/components/ui/Tabs";

describe("Layout Components", () => {
    
  describe("ModalFooterActions", () => {
    it("should render save-cancel buttons by default", () => {
      render(<ModalFooterActions onPrimary={() => {}} onSecondary={() => {}} />);
      expect(screen.getByText("Salvar")).toBeInTheDocument();
      expect(screen.getByText("Cancelar")).toBeInTheDocument();
    });

    it("should render custom buttons", () => {
        render(<ModalFooterActions mode="custom"><button>Custom</button></ModalFooterActions>);
        expect(screen.getByText("Custom")).toBeInTheDocument();
    });

    it("should render create-close mode", () => {
        render(<ModalFooterActions mode="create-close" onPrimary={() => {}} onSecondary={() => {}} />);
        expect(screen.getByText("Criar")).toBeInTheDocument();
        expect(screen.getByText("Fechar")).toBeInTheDocument();
    });

    it("should render destructive mode", () => {
        render(<ModalFooterActions mode="destructive" onPrimary={() => {}} onSecondary={() => {}} />);
        expect(screen.getByText("Excluir")).toBeInTheDocument();
    });

    it("should render close-only mode", () => {
        render(<ModalFooterActions mode="close-only" onPrimary={() => {}} />);
        expect(screen.getByText("Fechar")).toBeInTheDocument();
    });

    it("should call handlers", () => {
        const primary = vi.fn();
        const secondary = vi.fn();
        render(<ModalFooterActions onPrimary={primary} onSecondary={secondary} />);
        
        fireEvent.click(screen.getByText("Salvar"));
        expect(primary).toHaveBeenCalled();

        fireEvent.click(screen.getByText("Cancelar"));
        expect(secondary).toHaveBeenCalled();
    });
  });

  describe("Card", () => {
    it("should render card content", () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Title</CardTitle>
                </CardHeader>
                <CardContent>Content</CardContent>
            </Card>
        );
        expect(screen.getByText("Title")).toBeInTheDocument();
        expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("should handle hover prop", () => {
        const { container } = render(<Card hover>Hover</Card>);
        expect(container.firstChild).toHaveClass("hover:border-cyan-500");
    });
    
     it("should handle click", () => {
        const handleClick = vi.fn();
        render(<Card onClick={handleClick}>Click</Card>);
        fireEvent.click(screen.getByText("Click"));
        expect(handleClick).toHaveBeenCalled();
    });
  });

  describe("Tabs", () => {
      const tabs = [
          { id: "tab1", label: "Tab 1" },
          { id: "tab2", label: "Tab 2" },
      ];

      it("should render tabs", () => {
          render(<Tabs tabs={tabs} activeTab="tab1" onChange={() => {}} />);
          expect(screen.getByText("Tab 1")).toBeInTheDocument();
          expect(screen.getByText("Tab 2")).toBeInTheDocument();
      });

      it("should call onChange", () => {
          const handleChange = vi.fn();
          render(<Tabs tabs={tabs} activeTab="tab1" onChange={handleChange} />);
          fireEvent.click(screen.getByText("Tab 2"));
          expect(handleChange).toHaveBeenCalledWith("tab2");
      });

      it("should render TabPanel only when active", () => {
          render(
              <>
                <TabPanel value="tab1" activeTab="tab1">Panel 1</TabPanel>
                <TabPanel value="tab2" activeTab="tab1">Panel 2</TabPanel>
              </>
          );
          expect(screen.getByText("Panel 1")).toBeInTheDocument();
          expect(screen.queryByText("Panel 2")).not.toBeInTheDocument();
      });
  });
});
