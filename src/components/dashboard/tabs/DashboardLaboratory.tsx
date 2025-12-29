"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  TabPanel,
  SegmentedToggle,
} from "@/components/ui";
import {
  ExperimentsTab,
  RecapsTab,
  ExperimentFormModal,
  ViewExperimentModal,
  ViewRecapModal,
  RecapFormModal,
} from "@/components/laboratory";
import {
  useLaboratoryStore,
  CreateExperimentData,
  UpdateExperimentData,
  CreateRecapData,
  UpdateRecapData,
} from "@/store/useLaboratoryStore";
import { useJournalStore } from "@/store/useJournalStore";
import type { LaboratoryExperiment, LaboratoryRecap, TradeLite, JournalEntryLite } from "@/types";

interface DashboardLaboratoryProps {
  trades: TradeLite[];
}

const LABORATORY_TABS_OPTIONS = [
  { value: "experiments", label: <>🧪 Experimentos</> },
  { value: "recaps", label: <>📝 Recaps</> },
];

export function DashboardLaboratory({ trades }: DashboardLaboratoryProps) {
  const [activeTab, setActiveTab] = useState("experiments");

  // Experiment Modals state
  const [showExperimentForm, setShowExperimentForm] = useState(false);
  const [experimentFormMode, setExperimentFormMode] = useState<"create" | "edit">("create");
  const [showViewExperiment, setShowViewExperiment] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<LaboratoryExperiment | null>(null);

  // Recap Modals state
  const [showRecapForm, setShowRecapForm] = useState(false);
  const [recapFormMode, setRecapFormMode] = useState<"create" | "edit">("create");
  const [showViewRecap, setShowViewRecap] = useState(false);
  const [selectedRecap, setSelectedRecap] = useState<LaboratoryRecap | null>(null);

  // Laboratory Store
  const {
    experiments,
    recaps,
    experimentsLoaded,
    recapsLoaded,
    isLoading,
    loadExperiments,
    loadRecaps,
    addExperiment,
    updateExperiment,
    removeExperiment,
    promoteToPlaybook,
    addRecap,
    updateRecap,
    removeRecap,
  } = useLaboratoryStore();

  // Journal Store - for linking recaps to journal entries
  const { entries: journalEntries } = useJournalStore();

  // Map journal entries to lightweight format for the modal
  const journalEntriesLite: JournalEntryLite[] = useMemo(
    () =>
      journalEntries.map((e) => ({
        id: e.id,
        date: e.date,
        title: e.title,
        asset: e.asset,
      })),
    [journalEntries]
  );

  // Load data on mount (with caching check)
  useEffect(() => {
    if (!experimentsLoaded) {
      loadExperiments();
    }
    if (!recapsLoaded) {
      loadRecaps();
    }
  }, [loadExperiments, loadRecaps, experimentsLoaded, recapsLoaded]);

  // Experiment handlers
  const handleOpenCreateExperiment = () => {
    setSelectedExperiment(null);
    setExperimentFormMode("create");
    setShowExperimentForm(true);
  };

  const handleExperimentSubmit = async (
    data: CreateExperimentData | UpdateExperimentData,
    files: File[]
  ) => {
    if (experimentFormMode === "create") {
      await addExperiment(data as CreateExperimentData, files);
    } else {
      await updateExperiment(data as UpdateExperimentData, files);
    }
    setShowExperimentForm(false);
    setSelectedExperiment(null);
  };

  const handleViewExperiment = (experiment: LaboratoryExperiment) => {
    setSelectedExperiment(experiment);
    setShowViewExperiment(true);
  };

  const handleEditExperiment = (experiment: LaboratoryExperiment) => {
    setSelectedExperiment(experiment);
    setShowViewExperiment(false); // Close view modal
    setExperimentFormMode("edit");
    setShowExperimentForm(true); // Open form modal in edit mode
  };

  const handleDeleteExperiment = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este experimento?")) {
      await removeExperiment(id);
    }
  };

  const handlePromoteExperiment = async (id: string) => {
    if (confirm("Deseja promover este experimento para o Playbook?")) {
      await promoteToPlaybook(id);
    }
  };

  // Recap handlers
  const handleOpenCreateRecap = () => {
    setSelectedRecap(null);
    setRecapFormMode("create");
    setShowRecapForm(true);
  };

  const handleRecapSubmit = async (data: CreateRecapData | UpdateRecapData, files: File[]) => {
    if (recapFormMode === "create") {
      await addRecap(data as CreateRecapData, files);
    } else {
      await updateRecap(data as UpdateRecapData, files);
    }
    setShowRecapForm(false);
    setSelectedRecap(null);
  };

  const handleViewRecap = (recap: LaboratoryRecap) => {
    setSelectedRecap(recap);
    setShowViewRecap(true);
  };

  const handleEditRecap = (recap: LaboratoryRecap) => {
    setSelectedRecap(recap);
    setShowViewRecap(false); // Close view modal
    setRecapFormMode("edit");
    setShowRecapForm(true); // Open form modal in edit mode
  };

  const handleDeleteRecap = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este recap?")) {
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
              onCreateNew={handleOpenCreateExperiment}
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
              onCreateNew={handleOpenCreateRecap}
              onView={handleViewRecap}
              onEdit={handleEditRecap}
              onDelete={handleDeleteRecap}
              isLoading={isLoading}
            />
          </TabPanel>
        </CardContent>
      </Card>

      {/* Unified Experiment Form Modal (Create & Edit) */}
      <ExperimentFormModal
        isOpen={showExperimentForm}
        onClose={() => {
          setShowExperimentForm(false);
          setSelectedExperiment(null);
        }}
        mode={experimentFormMode}
        initialData={selectedExperiment}
        onSubmit={handleExperimentSubmit}
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

      {/* Unified Recap Form Modal (Create & Edit) */}
      <RecapFormModal
        isOpen={showRecapForm}
        onClose={() => {
          setShowRecapForm(false);
          setSelectedRecap(null);
        }}
        mode={recapFormMode}
        initialData={selectedRecap}
        onSubmit={handleRecapSubmit}
        trades={trades}
        journalEntries={journalEntriesLite}
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
