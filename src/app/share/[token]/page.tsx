'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { JournalEntry, JournalImage } from '@/types';

export default function SharePage() {
    const params = useParams();
    const token = params?.token as string;
    
    const [entry, setEntry] = useState<JournalEntry | null>(null);
    const [images, setImages] = useState<JournalImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;

        const loadSharedEntry = async () => {
            try {
                // Get shared journal by token
                const { data: sharedData, error: sharedError } = await supabase
                    .from('shared_journals')
                    .select('journal_entry_id, expires_at')
                    .eq('share_token', token)
                    .single();

                if (sharedError || !sharedData) {
                    setError('Link inválido ou expirado');
                    setLoading(false);
                    return;
                }

                // Check expiration
                if (new Date(sharedData.expires_at) < new Date()) {
                    setError('Este link expirou');
                    setLoading(false);
                    return;
                }

                // Increment view count
                await supabase
                    .from('shared_journals')
                    .update({ view_count: supabase.rpc('increment', { row_id: sharedData.journal_entry_id }) })
                    .eq('share_token', token);

                // Get journal entry
                const { data: entryData, error: entryError } = await supabase
                    .from('journal_entries')
                    .select('*')
                    .eq('id', sharedData.journal_entry_id)
                    .single();

                if (entryError || !entryData) {
                    setError('Entrada não encontrada');
                    setLoading(false);
                    return;
                }

                // Get images
                const { data: imagesData } = await supabase
                    .from('journal_images')
                    .select('*')
                    .eq('journal_entry_id', sharedData.journal_entry_id)
                    .order('display_order', { ascending: true });

                setEntry({
                    id: entryData.id,
                    userId: entryData.user_id,
                    accountId: entryData.account_id,
                    date: entryData.date,
                    title: entryData.title,
                    asset: entryData.asset,
                    tradeId: entryData.trade_id,
                    images: [],
                    emotion: entryData.emotion,
                    analysis: entryData.analysis,
                    notes: entryData.notes,
                    createdAt: entryData.created_at,
                    updatedAt: entryData.updated_at,
                });

                setImages(imagesData || []);
                setLoading(false);
            } catch (err) {
                console.error('Error loading shared entry:', err);
                setError('Erro ao carregar entrada compartilhada');
                setLoading(false);
            }
        };

        loadSharedEntry();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-emerald-400 text-xl">Carregando...</div>
            </div>
        );
    }

    if (error || !entry) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔗</div>
                    <h1 className="text-2xl font-bold text-gray-100 mb-2">{error || 'Entrada não encontrada'}</h1>
                    <p className="text-gray-400">Este link pode ter expirado ou sido removido.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-4">
                        <span className="text-emerald-400">🔗</span>
                        <span className="text-emerald-400 text-sm font-medium">Entrada Compartilhada</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-100 mb-2">{entry.title}</h1>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                        <span>📅 {new Date(entry.date).toLocaleDateString('pt-BR')}</span>
                        {entry.asset && <span>📊 {entry.asset}</span>}
                    </div>
                </div>

                {/* Images Grid */}
                {images.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-200 mb-4">📸 Análises</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {images.map((img) => (
                                <div key={img.id} className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                                    <div className="p-2 bg-gray-900/50 border-b border-gray-700">
                                        <span className="text-xs font-medium text-gray-400">{img.timeframe}</span>
                                    </div>
                                    <img
                                        src={img.url}
                                        alt={img.timeframe}
                                        className="w-full object-contain"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Analysis & Notes */}
                <div className="space-y-6">
                    {entry.emotion && (
                        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-200 mb-3">😊 Estado Emocional</h3>
                            <p className="text-gray-300">{entry.emotion}</p>
                        </div>
                    )}

                    {entry.analysis && (
                        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-200 mb-3">📊 Análise</h3>
                            <p className="text-gray-300 whitespace-pre-wrap">{entry.analysis}</p>
                        </div>
                    )}

                    {entry.notes && (
                        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-200 mb-3">📝 Notas</h3>
                            <p className="text-gray-300 whitespace-pre-wrap">{entry.notes}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-gray-500 text-sm">
                    <p>⏰ Este link expira em breve</p>
                </div>
            </div>
        </div>
    );
}
