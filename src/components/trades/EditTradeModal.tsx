'use client';

import { Modal } from '@/components/ui';
import { TradeForm } from './TradeForm';
import type { Trade } from '@/types';

interface EditTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    trade: Trade | null;
    onUpdateTrade: (trade: Trade) => void;
}

export function EditTradeModal({ isOpen, onClose, trade, onUpdateTrade }: EditTradeModalProps) {
    if (!trade) return null;

    const handleUpdate = (tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => {
        const updatedTrade: Trade = {
            ...trade,
            ...tradeData,
            updatedAt: new Date().toISOString(),
        };
        onUpdateTrade(updatedTrade);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="✏️ Editar Trade" maxWidth="6xl">
            <TradeForm
                accountId={trade.accountId}
                onSubmit={handleUpdate}
                onCancel={onClose}
                initialData={trade}
                mode="edit"
            />
        </Modal>
    );
}
