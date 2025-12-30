"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { resetPassword } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils/general";
import { validatePassword, getStrengthColor, getStrengthLabel } from "@/lib/security";

export function LoginForm() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithGithub, loading } =
    useAuth();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check for rate limit error from middleware redirect
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const retryAfter = searchParams.get("retry_after");

    if (errorParam === "rate_limited") {
      const minutes = retryAfter ? parseInt(retryAfter) : 15;
      setError(
        `Muitas tentativas de login. Tente novamente em ${minutes} minuto${minutes > 1 ? "s" : ""}.`
      );
    } else if (errorParam === "account_suspended") {
      setError("Sua conta foi suspensa. Entre em contato com o suporte.");
    }
  }, [searchParams]);

  // Validação de senha em tempo real (apenas para signup)
  const passwordValidation = useMemo(() => {
    if (mode === "signup" && password) {
      return validatePassword(password);
    }
    return null;
  }, [password, mode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Preencha todos os campos");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    // Validação robusta de senha para signup
    if (mode === "signup") {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        setError(validation.errors.join(", "));
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        // Force navigation to trigger middleware checks (pending/approved status)
        window.location.href = "/";
      } else {
        // signUpWithEmail from useAuth hook returns User directly (not { user, error })
        const newUser = await signUpWithEmail(email, password);

        if (newUser) {
          // Create users_extended profile via Server Action (bypasses RLS)
          const { createUserProfileAction } = await import("@/app/actions/admin");
          const profileResult = await createUserProfileAction(newUser.id, newUser.email);

          if (!profileResult.success) {
            console.warn("[handleSubmit] Failed to create profile:", profileResult.error);
          }
        }

        // Signup requires email confirmation in Supabase
        // Show success message instead of redirecting
        setSuccess(
          "✅ Conta criada com sucesso! Verifique seu email para confirmar e depois faça login."
        );
        setMode("login"); // Switch to login mode
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  const handleGithubAuth = async () => {
    setError("");
    setIsLoading(true);
    try {
      await signInWithGithub();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Digite seu email");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error);
      } else {
        setSuccess("Email de recuperação enviado! Verifique sua caixa de entrada.");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-3xl border border-gray-700 bg-[#353b3e] p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#4DB6AC] border-t-transparent"></div>
          <p className="text-gray-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Card - SOLID COLOR */}
      <div className="rounded-3xl border border-gray-700 bg-[#353b3e] p-8 shadow-2xl">
        {/* Tabs - hide when in forgot mode */}
        {mode !== "forgot" ? (
          <div className="mb-8 flex gap-4">
            <button
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-3 text-lg font-medium transition-all ${
                mode === "login"
                  ? "border-b-2 border-[#4DB6AC] text-white"
                  : "border-b-2 border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-3 text-lg font-medium transition-all ${
                mode === "signup"
                  ? "border-b-2 border-[#4DB6AC] text-white"
                  : "border-b-2 border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Criar Conta
            </button>
          </div>
        ) : (
          <div className="mb-8">
            <button
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
              className="flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Voltar para login
            </button>
            <h2 className="mt-4 text-2xl font-bold text-white">Recuperar senha</h2>
            <p className="mt-1 text-sm text-gray-400">
              Digite seu email para receber um link de recuperação
            </p>
          </div>
        )}

        {/* Email Form */}
        <form
          onSubmit={mode === "forgot" ? handleForgotPassword : handleEmailAuth}
          className="mb-6 space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-600 bg-[#2d3436] px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-[#4DB6AC] focus:ring-2 focus:ring-[#4DB6AC]/50 focus:outline-none"
              placeholder="seu@email.com"
              disabled={isLoading}
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-600 bg-[#2d3436] px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-[#4DB6AC] focus:ring-2 focus:ring-[#4DB6AC]/50 focus:outline-none"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-200"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Strength Indicator - Only shows in signup mode */}
              {mode === "signup" && password && passwordValidation && (
                <div className="mt-2">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-700">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${passwordValidation.score}%`,
                          backgroundColor: getStrengthColor(passwordValidation.strength),
                        }}
                      />
                    </div>
                    <span
                      className="min-w-[50px] text-right text-xs font-medium"
                      style={{ color: getStrengthColor(passwordValidation.strength) }}
                    >
                      {getStrengthLabel(passwordValidation.strength)}
                    </span>
                  </div>
                  {passwordValidation.errors.length > 0 && (
                    <ul className="space-y-0.5 text-xs text-gray-400">
                      {passwordValidation.errors.map((err, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <span className="text-red-400">•</span> {err}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Confirmar Senha
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-600 bg-[#2d3436] px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-[#4DB6AC] focus:ring-2 focus:ring-[#4DB6AC]/50 focus:outline-none"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/50 bg-red-500/20 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-green-500/50 bg-green-500/20 px-4 py-3 text-sm text-green-200">
              {success}
            </div>
          )}

          {mode === "login" && (
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError("");
                setSuccess("");
              }}
              className="text-sm text-[#4DB6AC] transition-colors hover:text-[#26A69A] hover:underline"
            >
              Esqueci minha senha
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-[#4DB6AC] py-3.5 font-bold text-white shadow-lg transition-all hover:bg-[#26A69A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Aguarde...
              </span>
            ) : mode === "login" ? (
              "Entrar"
            ) : mode === "signup" ? (
              "Criar Conta"
            ) : (
              "Enviar link de recuperação"
            )}
          </button>
        </form>

        {/* Divider - hide in forgot mode */}
        {mode !== "forgot" && (
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#353b3e] px-4 text-gray-400">Ou continue com</span>
            </div>
          </div>
        )}

        {/* OAuth Buttons - hide in forgot mode */}
        {mode !== "forgot" && (
          <div className="space-y-3">
            <button
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3.5 font-medium text-gray-800 shadow-md transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>

            <button
              onClick={handleGithubAuth}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#24292e] py-3.5 font-medium text-white shadow-md transition-all hover:bg-[#1b1f23] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              GitHub
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-gray-200">
        Seus dados são criptografados e seguros com Supabase
      </p>
    </>
  );
}
