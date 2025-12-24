"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils/general";
import { validatePassword, getStrengthColor, getStrengthLabel } from "@/lib/password-validator";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isValidSession] = useState(true);

  // Check if user has a valid recovery session
  useEffect(() => {
    // The user arrives here via Supabase magic link which sets up the session
    // If there's no hash in URL, they shouldn't be here
    if (typeof window !== "undefined" && !window.location.hash) {
      // For Supabase v2, the token is in the hash
      // But the callback route handles token exchange
      // So we just check if user came from email link
    }
  }, []);

  // Password validation
  const passwordValidation = useMemo(() => {
    if (password) {
      return validatePassword(password);
    }
    return null;
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(validation.errors.join(", "));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await updatePassword(password);
      if (error) {
        setError(error);
      } else {
        setSuccess("Senha atualizada com sucesso! Redirecionando...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <div className="absolute inset-0 z-0 bg-black/20 backdrop-blur-[2px]"></div>
        <div className="relative z-10 w-full max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-white">Link expirado</h1>
          <p className="mb-6 text-gray-300">
            O link de recuperação de senha expirou ou é inválido.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="rounded-xl bg-[#4DB6AC] px-6 py-3 font-bold text-white transition-all hover:bg-[#26A69A]"
          >
            Voltar para login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 z-0 bg-black/20 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Title */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-5xl font-bold text-white">Trading Journal</h1>
          <p className="text-lg text-gray-200">Criar nova senha</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-gray-700 bg-[#353b3e] p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Nova senha</h2>
            <p className="mt-1 text-sm text-gray-400">Digite sua nova senha abaixo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Nova Senha</label>
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

              {/* Password Strength Indicator */}
              {password && passwordValidation && (
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[#4DB6AC] py-3.5 font-bold text-white shadow-lg transition-all hover:bg-[#26A69A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Atualizando...
                </span>
              ) : (
                "Atualizar senha"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-gray-400 transition-colors hover:text-white"
            >
              Voltar para login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
