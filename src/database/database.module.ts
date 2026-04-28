import { Module, Global } from '@nestjs/common';
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
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        const ssl = config.get<string>('DATABASE_SSL') === 'true';
        return new Pool({
          connectionString: url,
          ssl: ssl ? { rejectUnauthorized: false } : false,
        });
      },
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}

