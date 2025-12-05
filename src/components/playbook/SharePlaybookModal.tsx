'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Playbook } from '@/types';
import { supabase } from '@/lib/supabase';
import { sharePlaybook } from '@/services/communityService';

interface SharePlaybookModalProps {
    playbook: Playbook;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function SharePlaybookModal({ playbook, isOpen, onClose, onSuccess }: SharePlaybookModalProps) {
    const [step, setStep] = useState<'loading' | 'nickname' | 'confirm'>('loading');
    const [nickname, setNickname] = useState('');
    const [existingName, setExistingName] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if user has a display name
    useEffect(() => {
        if (!isOpen) return;

        const checkUserName = async () => {
            setStep('loading');
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Usuário não autenticado');
                return;
            }

            // Check users_extended for name
            const { data, error: fetchError } = await supabase
                .from('users_extended')
                .select('name')
                .eq('id', user.id)
                .maybeSingle();

            if (fetchError) {
                console.error('Erro ao buscar nome:', fetchError);
                // If table doesn't exist or other error, ask for nickname
                setStep('nickname');
                return;
            }

            if (data?.name) {
                setExistingName(data.name);
                setStep('confirm');
            } else {
                setStep('nickname');
            }
        };

        checkUserName();
    }, [isOpen]);

    const handleSaveNickname = async () => {
        if (!nickname.trim()) {
            setError('Por favor, digite um nickname');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError('Usuário não autenticado');
            setIsSubmitting(false);
            return;
        }

        // Save nickname to users_extended
        const { error: saveError } = await supabase
            .from('users_extended')
            .upsert({
                id: user.id,
                name: nickname.trim(),
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'id'
            });

        if (saveError) {
            console.error('Erro ao salvar nickname:', saveError);
            setError('Erro ao salvar. Tente novamente.');
            setIsSubmitting(false);
            return;
        }

        setExistingName(nickname.trim());
        setStep('confirm');
        setIsSubmitting(false);
    };

    const handleShare = async () => {
        setIsSubmitting(true);
        setError(null);

        const result = await sharePlaybook(playbook.id);

        if (result) {
            onSuccess();
            onClose();
        } else {
            setError('Erro ao compartilhar. Tente novamente.');
        }

        setIsSubmitting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700 shadow-2xl">
                
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="text-3xl">🌐</div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Compartilhar Playbook</h2>
                        <p className="text-sm text-gray-400">Torne público na comunidade</p>
                    </div>
                </div>

                {/* Loading State */}
                {step === 'loading' && (
                    <div className="py-8 text-center text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                        Verificando...
                    </div>
                )}

                {/* Nickname Step */}
                {step === 'nickname' && (
                    <div>
                        <p className="text-gray-300 mb-4">
                            Para compartilhar playbooks, você precisa de um nome de exibição.
                        </p>
                        
                        <label className="block text-sm text-gray-400 mb-2">
                            Seu nickname na comunidade:
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Ex: TraderPro, João Silva..."
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                            maxLength={50}
                        />

                        {error && (
                            <p className="text-red-400 text-sm mt-2">{error}</p>
                        )}

                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="info"
                                onClick={handleSaveNickname}
                                isLoading={isSubmitting}
                                className="flex-1"
                            >
                                Continuar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Confirm Step */}
                {step === 'confirm' && (
                    <div>
                        <div className="bg-gray-800/50 rounded-xl p-4 mb-4 border border-gray-700">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="text-2xl p-2 rounded-lg bg-gray-900/50"
                                    style={{ color: playbook.color }}
                                >
                                    {playbook.icon}
                                </div>
                                <div>
                                    <div className="text-white font-semibold">{playbook.name}</div>
                                    <div className="text-sm text-gray-400">
                                        Será exibido como: <span className="text-cyan-400">{existingName}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-gray-300 text-sm mb-4">
                            Outros usuários poderão ver e se inspirar nas suas regras.
                        </p>

                        {error && (
                            <p className="text-red-400 text-sm mb-4">{error}</p>
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="success"
                                onClick={handleShare}
                                isLoading={isSubmitting}
                                className="flex-1"
                            >
                                🌐 Compartilhar
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
