"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";

export default function PendingPage() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    }
    getUser();
  }, []);

  const handleCheckStatus = async () => {
    setChecking(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data } = await supabase
      .from("users_extended")
      .select("status")
      .eq("id", user.id)
      .single();

    if (data?.status === "approved") {
      window.location.href = "/";
    } else {
      setChecking(false);
      alert("Sua conta ainda está aguardando aprovação.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Grid pattern overlay - same as main page */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] [background-size:20px_20px] opacity-10" />

      <div className="relative z-10 w-full max-w-md">
        {/* Card matching app style */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-8 text-center shadow-xl backdrop-blur-sm">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/20">
            <svg
              className="h-10 w-10 text-amber-400"
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
          <h1 className="mb-2 text-2xl font-bold text-cyan-400">Aguardando Aprovação</h1>

          {/* Description */}
          <p className="mb-6 text-gray-400">
            Sua conta <span className="font-medium text-white">{userEmail}</span> está aguardando
            aprovação de um administrador.
          </p>

          {/* Info box */}
          <div className="mb-6 rounded-xl border border-gray-700 bg-gray-950/50 p-4 text-left">
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400"
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
                <p className="mb-1 font-medium">O que acontece agora?</p>
                <p className="text-gray-400">
                  Um administrador irá revisar sua solicitação e aprovar seu acesso. Você receberá
                  uma notificação quando sua conta for ativada.
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
              {checking ? "Verificando..." : "Verificar Status"}
            </Button>

            <Button onClick={handleLogout} variant="gradient-danger" className="w-full">
              Sair
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
