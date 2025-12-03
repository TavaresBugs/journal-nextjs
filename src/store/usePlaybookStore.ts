import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Playbook } from '@/types';

interface PlaybookStore {
    playbooks: Playbook[];
    isLoading: boolean;
    error: string | null;

    // Actions
    loadPlaybooks: (accountId: string) => Promise<void>;
    addPlaybook: (playbook: Omit<Playbook, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updatePlaybook: (playbook: Playbook) => Promise<void>;
    removePlaybook: (id: string) => Promise<void>;
}

export const usePlaybookStore = create<PlaybookStore>((set, get) => ({
    playbooks: [],
    isLoading: false,
    error: null,

    loadPlaybooks: async (accountId: string) => {
        set({ isLoading: true, error: null });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('playbooks')
                .select('*')
                .eq('account_id', accountId)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const playbooks: Playbook[] = (data || []).map((row) => ({
                id: row.id,
                userId: row.user_id,
                accountId: row.account_id,
                name: row.name,
                description: row.description,
                icon: row.icon || '📈',
                color: row.color || '#3B82F6',
                ruleGroups: row.rule_groups || [],
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            }));

            set({ playbooks, isLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error loading playbooks:', error);
            set({ error: message, isLoading: false });
        }
    },

    addPlaybook: async (playbookData) => {
        set({ isLoading: true, error: null });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('playbooks')
                .insert({
                    user_id: user.id,
                    account_id: playbookData.accountId,
                    name: playbookData.name,
                    description: playbookData.description,
                    icon: playbookData.icon,
                    color: playbookData.color,
                    rule_groups: playbookData.ruleGroups,
                })
                .select()
                .single();

            if (error) throw error;

            const newPlaybook: Playbook = {
                id: data.id,
                userId: data.user_id,
                accountId: data.account_id,
                name: data.name,
                description: data.description,
                icon: data.icon,
                color: data.color,
                ruleGroups: data.rule_groups,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            };

            set({ playbooks: [newPlaybook, ...get().playbooks], isLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error adding playbook:', error);
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    updatePlaybook: async (playbook) => {
        set({ isLoading: true, error: null });

        try {
            const { error } = await supabase
                .from('playbooks')
                .update({
                    name: playbook.name,
                    description: playbook.description,
                    icon: playbook.icon,
                    color: playbook.color,
                    rule_groups: playbook.ruleGroups,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', playbook.id);

            if (error) throw error;

            set({
                playbooks: get().playbooks.map((p) =>
                    p.id === playbook.id ? { ...playbook, updatedAt: new Date().toISOString() } : p
                ),
                isLoading: false,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error updating playbook:', error);
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    removePlaybook: async (id) => {
        set({ isLoading: true, error: null });

        try {
            const { error } = await supabase
                .from('playbooks')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set({
                playbooks: get().playbooks.filter((p) => p.id !== id),
                isLoading: false,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error removing playbook:', error);
            set({ error: message, isLoading: false });
            throw error;
        }
    },
}));
