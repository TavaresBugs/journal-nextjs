import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TaxableTrade, TaxCalculation, TaxCostsConfig, calculateMonthlyTax, enrichTradesWithCosts } from '@/services/taxService';
import { TaxReport } from './TaxReport';
import { Trade } from '@/types';
import dayjs from 'dayjs';

interface TaxCalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    trades: Trade[]; // Trades passados pelo pai ou buscados aqui? Vamos assumir que recebemos todos ou buscamos.
                     // Idealmente, buscamos aqui com base no mês selecionado.
                     // Para simplificar, vamos assumir que o pai passa uma função de fetch ou os trades do contexto.
                     // Mas o modal pede pra selecionar o mês, então ele deve controlar isso.
    fetchTradesForMonth?: (month: string) => Promise<Trade[]>;
}

export function TaxCalculatorModal({ isOpen, onClose, fetchTradesForMonth }: TaxCalculatorModalProps) {
    const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
    const [monthlyTrades, setMonthlyTrades] = useState<Trade[]>([]);
    const [taxableTrades, setTaxableTrades] = useState<TaxableTrade[]>([]);

    // Configuração de custos padrão
    const [costsConfig, setCostsConfig] = useState<TaxCostsConfig>({
        defaultBrokerageFee: 0, // R$ por ordem (ou por contrato?) Assumindo valor fixo por trade
        defaultExchangeFeePct: 0.030, // 0.030%
        defaultTaxesPct: 5 // ISS 5%
    });

    const [calculation, setCalculation] = useState<TaxCalculation | null>(null);
    const [previousLoss, setPreviousLoss] = useState<string>('0');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'config' | 'review' | 'report'>('config');

    // Carregar trades quando mês muda
    useEffect(() => {
        if (isOpen && fetchTradesForMonth) {
            setIsLoading(true);
            fetchTradesForMonth(selectedMonth)
                .then(trades => {
                    setMonthlyTrades(trades);
                    // Reset
                    setStep('config');
                    setCalculation(null);
                })
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, selectedMonth, fetchTradesForMonth]);

    const handleApplyConfig = () => {
        // Aplica custos padrão
        const enriched = enrichTradesWithCosts(monthlyTrades, costsConfig);
        setTaxableTrades(enriched);
        setStep('review');
    };

    const handleUpdateTradeCost = (tradeId: string, field: keyof TaxableTrade, value: number) => {
        setTaxableTrades(prev => prev.map(t => {
            if (t.id === tradeId) {
                const updated = { ...t, [field]: value };
                // Recalcular netResult e irrf se necessário
                // (Simplificação: Recalcular custos totais)
                const totalCosts = updated.brokerageFee + updated.exchangeFee + updated.taxes;
                const net = (updated.pnl || 0) - totalCosts;
                return { ...updated, netResult: net };
            }
            return t;
        }));
    };

    const handleCalculate = () => {
        const result = calculateMonthlyTax(selectedMonth, taxableTrades, Number(previousLoss));
        setCalculation(result);
        setStep('report');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Calculadora de IR (Day Trade)">
            <div className="w-full max-w-4xl mx-auto min-h-[500px] flex flex-col">

                {/* Header: Seleção de Mês */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Mês de Referência</label>
                        <Input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Prejuízo Acumulado Anterior (R$)</label>
                        <Input
                            type="number"
                            value={previousLoss}
                            onChange={(e) => setPreviousLoss(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {step === 'config' && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">1. Configuração de Custos Padrão</h3>
                        <p className="text-sm text-zinc-500">Defina as taxas médias cobradas pela sua corretora para aplicar a todos os trades do mês.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Corretagem (R$ / Trade)</label>
                                <Input
                                    type="number"
                                    value={costsConfig.defaultBrokerageFee}
                                    onChange={(e) => setCostsConfig({...costsConfig, defaultBrokerageFee: Number(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Emolumentos (Estimativa R$)</label>
                                <Input
                                    type="number"
                                    disabled // Desabilitado por ser complexo calcular sem volume exato, user deve editar na tabela se quiser
                                    value={0}
                                    placeholder="Editável na tabela"
                                />
                                <span className="text-xs text-zinc-400">Edite trade a trade</span>
                            </div>
                             <div>
                                <label className="block text-sm font-medium mb-1">ISS (% sobre Corretagem)</label>
                                <Input
                                    type="number"
                                    value={costsConfig.defaultTaxesPct}
                                    onChange={(e) => setCostsConfig({...costsConfig, defaultTaxesPct: Number(e.target.value)})}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button onClick={handleApplyConfig} disabled={isLoading || monthlyTrades.length === 0}>
                                {isLoading ? 'Carregando...' : 'Aplicar e Revisar Trades'}
                            </Button>
                        </div>
                        {monthlyTrades.length === 0 && !isLoading && (
                            <p className="text-center text-zinc-500 mt-8">Nenhum trade encontrado para este mês.</p>
                        )}
                    </div>
                )}

                {step === 'review' && (
                    <div className="flex-1 flex flex-col">
                        <h3 className="font-semibold text-lg mb-2">2. Revisão de Trades e Custos</h3>
                        <p className="text-sm text-zinc-500 mb-4">Ajuste os custos individualmente se necessário. Apenas Day Trades (Entry = Exit) são considerados.</p>

                        <div className="flex-1 overflow-auto border rounded-md mb-4 max-h-[400px]">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-zinc-100 dark:bg-zinc-800 sticky top-0">
                                    <tr>
                                        <th className="p-2">Data</th>
                                        <th className="p-2">Ativo</th>
                                        <th className="p-2">Tipo</th>
                                        <th className="p-2 text-right">Resultado Bruto</th>
                                        <th className="p-2 text-right">Corretagem</th>
                                        <th className="p-2 text-right">Taxas (B3/Outros)</th>
                                        <th className="p-2 text-right">IRRF (1%)</th>
                                        <th className="p-2 text-right">Líquido</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {taxableTrades.filter(t => t.isDayTrade).map(trade => (
                                        <tr key={trade.id} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                            <td className="p-2">{dayjs(trade.entryDate).format('DD/MM')}</td>
                                            <td className="p-2">{trade.symbol}</td>
                                            <td className="p-2">{trade.type}</td>
                                            <td className={`p-2 text-right font-medium ${trade.pnl && trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {trade.pnl?.toFixed(2)}
                                            </td>
                                            <td className="p-2 text-right">
                                                <input
                                                    className="w-20 p-1 text-right border rounded bg-transparent"
                                                    type="number"
                                                    value={trade.brokerageFee}
                                                    onChange={(e) => handleUpdateTradeCost(trade.id, 'brokerageFee', Number(e.target.value))}
                                                />
                                            </td>
                                            <td className="p-2 text-right">
                                                <input
                                                    className="w-20 p-1 text-right border rounded bg-transparent"
                                                    type="number"
                                                    value={trade.exchangeFee + trade.taxes} // Simplificado visualmente
                                                    onChange={(e) => {
                                                        // Atualiza exchangeFee como a diferença, assumindo taxes fixo no calculo anterior ou livre
                                                        // Para simplicidade, vamos jogar tudo em exchangeFee se o user editar aqui
                                                        handleUpdateTradeCost(trade.id, 'exchangeFee', Number(e.target.value) - trade.taxes)
                                                    }}
                                                />
                                            </td>
                                            <td className="p-2 text-right text-zinc-500">
                                                {trade.irrf.toFixed(2)}
                                            </td>
                                            <td className={`p-2 text-right font-bold ${trade.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {trade.netResult.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {taxableTrades.filter(t => t.isDayTrade).length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="p-4 text-center text-zinc-500">
                                                Nenhum Day Trade identificado neste mês.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between mt-auto">
                            <Button variant="outline" onClick={() => setStep('config')}>Voltar</Button>
                            <Button onClick={handleCalculate} disabled={taxableTrades.filter(t => t.isDayTrade).length === 0}>
                                Calcular Imposto
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'report' && calculation && (
                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 overflow-auto mb-4">
                            <TaxReport calculation={calculation} />
                        </div>
                        <div className="flex justify-start">
                            <Button variant="outline" onClick={() => setStep('review')}>Voltar e Editar</Button>
                        </div>
                    </div>
                )}

            </div>
        </Modal>
    );
}
