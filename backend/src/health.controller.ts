import {
  Controller,
  Get,
  ServiceUnavailableException,
} from "@nestjs/common";

import { DatabaseService } from "./database.service";

interface HealthResponse {
  status: "ok" | "unavailable";
  api: "reachable";
  database: "reachable" | "unavailable";
}

@Controller("health")
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  async getHealth(): Promise<HealthResponse> {
    try {
      await this.databaseService.checkConnection();
      return {
        status: "ok",
        api: "reachable",
        database: "reachable",
      };
    } catch {
      throw new ServiceUnavailableException({
        status: "unavailable",
        api: "reachable",
        database: "unavailable",
      });
    }
  }
}
