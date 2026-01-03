import React from "react";
import { Button } from "@/components/ui";

export interface ModalFooterActionsProps {
  /** 
    /** 
     * Define o padrão de botões:
     * - 'save-cancel': [Cancelar (ghost)] [Salvar (primary/success)]
     * - 'create-close': [Fechar (ghost)] [Criar (primary/success)]
     * - 'close-only': [Fechar (ghost)]
     * - 'destructive': [Cancelar (ghost)] [Excluir (danger)]
     * - 'custom': Permite customização manual
     */
  mode?: "save-cancel" | "create-close" | "close-only" | "destructive" | "custom";

  /** Variantes de estilo para o botão primário */
  primaryVariant?:
    | "primary"
    | "success"
    | "danger"
    | "zorin-primary"
    | "gradient-success"
    | "solid-danger";

  /** Handlers */
  onPrimary?: () => void;
  onSecondary?: () => void;

  /** Labels (com defaults inteligentes baseados no mode) */
  primaryLabel?: string;
  secondaryLabel?: string;

  /** States */
  isLoading?: boolean;
  disabled?: boolean;

  /** Se true, botões ocupam (flex-1) cada um. Útil para mobile/formulários. */
  isFullWidth?: boolean;

  /** Se true, o botão primário será type="submit" e onPrimary será opcional */
  isSubmit?: boolean;

  className?: string;

  /** Conteúdo customizado para mode='custom' */
  children?: React.ReactNode;
}

export function ModalFooterActions({
  mode = "save-cancel",
  primaryVariant,
  onPrimary,
  onSecondary,
  primaryLabel,
  secondaryLabel,
  isLoading = false,
  disabled = false,
  isFullWidth = true,
  isSubmit = false,
  className = "",
  children,
}: ModalFooterActionsProps) {
  if (mode === "custom") {
    return (
      <div
        className={`flex items-center justify-end gap-3 border-t border-gray-700 pt-4 ${className}`}
      >
        {children}
      </div>
    );
  }

  // Defaults based on mode
  const getLabels = () => {
    switch (mode) {
      case "create-close":
        return { primary: "Criar", secondary: "Fechar" };
      case "save-cancel":
        return { primary: "Salvar", secondary: "Cancelar" };
      case "destructive":
        return { primary: "Excluir", secondary: "Cancelar" };
      case "close-only":
        return { primary: "Fechar", secondary: "" };
      default:
        return { primary: "Confirmar", secondary: "Cancelar" };
    }
  };

  const defaults = getLabels();
  const finalPrimaryLabel = primaryLabel || defaults.primary;
  const finalSecondaryLabel = secondaryLabel || defaults.secondary;

  // Determine default variant if not provided
  const finalPrimaryVariant =
    primaryVariant ||
    (mode === "destructive" ? "danger" : mode === "close-only" ? "solid-danger" : "zorin-primary");

  if (mode === "close-only") {
    return (
      <div className={`flex justify-end border-t border-gray-700 pt-4 ${className}`}>
        <Button
          variant={finalPrimaryVariant}
          onClick={onPrimary}
          className={isFullWidth ? "flex-1" : ""}
          disabled={disabled}
          size="lg"
        >
          {finalPrimaryLabel}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-end gap-3 border-t border-gray-700 pt-4 ${className}`}
    >
      {onSecondary && (
        <Button
          type="button"
          variant="solid-danger"
          onClick={onSecondary}
          disabled={isLoading || disabled}
          className={`font-semibold ${isFullWidth ? "flex-1" : ""}`}
          size="lg"
        >
          {finalSecondaryLabel}
        </Button>
      )}

      <Button
        type={isSubmit ? "submit" : "button"}
        variant={finalPrimaryVariant}
        onClick={onPrimary}
        isLoading={isLoading}
        disabled={disabled || isLoading}
        className={`font-bold ${isFullWidth ? "flex-1" : ""}`}
        size="lg"
      >
        {finalPrimaryLabel}
      </Button>
    </div>
  );
}
