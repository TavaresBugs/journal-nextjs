// ISR: Revalidate every 7 days (static legal content rarely changes)
export const revalidate = 604800;

export default function TermosPage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-12">
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="rounded-2xl border border-gray-700 bg-[#353b3e]/95 p-8 shadow-2xl">
          <h1 className="mb-6 text-3xl font-bold text-white">📜 Termos de Uso</h1>

          <p className="mb-8 text-sm text-gray-400">Última atualização: Dezembro 2024</p>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar o Trading Journal Pro, você concorda em cumprir estes Termos de
                Uso. Se você não concordar com qualquer parte destes termos, não deve usar este
                serviço.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">2. Descrição do Serviço</h2>
              <p>
                O Trading Journal Pro é uma ferramenta de registro e análise de operações de
                trading. O serviço permite que você:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-gray-400">
                <li>Registre suas operações de trading</li>
                <li>Analise seu desempenho com métricas e gráficos</li>
                <li>Gerencie múltiplas carteiras</li>
                <li>Crie e gerencie playbooks de estratégias</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">
                3. Responsabilidades do Usuário
              </h2>
              <p>Você é responsável por:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-gray-400">
                <li>Manter a confidencialidade de sua conta</li>
                <li>Todas as atividades realizadas em sua conta</li>
                <li>Fornecer informações precisas ao registrar operações</li>
                <li>Cumprir todas as leis aplicáveis ao trading</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">
                4. Isenção de Responsabilidade
              </h2>
              <p className="text-amber-300/90">
                ⚠️ O Trading Journal Pro NÃO fornece aconselhamento financeiro, recomendações de
                investimento ou garantias de resultados. As análises e métricas são meramente
                informativas e baseadas nos dados fornecidos pelo usuário.
              </p>
              <p className="mt-2">
                Trading envolve riscos significativos e você pode perder todo o capital investido.
                Consulte um profissional qualificado antes de tomar decisões de investimento.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">5. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo, design, código e funcionalidades do Trading Journal Pro são
                protegidos por direitos autorais. Você não pode copiar, modificar ou distribuir
                qualquer parte do serviço sem autorização expressa.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">6. Modificações</h2>
              <p>
                Reservamos o direito de modificar estes termos a qualquer momento. Alterações
                significativas serão comunicadas por email ou notificação no aplicativo.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">7. Encerramento</h2>
              <p>
                Podemos suspender ou encerrar seu acesso ao serviço a qualquer momento, com ou sem
                motivo, incluindo violação destes termos.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-white">8. Contato</h2>
              <p>
                Para dúvidas sobre estes termos, entre em contato através do email:
                <span className="text-[#4DB6AC]"> suporte@tradingjournal.com.br</span>
              </p>
            </section>
          </div>

          <div className="mt-8 border-t border-gray-700 pt-6">
            <a href="/login" className="text-[#4DB6AC] transition-colors hover:text-[#26A69A]">
              ← Voltar para Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
