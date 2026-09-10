import { Controller, Get, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { KYSELY_INSTANCE } from '../database/database.module';
import { Database } from '../database/database.types';

@Controller('health')
export class HealthController {
  constructor(@Inject(KYSELY_INSTANCE) private readonly db: Kysely<Database>) {}

  @Get()
  async check() {
    try {
      await sql`select 1`.execute(this.db);
      return { status: 'ok', database: 'connected' };
    } catch (err) {
      return {
        status: 'ok',
        database: 'error',
        message: err instanceof Error ? err.message : 'error desconocido',
      };
    }
  }
}
