"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0E14] p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 h-96 w-96 animate-pulse rounded-full bg-cyan-500/10 blur-3xl"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-96 w-96 animate-pulse rounded-full bg-red-500/10 blur-3xl"
          style={{ animationDuration: "6s" }}
        />
        <div className="absolute top-1/2 left-1/2 z-10 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_center,transparent_0%,#0B0E14_100%)]" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-20 w-full max-w-lg text-center">
        {/* Main 404 Visual */}
        <div className="relative mb-8 inline-block">
          <h1 className="bg-gradient-to-b from-gray-700 to-gray-900 bg-clip-text text-[150px] leading-none font-black text-transparent select-none">
            404
          </h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-10deg] rounded border border-red-500/20 bg-red-500/10 px-4 py-1 text-2xl font-bold text-red-500 backdrop-blur-md">
            STOP LOSS ATINGIDO
          </div>
        </div>

        {/* Message */}
        <h2 className="mb-4 text-2xl font-bold text-white">Página Liquidada</h2>
        <p className="mx-auto mb-8 max-w-md text-gray-400">
          Parece que o mercado foi contra você nesta operação. A página que você está procurando não
          existe ou foi movida.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="w-full transform rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 px-8 py-3 font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:-translate-y-0.5 hover:from-cyan-500 hover:to-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] sm:w-auto"
          >
            Voltar ao Dashboard
          </Link>

          <Link
            href="/"
            onClick={() => window.history.back()}
            className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-8 py-3 font-semibold text-gray-300 backdrop-blur-sm transition-all hover:border-gray-600 hover:bg-gray-800 sm:w-auto"
          >
            Tentar Novamente
          </Link>
        </div>
      </div>
    </div>
  );
}
