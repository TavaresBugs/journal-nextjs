import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { PlaybookGrid } from '@/components/playbook/PlaybookGrid';
import { Trade, Playbook } from '@/types';

interface DashboardPlaybooksProps {
    trades: Trade[];
    playbooks: Playbook[];
    currency: string;

    // Actions
    onCreatePlaybook: () => void;
    onEditPlaybook: (playbook: Playbook) => void;
    onDeletePlaybook: (playbookId: string) => Promise<void>;
    onViewPlaybook: (playbook: Playbook) => void;
    onSharePlaybook: (playbook: Playbook) => void;
}

export function DashboardPlaybooks({
    trades,
    playbooks,
    currency,
    onCreatePlaybook,
    onEditPlaybook,
    onDeletePlaybook,
    onViewPlaybook,
    onSharePlaybook
}: DashboardPlaybooksProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>📖 Playbook</CardTitle>
                <Button
                    variant="gradient-success"
                    onClick={onCreatePlaybook}
                    leftIcon={<span>+</span>}
                >
                    Criar Playbook
                </Button>
            </CardHeader>
            <CardContent>
               <PlaybookGrid
                    trades={trades}
                    playbooks={playbooks}
                    currency={currency}
                    onEdit={onEditPlaybook}
                    onDelete={onDeletePlaybook}
                    onView={onViewPlaybook}
                    onShare={onSharePlaybook}
               />
            </CardContent>
        </Card>
    );
}
