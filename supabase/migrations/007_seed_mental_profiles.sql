-- Mental Hub: Seed Profiles (Cold Start Data)
-- Based on trading psychology literature (Tendler, Douglas, Steenbarger)

-- C-GAME (Red Zone) - Destructive Behaviors
INSERT INTO mental_profiles (user_id, category, severity, description, zone, is_system) VALUES
(NULL, 'tilt', 10, 'Aumentar lote após loss para recuperar', 'C-Game', TRUE),
(NULL, 'tilt', 9, 'Entrar sem setup definido', 'C-Game', TRUE),
(NULL, 'tilt', 9, 'Ignorar stop loss', 'C-Game', TRUE),
(NULL, 'tilt', 8, 'Média de preço contra a tendência', 'C-Game', TRUE),
(NULL, 'greed', 9, 'Não respeitar alvo de gain', 'C-Game', TRUE),
(NULL, 'greed', 8, 'Adicionar posição em trade ganhador sem critério', 'C-Game', TRUE),
(NULL, 'fear', 8, 'Sair antes do stop por medo', 'C-Game', TRUE),
(NULL, 'fear', 7, 'Cancelar ordem de entrada por ansiedade', 'C-Game', TRUE),
(NULL, 'fomo', 9, 'Entrar atrasado após perder o timing', 'C-Game', TRUE),
(NULL, 'fomo', 8, 'Perseguir preço fora da zona de entrada', 'C-Game', TRUE),
(NULL, 'overconfidence', 8, 'Dobrar risco após sequência de wins', 'C-Game', TRUE),
(NULL, 'overconfidence', 7, 'Ignorar regras após lucro grande', 'C-Game', TRUE);

-- B-GAME (Yellow Zone) - Suboptimal but Manageable
INSERT INTO mental_profiles (user_id, category, severity, description, zone, is_system) VALUES
(NULL, 'hesitation', 6, 'Demorar para executar o trade', 'B-Game', TRUE),
(NULL, 'hesitation', 5, 'Análise excessiva (paralisia por análise)', 'B-Game', TRUE),
(NULL, 'fear', 5, 'Reduzir lote sem razão técnica', 'B-Game', TRUE),
(NULL, 'fear', 4, 'Evitar operar em dia de notícia', 'B-Game', TRUE),
(NULL, 'greed', 5, 'Estender alvo sem setup confirmando', 'B-Game', TRUE),
(NULL, 'tilt', 5, 'Irritação leve após loss normal', 'B-Game', TRUE),
(NULL, 'discipline', 5, 'Não anotar o trade no diário', 'B-Game', TRUE),
(NULL, 'discipline', 4, 'Pular o check pré-operacional', 'B-Game', TRUE);

-- A-GAME (Green Zone) - Peak Performance
INSERT INTO mental_profiles (user_id, category, severity, description, zone, is_system) VALUES
(NULL, 'discipline', 2, 'Esperar o candle fechar antes de entrar', 'A-Game', TRUE),
(NULL, 'discipline', 1, 'Seguir o plano de trade à risca', 'A-Game', TRUE),
(NULL, 'discipline', 2, 'Aceitar loss como custo do negócio', 'A-Game', TRUE),
(NULL, 'discipline', 1, 'Fazer pré-operacional completo', 'A-Game', TRUE),
(NULL, 'discipline', 1, 'Respeitar limite diário de loss', 'A-Game', TRUE),
(NULL, 'discipline', 2, 'Anotar trade imediatamente após fechar', 'A-Game', TRUE),
(NULL, 'discipline', 1, 'Pausar após 2 losses seguidos', 'A-Game', TRUE),
(NULL, 'fear', 3, 'Reconhecer o medo e respirar antes de agir', 'A-Game', TRUE),
(NULL, 'greed', 3, 'Parcial no alvo 1 e deixar correr com trailing', 'A-Game', TRUE);
