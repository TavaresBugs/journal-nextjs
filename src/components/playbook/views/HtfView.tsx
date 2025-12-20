"use client";

import { GlassCard } from "@/components/ui";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { formatCurrency } from "@/lib/calculations";
import { getConditionLabel, getPdArrayLabel } from "@/lib/utils/playbook";
import type {
  HtfExpandedMetric,
  ConditionMetric,
  PdArrayExpandedMetric,
  SessionMetric,
  LtfExpandedMetric,
  TagMetric,
} from "@/types/playbookTypes";

export interface DrillPath {
  htf?: HtfExpandedMetric;
  condition?: ConditionMetric;
  pdArray?: PdArrayExpandedMetric;
  session?: SessionMetric;
  ltf?: LtfExpandedMetric;
  tag?: TagMetric;
}

interface HtfViewProps {
  hierarchicalMetrics: HtfExpandedMetric[];
  drillPath: DrillPath;
  setDrillPath: (path: DrillPath) => void;
  currency: string;
}

const getWinRateColor = (winRate: number) => {
  if (winRate >= 70) return "#00c853";
  if (winRate >= 50) return "#3b82f6";
  if (winRate > 0) return "#f59e0b";
  return "#ef4444";
};

// Reusable metric card row
function MetricCardContent({
  totalTrades,
  wins,
  losses,
  pnl,
  winRate,
  currency,
}: {
  totalTrades: number;
  wins: number;
  losses: number;
  pnl: number;
  winRate: number;
  avgRR: number | null;
  currency: string;
}) {
  return (
    <>
      <div className="grid flex-1 grid-cols-4 items-center gap-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase">Trades</div>
          <div className="text-lg font-medium text-gray-200">{totalTrades}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase">Win / Loss</div>
          <div className="text-lg font-medium">
            <span className="text-[#00c853]">{wins}</span> <span className="text-gray-500">/</span>{" "}
            <span className="text-[#ef4444]">{losses}</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase">Financeiro</div>
          <div
            className={`text-base font-bold whitespace-nowrap ${pnl >= 0 ? "text-[#04df73]" : "text-[#ff6467]"}`}
          >
            {formatCurrency(pnl, currency)}
          </div>
        </div>
        <div className="flex justify-end">
          <CircularProgress
            percentage={winRate}
            size={50}
            strokeWidth={5}
            color={getWinRateColor(winRate)}
            backgroundColor="#374151"
          />
        </div>
      </div>
    </>
  );
}

// Reusable footer for metric cards
function MetricCardFooter({
  avgRR,
  nextLabel,
  nextCount,
  color,
}: {
  avgRR: number | null;
  nextLabel: string;
  nextCount: number;
  color: string;
}) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-gray-700/50 pt-3">
      <div className="flex gap-4 text-xs text-gray-500">
        <span>
          Avg RR:{" "}
          <span className="font-medium text-gray-300">{avgRR ? avgRR.toFixed(2) + "R" : "-"}</span>
        </span>
      </div>
      <span
        className={`text-sm text-gray-500 group-hover:${color} flex items-center gap-1 transition-colors`}
      >
        Ver {nextCount} {nextLabel} <span className="text-lg">→</span>
      </span>
    </div>
  );
}

export function HtfView({ hierarchicalMetrics, drillPath, setDrillPath, currency }: HtfViewProps) {
  return (
    <div className="space-y-2">
      {/* Breadcrumb Navigation */}
      {(drillPath.htf ||
        drillPath.condition ||
        drillPath.pdArray ||
        drillPath.session ||
        drillPath.ltf ||
        drillPath.tag) && (
        <div className="scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent flex items-center justify-center gap-2 overflow-x-auto pb-1 whitespace-nowrap">
          <button
            onClick={() => setDrillPath({})}
            className="flex items-center gap-1 rounded-full border border-gray-700 bg-gray-700/30 px-3 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-gray-200"
          >
            📊 Início
          </button>

          {drillPath.htf && (
            <>
              <span className="text-xs text-gray-600">→</span>
              <button
                onClick={() => setDrillPath({ htf: drillPath.htf })}
                className="flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
              >
                🕐 {drillPath.htf.htf}
              </button>
            </>
          )}
          {drillPath.condition && (
            <>
              <span className="text-xs text-gray-600">→</span>
              <button
                onClick={() => setDrillPath({ htf: drillPath.htf, condition: drillPath.condition })}
                className="flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
              >
                {drillPath.condition.icon} {getConditionLabel(drillPath.condition.condition)}
              </button>
            </>
          )}
          {drillPath.pdArray && (
            <>
              <span className="text-xs text-gray-600">→</span>
              <button
                onClick={() =>
                  setDrillPath({
                    htf: drillPath.htf,
                    condition: drillPath.condition,
                    pdArray: drillPath.pdArray,
                  })
                }
                className="flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400 transition-colors hover:bg-orange-500/20"
              >
                {drillPath.pdArray.icon} {getPdArrayLabel(drillPath.pdArray.pdArray)}
              </button>
            </>
          )}
          {drillPath.session && (
            <>
              <span className="text-xs text-gray-600">→</span>
              <button
                onClick={() =>
                  setDrillPath({
                    htf: drillPath.htf,
                    condition: drillPath.condition,
                    pdArray: drillPath.pdArray,
                    session: drillPath.session,
                  })
                }
                className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                {drillPath.session.icon} {drillPath.session.session}
              </button>
            </>
          )}
          {drillPath.ltf && (
            <>
              <span className="text-xs text-gray-600">→</span>
              <button
                onClick={() =>
                  setDrillPath({
                    htf: drillPath.htf,
                    condition: drillPath.condition,
                    pdArray: drillPath.pdArray,
                    session: drillPath.session,
                    ltf: drillPath.ltf,
                  })
                }
                className="flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20"
              >
                📈 {drillPath.ltf.ltf}
              </button>
            </>
          )}
          {drillPath.tag && (
            <>
              <span className="text-xs text-gray-600">→</span>
              <span className="flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
                🏷️ {drillPath.tag.tagCombo}
              </span>
            </>
          )}
        </div>
      )}

      {/* Level 1: HTF Cards */}
      {!drillPath.htf && (
        <>
          <h4 className="text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
            Timeframe de Análise (HTF)
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {hierarchicalMetrics.map((htf) => (
              <GlassCard
                key={htf.htf}
                onClick={() => setDrillPath({ htf })}
                className="bg-zorin-bg/30 hover:border-zorin-accent/50 group cursor-pointer border-white/5 transition-all"
              >
                <div className="flex items-center gap-6">
                  <span className="rounded-lg border border-indigo-500/30 bg-indigo-500/20 px-4 py-2 text-sm font-bold whitespace-nowrap text-indigo-300">
                    🕐 {htf.htf}
                  </span>
                  <MetricCardContent {...htf} currency={currency} />
                </div>
                <MetricCardFooter
                  avgRR={htf.avgRR}
                  nextLabel="condições"
                  nextCount={htf.conditionBreakdown.length}
                  color="text-indigo-400"
                />
              </GlassCard>
            ))}
          </div>
        </>
      )}

      {/* Level 2: Condition Cards */}
      {drillPath.htf && !drillPath.condition && (
        <>
          <h4 className="text-xs font-medium tracking-wider text-gray-500 uppercase">
            📈 Condições de Mercado
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {drillPath.htf.conditionBreakdown.map((cond) => (
              <GlassCard
                key={cond.condition}
                onClick={() => setDrillPath({ ...drillPath, condition: cond })}
                className="bg-zorin-bg/30 hover:border-zorin-accent/50 group cursor-pointer border-white/5 transition-all"
              >
                <div className="flex items-center gap-6">
                  <span className="rounded-lg border border-amber-500/30 bg-amber-500/20 px-4 py-2 text-sm font-bold whitespace-nowrap text-amber-300">
                    {cond.icon} {getConditionLabel(cond.condition)}
                  </span>
                  <MetricCardContent {...cond} currency={currency} />
                </div>
                <MetricCardFooter
                  avgRR={cond.avgRR}
                  nextLabel="PD Arrays"
                  nextCount={cond.pdArrayBreakdown.length}
                  color="text-amber-400"
                />
              </GlassCard>
            ))}
          </div>
        </>
      )}

      {/* Level 3: PD Array Cards */}
      {drillPath.condition && !drillPath.pdArray && (
        <>
          <h4 className="text-xs font-medium tracking-wider text-gray-500 uppercase">
            📍 PD Arrays
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {drillPath.condition.pdArrayBreakdown.map((pd) => (
              <GlassCard
                key={pd.pdArray}
                onClick={() => setDrillPath({ ...drillPath, pdArray: pd })}
                className="bg-zorin-bg/30 hover:border-zorin-accent/50 group cursor-pointer border-white/5 transition-all"
              >
                <div className="flex items-center gap-6">
                  <span className="rounded-lg border border-orange-500/30 bg-orange-500/20 px-4 py-2 text-sm font-bold whitespace-nowrap text-orange-300">
                    {pd.icon} {getPdArrayLabel(pd.pdArray)}
                  </span>
                  <MetricCardContent {...pd} currency={currency} />
                </div>
                <MetricCardFooter
                  avgRR={pd.avgRR}
                  nextLabel="sessões"
                  nextCount={pd.sessionBreakdown.length}
                  color="text-orange-400"
                />
              </GlassCard>
            ))}
          </div>
        </>
      )}

      {/* Level 4: Session Cards */}
      {drillPath.pdArray && !drillPath.session && (
        <>
          <h4 className="text-xs font-medium tracking-wider text-gray-500 uppercase">🕐 Sessões</h4>
          <div className="grid grid-cols-1 gap-3">
            {drillPath.pdArray.sessionBreakdown.map((sess) => (
              <GlassCard
                key={sess.session}
                onClick={() => setDrillPath({ ...drillPath, session: sess })}
                className="bg-zorin-bg/30 hover:border-zorin-accent/50 group cursor-pointer border-white/5 transition-all"
              >
                <div className="flex items-center gap-6">
                  <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm font-bold whitespace-nowrap text-emerald-300">
                    {sess.icon} {sess.session}
                  </span>
                  <MetricCardContent {...sess} currency={currency} />
                </div>
                <MetricCardFooter
                  avgRR={sess.avgRR}
                  nextLabel="TF entrada"
                  nextCount={sess.ltfBreakdown.length}
                  color="text-emerald-400"
                />
              </GlassCard>
            ))}
          </div>
        </>
      )}

      {/* Level 5: LTF Cards */}
      {drillPath.session && !drillPath.ltf && (
        <>
          <h4 className="text-xs font-medium tracking-wider text-gray-500 uppercase">
            📈 Timeframe de Entrada (LTF)
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {drillPath.session.ltfBreakdown.map((ltf) => (
              <GlassCard
                key={ltf.ltf}
                onClick={() => setDrillPath({ ...drillPath, ltf })}
                className="bg-zorin-bg/30 hover:border-zorin-accent/50 group cursor-pointer border-white/5 transition-all"
              >
                <div className="flex items-center gap-6">
                  <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/20 px-4 py-2 text-sm font-bold whitespace-nowrap text-cyan-300">
                    📈 {ltf.ltf}
                  </span>
                  <MetricCardContent {...ltf} currency={currency} />
                </div>
                <MetricCardFooter
                  avgRR={ltf.avgRR}
                  nextLabel="confluências"
                  nextCount={ltf.tagBreakdown.length}
                  color="text-cyan-400"
                />
              </GlassCard>
            ))}
          </div>
        </>
      )}

      {/* Level 6: Tag Cards (Final Level) */}
      {drillPath.ltf && (
        <>
          <h4 className="text-xs font-medium tracking-wider text-gray-500 uppercase">
            🏷️ Confluências
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {drillPath.ltf.tagBreakdown.map((tag) => (
              <GlassCard
                key={tag.tagCombo}
                className="bg-zorin-bg/30 cursor-default border-white/5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex max-w-[300px] flex-wrap gap-2">
                    {tag.tagCombo.split(" + ").map((t, i) => (
                      <span
                        key={i}
                        className="rounded-lg border border-purple-500/30 bg-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-300"
                      >
                        🏷️ {t}
                      </span>
                    ))}
                  </div>
                  <MetricCardContent {...tag} currency={currency} />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-gray-700/50 pt-3">
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>
                      Avg RR:{" "}
                      <span className="font-medium text-gray-300">
                        {tag.avgRR ? tag.avgRR.toFixed(2) + "R" : "-"}
                      </span>
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">Fim da análise</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
