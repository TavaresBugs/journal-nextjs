"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";
import { ExperimentCard } from "./ExperimentCard";
import type { LaboratoryExperiment, ExperimentStatus } from "@/types";

interface ExperimentsTabProps {
  experiments: LaboratoryExperiment[];
  onCreateNew: () => void;
  onView: (experiment: LaboratoryExperiment) => void;
  onEdit: (experiment: LaboratoryExperiment) => void;
  onDelete: (id: string) => void;
  onPromote: (id: string) => void;
  isLoading?: boolean;
}

const STATUS_FILTERS: { value: ExperimentStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "em_aberto", label: "Em Aberto" },
  { value: "testando", label: "Testando" },
  { value: "validado", label: "Validado" },
  { value: "descartado", label: "Descartado" },
];

export function ExperimentsTab({
  experiments,
  onCreateNew,
  onView,
  onEdit,
  onDelete,
  onPromote,
  isLoading = false,
}: ExperimentsTabProps) {
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter experiments
  const filteredExperiments = experiments.filter((exp) => {
    if (statusFilter !== "all" && exp.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        exp.title.toLowerCase().includes(query) ||
        exp.description?.toLowerCase().includes(query) ||
        exp.category?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Experimentos</h2>
          <p className="text-sm text-gray-400">
            Teste novas ideias e estratégias antes de aplicá-las
          </p>
        </div>
        <Button variant="gradient-success" onClick={onCreateNew} leftIcon={<span>+</span>}>
          Novo Experimento
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar experimentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === filter.value
                  ? "border border-cyan-500/50 bg-cyan-500/20 text-cyan-400"
                  : "border border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredExperiments.length === 0 && (
        <div className="py-12 text-center">
          <div className="mb-4 text-4xl">🧪</div>
          <h3 className="mb-2 text-lg font-medium text-white">
            {experiments.length === 0
              ? "Nenhum experimento ainda"
              : "Nenhum experimento encontrado"}
          </h3>
          <p className="mb-6 text-gray-400">
            {experiments.length === 0
              ? "Comece criando seu primeiro experimento para testar novas estratégias"
              : "Tente ajustar os filtros de busca"}
          </p>
          {experiments.length === 0 && (
            <Button variant="gradient-success" onClick={onCreateNew}>
              Criar Primeiro Experimento
            </Button>
          )}
        </div>
      )}

      {/* Experiments Grid */}
      {!isLoading && filteredExperiments.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredExperiments.map((experiment) => (
            <ExperimentCard
              key={experiment.id}
              experiment={experiment}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onPromote={onPromote}
            />
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {experiments.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-700/50 pt-4 text-sm text-gray-400">
          <span>
            {filteredExperiments.length} de {experiments.length} experimentos
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {experiments.filter((e) => e.status === "validado").length} validados
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              {experiments.filter((e) => e.status === "testando").length} em teste
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
