import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { DatabaseService } from './database.service';
import { closeStorage, initStorage } from './repository';

// Opens the storage (PostgreSQL, the saved file or memory) when the app starts.
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule implements OnModuleInit, OnModuleDestroy {
  public async onModuleInit(): Promise<void> {
    await initStorage();
  }

  public async onModuleDestroy(): Promise<void> {
    await closeStorage();
  }
}
