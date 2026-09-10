import { Global, Module } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Database } from './database.types';

export const KYSELY_INSTANCE = 'KYSELY_INSTANCE';

@Global()
@Module({
  providers: [
    {
      provide: KYSELY_INSTANCE,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
          throw new Error('Falta la variable de entorno DATABASE_URL');
        }
        const dialect = new PostgresDialect({
          pool: new Pool({ connectionString }),
        });
        return new Kysely<Database>({ dialect });
      },
    },
  ],
  exports: [KYSELY_INSTANCE],
})
export class DatabaseModule {}
