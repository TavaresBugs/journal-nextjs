"use client";

import type { RuleGroup } from "@/types";

interface PlaybookRulesDisplayProps {
  ruleGroups: RuleGroup[] | undefined;
  title?: string;
}

/**
 * Map common rule group names to emojis
 */
function getGroupEmoji(name: string): string {
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
  if (normalized.includes("saída") || normalized.includes("exit") || normalized.includes("alvo"))
    return "🏁";
  if (normalized.includes("gestão") || normalized.includes("risco") || normalized.includes("risk"))
    return "🛡️";
  if (
    normalized.includes("psico") ||
    normalized.includes("mental") ||
    normalized.includes("emocional")
  )
    return "🧠";
  return "📋";
}

/**
 * PlaybookRulesDisplay
 *
 * Shared component for displaying playbook rules in a consistent format.
 * Used by ViewPlaybookModal and ViewSharedPlaybookModal.
 */
export function PlaybookRulesDisplay({
  ruleGroups,
  title = "REGRAS DO PLAYBOOK",
}: PlaybookRulesDisplayProps) {
  if (!ruleGroups || ruleGroups.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <span className="text-xl">📜</span>
        {title}
      </h3>

      <div className="space-y-4">
        {ruleGroups.map((group, idx) => (
          <div
            key={group.id || idx}
            className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800/50"
          >
            <div className="flex items-center gap-2 border-b border-gray-700 bg-gray-800 px-4 py-2 font-semibold text-gray-200">
              <span className="text-lg">{getGroupEmoji(group.name)}</span>
              {group.name}
            </div>
            <div className="space-y-2 p-4">
              {group.rules.length > 0 ? (
                group.rules.map((rule, ruleIdx) => (
                  <div key={ruleIdx} className="flex items-start gap-3 text-sm text-gray-300">
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
                    <span className="leading-relaxed">{rule}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">Nenhuma regra definida.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
