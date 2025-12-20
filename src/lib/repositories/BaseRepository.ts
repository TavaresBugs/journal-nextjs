import { SupabaseClient } from "@supabase/supabase-js";
import { Result } from "./types";
import { AppError, ErrorCode, toAppError } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";

/**
 * Classe base abstrata para todos os repositórios.
 * Fornece métodos CRUD genéricos e tratamento de erro padronizado para o Supabase.
 *
 * @template T O tipo da entidade que este repositório gerencia.
 */
export abstract class BaseRepository<T> {
  protected supabase: SupabaseClient;
  protected tableName: string;
  protected logger: Logger;

  /**
   * Cria uma nova instância do repositório.
   *
   * @param supabase - O cliente Supabase para interação com o banco de dados.
   * @param tableName - O nome da tabela no banco de dados.
   */
  constructor(supabase: SupabaseClient, tableName: string) {
    this.supabase = supabase;
    this.tableName = tableName;
    this.logger = new Logger(`${tableName}Repository`);
  }

  /**
   * Executa uma query do Supabase com tratamento de erro padronizado.
   * Captura exceções e erros do Supabase, convertendo-os para AppError.
   *
   * @template R - O tipo de retorno esperado da query.
   * @param fn - Uma função que retorna a promise da query do Supabase.
   * @returns Um objeto Result contendo os dados (em caso de sucesso) ou um erro.
   */
  protected async query<R>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: () => PromiseLike<{ data: R | null; error: any }>
  ): Promise<Result<R, AppError>> {
    try {
      const { data, error } = await fn();

      if (error) {
        this.logger.error("Query failed", { error });

        let errorCode = ErrorCode.DB_QUERY_FAILED;
        if (error.code === "PGRST116") errorCode = ErrorCode.DB_NOT_FOUND;
        if (error.code === "23505") errorCode = ErrorCode.DB_CONSTRAINT_VIOLATION;

        return {
          data: null,
          error: new AppError(error.message || "Database error", errorCode, 500, {
            originalError: error,
          }),
        };
      }

      // Supabase returns null data for some queries even on success (e.g. maybeSingle) if not found
      // We need to handle this based on the specific query expectation, but generally:
      if (data === null) {
        // If the query was meant to find something and didn't (and didn't error), it might be a not found case
        // But for now let's just return null data as success
      }

      return { data: data as R, error: null };
    } catch (err) {
      this.logger.error("Unexpected error in repository", { error: err });
      return {
        data: null,
        error: toAppError(err, "Unexpected repository error"),
      };
    }
  }

  // Basic CRUD

  /**
   * Busca um registro pelo ID.
   *
   * @param id - O ID do registro.
   * @returns O registro encontrado ou erro se falhar/não encontrar (dependendo da query).
   */
  async getById(id: string): Promise<Result<T, AppError>> {
    return this.query<T>(() =>
      this.supabase.from(this.tableName).select("*").eq("id", id).single()
    );
  }

  /**
   * Busca múltiplos registros por uma lista de IDs.
   *
   * @param ids - Array de IDs para buscar.
   * @returns Lista de registros encontrados.
   */
  async getByIds(ids: string[]): Promise<Result<T[], AppError>> {
    return this.query<T[]>(() => this.supabase.from(this.tableName).select("*").in("id", ids));
  }

  /**
   * Cria um novo registro.
   *
   * @param data - Dados parciais da entidade a ser criada.
   * @returns O registro criado.
   */
  async create(data: Partial<T>): Promise<Result<T, AppError>> {
    return this.query<T>(() => this.supabase.from(this.tableName).insert(data).select().single());
  }

  /**
   * Atualiza um registro existente.
   *
   * @param id - O ID do registro a ser atualizado.
   * @param data - Dados parciais para atualizar.
   * @returns O registro atualizado.
   */
  async update(id: string, data: Partial<T>): Promise<Result<T, AppError>> {
    return this.query<T>(() =>
      this.supabase.from(this.tableName).update(data).eq("id", id).select().single()
    );
  }

  /**
   * Remove um registro pelo ID.
   *
   * @param id - O ID do registro a ser removido.
   * @returns True se removido com sucesso, ou erro em caso de falha.
   */
  async delete(id: string): Promise<Result<boolean, AppError>> {
    const res = await this.query<null>(() =>
      this.supabase.from(this.tableName).delete().eq("id", id)
    );

    if (res.error) return { data: null, error: res.error };
    return { data: true, error: null };
  }
}
