// ============================================
// useAuth - Hook para gerenciar autenticação
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    getCurrentUser, 
    onAuthStateChange, 
    signInWithEmail as authSignInWithEmail,
    signUpWithEmail as authSignUpWithEmail,
    signInWithGoogle as authSignInWithGoogle,
    signInWithGithub as authSignInWithGithub,
    signOut as authSignOut
} from '@/lib/auth';
import type { User } from '@/types';

/**
 * Custom hook for managing authentication state and actions.
 * Wraps Supabase auth functions and provides user state.
 * 
 * @returns Authentication state and methods (signIn, signUp, signOut)
 */
export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Carregar usuário inicial
        getCurrentUser().then(setUser).finally(() => setLoading(false));

        // Escutar mudanças de autenticação
        const subscription = onAuthStateChange((newUser) => {
            setUser(newUser);
            setLoading(false);
            // Middleware agora cuida de todos os redirecionamentos
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [router]);

    const signInWithEmail = async (email: string, password: string) => {
        const { user, error } = await authSignInWithEmail(email, password);
        if (error) throw new Error(error);
        return user;
    };

    const signUpWithEmail = async (email: string, password: string) => {
        const { user, error } = await authSignUpWithEmail(email, password);
        if (error) throw new Error(error);
        return user;
    };

    const signInWithGoogle = async () => {
        const { error } = await authSignInWithGoogle();
        if (error) throw new Error(error);
    };

    const signInWithGithub = async () => {
        const { error } = await authSignInWithGithub();
        if (error) throw new Error(error);
    };

    const signOut = async () => {
        try {
            console.log('Iniciando logout...');
            
            // Executar logout e redirecionamento em paralelo com timeout
            const logoutPromise = authSignOut();
            const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000));
            
            // Aguardar logout ou timeout (o que vier primeiro)
            const result = await Promise.race([logoutPromise, timeoutPromise]);
            
            if (result && typeof result === 'object' && 'error' in result) {
                console.error('Erro ao fazer logout:', (result as { error: unknown }).error);
            } else {
                console.log('Logout bem-sucedido ou timeout alcançado');
            }
        } catch (error) {
            console.error('Erro no signOut:', error);
        } finally {
            // SEMPRE limpar estado e redirecionar, independente do resultado
            console.log('Limpando estado e redirecionando...');
            setUser(null);
            // Force full reload to ensure cookies and state are completely cleared
            window.location.href = '/login';
        }
    };

    return {
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithGithub,
        signOut,
    };
}
