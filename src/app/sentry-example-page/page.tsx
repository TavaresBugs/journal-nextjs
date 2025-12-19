"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 text-white">
      <h1 className="text-2xl font-bold">Sentry Test Page</h1>
      <p className="text-slate-400">Clique no botão para disparar um erro de teste</p>

      <button
        className="rounded-lg bg-red-600 px-6 py-3 font-semibold transition-colors hover:bg-red-700"
        onClick={() => {
          throw new Error("Sentry Test Error - " + new Date().toISOString());
        }}
      >
        🔥 Disparar Erro (Client)
      </button>

      <button
        className="rounded-lg bg-orange-600 px-6 py-3 font-semibold transition-colors hover:bg-orange-700"
        onClick={() => {
          Sentry.captureMessage("Sentry Test Message - " + new Date().toISOString());
          alert("Mensagem enviada ao Sentry!");
        }}
      >
        📨 Enviar Mensagem
      </button>
    </div>
  );
}
