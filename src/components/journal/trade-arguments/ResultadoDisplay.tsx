"use client";

interface ResultadoDisplayProps {
  proPoints: number;
  contraPoints: number;
  hasArguments: boolean;
}

type Resultado = "bullish" | "bearish" | "neutro";

function calcularResultado(proPoints: number, contraPoints: number): Resultado {
  if (proPoints === 0 && contraPoints === 0) return "neutro";
  if (proPoints > contraPoints) return "bullish";
  if (contraPoints > proPoints) return "bearish";
  return "neutro";
}

const resultadoConfig = {
  bullish: {
    label: "Bullish",
    color: "text-green-400",
    emoji: "🚀",
    description: "Análise favorável à operação",
  },
  bearish: {
    label: "Bearish",
    color: "text-red-400",
    emoji: "⚠️",
    description: "Análise desfavorável à operação",
  },
  neutro: {
    label: "Neutro",
    color: "text-gray-400",
    emoji: "🤷",
    description: "Análise equilibrada ou incompleta",
  },
};

export function ResultadoDisplay({ proPoints, contraPoints, hasArguments }: ResultadoDisplayProps) {
  const resultado = calcularResultado(proPoints, contraPoints);
  const config = resultadoConfig[resultado];

  return (
    <div className="rounded-lg bg-gray-800/50 p-6">
      <p className="mb-2 text-center text-xs tracking-wide text-gray-500 uppercase">RESULTADO</p>

      {!hasArguments ? (
        <div className="py-6 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-gray-700">
            <span className="text-center text-xs text-gray-600">
              Selecione
              <br />
              argumentos
            </span>
          </div>
          <h3 className={`mb-2 text-xl font-bold ${config.color}`}>
            {config.emoji} {config.label}
          </h3>
          <div className="mb-4 flex items-center justify-center gap-2 text-sm text-yellow-500">
            <span>⚠️</span>
            <span>Adicione pelo menos 1 argumento para calcular.</span>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center">
          <h3 className={`mb-2 text-2xl font-bold ${config.color}`}>
            {config.emoji} {config.label}
          </h3>
          <p className="mb-6 text-sm text-gray-400">{config.description}</p>

          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="mb-1 text-xs text-green-400">Prós (Bullish)</p>
              <p className="text-2xl font-bold text-green-400">{proPoints}</p>
              <p className="text-xs text-gray-500">pts</p>
            </div>

            <div className="text-center">
              <p className="mb-1 text-xs text-red-400">Contras (Bearish)</p>
              <p className="text-2xl font-bold text-red-400">{contraPoints}</p>
              <p className="text-xs text-gray-500">pts</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
