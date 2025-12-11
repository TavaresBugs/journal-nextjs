'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Tabs, TabPanel } from '@/components/ui';
import { 
    ExperimentsTab, 
    RecapsTab, 
    CreateExperimentModal, 
    ViewExperimentModal,
    CreateRecapModal,
    ViewRecapModal 
} from '@/components/laboratory';
import { useLaboratoryStore, CreateExperimentData, CreateRecapData } from '@/store/useLaboratoryStore';
import type { LaboratoryExperiment, LaboratoryRecap, TradeLite } from '@/types';

interface DashboardLaboratoryProps {
    trades: TradeLite[];
}

const LABORATORY_TABS = [
    { id: 'experiments', label: 'Experimentos', icon: '🧪' },
    { id: 'recaps', label: 'Recaps', icon: '📝' },
];

export function DashboardLaboratory({ trades }: DashboardLaboratoryProps) {
    const [activeTab, setActiveTab] = useState('experiments');
    
    // Modals state
    const [showCreateExperiment, setShowCreateExperiment] = useState(false);
    const [showViewExperiment, setShowViewExperiment] = useState(false);
    const [selectedExperiment, setSelectedExperiment] = useState<LaboratoryExperiment | null>(null);
    
    const [showCreateRecap, setShowCreateRecap] = useState(false);
    const [showViewRecap, setShowViewRecap] = useState(false);
    const [selectedRecap, setSelectedRecap] = useState<LaboratoryRecap | null>(null);

    // Store
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
        removeRecap,
    } = useLaboratoryStore();

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
    };

    const handleViewRecap = (recap: LaboratoryRecap) => {
        setSelectedRecap(recap);
        setShowViewRecap(true);
    };

    const handleEditRecap = (recap: LaboratoryRecap) => {
        setSelectedRecap(recap);
        setShowViewRecap(true);
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
                    <Tabs 
                        tabs={LABORATORY_TABS} 
                        activeTab={activeTab} 
                        onChange={setActiveTab} 
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
                onClose={() => setShowCreateRecap(false)}
                onSubmit={handleCreateRecap}
                trades={trades}
                isLoading={isLoading}
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
        </>
    );
}
