import { connect, Connection } from '@tursodatabase/serverless';

export interface Env {
  TURSO_URL: string;
  TURSO_AUTH_TOKEN: string;
  API_SECRET?: string;
  CRON_SECRET?: string;
  RESEND_API_KEY?: string;
}

/**
 * creates and returns a turso client instance.
 */
export function getDbClient(env: Env): Connection {
  if (!env.TURSO_URL || !env.TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_URL and TURSO_AUTH_TOKEN environment variables must be set.');
  }
  return connect({
    url: env.TURSO_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
}

/**
 * ensures that all required sqlite tables exist in the database.
 */
export async function initializeDatabase(client: Connection): Promise<void> {
  await client.batch([
    `CREATE TABLE IF NOT EXISTS daily_tasks (
      date_key TEXT PRIMARY KEY,
      bootdev INTEGER DEFAULT 0,
      neetcode INTEGER DEFAULT 0,
      ailearning INTEGER DEFAULT 0,
      twitter INTEGER DEFAULT 0,
      jobhunt INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS weekly_tasks (
      week_key TEXT PRIMARY KEY,
      oss1 TEXT DEFAULT '',
      oss2 TEXT DEFAULT '',
      project_repo TEXT DEFAULT '',
      codechef TEXT DEFAULT '',
      codeforces TEXT DEFAULT '',
      leetcode TEXT DEFAULT '',
      hackathon TEXT DEFAULT '',
      ctf TEXT DEFAULT '',
      revision TEXT DEFAULT '',
      is_saved INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS monthly_tasks (
      month_key TEXT PRIMARY KEY,
      blog1 TEXT DEFAULT '',
      blog2 TEXT DEFAULT '',
      lang_commit TEXT DEFAULT '',
      is_saved INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS inbox_tasks (
      id TEXT PRIMARY KEY,
      text TEXT DEFAULT '',
      completed INTEGER DEFAULT 0,
      position INTEGER DEFAULT 0
    );`
  ]);
}
