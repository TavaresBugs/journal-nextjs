'use client';

import { useState, useEffect } from 'react';
import { Button, Modal, Input } from '@/components/ui';
import { Playbook } from '@/types';
import { supabase } from '@/lib/supabase';
import { sharePlaybook } from '@/services/community/playbookService';

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
        <Modal isOpen={isOpen} onClose={onClose} title="🌐 Compartilhar Playbook" maxWidth="md">
            <div className="space-y-4">
                {/* Header Subtitle */}
                <p className="text-sm text-gray-400 -mt-2 mb-4">Torne público na comunidade</p>

                {/* Loading State */}
                {step === 'loading' && (
                    <div className="py-8 text-center text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zorin-accent mx-auto mb-4"></div>
                        Verificando...
                    </div>
                )}

                {/* Nickname Step */}
                {step === 'nickname' && (
                    <div className="space-y-4">
                        <p className="text-gray-300">
                            Para compartilhar playbooks, você precisa de um nome de exibição.
                        </p>
                        
                        <Input
                            label="Seu nickname na comunidade"
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Ex: TraderPro, João Silva..."
                            maxLength={50}
                        />

                        {error && (
                            <p className="text-red-400 text-sm mt-2">{error}</p>
                        )}

                        <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
                            <Button
                                variant="zorin-ghost"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="zorin-primary"
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
                    <div className="space-y-4">
                        <div className="bg-zorin-bg/30 rounded-xl p-4 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="text-2xl p-2 rounded-lg bg-zorin-bg/50"
                                    style={{ color: playbook.color }}
                                >
                                    {playbook.icon}
                                </div>
                                <div>
                                    <div className="text-white font-semibold">{playbook.name}</div>
                                    <div className="text-sm text-gray-400">
                                        Será exibido como: <span className="text-zorin-accent">{existingName}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-gray-300 text-sm">
                            Outros usuários poderão ver e se inspirar nas suas regras.
                        </p>

                        {error && (
                            <p className="text-red-400 text-sm mb-4">{error}</p>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-white/5">
                            <Button
                                variant="zorin-ghost"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="zorin-primary"
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
        </Modal>
    );
}
