'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal, Button } from '@/components/ui';
import type { Trade, JournalEntry } from '@/types';
import { JournalEntryContent } from '@/components/journal/preview';
import { createReview, getReviewsForJournalEntry, type MentorReview } from '@/services/journal/review';
import { useToast } from '@/providers/ToastProvider';
import { useAuth } from '@/hooks/useAuth';

interface MenteeJournalReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
  trade?: Trade | null;
  menteeId: string;
}

export function MenteeJournalReviewModal({
  isOpen,
  onClose,
  entry,
  trade,
  menteeId
}: MenteeJournalReviewModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<MentorReview[]>([]);
  const [addingType, setAddingType] = useState<'comment' | 'suggestion' | 'correction' | null>(null);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Fetch reviews when modal opens
  const loadReviews = useCallback(async () => {
    setIsLoadingReviews(true);
    try {
      const data = await getReviewsForJournalEntry(entry.id);
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [entry.id]);

  useEffect(() => {
    if (isOpen && entry.id) {
      loadReviews();
    }
  }, [isOpen, entry.id, loadReviews]);

  const handleSubmitReview = async () => {
    if (!reviewContent.trim() || !addingType) return;

    setIsSubmitting(true);
    try {
      const review = await createReview({
        menteeId,
        mentorId: user?.id || '',
        journalEntryId: entry.id,
        tradeId: trade?.id,
        reviewType: addingType,
        content: reviewContent,
        rating: undefined
      });

      if (review) {
        setReviews(prev => [...prev, review]);
        setReviewContent('');
        setAddingType(null);
        showToast('Feedback enviado com sucesso!', 'success');
      } else {
        showToast('Erro ao enviar feedback', 'error');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast('Erro ao enviar feedback', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este feedback?')) return;
    try {
      const success = await import('@/services/journal/review').then(m => m.deleteReview(id));
      if (success) {
        setReviews(prev => prev.filter(r => r.id !== id));
        showToast('Feedback excluído.', 'success');
      } else {
        showToast('Erro ao excluir.', 'error');
      }
    } catch (error) {
       console.error(error);
       showToast('Erro ao excluir.', 'error');
    }
  };

  const startEdit = (review: MentorReview) => {
    setEditingId(review.id);
    setEditContent(review.content);
  };

  const handleUpdate = async () => {
    if (!editingId || !editContent.trim()) return;
    try {
      const success = await import('@/services/journal/review').then(m => m.updateReview(editingId, editContent));
      if (success) {
        setReviews(prev => prev.map(r => r.id === editingId ? { ...r, content: editContent } : r));
        setEditingId(null);
        setEditContent('');
        showToast('Feedback atualizado.', 'success');
      } else {
        showToast('Erro ao atualizar.', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Erro ao atualizar.', 'error');
    }
  };

  const corrections = reviews.filter(r => r.reviewType === 'correction');
  const suggestions = reviews.filter(r => r.reviewType === 'suggestion');
  const comments = reviews.filter(r => r.reviewType === 'comment');

  const renderReviewItem = (r: MentorReview, colorClass: string) => {
     const isEditing = editingId === r.id;
     const isOwner = r.mentorId === user?.id;

     return (
        <div key={r.id} className={`text-sm text-gray-300 border-b ${colorClass} last:border-0 pb-2 last:pb-0`}>
           <div className="flex justify-between items-center mb-2">
              <span className={`text-[10px] opacity-70`}>{new Date(r.createdAt).toLocaleDateString()}</span>
              {isOwner && !isEditing && (
                 <div className="flex gap-2">
                    <Button 
                       onClick={() => startEdit(r)} 
                       size="icon" 
                       variant="gold" 
                       className="w-6 h-6 p-0"
                       title="Editar"
                    >
                       <span className="text-xs">✏️</span>
                    </Button>
                    <Button 
                       onClick={() => handleDelete(r.id)} 
                       size="icon" 
                       variant="danger" 
                       className="w-6 h-6 p-0"
                       title="Excluir"
                    >
                       <span className="text-xs">🗑️</span>
                    </Button>
                 </div>
              )}
           </div>
           
           {isEditing ? (
              <div className="space-y-2 mt-2">
                 <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500"
                    rows={3}
                 />
                 <div className="flex justify-end gap-2">
                    <Button onClick={() => setEditingId(null)} size="sm" variant="ghost">Cancelar</Button>
                    <Button onClick={handleUpdate} size="sm" variant="primary">Salvar</Button>
                 </div>
              </div>
           ) : (
              <div className="whitespace-pre-wrap">{r.content}</div>
           )}
        </div>
     );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📝 Revisão do Mentor" maxWidth="full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
        {/* Left Side: Journal Content (ReadOnly) */}
        <div className="pr-2 lg:border-r border-gray-800">
          <JournalEntryContent entry={entry} linkedTrades={trade ? [trade] : []} />
        </div>

        {/* Right Side: Structured Review Panel */}
        <div className="flex flex-col bg-gray-900/30 p-6 rounded-lg border border-gray-800 min-h-[500px]">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                <span>💬</span> Painel de Feedback
              </h3>
              <div className="flex gap-2">
                 <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded border border-gray-700">
                   {reviews.length} registros
                 </span>
              </div>
           </div>

           {/* Review Lists (Natural Height) */}
           <div className="space-y-6 mb-8">
              {isLoadingReviews && (
                 <div className="flex justify-center py-4">
                    <span className="text-sm text-cyan-400 animate-pulse">Carregando feedback...</span>
                 </div>
              )}
              
              {/* Green / Comments */}
              <div className="space-y-2">
                 <div className="flex justify-between items-center border-b border-green-500/20 pb-1">
                    <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider">Comentários / Acertos</h4>
                    <Button 
                       onClick={() => { setAddingType('comment'); setReviewContent(''); }}
                       size="sm"
                       variant="ghost"
                       className="text-green-400 hover:text-green-300 hover:bg-green-500/10 h-6 px-2 text-xs"
                    >
                       + Adicionar
                    </Button>
                 </div>
                 <div className="space-y-3 bg-green-500/5 p-3 rounded-lg border border-green-500/10 min-h-[80px]">
                    {comments.length > 0 ? (
                       comments.map(r => renderReviewItem(r, 'border-green-500/10'))
                    ) : (
                       <span className="text-gray-500 italic text-sm">Nenhum comentário registrado.</span>
                    )}
                 </div>
              </div>

              {/* Yellow / Suggestions */}
              <div className="space-y-2">
                 <div className="flex justify-between items-center border-b border-yellow-500/20 pb-1">
                    <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-wider">Sugestões / Melhorias</h4>
                    <Button 
                       onClick={() => { setAddingType('suggestion'); setReviewContent(''); }}
                       size="sm"
                       variant="ghost"
                       className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 h-6 px-2 text-xs"
                    >
                       + Adicionar
                    </Button>
                 </div>
                 <div className="space-y-3 bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10 min-h-[80px]">
                    {suggestions.length > 0 ? (
                       suggestions.map(r => renderReviewItem(r, 'border-yellow-500/10'))
                    ) : (
                       <span className="text-gray-500 italic text-sm">Nenhuma sugestão registrada.</span>
                    )}
                 </div>
              </div>

              {/* Red / Corrections */}
              <div className="space-y-2">
                 <div className="flex justify-between items-center border-b border-red-500/20 pb-1">
                    <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider">Erros / Correções</h4>
                    <Button 
                       onClick={() => { setAddingType('correction'); setReviewContent(''); }}
                       size="sm"
                       variant="ghost"
                       className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 px-2 text-xs"
                    >
                       + Adicionar
                    </Button>
                 </div>
                 <div className="space-y-3 bg-red-500/5 p-3 rounded-lg border border-red-500/10 min-h-[80px]">
                    {corrections.length > 0 ? (
                       corrections.map(r => renderReviewItem(r, 'border-red-500/10'))
                    ) : (
                       <span className="text-gray-500 italic text-sm">Nenhuma correção registrada.</span>
                    )}
                 </div>
              </div>
           </div>

           {/* Input Area (Fixed/Floating Logic replaced by direct state access) */}
           <div className="mt-4 border-t border-gray-800 pt-4">
              {addingType && (
                 <div className="space-y-3 bg-gray-950/50 p-4 rounded-lg border border-gray-800 animate-in fade-in slide-in-from-bottom-2 sticky bottom-4 z-10 shadow-xl">
                    <div className="flex justify-between items-center">
                       <span className={`text-sm font-bold uppercase ${
                          addingType === 'correction' ? 'text-red-400' : 
                          addingType === 'suggestion' ? 'text-yellow-400' : 'text-green-400'
                       }`}>
                          Adicionar {addingType === 'correction' ? 'Correção' : addingType === 'suggestion' ? 'Sugestão' : 'Comentário'}
                       </span>
                       <button onClick={() => setAddingType(null)} className="text-gray-500 hover:text-gray-300 text-xs">Cancelar</button>
                    </div>
                    <textarea
                       value={reviewContent}
                       onChange={(e) => setReviewContent(e.target.value)}
                       placeholder="Digite seu feedback..."
                       autoFocus
                       className={`w-full bg-gray-900 border rounded-lg p-3 text-sm text-gray-200 focus:outline-none resize-none h-32 ${
                          addingType === 'correction' ? 'border-red-500/30 focus:border-red-500' : 
                          addingType === 'suggestion' ? 'border-yellow-500/30 focus:border-yellow-500' : 'border-green-500/30 focus:border-green-500'
                       }`}
                    />
                    <div className="flex justify-end gap-2">
                       <Button onClick={handleSubmitReview} disabled={!reviewContent.trim() || isSubmitting} variant="primary" size="sm">
                          {isSubmitting ? 'Salvando...' : 'Salvar Feedback'}
                       </Button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>
    </Modal>
  );
}
