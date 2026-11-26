import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { Pool, QueryResult, QueryResultRow } from "pg";

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly pool: Pool | undefined;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (connectionString) {
      this.pool = new Pool({ connectionString });
    }
  }

  isConfigured(): boolean {
    return this.pool !== undefined;
  }

  async checkConnection(): Promise<void> {
    await this.query("SELECT 1");
  }

  async query<Result extends QueryResultRow>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<QueryResult<Result>> {
    if (!this.pool) {
      throw new Error("Database is not configured");
    }

    return this.pool.query<Result>(text, [...values]);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool?.end();
  }
}
