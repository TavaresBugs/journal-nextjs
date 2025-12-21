// ============================================
// AUTH - Camada de Autenticação com Supabase
// ============================================

import { supabase } from "./supabase";
import { getErrorMessage } from "./utils";
import type { User, AuthProvider } from "@/types";

/**
 * Atualiza o último login do usuário na tabela users_extended.
 */
async function updateLastLoginInternal(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("users_extended")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      console.error("[updateLastLogin] Error:", error);
    }
  } catch (error) {
    console.error("[updateLastLogin] Error:", error);
  }
}

// ============================================
// AUTH STATE
// ============================================

/**
 * Obter usuário autenticado atual
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // Use getUser() directly - it's faster and more reliable than getSession()
    // getUser() makes a direct API call and bypasses localStorage/LockManager issues
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("getUser timeout after 8s")), 8000)
    );

    const userPromise = supabase.auth.getUser();

    // Race between getUser and timeout
    const {
      data: { user },
      error,
    } = await Promise.race([userPromise, timeoutPromise]);

    if (error || !user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      provider: (user.app_metadata?.provider || "email") as AuthProvider,
      createdAt: user.created_at,
    };
  } catch (error) {
    console.error("[getCurrentUser] Unexpected error:", error);
    return null;
  }
}

/**
 * Listener para mudanças no estado de autenticação
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      // Atualizar último login em SIGNED_IN
      if (event === "SIGNED_IN" && session.user.id) {
        updateLastLoginInternal(session.user.id).catch(() => {});
      }
      callback(user);
    } else {
      callback(null);
    }
  });

  return subscription;
}

// ============================================
// SIGN UP / SIGN IN
// ============================================

/**
 * Criar conta com email e senha
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: "Failed to create account" };
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email || email,
      provider: "email",
      createdAt: data.user.created_at,
    };

    return { user, error: null };
  } catch (error: unknown) {
    return { user: null, error: getErrorMessage(error) };
  }
}

/**
 * Login com email e senha
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: "Login failed" };
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email || email,
      name: data.user.user_metadata?.full_name,
      avatar: data.user.user_metadata?.avatar_url,
      provider: "email",
      createdAt: data.user.created_at,
    };

    // Atualizar último login
    updateLastLoginInternal(data.user.id).catch(() => {});

    return { user, error: null };
  } catch (error: unknown) {
    return { user: null, error: getErrorMessage(error) };
  }
}

/**
 * Login com Google OAuth
 */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    console.log("[signInWithGoogle] Starting OAuth flow...");
    console.log(
      "[signInWithGoogle] Redirect URL will be:",
      `${window.location.origin}/auth/callback`
    );

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("[signInWithGoogle] OAuth error:", error);
      console.error("[signInWithGoogle] Error details:", JSON.stringify(error, null, 2));
      return { error: error.message };
    }

    console.log("[signInWithGoogle] OAuth initiated successfully");
    return { error: null };
  } catch (error: unknown) {
    console.error("[signInWithGoogle] Unexpected error:", error);
    return { error: getErrorMessage(error) };
  }
}

/**
 * Login com GitHub OAuth
 */
export async function signInWithGithub(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
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
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
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
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
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
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}
