import {
  Controller,
  Get,
  ServiceUnavailableException,
} from "@nestjs/common";

import { DatabaseService } from "./database.service";

interface HealthResponse {
  status: "ok" | "unavailable";
  api: "reachable";
  database: "reachable" | "unavailable" | "not_configured";
  dataSource: "postgresql" | "mock";
  mockData: "ready" | "not_used";
}

@Controller("health")
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  async getHealth(): Promise<HealthResponse> {
    if (!this.databaseService.isConfigured()) {
      return {
        status: "ok",
        api: "reachable",
        database: "not_configured",
        dataSource: "mock",
        mockData: "ready",
      };
    }

    try {
      await this.databaseService.checkConnection();
      return {
        status: "ok",
        api: "reachable",
        database: "reachable",
        dataSource: "postgresql",
        mockData: "not_used",
      };
    } catch {
      throw new ServiceUnavailableException({
        status: "unavailable",
        api: "reachable",
        database: "unavailable",
        dataSource: "postgresql",
        mockData: "not_used",
      });
    }
  }
}
