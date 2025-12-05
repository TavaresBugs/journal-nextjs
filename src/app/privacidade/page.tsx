'use client';

export default function PrivacidadePage() {
    return (
        <div className="min-h-screen py-12 px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"></div>
            
            <div className="max-w-3xl mx-auto relative z-10">
                <div className="bg-[#353b3e]/95 rounded-2xl p-8 border border-gray-700 shadow-2xl">
                    <h1 className="text-3xl font-bold text-white mb-6">🔒 Política de Privacidade</h1>
                    
                    <p className="text-gray-400 text-sm mb-8">
                        Última atualização: Dezembro 2024 | Em conformidade com a LGPD (Lei nº 13.709/2018)
                    </p>
                    
                    <div className="space-y-6 text-gray-300">
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">1. Dados que Coletamos</h2>
                            <p>Coletamos os seguintes dados pessoais:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                                <li><strong>Dados de cadastro:</strong> Nome, email, foto de perfil (via OAuth)</li>
                                <li><strong>Dados de uso:</strong> Registros de operações, configurações de carteiras</li>
                                <li><strong>Dados técnicos:</strong> IP, navegador, logs de acesso</li>
                            </ul>
                        </section>
                        
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">2. Finalidade do Tratamento</h2>
                            <p>Utilizamos seus dados para:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                                <li>Fornecer e manter o serviço de journal de trading</li>
                                <li>Autenticar seu acesso de forma segura</li>
                                <li>Gerar análises e métricas personalizadas</li>
                                <li>Enviar comunicações importantes sobre o serviço</li>
                                <li>Cumprir obrigações legais</li>
                            </ul>
                        </section>
                        
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">3. Base Legal (LGPD Art. 7º)</h2>
                            <p>O tratamento de dados é realizado com base em:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                                <li><strong>Consentimento (Art. 7º, I):</strong> Ao criar conta, você consente com esta política</li>
                                <li><strong>Execução de contrato (Art. 7º, V):</strong> Necessário para fornecer o serviço</li>
                                <li><strong>Legítimo interesse (Art. 7º, IX):</strong> Segurança e melhoria do serviço</li>
                            </ul>
                        </section>
                        
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">4. Compartilhamento de Dados</h2>
                            <p>
                                Seus dados <strong className="text-[#4DB6AC]">NÃO são vendidos</strong> a terceiros. 
                                Compartilhamos apenas com:
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                                <li><strong>Supabase:</strong> Armazenamento e autenticação (servidores seguros)</li>
                                <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
                            </ul>
                        </section>
                        
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">5. Seus Direitos (LGPD Art. 18)</h2>
                            <p>Você tem direito a:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                                <li>✅ Acessar seus dados pessoais</li>
                                <li>✅ Corrigir dados incompletos ou desatualizados</li>
                                <li>✅ Solicitar exclusão de dados (portabilidade)</li>
                                <li>✅ Revogar consentimento a qualquer momento</li>
                                <li>✅ Obter informações sobre compartilhamento</li>
                            </ul>
                            <p className="mt-2 text-sm text-gray-400">
                                Para exercer seus direitos, entre em contato: 
                                <span className="text-[#4DB6AC]"> dpo@tradingjournal.com.br</span>
                            </p>
                        </section>
                        
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">6. Segurança dos Dados</h2>
                            <p>Implementamos medidas de segurança incluindo:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                                <li>Criptografia em trânsito (TLS 1.3) e em repouso</li>
                                <li>Autenticação segura via OAuth (Google/GitHub)</li>
                                <li>Rate limiting e proteção contra ataques</li>
                                <li>Logs de auditoria para ações críticas</li>
                            </ul>
                        </section>
                        
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">7. Cookies</h2>
                            <p>Utilizamos cookies para:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                                <li><strong>Essenciais:</strong> Autenticação e sessão (não podem ser desabilitados)</li>
                                <li><strong>Preferências:</strong> Armazenar suas configurações</li>
                            </ul>
                            <p className="mt-2">
                                Não utilizamos cookies de rastreamento ou publicidade.
                            </p>
                        </section>
                        
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">8. Retenção de Dados</h2>
                            <p>
                                Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão da conta, 
                                os dados são removidos em até 30 dias, exceto quando a retenção for exigida por lei.
                            </p>
                        </section>
                        
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">9. Contato do Encarregado (DPO)</h2>
                            <p>
                                Para questões relacionadas à privacidade e proteção de dados:
                            </p>
                            <p className="mt-2 text-[#4DB6AC]">
                                📧 dpo@tradingjournal.com.br
                            </p>
                        </section>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-700 flex gap-4">
                        <a 
                            href="/login" 
                            className="text-[#4DB6AC] hover:text-[#26A69A] transition-colors"
                        >
                            ← Voltar para Login
                        </a>
                        <a 
                            href="/termos" 
                            className="text-gray-400 hover:text-gray-200 transition-colors"
                        >
                            Ver Termos de Uso
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
