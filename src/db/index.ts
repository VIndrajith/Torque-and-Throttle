import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
  var _sqlDisabled: boolean | undefined;
}

export const isSqlConfigured = (): boolean => {
  return Boolean(process.env.SQL_HOST && process.env.SQL_DB_NAME && !global._sqlDisabled);
};

export const createPool = () => {
  if (!global._postgresPool && isSqlConfigured()) {
    try {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 5,
        connectionTimeoutMillis: 2000,
      });

      global._postgresPool.on('error', (err) => {
        // Quietly disable SQL if socket/connection does not exist
        if (err.message.includes('ENOENT') || err.message.includes('ECONNREFUSED')) {
          global._sqlDisabled = true;
        }
      });
    } catch {
      global._sqlDisabled = true;
    }
  }
  return global._postgresPool;
};

const pool = createPool();
const fallbackPool = pool || new Pool({ connectionTimeoutMillis: 1000 });
fallbackPool.on('error', () => {
  // Prevent unhandled error event if SQL is not provisioned
});

// Dummy or active pool
export const db = drizzle(fallbackPool as any, { schema });
