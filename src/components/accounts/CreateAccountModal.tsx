'use client';

import { useState } from 'react';
import { Modal, Input, Button } from '@/components/ui';
import type { Account } from '@/types';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAccountStore } from '@/store/useAccountStore';
import { useToast } from '@/contexts/ToastContext';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
}

export function CreateAccountModal({ isOpen, onClose, onCreateAccount }: CreateAccountModalProps) {
  const { currencies, leverages } = useSettingsStore();
  const { accounts } = useAccountStore();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState(currencies[0] || 'USD');
  const [initialBalance, setInitialBalance] = useState('100000');
  const [leverage, setLeverage] = useState(leverages[0] || '1:100');
  const [maxDrawdown, setMaxDrawdown] = useState('10');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate name
    if (accounts.some(acc => acc.name.toLowerCase() === name.trim().toLowerCase())) {
      showToast('Já existe uma carteira com este nome. Por favor, escolha outro.', 'error');
      return;
    }
    
    const accountData = {
      name,
      currency: currency.toUpperCase(),
      initialBalance: parseFloat(initialBalance),
      currentBalance: parseFloat(initialBalance),
      leverage,
      maxDrawdown: parseFloat(maxDrawdown),
    };
    
    onCreateAccount(accountData);
    
    // Reset form
    setName('');
    setCurrency(currencies[0] || 'USD');
    setInitialBalance('100000');
    setLeverage(leverages[0] || '1:100');
    setMaxDrawdown('10');
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Carteira" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome"
          placeholder="Ex: FTMO 100k"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Moeda
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 uppercase"
            >
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
          
          <Input
            label="Saldo Inicial"
            type="number"
            placeholder="100000"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            step="100"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Alavancagem
            </label>
            <select
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {leverages.map(lev => (
                <option key={lev} value={lev}>{lev}</option>
              ))}
            </select>
          </div>
          
          <Input
            label="Max Drawdown (%)"
            type="number"
            placeholder="10"
            value={maxDrawdown}
            onChange={(e) => setMaxDrawdown(e.target.value)}
            step="0.5"
            min="0"
            max="100"
            required
          />
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="gradient-danger" onClick={onClose} className="flex-1 font-extrabold">
            Cancelar
          </Button>
          <Button type="submit" variant="gradient-success" className="flex-1 font-extrabold">
            Criar Carteira
          </Button>
        </div>
      </form>
    </Modal>
  );
}
