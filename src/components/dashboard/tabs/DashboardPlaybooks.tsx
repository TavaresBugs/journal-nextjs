import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { PlaybookGrid } from "@/components/playbook/PlaybookGrid";
import { Trade, Playbook, PlaybookStats } from "@/types";

interface DashboardPlaybooksProps {
  accountId: string;
  trades: Trade[]; // Unused but kept for compatibility
  playbooks: Playbook[];
  currency: string;
  stats?: PlaybookStats[]; // New prop
  onLoadStats?: () => Promise<void>; // New prop

  // Actions
  onCreatePlaybook: () => void;
  onEditPlaybook: (playbook: Playbook) => void;
  onDeletePlaybook: (playbookId: string) => Promise<void>;
  onViewPlaybook: (playbook: Playbook) => void;
  onSharePlaybook: (playbook: Playbook) => void;
}

export function DashboardPlaybooks({
  playbooks,
  currency,
  stats = [],
  onLoadStats,
  onCreatePlaybook,
  onEditPlaybook,
  onDeletePlaybook,
  onViewPlaybook,
  onSharePlaybook,
}: DashboardPlaybooksProps) {
  const [isLoading, setIsLoading] = useState(stats.length === 0);

  useEffect(() => {
    let mounted = true;

    async function init() {
      // If we already have stats, we don't necessarily look loading, but we might want to refresh if null
      if (stats.length === 0) setIsLoading(true);

      try {
        if (onLoadStats) {
          await onLoadStats();
        }
      } catch (error) {
        console.error("Failed to load playbook stats", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [onLoadStats, stats.length]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>📖 Playbook</CardTitle>
        <Button variant="gradient-success" onClick={onCreatePlaybook} leftIcon={<span>+</span>}>
          Criar Playbook
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <PlaybookGrid
            stats={stats}
            playbooks={playbooks}
            currency={currency}
            onEdit={onEditPlaybook}
            onDelete={onDeletePlaybook}
            onView={onViewPlaybook}
            onShare={onSharePlaybook}
          />
        )}
      </CardContent>
    </Card>
  );
}
