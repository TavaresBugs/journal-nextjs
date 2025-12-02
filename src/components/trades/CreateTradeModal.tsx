'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { Modal, Input, Button } from '@/components/ui';
import type { Trade } from '@/types';
import { DEFAULT_ASSETS } from '@/types';
import { calculateTradePnL, determineTradeOutcome } from '@/lib/calculations';

interface CreateTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    accountId: string;
    onCreateTrade: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function CreateTradeModal({ isOpen, onClose, accountId, onCreateTrade }: CreateTradeModalProps) {
    const [symbol, setSymbol] = useState('');
    const [type, setType] = useState<'Long' | 'Short'>('Long');
    const [entryPrice, setEntryPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [exitPrice, setExitPrice] = useState('');
    const [lot, setLot] = useState('1.0');
    const [entryDate, setEntryDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [entryTime, setEntryTime] = useState('');
    const [exitDate, setExitDate] = useState('');
    const [exitTime, setExitTime] = useState('');
    const [tfAnalise, setTfAnalise] = useState('');
    const [tfEntrada, setTfEntrada] = useState('');
    const [tags, setTags] = useState('');
    const [strategy, setStrategy] = useState('');
    const [setup, setSetup] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const assetMultiplier = DEFAULT_ASSETS[symbol.toUpperCase()] || 1;
        
        const tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'> = {
            userId: '', // Will be set by storage
            accountId,
            symbol: symbol.toUpperCase(),
            type,
            entryPrice: parseFloat(entryPrice),
            stopLoss: stopLoss ? parseFloat(stopLoss) : 0,
            takeProfit: takeProfit ? parseFloat(takeProfit) : 0,
            exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
            lot: parseFloat(lot),
            entryDate,
            entryTime: entryTime || undefined,
            exitDate: exitDate || undefined,
            exitTime: exitTime || undefined,
            tfAnalise: tfAnalise || undefined,
            tfEntrada: tfEntrada || undefined,
            tags: tags || undefined,
            strategy: strategy || undefined,
            setup: setup || undefined,
            notes: notes || undefined,
            pnl: undefined,
            outcome: 'pending',
        };

        // Calculate P&L if exit price is provided
        if (exitPrice) {
            const pnl = calculateTradePnL({ ...tradeData, exitPrice: parseFloat(exitPrice) } as Trade, assetMultiplier);
            tradeData.pnl = pnl;
            tradeData.outcome = determineTradeOutcome({ ...tradeData, pnl } as Trade);
        }

        onCreateTrade(tradeData);

        // Reset form
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setSymbol('');
        setType('Long');
        setEntryPrice('');
        setStopLoss('');
        setTakeProfit('');
        setExitPrice('');
        setLot('1.0');
        setEntryDate(dayjs().format('YYYY-MM-DD'));
        setEntryTime('');
        setExitDate('');
        setExitTime('');
        setTfAnalise('');
        setTfEntrada('');
        setTags('');
        setStrategy('');
        setSetup('');
        setNotes('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="➕ Novo Trade" maxWidth="xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Linha 1: Ativo e Direção */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Ativo"
                        placeholder="Ex: EURUSD, US30, BTCUSD"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        className="uppercase"
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Direção
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as 'Long' | 'Short')}
                            className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="Long">Long (Compra)</option>
                            <option value="Short">Short (Venda)</option>
                        </select>
                    </div>
                </div>

                {/* Linha 2: Preços */}
                <div className="grid grid-cols-3 gap-4">
                    <Input
                        label="Preço Entrada"
                        type="number"
                        step="0.00001"
                        placeholder="0.00000"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        required
                    />
                    <Input
                        label="Stop Loss"
                        type="number"
                        step="0.00001"
                        placeholder="0.00000"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                    />
                    <Input
                        label="Take Profit"
                        type="number"
                        step="0.00001"
                        placeholder="0.00000"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(e.target.value)}
                    />
                </div>

                {/* Linha 3: Exit e Lote */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Preço de Saída (opcional)"
                        type="number"
                        step="0.00001"
                        placeholder="Deixe vazio se trade ainda aberto"
                        value={exitPrice}
                        onChange={(e) => setExitPrice(e.target.value)}
                    />
                    <Input
                        label="Lote"
                        type="number"
                        step="0.01"
                        placeholder="1.0"
                        value={lot}
                        onChange={(e) => setLot(e.target.value)}
                        required
                    />
                </div>

                {/* Linha 4: Datas */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            label="Data Entrada"
                            type="date"
                            value={entryDate}
                            onChange={(e) => setEntryDate(e.target.value)}
                            required
                        />
                        <Input
                            label="Hora Entrada"
                            type="time"
                            value={entryTime}
                            onChange={(e) => setEntryTime(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            label="Data Saída"
                            type="date"
                            value={exitDate}
                            onChange={(e) => setExitDate(e.target.value)}
                        />
                        <Input
                            label="Hora Saída"
                            type="time"
                            value={exitTime}
                            onChange={(e) => setExitTime(e.target.value)}
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-700 my-6"></div>

                {/* Linha 5: Timeframes */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="TF Análise (HTF)"
                        placeholder="Ex: 4H, Diário"
                        value={tfAnalise}
                        onChange={(e) => setTfAnalise(e.target.value)}
                    />
                    <Input
                        label="TF Entrada (LTF)"
                        placeholder="Ex: M5, M15"
                        value={tfEntrada}
                        onChange={(e) => setTfEntrada(e.target.value)}
                    />
                </div>

                {/* Linha 6: Tags */}
                <Input
                    label="Tags (PDArrays, Contexto)"
                    placeholder="#FVG #BPR #OB #Liquidez"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                />

                {/* Linha 7: Estratégia e Setup */}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Estratégia"
                        placeholder="Ex: Pullback, Breakout"
                        value={strategy}
                        onChange={(e) => setStrategy(e.target.value)}
                    />
                    <Input
                        label="Setup"
                        placeholder="Ex: Pivô de Alta"
                        value={setup}
                        onChange={(e) => setSetup(e.target.value)}
                    />
                </div>

                {/* Linha 8: Notas */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Notas / Contexto
                    </label>
                    <textarea
                        rows={3}
                        placeholder="Contexto, sentimento, erros..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-vertical"
                    />
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                        Cancelar
                    </Button>
                    <Button type="submit" variant="success" className="flex-1">
                        Criar Trade
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
