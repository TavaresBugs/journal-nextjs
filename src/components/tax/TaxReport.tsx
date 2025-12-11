import React from 'react';
import { TaxCalculation, DARFModel, generateDARFData } from '@/services/analytics/tax';
import { Card } from '@/components/ui/Card';

interface TaxReportProps {
    calculation: TaxCalculation;
}

export function TaxReport({ calculation }: TaxReportProps) {
    const darf = generateDARFData(calculation);

    // Format currency helper
    const fmt = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">Resumo da Apuração</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Resultado Bruto (Day Trade):</span>
                            <span className={calculation.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {fmt(calculation.grossProfit)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">(-) Custos Operacionais:</span>
                            <span className="text-red-600">{fmt(calculation.costs)}</span>
                        </div>
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between font-medium">
                            <span className="text-zinc-700 dark:text-zinc-300">(=) Resultado Líquido:</span>
                            <span className={calculation.netResult >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {fmt(calculation.netResult)}
                            </span>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">Base de Cálculo</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Resultado Líquido do Mês:</span>
                            <span>{fmt(calculation.netResult)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">(-) Prejuízo Anterior:</span>
                            <span className="text-red-600">{fmt(calculation.accumulatedLoss - (calculation.netResult < 0 ? Math.abs(calculation.netResult) : 0))}</span>
                            {/* Nota: accumulatedLoss retornado já inclui o prejuízo do mês se houver.
                                Aqui queremos mostrar quanto TINHA antes de abater.
                                Se netResult > 0, accumulatedLoss é o que sobrou.
                                Se netResult < 0, accumulatedLoss é anterior + atual.
                             */}
                        </div>
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between font-medium">
                            <span className="text-zinc-700 dark:text-zinc-300">(=) Base Tributável:</span>
                            <span>{fmt(calculation.taxableBasis)}</span>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                    <span className="i-lucide-file-text w-6 h-6" />
                    DARF (Código 6015)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500 uppercase">Período de Apuração</label>
                        <div className="text-lg font-mono text-zinc-900 dark:text-zinc-100">{darf.period}</div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500 uppercase">Data de Vencimento</label>
                        <div className="text-lg font-mono text-zinc-900 dark:text-zinc-100">{darf.dueDate}</div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500 uppercase">Imposto Devido (20%)</label>
                        <div className="text-lg font-mono text-zinc-900 dark:text-zinc-100">{fmt(calculation.taxableBasis * 0.20)}</div>
                    </div>
                    <div className="space-y-1">
                         <label className="text-xs font-medium text-zinc-500 uppercase">(-) IRRF (Dedo-duro)</label>
                         <div className="text-lg font-mono text-red-500">{fmt(calculation.irrfDeduction)}</div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-zinc-500 max-w-md">
                        <p>Atenção: Para valores inferiores a R$ 10,00, o DARF não deve ser emitido, mas o valor deve ser acumulado para o próximo mês.</p>
                    </div>
                    <div className="text-right">
                        <label className="block text-sm font-medium text-zinc-500 mb-1">Valor Total a Pagar</label>
                        <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                            {calculation.taxDue > 0 ? fmt(calculation.taxDue) : 'R$ 0,00'}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-900/50">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 flex gap-2">
                    <span className="font-bold">⚠️ Importante:</span>
                    Ao contrário do Swing Trade, operações de Day Trade não possuem isenção para vendas até R$ 20.000,00. Todo lucro líquido é tributado em 20%.
                </p>
            </div>
        </div>
    );
}
