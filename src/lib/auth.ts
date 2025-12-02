// ============================================
// AUTH - Camada de Autenticação com Supabase
// ============================================

import { supabase } from './supabase';
import type { User, AuthProvider } from '@/types';

// ============================================
// AUTH STATE
// ============================================

/**
 * Obter usuário autenticado atual
 */
export async function getCurrentUser(): Promise<User | null> {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
            return null;
        }

        return {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            provider: (user.app_metadata?.provider || 'email') as AuthProvider,
            createdAt: user.created_at
        };
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

/**
 * Listener para mudanças no estado de autenticação
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
            if (session?.user) {
                const user = await getCurrentUser();
                callback(user);
            } else {
                callback(null);
            }
        }
    );

    return subscription;
}

// ============================================
// SIGN UP / SIGN IN
// ============================================

/**
 * Criar conta com email e senha
 */
export async function signUpWithEmail(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            return { user: null, error: error.message };
        }

        if (!data.user) {
            return { user: null, error: 'Failed to create account' };
        }

        const user: User = {
            id: data.user.id,
            email: data.user.email || email,
            provider: 'email',
            createdAt: data.user.created_at
        };

        return { user, error: null };
    } catch (error: any) {
        return { user: null, error: error.message || 'An error occurred' };
    }
}

/**
 * Login com email e senha
 */
export async function signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { user: null, error: error.message };
        }

        if (!data.user) {
            return { user: null, error: 'Login failed' };
        }

        const user: User = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name,
            avatar: data.user.user_metadata?.avatar_url,
            provider: 'email',
            createdAt: data.user.created_at
        };

        return { user, error: null };
    } catch (error: any) {
        return { user: null, error: error.message || 'An error occurred' };
    }
}

/**
 * Login com Google OAuth
 */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            return { error: error.message };
        }

        return { error: null };
    } catch (error: any) {
        return { error: error.message || 'An error occurred' };
    }
}

/**
 * Login com GitHub OAuth
 */
export async function signInWithGithub(): Promise<{ error: string | null }> {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            return { error: error.message };
        }

        return { error: null };
    } catch (error: any) {
        return { error: error.message || 'An error occurred' };
    }
}

// ============================================
// SIGN OUT
// ============================================

/**
 * Logout
 */
export async function signOut(): Promise<{ error: string | null }> {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return { error: error.message };
        }

        return { error: null };
    } catch (error: any) {
        return { error: error.message || 'An error occurred' };
    }
}

// ============================================
// PASSWORD RECOVERY
// ============================================

/**
 * Enviar email de recuperação de senha
 */
export async function resetPassword(email: string): Promise<{ error: string | null }> {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
            return { error: error.message };
        }

        return { error: null };
    } catch (error: any) {
        return { error: error.message || 'An error occurred' };
    }
}

/**
 * Atualizar senha (após reset)
 */
export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            return { error: error.message };
        }

        return { error: null };
    } catch (error: any) {
        return { error: error.message || 'An error occurred' };
    }
}
