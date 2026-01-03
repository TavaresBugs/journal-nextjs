"use client";

import { useState } from "react";
import { Modal, IconActionButton, SegmentedToggle } from "@/components/ui";
import { TabPanel } from "@/components/ui/Tabs";
import { PlaybookReviewTab } from "./PlaybookReviewTab";
import { PlaybookRulesDisplay } from "./PlaybookRulesDisplay";
import type { Playbook, Trade } from "@/types";

interface ViewPlaybookModalProps {
  isOpen: boolean;
  onClose: () => void;
  playbook: Playbook | null;
  onEdit?: (playbook: Playbook) => void;
  trades?: Trade[];
  currency?: string;
}

export function ViewPlaybookModal({
  isOpen,
  onClose,
  playbook,
  onEdit,
  trades = [],
  currency = "USD",
}: ViewPlaybookModalProps) {
  const [activeTab, setActiveTab] = useState("info");

  if (!playbook) return null;

  // Filter trades that match this playbook strategy
  const playbookTrades = trades.filter((t) => t.strategy === playbook.name);

  const handleClose = () => {
    setActiveTab("info"); // Reset to info tab on close
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${playbook.icon} ${playbook.name}`}
      maxWidth="5xl"
      headerActions={
        onEdit && activeTab === "info" ? (
          <IconActionButton
            variant="edit"
            size="md"
            onClick={() => {
              onEdit(playbook);
              handleClose();
            }}
            className="[&_svg]:h-6 [&_svg]:w-6"
          />
        ) : undefined
      }
    >
      <div className="min-h-[500px] space-y-6 transition-all duration-300 ease-in-out">
        {/* Description (if exists) */}
        {playbook.description && (
          <p className="px-1 text-sm leading-relaxed text-gray-400">{playbook.description}</p>
        )}

        {/* Tabs */}
        <SegmentedToggle
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: "info", label: <>📋 Info</> },
            { value: "relatorios", label: <>📊 Relatórios</> },
          ]}
        />

        {/* Tab: Info (Rules) */}
        <TabPanel value="info" activeTab={activeTab}>
          <PlaybookRulesDisplay ruleGroups={playbook.ruleGroups} />
        </TabPanel>

        {/* Tab: Relatórios (Analytics) */}
        <TabPanel value="relatorios" activeTab={activeTab}>
          <PlaybookReviewTab trades={playbookTrades} currency={currency} />
        </TabPanel>
      </div>
    </Modal>
  );
}
