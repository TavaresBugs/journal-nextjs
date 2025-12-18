'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, TabPanel, SegmentedToggle } from '@/components/ui';
import { 
    ExperimentsTab, 
    RecapsTab, 
    CreateExperimentModal, 
    ViewExperimentModal,
    CreateRecapModal,
    ViewRecapModal,
    EditRecapModal 
} from '@/components/laboratory';
import { useLaboratoryStore, CreateExperimentData, CreateRecapData, UpdateRecapData } from '@/store/useLaboratoryStore';
import { useJournalStore } from '@/store/useJournalStore';
import type { LaboratoryExperiment, LaboratoryRecap, TradeLite, JournalEntryLite } from '@/types';

interface DashboardLaboratoryProps {
    trades: TradeLite[];
}

const LABORATORY_TABS_OPTIONS = [
    { value: 'experiments', label: <>🧪 Experimentos</> },
    { value: 'recaps', label: <>📝 Recaps</> },
];

export function DashboardLaboratory({ trades }: DashboardLaboratoryProps) {
    const [activeTab, setActiveTab] = useState('experiments');
    
    // Modals state
    const [showCreateExperiment, setShowCreateExperiment] = useState(false);
    const [showViewExperiment, setShowViewExperiment] = useState(false);
    const [selectedExperiment, setSelectedExperiment] = useState<LaboratoryExperiment | null>(null);
    
    const [showCreateRecap, setShowCreateRecap] = useState(false);
    const [showViewRecap, setShowViewRecap] = useState(false);
    const [showEditRecap, setShowEditRecap] = useState(false);
    const [selectedRecap, setSelectedRecap] = useState<LaboratoryRecap | null>(null);

    // Laboratory Store
    const {
        experiments,
        recaps,
        isLoading,
        loadExperiments,
        loadRecaps,
        addExperiment,
        removeExperiment,
        promoteToPlaybook,
        addRecap,
        updateRecap,
        removeRecap,
    } = useLaboratoryStore();

    // Journal Store - for linking recaps to journal entries
    const { entries: journalEntries } = useJournalStore();

    // Map journal entries to lightweight format for the modal
    const journalEntriesLite: JournalEntryLite[] = useMemo(() => 
        journalEntries.map(e => ({
            id: e.id,
            date: e.date,
            title: e.title,
            asset: e.asset,
        })),
        [journalEntries]
    );

    // Load data on mount
    useEffect(() => {
        loadExperiments();
        loadRecaps();
    }, [loadExperiments, loadRecaps]);

    // Experiment handlers
    const handleCreateExperiment = async (data: CreateExperimentData, files: File[]) => {
        await addExperiment(data, files);
        setShowCreateExperiment(false);
    };

    const handleViewExperiment = (experiment: LaboratoryExperiment) => {
        setSelectedExperiment(experiment);
        setShowViewExperiment(true);
    };

    const handleEditExperiment = (experiment: LaboratoryExperiment) => {
        // For now, we'll use view modal with edit option
        // You could create a separate EditExperimentModal if needed
        setSelectedExperiment(experiment);
        setShowViewExperiment(true);
    };

    const handleDeleteExperiment = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este experimento?')) {
            await removeExperiment(id);
        }
    };

    const handlePromoteExperiment = async (id: string) => {
        if (confirm('Deseja promover este experimento para o Playbook?')) {
            await promoteToPlaybook(id);
        }
    };

    // Recap handlers
    const handleCreateRecap = async (data: CreateRecapData, files: File[]) => {
        await addRecap(data, files);
        setShowCreateRecap(false);
        setSelectedRecap(null);
    };

    const handleUpdateRecap = async (id: string, data: CreateRecapData, files: File[]) => {
        await updateRecap({ id, ...data });
        setShowCreateRecap(false);
        setSelectedRecap(null);
    };

    const handleViewRecap = (recap: LaboratoryRecap) => {
        setSelectedRecap(recap);
        setShowViewRecap(true);
    };

    const handleEditRecap = (recap: LaboratoryRecap) => {
        setSelectedRecap(recap);
        setShowViewRecap(false); // Close view modal
        setShowEditRecap(true); // Open edit modal
    };

    const handleUpdateRecapFromEdit = async (data: UpdateRecapData, files: File[]) => {
        await updateRecap(data, files);
        setShowEditRecap(false);
        setSelectedRecap(null);
    };

    const handleDeleteRecap = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este recap?')) {
            await removeRecap(id);
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>🧪 Laboratório</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Internal Tabs */}
                    <SegmentedToggle 
                        value={activeTab} 
                        onChange={setActiveTab} 
                        options={LABORATORY_TABS_OPTIONS}
                        className="mb-6"
                    />

                    {/* Experiments Tab */}
                    <TabPanel value="experiments" activeTab={activeTab}>
                        <ExperimentsTab
                            experiments={experiments}
                            onCreateNew={() => setShowCreateExperiment(true)}
                            onView={handleViewExperiment}
                            onEdit={handleEditExperiment}
                            onDelete={handleDeleteExperiment}
                            onPromote={handlePromoteExperiment}
                            isLoading={isLoading}
                        />
                    </TabPanel>

                    {/* Recaps Tab */}
                    <TabPanel value="recaps" activeTab={activeTab}>
                        <RecapsTab
                            recaps={recaps}
                            onCreateNew={() => setShowCreateRecap(true)}
                            onView={handleViewRecap}
                            onEdit={handleEditRecap}
                            onDelete={handleDeleteRecap}
                            isLoading={isLoading}
                        />
                    </TabPanel>
                </CardContent>
            </Card>

            {/* Experiment Modals */}
            <CreateExperimentModal
                isOpen={showCreateExperiment}
                onClose={() => setShowCreateExperiment(false)}
                onSubmit={handleCreateExperiment}
                isLoading={isLoading}
            />

            <ViewExperimentModal
                isOpen={showViewExperiment}
                onClose={() => {
                    setShowViewExperiment(false);
                    setSelectedExperiment(null);
                }}
                experiment={selectedExperiment}
                onEdit={handleEditExperiment}
                onPromote={handlePromoteExperiment}
            />

            {/* Recap Modals */}
            <CreateRecapModal
                isOpen={showCreateRecap}
                onClose={() => { setShowCreateRecap(false); setSelectedRecap(null); }}
                onSubmit={handleCreateRecap}
                onUpdate={handleUpdateRecap}
                trades={trades}
                journalEntries={journalEntriesLite}
                isLoading={isLoading}
                editingRecap={selectedRecap}
            />

            <ViewRecapModal
                isOpen={showViewRecap}
                onClose={() => {
                    setShowViewRecap(false);
                    setSelectedRecap(null);
                }}
                recap={selectedRecap}
                onEdit={handleEditRecap}
            />

            <EditRecapModal
                isOpen={showEditRecap}
                onClose={() => {
                    setShowEditRecap(false);
                    setSelectedRecap(null);
                }}
                onBack={() => {
                    setShowEditRecap(false);
                    setShowViewRecap(true);
                }}
                recap={selectedRecap}
                onUpdateRecap={handleUpdateRecapFromEdit}
                trades={trades}
                journalEntries={journalEntriesLite}
                isLoading={isLoading}
            />
        </>
    );
}
