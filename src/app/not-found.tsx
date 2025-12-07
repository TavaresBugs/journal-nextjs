'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#0B0E14_100%)] z-10" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ 
               backgroundImage: 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }} 
        />
      </div>

      <div className="relative z-20 max-w-lg w-full text-center">
        {/* Main 404 Visual */}
        <div className="mb-8 relative inline-block">
          <h1 className="text-[150px] font-black leading-none bg-clip-text text-transparent bg-gradient-to-b from-gray-700 to-gray-900 select-none">
            404
          </h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-red-500 bg-red-500/10 px-4 py-1 rounded border border-red-500/20 rotate-[-10deg] backdrop-blur-md">
            STOP LOSS ATINGIDO
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-4">
          Página Liquidada
        </h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Parece que o mercado foi contra você nesta operação. A página que você está procurando não existe ou foi movida.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/"
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transform hover:-translate-y-0.5"
          >
            Voltar ao Dashboard
          </Link>
          
          <Link
            href="/"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-8 py-3 bg-gray-800/50 hover:bg-gray-800 text-gray-300 font-semibold rounded-xl border border-gray-700 hover:border-gray-600 transition-all backdrop-blur-sm"
          >
            Tentar Novamente
          </Link>
        </div>
      </div>
    </div>
  );
}
