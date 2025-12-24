/**
 * Dynamic imports for heavy modal components
 * Reduces initial bundle size by loading modals on-demand
 */
import dynamic from "next/dynamic";

// Loading skeleton for modals
function ModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-900 p-8">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-gray-800"></div>
        <div className="space-y-4">
          <div className="h-12 w-full animate-pulse rounded bg-gray-800"></div>
          <div className="h-12 w-full animate-pulse rounded bg-gray-800"></div>
          <div className="h-32 w-full animate-pulse rounded bg-gray-800"></div>
        </div>
      </div>
    </div>
  );
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

export const CreateExperimentModal = dynamic(
  () =>
    import("@/components/laboratory/CreateExperimentModal").then((mod) => ({
      default: mod.CreateExperimentModal,
    })),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);
