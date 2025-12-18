import React from "react";
import { TaxCalculation, generateDARFData } from "@/services/analytics/tax";
import { Card } from "@/components/ui/Card";

interface TaxReportProps {
  calculation: TaxCalculation;
}

export function TaxReport({ calculation }: TaxReportProps) {
  const darf = generateDARFData(calculation);

  // Format currency helper
  const fmt = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Resumo da Apuração
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Resultado Bruto (Day Trade):</span>
              <span className={calculation.grossProfit >= 0 ? "text-green-600" : "text-red-600"}>
                {fmt(calculation.grossProfit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">(-) Custos Operacionais:</span>
              <span className="text-red-600">{fmt(calculation.costs)}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-2 font-medium dark:border-zinc-800">
              <span className="text-zinc-700 dark:text-zinc-300">(=) Resultado Líquido:</span>
              <span className={calculation.netResult >= 0 ? "text-green-600" : "text-red-600"}>
                {fmt(calculation.netResult)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Base de Cálculo
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Resultado Líquido do Mês:</span>
              <span>{fmt(calculation.netResult)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">(-) Prejuízo Anterior:</span>
              <span className="text-red-600">
                {fmt(
                  calculation.accumulatedLoss -
                    (calculation.netResult < 0 ? Math.abs(calculation.netResult) : 0)
                )}
              </span>
              {/* Nota: accumulatedLoss retornado já inclui o prejuízo do mês se houver.
                                Aqui queremos mostrar quanto TINHA antes de abater.
                                Se netResult > 0, accumulatedLoss é o que sobrou.
                                Se netResult < 0, accumulatedLoss é anterior + atual.
                             */}
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-2 font-medium dark:border-zinc-800">
              <span className="text-zinc-700 dark:text-zinc-300">(=) Base Tributável:</span>
              <span>{fmt(calculation.taxableBasis)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-800/50">
        <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          <span className="i-lucide-file-text h-6 w-6" />
          DARF (Código 6015)
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 uppercase">
              Período de Apuração
            </label>
            <div className="font-mono text-lg text-zinc-900 dark:text-zinc-100">{darf.period}</div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 uppercase">
              Data de Vencimento
            </label>
            <div className="font-mono text-lg text-zinc-900 dark:text-zinc-100">{darf.dueDate}</div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 uppercase">
              Imposto Devido (20%)
            </label>
            <div className="font-mono text-lg text-zinc-900 dark:text-zinc-100">
              {fmt(calculation.taxableBasis * 0.2)}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 uppercase">
              (-) IRRF (Dedo-duro)
            </label>
            <div className="font-mono text-lg text-red-500">{fmt(calculation.irrfDeduction)}</div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-6 md:flex-row dark:border-zinc-700">
          <div className="max-w-md text-sm text-zinc-500">
            <p>
              Atenção: Para valores inferiores a R$ 10,00, o DARF não deve ser emitido, mas o valor
              deve ser acumulado para o próximo mês.
            </p>
          </div>
          <div className="text-right">
            <label className="mb-1 block text-sm font-medium text-zinc-500">
              Valor Total a Pagar
            </label>
            <div className="text-3xl font-bold text-zinc-900 dark:text-white">
              {calculation.taxDue > 0 ? fmt(calculation.taxDue) : "R$ 0,00"}
            </div>
          </div>
        </div>
      </Card>

      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20">
        <p className="flex gap-2 text-sm text-yellow-800 dark:text-yellow-200">
          <span className="font-bold">⚠️ Importante:</span>
          Ao contrário do Swing Trade, operações de Day Trade não possuem isenção para vendas até R$
          20.000,00. Todo lucro líquido é tributado em 20%.
        </p>
      </div>
    </div>
  );
}
