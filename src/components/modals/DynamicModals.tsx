/**
 * Dynamic imports for heavy modal components
 * Reduces initial bundle size by loading modals on-demand
 */
import dynamic from "next/dynamic";

// Loading skeleton for modals
// Returns null to avoid flash of empty modal during lazy load
// The actual modal components handle their own isOpen logic
function ModalSkeleton() {
  return null; // Don't show skeleton - modal handles visibility
}

// Trade Modals
export const CreateTradeModal = dynamic(
  () =>
    import("@/components/trades/CreateTradeModal").then((mod) => ({
      default: mod.CreateTradeModal,
    })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

export const EditTradeModal = dynamic(
  () =>
    import("@/components/trades/EditTradeModal").then((mod) => ({ default: mod.EditTradeModal })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

// Playbook Modals
export const PlaybookFormModal = dynamic(
  () =>
    import("@/components/playbook/PlaybookFormModal").then((mod) => ({
      default: mod.PlaybookFormModal,
    })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

export const ViewPlaybookModal = dynamic(
  () =>
    import("@/components/playbook/ViewPlaybookModal").then((mod) => ({
      default: mod.ViewPlaybookModal,
    })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

export const SharePlaybookModal = dynamic(
  () =>
    import("@/components/playbook/SharePlaybookModal").then((mod) => ({
      default: mod.SharePlaybookModal,
    })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

// Journal Modals
export const JournalEntryModal = dynamic(
  () =>
    import("@/components/journal/JournalEntryModal").then((mod) => ({
      default: mod.JournalEntryModal,
    })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

// Account Modals
export const CreateAccountModal = dynamic(
  () =>
    import("@/components/accounts/CreateAccountModal").then((mod) => ({
      default: mod.CreateAccountModal,
    })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

export const EditAccountModal = dynamic(
  () =>
    import("@/components/accounts/EditAccountModal").then((mod) => ({
      default: mod.EditAccountModal,
    })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

// Settings Modals
export const SettingsModal = dynamic(
  () =>
    import("@/components/settings/SettingsModal").then((mod) => ({ default: mod.SettingsModal })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

// Laboratory Modals (heavy with complex forms)
// Laboratory Modals (heavy with complex forms)
export const RecapFormModal = dynamic(
  () =>
    import("@/components/laboratory/RecapFormModal").then((mod) => ({
      default: mod.RecapFormModal,
    })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

export const ExperimentFormModal = dynamic(
  () =>
    import("@/components/laboratory/ExperimentFormModal").then((mod) => ({
      default: mod.ExperimentFormModal,
    })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

// Import & Detail Modals
export const ImportModal = dynamic(
  () => import("@/components/import/ImportModal").then((mod) => ({ default: mod.ImportModal })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

export const DayDetailModal = dynamic(
  () =>
    import("@/components/journal/DayDetailModal").then((mod) => ({ default: mod.DayDetailModal })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);
