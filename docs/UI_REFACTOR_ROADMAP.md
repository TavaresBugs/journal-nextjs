# Roadmap de Padronização e Refatoração da UI

Este documento descreve o plano para refatorar e padronizar os componentes da UI, com o objetivo de reduzir a duplicação de código, aumentar a consistência e simplificar a manutenção. O trabalho será dividido em sessões, cada uma com um foco específico.

## Sessão 1: Centralização e Padronização de Botões

**Objetivo:** Garantir que todos os elementos clicáveis que funcionam como botões usem um único componente `Button` padronizado, eliminando estilos manuais e componentes duplicados.

**Passos:**

1.  Analisar o componente base `src/components/ui/button.tsx` para entender suas variantes (tamanho, cor, etc.).
2.  Procurar no projeto por usos de `<button className="...">` e `<a>` estilizados como botões.
3.  Substituir implementações personalizadas pelo componente `Button` padrão.
4.  Criar novas variantes no componente `Button` se for necessário.

## Sessão 2: Unificação de Inputs, Textareas e Selects

**Objetivo:** Padronizar todos os campos de formulário para usar componentes de UI consistentes, melhorando a acessibilidade e a estilização.

**Passos:**

1.  Analisar os componentes `Input`, `Textarea` e `Select` em `src/components/ui/`.
2.  Mapear o uso de `<input>`, `<textarea>` e `<select>` nativos com estilos personalizados.
3.  Refatorar os formulários para usar os componentes de UI padronizados, garantindo que `labels` e mensagens de erro sejam consistentes.

## Sessão 3: Consolidação de Cards e Contêineres de Layout

**Objetivo:** Criar e utilizar um componente `Card` padronizado para todas as áreas que apresentam conteúdo em blocos, como painéis de estatísticas, itens de lista, etc.

**Passos:**

1.  Analisar ou criar um componente `Card` em `src/components/ui/card.tsx`.
2.  Identificar `divs` que são repetidamente estilizadas para parecerem "cards" ou "painéis".
3.  Substituir essas `divs` pelo componente `Card` padronizado, utilizando suas props para configurar `header`, `content` e `footer`.

## Sessão 4: Abstração de Componentes Específicos de Domínio

**Objetivo:** Identificar componentes que são reutilizados em várias partes de uma feature (ex: `journal`, `trades`) e extraí-los para um diretório compartilhado dentro dessa feature, evitando "componentes de página única".

**Passos:**

1.  Analisar componentes grandes e monolíticos em `src/components/[feature]/`.
2.  Identificar lógica de UI repetida e extraí-la para sub-componentes menores e reutilizáveis.
3.  Organizar esses sub-componentes em uma estrutura de diretório lógica (ex: `src/components/journal/shared/`).
