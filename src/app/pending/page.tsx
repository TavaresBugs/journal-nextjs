'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

export default function PendingPage() {
    const [userEmail, setUserEmail] = useState<string>('');
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setUserEmail(user.email);
            }
        }
        getUser();
    }, []);

    const handleCheckStatus = async () => {
        setChecking(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login';
            return;
        }

        const { data } = await supabase
            .from('users_extended')
            .select('status')
            .eq('id', user.id)
            .single();

        if (data?.status === 'approved') {
            window.location.href = '/';
        } else {
            setChecking(false);
            alert('Sua conta ainda está aguardando aprovação.');
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            {/* Grid pattern overlay - same as main page */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />

            <div className="relative z-10 max-w-md w-full">
                {/* Card matching app style */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm shadow-xl text-center">
                    {/* Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                        <svg 
                            className="w-10 h-10 text-amber-400" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                            />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-cyan-400 mb-2">
                        Aguardando Aprovação
                    </h1>

                    {/* Description */}
                    <p className="text-gray-400 mb-6">
                        Sua conta <span className="text-white font-medium">{userEmail}</span> está 
                        aguardando aprovação de um administrador.
                    </p>

                    {/* Info box */}
                    <div className="bg-gray-950/50 border border-gray-700 rounded-xl p-4 mb-6 text-left">
                        <div className="flex items-start gap-3">
                            <svg 
                                className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                />
                            </svg>
                            <div className="text-sm text-gray-300">
                                <p className="font-medium mb-1">O que acontece agora?</p>
                                <p className="text-gray-400">
                                    Um administrador irá revisar sua solicitação e aprovar seu acesso. 
                                    Você receberá uma notificação quando sua conta for ativada.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <Button 
                            onClick={handleCheckStatus}
                            disabled={checking}
                            variant="gradient-success"
                            className="w-full"
                        >
                            {checking ? 'Verificando...' : 'Verificar Status'}
                        </Button>
                        
                        <Button 
                            onClick={handleLogout}
                            variant="gradient-danger"
                            className="w-full"
                        >
                            Sair
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
