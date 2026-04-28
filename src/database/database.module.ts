import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const DATABASE_POOL = 'DATABASE_POOL';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const url = config.get<string>('DATABASE_URL');
        const ssl = config.get<string>('DATABASE_SSL') === 'true';

        const pool = new Pool({
          connectionString: url,
          ssl: ssl ? { rejectUnauthorized: false } : false,
        });

        try {
          const client = await pool.connect();
          const res = await client.query('SELECT current_database() AS db, inet_server_addr() AS host');
          const { db, host } = res.rows[0];
          client.release();
          logger.log(`✅ Database connected successfully → db: "${db}" | host: ${host ?? 'N/A'}`);
        } catch (err: any) {
          logger.error(`❌ Database connection failed: ${err.message}`);
        }

        return pool;
      },
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}


