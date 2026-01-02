import { SharedPlaybook } from "@/types";
import { Modal, IconActionButton } from "@/components/ui";
import { formatCurrency } from "@/lib/utils/trading";
import { useToast } from "@/providers/ToastProvider";
import { clonePlaybookAction } from "@/app/actions/playbooks";
import { useState } from "react";

interface ViewSharedPlaybookModalProps {
  playbook: SharedPlaybook | null;
  onClose: () => void;
}

export function ViewSharedPlaybookModal({ playbook, onClose }: ViewSharedPlaybookModalProps) {
  const { showToast } = useToast();
  const [isCloning, setIsCloning] = useState(false);

  if (!playbook) return null;

  const stats = playbook.authorStats;
  const winRate = stats?.winRate || 0;
  const netPnl = stats?.netPnl || 0;
  const maxWinStreak = stats?.maxWinStreak || 0;
  const avgRR = stats?.avgRR || 0;

  const handleClone = async () => {
    try {
      setIsCloning(true);
      const result = await clonePlaybookAction(playbook);
      if (result.success) {
        showToast("Playbook clonado com sucesso! Verifique sua biblioteca.", "success");
        onClose();
      } else {
        showToast(result.error || "Erro ao clonar playbook.", "error");
      }
    } catch (error) {
      console.error("Failed to clone playbook:", error);
      showToast("Erro ao clonar playbook.", "error");
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <Modal
      isOpen={!!playbook}
      onClose={onClose}
      headerActions={
        <IconActionButton
          variant="copy"
          onClick={handleClone}
          title="Clonar este Playbook"
          disabled={isCloning}
        />
      }
      title={
        <div className="flex items-center gap-4">
          <div
            className="rounded-xl bg-gray-800/50 p-3 text-4xl"
            style={{ color: playbook.playbook?.color }}
          >
            {playbook.playbook?.icon || "📘"}
          </div>
          <div>
            <h2 className="mb-1 text-2xl font-bold text-white">
              {playbook.playbook?.name || "Playbook"}
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <div className="flex items-center gap-1.5 rounded-full bg-gray-800 px-2 py-0.5">
                <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
                {playbook.userName}
              </div>
              <span className="flex items-center gap-1 text-amber-400">⭐ {playbook.stars}</span>
            </div>
          </div>
        </div>
      }
      maxWidth="4xl"
    >
      <div className="space-y-8">
        {/* Description */}
        {(playbook.description || playbook.playbook?.description) && (
          <div className="rounded-xl border border-gray-800 bg-gray-800/30 p-4">
            <p className="leading-relaxed text-gray-300">
              {playbook.description || playbook.playbook?.description}
            </p>
          </div>
        )}

        {/* Rules Section - Prominent */}
        {playbook.playbook?.ruleGroups && playbook.playbook.ruleGroups.length > 0 && (
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <span className="text-xl">📜</span>
              REGRAS DO PLAYBOOK
            </h3>
            <div className="grid gap-4">
              {playbook.playbook.ruleGroups.map((group, idx) => {
                // Map common rule group names to emojis
                const getGroupEmoji = (name: string): string => {
                  const normalized = name.toLowerCase().trim();
                  if (
                    normalized.includes("condições") ||
                    normalized.includes("mercado") ||
                    normalized.includes("contexto")
                  )
                    return "📊";
                  if (
                    normalized.includes("entrada") ||
                    normalized.includes("trigger") ||
                    normalized.includes("gatilho")
                  )
                    return "🎯";
                  if (
                    normalized.includes("saída") ||
                    normalized.includes("exit") ||
                    normalized.includes("alvo")
                  )
                    return "🏁";
                  if (
                    normalized.includes("gestão") ||
                    normalized.includes("risco") ||
                    normalized.includes("risk")
                  )
                    return "🛡️";
                  if (
                    normalized.includes("psico") ||
                    normalized.includes("mental") ||
                    normalized.includes("emocional")
                  )
                    return "🧠";
                  return "📋";
                };

                return (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800/50"
                  >
                    <div className="flex items-center gap-2 border-b border-gray-700 bg-gray-800 px-4 py-2 font-semibold text-gray-200">
                      <span className="text-lg">{getGroupEmoji(group.name)}</span>
                      {group.name}
                    </div>
                    <div className="p-4">
                      <ul className="space-y-2">
                        {group.rules.map((rule, ruleIdx) => (
                          <li key={ruleIdx} className="flex items-start gap-3 text-gray-300">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mt-0.5 shrink-0 text-emerald-400"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Author Stats - Detailed Grid */}
        {playbook.authorStats ? (
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-400"
              >
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              PERFORMANCE DO AUTOR
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="group relative col-span-2 flex flex-col justify-between overflow-hidden rounded-xl border border-gray-700 bg-linear-to-br from-gray-800 to-gray-900 p-4">
                <div className="text-sm font-medium text-gray-400">Net P&L</div>
                <div
                  className={`text-3xl font-bold ${netPnl >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {netPnl >= 0 ? "+" : ""}
                  {formatCurrency(netPnl)}
                </div>
              </div>

              <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
                <div className="mb-1 text-xs text-gray-400">Win Rate</div>
                <div
                  className={`text-xl font-bold ${winRate >= 50 ? "text-green-400" : "text-red-400"}`}
                >
                  {winRate.toFixed(1)}%
                </div>
              </div>

              <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
                <div className="mb-1 text-xs text-gray-400">Avg RR</div>
                <div className="text-xl font-bold text-gray-200">{avgRR.toFixed(2)}R</div>
              </div>

              {/* Detailed Metrics - Row 2 */}
              <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
                <div className="mb-1 text-xs text-gray-400">Sequência Win</div>
                <div className="text-lg font-bold text-green-400">{maxWinStreak}</div>
              </div>

              <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
                <div className="mb-1 text-xs text-gray-400">Duração Média</div>
                <div className="text-lg font-bold text-gray-200">
                  {playbook.authorStats.avgDuration || "-"}
                </div>
              </div>

              <div className="col-span-2 rounded-xl border border-gray-700 bg-gray-800/50 p-4">
                <div className="mb-1 text-xs text-gray-400">Preferências</div>
                <div className="flex items-center gap-3 text-sm font-medium text-white">
                  <span className="flex items-center gap-1">
                    <span className="text-gray-500">Ativo:</span>{" "}
                    {playbook.authorStats.preferredSymbol || "-"}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-gray-600"></span>
                  <span className="flex items-center gap-1">
                    <span className="text-gray-500">Sessão:</span>{" "}
                    {playbook.authorStats.preferredSession || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-800 bg-gray-800/30 p-8 text-center">
            <div className="mb-3 text-4xl">👻</div>
            <h3 className="font-medium text-gray-300">Sem dados de performance</h3>
            <p className="mt-1 text-sm text-gray-500">
              O autor ainda não registrou trades suficientes com este playbook.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
