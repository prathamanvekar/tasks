import { PagesFunction } from '@cloudflare/workers-types';
import { getDbClient, initializeDatabase, Env } from './db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// Handle CORS Preflight OPTIONS requests
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

function isAuthorized(request: Request, env: Env): boolean {
  if (!env.API_SECRET) {
    // Optional API_SECRET: if not configured, allow access (makes developer onboarding easier)
    return true;
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  return token === env.API_SECRET;
}

// GET /api/sync - returns all task history from the database
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    if (!isAuthorized(context.request, context.env)) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: CORS_HEADERS,
      });
    }

    const client = getDbClient(context.env);
    await initializeDatabase(client);

    // Fetch all logs from all tables
    const dailyResult = await client.execute('SELECT * FROM daily_tasks');
    const weeklyResult = await client.execute('SELECT * FROM weekly_tasks');
    const monthlyResult = await client.execute('SELECT * FROM monthly_tasks');

    // Map database models to application camelCase formats
    const daily = dailyResult.rows.map((row: any) => ({
      dateKey: String(row.date_key),
      bootdev: Boolean(row.bootdev),
      neetcode: Boolean(row.neetcode),
      ailearning: Boolean(row.ailearning),
      twitter: Boolean(row.twitter),
      jobhunt: Boolean(row.jobhunt),
    }));

    const weekly = weeklyResult.rows.map((row: any) => ({
      weekKey: String(row.week_key),
      oss1: String(row.oss1 || ''),
      oss2: String(row.oss2 || ''),
      projectRepo: String(row.project_repo || ''),
      codechef: String(row.codechef || ''),
      codeforces: String(row.codeforces || ''),
      leetcode: String(row.leetcode || ''),
      hackathon: String(row.hackathon || ''),
      ctf: String(row.ctf || ''),
      revision: String(row.revision || ''),
      isSaved: Boolean(row.is_saved),
    }));

    const monthly = monthlyResult.rows.map((row: any) => ({
      monthKey: String(row.month_key),
      blog1: String(row.blog1 || ''),
      blog2: String(row.blog2 || ''),
      langCommit: String(row.lang_commit || ''),
      isSaved: Boolean(row.is_saved),
    }));

    return new Response(JSON.stringify({ daily, weekly, monthly }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};

// POST /api/sync - upserts or deletes task records
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    if (!isAuthorized(context.request, context.env)) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: CORS_HEADERS,
      });
    }

    const payload: any = await context.request.json();
    const { type } = payload;
    const client = getDbClient(context.env);

    if (type === 'daily') {
      const { dateKey, data } = payload;
      // Optimize storage: if all checkboxes are false, delete the row
      const allFalse = !data.bootdev && !data.neetcode && !data.ailearning && !data.twitter && !data.jobhunt;
      if (allFalse) {
        await client.execute(
          'DELETE FROM daily_tasks WHERE date_key = ?',
          [dateKey]
        );
      } else {
        await client.execute(
          `INSERT INTO daily_tasks (date_key, bootdev, neetcode, ailearning, twitter, jobhunt)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(date_key) DO UPDATE SET
                  bootdev = excluded.bootdev,
                  neetcode = excluded.neetcode,
                  ailearning = excluded.ailearning,
                  twitter = excluded.twitter,
                  jobhunt = excluded.jobhunt`,
          [
            dateKey,
            data.bootdev ? 1 : 0,
            data.neetcode ? 1 : 0,
            data.ailearning ? 1 : 0,
            data.twitter ? 1 : 0,
            data.jobhunt ? 1 : 0,
          ]
        );
      }
    } else if (type === 'weekly') {
      const { weekKey, data } = payload;
      await client.execute(
        `INSERT INTO weekly_tasks (week_key, oss1, oss2, project_repo, codechef, codeforces, leetcode, hackathon, ctf, revision, is_saved)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(week_key) DO UPDATE SET
                oss1 = excluded.oss1,
                oss2 = excluded.oss2,
                project_repo = excluded.project_repo,
                codechef = excluded.codechef,
                codeforces = excluded.codeforces,
                leetcode = excluded.leetcode,
                hackathon = excluded.hackathon,
                ctf = excluded.ctf,
                revision = excluded.revision,
                is_saved = excluded.is_saved`,
        [
          weekKey,
          data.oss1 || '',
          data.oss2 || '',
          data.projectRepo || '',
          data.codechef || '',
          data.codeforces || '',
          data.leetcode || '',
          data.hackathon || '',
          data.ctf || '',
          data.revision || '',
          data.isSaved ? 1 : 0,
        ]
      );
    } else if (type === 'monthly') {
      const { monthKey, data } = payload;
      await client.execute(
        `INSERT INTO monthly_tasks (month_key, blog1, blog2, lang_commit, is_saved)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(month_key) DO UPDATE SET
                blog1 = excluded.blog1,
                blog2 = excluded.blog2,
                lang_commit = excluded.lang_commit,
                is_saved = excluded.is_saved`,
        [
          monthKey,
          data.blog1 || '',
          data.blog2 || '',
          data.langCommit || '',
          data.isSaved ? 1 : 0,
        ]
      );
    } else {
      return new Response(JSON.stringify({ error: 'invalid type parameter' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};
