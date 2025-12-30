# Guia de Contribuição

Obrigado pelo interesse em contribuir com o Journal Next.js! Este documento define os padrões e boas práticas do projeto.

## Padrões de Código

### Documentação (JSDoc)

Todas as funções, classes e interfaces públicas devem ser documentadas utilizando JSDoc. Isso melhora o IntelliSense e facilita o onboarding de novos desenvolvedores.

#### Template Básico

```typescript
/**
 * Descrição curta do que a função faz.
 * Descrição mais detalhada se necessário.
 *
 * @param param1 - Descrição do parâmetro 1
 * @param param2 - Descrição do parâmetro 2 (opcional)
 * @returns Descrição do valor de retorno
 * @throws {ErrorType} Descrição de possíveis erros
 *
 * @example
 * const result = myFunction('valor');
 */
export function myFunction(param1: string, param2?: number): Result {
  // ...
}
```

#### Classes e Métodos

```typescript
/**
 * Repository para gerenciar operações de trades.
 */
export class TradeRepository {
  /**
   * Busca trades recentes.
   *
   * @param accountId - O ID da conta
   * @returns Promise com array de trades
   */
  async getRecent(accountId: string): Promise<Trade[]> {
    // ...
  }
}
```

### Git Hooks e Commits

Utilizamos Husky e Commitlint para garantir a qualidade dos commits.

- **Commits**: Devem seguir o padrão [Conventional Commits](https://www.conventionalcommits.org/).
  - `feat`: Nova funcionalidade
  - `fix`: Correção de bug
  - `docs`: Documentação
  - `refactor`: Refatoração de código
  - `test`: Testes
  - `chore`: Tarefas de build/configs

Exemplo: `feat(auth): add google login support`

- **Pre-commit**: O Husky irá rodar `lint-staged` para verificar linting apenas nos arquivos modificados.
- **Pre-push**: Testes e build serão executados antes de enviar para o repositório remoto.

### Testes

- Novos componentes e lógica de negócio devem ter testes unitários.
- Rode `npm test` para executar a suíte de testes.

## Estrutura do Projeto

- `src/app`: Páginas e rotas (Next.js App Router)
- `src/components`: Componentes React reutilizáveis
- `src/hooks`: Custom Hooks
- `src/lib`: Configurações e utilitários (Supabase, Utils)
- `src/services`: Lógica de negócio e chamadas de API
- `src/store`: Gerenciamento de estado global (Zustand)
- `src/types`: Definições de tipos TypeScript
