import { PagesFunction } from '@cloudflare/workers-types';
import { getDbClient, Env } from './db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

// Date Helpers
function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekString(date: Date): string {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  week1.setDate(week1.getDate() + 3 - (week1.getDay() + 6) % 7);
  const millisecondDiff = tempDate.getTime() - week1.getTime();
  const weekNum = 1 + Math.round(millisecondDiff / 604800000);
  return `${tempDate.getFullYear()}-w${String(weekNum).padStart(2, '0')}`;
}

function getWeekRange(date: Date): string {
  const currentDay = date.getDay();
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(date);
  monday.setDate(date.getDate() + distanceToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString('en-US', options)} - ${sunday.toLocaleDateString('en-US', options)}`;
}

function getMonthString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// Streak & Stats Calculator
interface StreakStats {
  streak: number;
  maxStreak: number;
  completionRate: number;
}

function calculateStreakStats(rows: any[], targetDateStr: string): StreakStats {
  const dailyMap = new Map<string, boolean>();
  rows.forEach((row) => {
    const isCompleted =
      Boolean(row.bootdev) &&
      Boolean(row.neetcode) &&
      Boolean(row.ailearning) &&
      Boolean(row.twitter) &&
      Boolean(row.jobhunt);
    dailyMap.set(row.date_key, isCompleted);
  });

  let maxStreak = 0;
  let currentRun = 0;

  const sortedDates = Array.from(dailyMap.keys()).sort();
  sortedDates.forEach((dateStr) => {
    if (dailyMap.get(dateStr)) {
      currentRun++;
      if (currentRun > maxStreak) maxStreak = currentRun;
    } else {
      currentRun = 0;
    }
  });

  let streak = 0;
  const targetDate = new Date(targetDateStr);
  const todayStr = formatDateString(new Date());

  const todayDone = dailyMap.get(todayStr) || false;
  const yesterday = new Date(targetDate.getTime());
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateString(yesterday);
  const yesterdayDone = dailyMap.get(yesterdayStr) || false;

  const canHaveStreak = todayDone || yesterdayDone;

  if (canHaveStreak) {
    let checkDate = new Date(targetDate.getTime());
    for (let i = 0; i < 365; i++) {
      const keyStr = formatDateString(checkDate);
      const isDone = dailyMap.get(keyStr) || false;
      if (isDone) {
        if (todayDone || i > 0) {
          streak++;
        }
      } else {
        if (i > 0 || todayDone) {
          break;
        }
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  let completedInLast30 = 0;
  let daysScanned = 0;
  let rateScanDate = new Date(targetDate.getTime());
  for (let i = 0; i < 30; i++) {
    const keyStr = formatDateString(rateScanDate);
    if (dailyMap.has(keyStr)) {
      daysScanned++;
      if (dailyMap.get(keyStr)) {
        completedInLast30++;
      }
    }
    rateScanDate.setDate(rateScanDate.getDate() - 1);
  }

  const completionRate = daysScanned > 0 ? Math.round((completedInLast30 / daysScanned) * 100) : 0;

  return { streak, maxStreak, completionRate };
}

// Helper to calculate weekly streaks
interface WeeklyStreakStats {
  streak: number;
  maxStreak: number;
}

function calculateWeeklyStreakStats(rows: any[], targetWeekKey: string): WeeklyStreakStats {
  const weeklyMap = new Map<string, boolean>();
  rows.forEach((row) => {
    const isCompleted =
      Boolean(row.is_saved) &&
      row.oss1 && row.oss1.trim() !== '' &&
      row.oss2 && row.oss2.trim() !== '' &&
      row.project_repo && row.project_repo.trim() !== '' &&
      row.codechef && row.codechef.trim() !== '' &&
      row.codeforces && row.codeforces.trim() !== '' &&
      row.leetcode && row.leetcode.trim() !== '' &&
      row.hackathon && row.hackathon.trim() !== '' &&
      row.ctf && row.ctf.trim() !== '' &&
      row.revision && row.revision.trim() !== '';
    weeklyMap.set(row.week_key, isCompleted);
  });

  let maxStreak = 0;
  let currentRun = 0;
  const sortedWeeks = Array.from(weeklyMap.keys()).sort();
  sortedWeeks.forEach((wKey) => {
    if (weeklyMap.get(wKey)) {
      currentRun++;
      if (currentRun > maxStreak) maxStreak = currentRun;
    } else {
      currentRun = 0;
    }
  });

  let streak = 0;
  const currentWeekDone = weeklyMap.get(targetWeekKey) || false;

  function getOffsetWeekKey(wKey: string, offset: number): string {
    const [yearStr, weekStr] = wKey.split('-w');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    const date = new Date(year, 0, 4);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    date.setDate(date.getDate() + (week - 1 + offset) * 7);
    return getWeekString(date);
  }

  const prevWeekKey = getOffsetWeekKey(targetWeekKey, -1);
  const prevWeekDone = weeklyMap.get(prevWeekKey) || false;
  const canHaveStreak = currentWeekDone || prevWeekDone;

  if (canHaveStreak) {
    for (let i = 0; i < 52; i++) {
      const keyStr = getOffsetWeekKey(targetWeekKey, -i);
      const isDone = weeklyMap.get(keyStr) || false;
      if (isDone) {
        if (currentWeekDone || i > 0) {
          streak++;
        }
      } else {
        if (i > 0 || currentWeekDone) {
          break;
        }
      }
    }
  }

  return { streak, maxStreak };
}

// Helper to calculate monthly streaks
interface MonthlyStreakStats {
  streak: number;
  maxStreak: number;
}

function calculateMonthlyStreakStats(rows: any[], targetMonthKey: string): MonthlyStreakStats {
  const monthlyMap = new Map<string, boolean>();
  rows.forEach((row) => {
    const isCompleted =
      Boolean(row.is_saved) &&
      row.blog1 && row.blog1.trim() !== '' &&
      row.blog2 && row.blog2.trim() !== '' &&
      row.lang_commit && row.lang_commit.trim() !== '';
    monthlyMap.set(row.month_key, isCompleted);
  });

  let maxStreak = 0;
  let currentRun = 0;
  const sortedMonths = Array.from(monthlyMap.keys()).sort();
  sortedMonths.forEach((mKey) => {
    if (monthlyMap.get(mKey)) {
      currentRun++;
      if (currentRun > maxStreak) maxStreak = currentRun;
    } else {
      currentRun = 0;
    }
  });

  let streak = 0;
  const currentMonthDone = monthlyMap.get(targetMonthKey) || false;

  function getOffsetMonthKey(mKey: string, offset: number): string {
    const [yearStr, monthStr] = mKey.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const date = new Date(year, month - 1 + offset, 15);
    return getMonthString(date);
  }

  const prevMonthKey = getOffsetMonthKey(targetMonthKey, -1);
  const prevMonthDone = monthlyMap.get(prevMonthKey) || false;
  const canHaveStreak = currentMonthDone || prevMonthDone;

  if (canHaveStreak) {
    for (let i = 0; i < 24; i++) {
      const keyStr = getOffsetMonthKey(targetMonthKey, -i);
      const isDone = monthlyMap.get(keyStr) || false;
      if (isDone) {
        if (currentMonthDone || i > 0) {
          streak++;
        }
      } else {
        if (i > 0 || currentMonthDone) {
          break;
        }
      }
    }
  }

  return { streak, maxStreak };
}

// Formatting helper for links and __NOT_DONE__
function formatLinkOrValue(val: string | null | undefined): string {
  if (!val || val.trim() === '') return 'none';
  if (val === '__NOT_DONE__') return '<span style="color: #ff5555; text-decoration: line-through; font-style: italic;">not done</span>';
  return val;
}

// HTML Email Layout Generator (Theme Cohesive, Strictly Lowercase, Brutalist Minimal)
function wrapEmailHtml(contentHtml: string, title: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body, p, h1, h2, h3, div, span, td {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          text-transform: lowercase !important;
        }
      </style>
    </head>
    <body style="background-color: #1f1f1f; color: #d1d1d1; margin: 0; padding: 40px 20px; font-size: 14px; line-height: 1.6;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #1f1f1f;">
        <tr>
          <td style="padding-bottom: 24px;">
            <!-- Header -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 2px solid #ff5555; padding-bottom: 12px;">
              <tr>
                <td>
                  <h1 style="font-size: 26px; font-weight: 800; color: #ffffff; margin: 0 0 4px 0;">good morning, pratham.</h1>
                  <span style="font-size: 11px; color: #888888;">[ tasks.sh // automated statistics report ]</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <!-- Main Content Card -->
            <div style="background-color: #282828; border: 1.5px solid #2e2e2e; padding: 24px; margin-bottom: 24px; box-shadow: 4px 4px 0px #0a0a0a; border-radius: 4px;">
              ${contentHtml}
            </div>
          </td>
        </tr>
        <tr>
          <td style="text-align: center; padding-top: 12px;">
            <p style="font-size: 10px; color: #555555; margin: 0;">
              this is an automated report sent from cloudflare edge environment.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// POST/GET /api/cron-email - sends daily, weekly, or monthly reports
export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;

    // 1. Security Authorization Check
    const authHeader = request.headers.get('Authorization');
    const url = new URL(request.url);
    const secretParam = url.searchParams.get('secret');
    const cronSecret = env.CRON_SECRET;

    if (cronSecret) {
      const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : secretParam;
      if (token !== cronSecret) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: CORS_HEADERS,
        });
      }
    }

    // 2. Identify report type
    const type = url.searchParams.get('type') || 'daily'; // daily, weekly, monthly
    const client = getDbClient(env);

    if (!env.RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not configured.' }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    const today = new Date();
    let subject = '';
    let emailHtml = '';

    if (type === 'daily') {
      const dateKey = url.searchParams.get('date') || formatDateString(today);
      
      // Fetch daily task data for target date
      const dateResult = await client.execute(
        'SELECT * FROM daily_tasks WHERE date_key = ?',
        [dateKey]
      );

      const allDailyResult = await client.execute('SELECT * FROM daily_tasks');
      const stats = calculateStreakStats(allDailyResult.rows, dateKey);

      // Fetch weekly and monthly to calculate their streaks
      const allWeeklyResult = await client.execute('SELECT * FROM weekly_tasks');
      const weekKey = getWeekString(today);
      const weeklyStats = calculateWeeklyStreakStats(allWeeklyResult.rows, weekKey);

      const allMonthlyResult = await client.execute('SELECT * FROM monthly_tasks');
      const monthKey = getMonthString(today);
      const monthlyStats = calculateMonthlyStreakStats(allMonthlyResult.rows, monthKey);

      const task = dateResult.rows[0] || {
        bootdev: 0,
        neetcode: 0,
        ailearning: 0,
        twitter: 0,
        jobhunt: 0,
      };

      const formatCheckbox = (val: any) =>
        val
          ? `<span style="color: #ff5555; font-weight: bold; margin-right: 6px;">[■]</span>`
          : `<span style="color: #666666; margin-right: 6px;">[ ]</span>`;

      subject = `tasks: daily report [ ${dateKey} ]`;
      emailHtml = wrapEmailHtml(`
        <h3 style="font-size: 14px; font-weight: bold; color: #ffffff; border-bottom: 1px dotted #ff5555; padding-bottom: 6px; margin: 0 0 16px 0;">[ report // daily checklist // ${dateKey} ]</h3>
        
        <div style="margin-bottom: 12px; font-size: 13px;">
          <div style="margin-bottom: 6px;">${formatCheckbox(task.bootdev)} boot.dev (min 2 lessons)</div>
          <div style="margin-bottom: 6px;">${formatCheckbox(task.neetcode)} neetcode (min 2 problems)</div>
          <div style="margin-bottom: 6px;">${formatCheckbox(task.ailearning)} ai learning (min 0.5 chapter)</div>
          <div style="margin-bottom: 6px;">${formatCheckbox(task.twitter)} twitter post (min 1 post)</div>
          <div style="margin-bottom: 6px;">${formatCheckbox(task.jobhunt)} job hunt (apply / search)</div>
        </div>

        <div style="margin-top: 24px; border-top: 1.5px solid #2e2e2e; padding-top: 16px;">
          <h4 style="font-size: 12px; font-weight: bold; color: #ffffff; margin: 0 0 12px 0;">[ system stats ]</h4>
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #888888;">daily streak:</td>
              <td style="text-align: right; font-weight: bold; color: #ffffff; font-size: 12px;">${stats.streak}d (max: ${stats.maxStreak}d)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #888888;">weekly streak:</td>
              <td style="text-align: right; font-weight: bold; color: #ffffff; font-size: 12px;">${weeklyStats.streak}w (max: ${weeklyStats.maxStreak}w)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #888888;">monthly streak:</td>
              <td style="text-align: right; font-weight: bold; color: #ffffff; font-size: 12px;">${monthlyStats.streak}m (max: ${monthlyStats.maxStreak}m)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #888888;">completion index:</td>
              <td style="text-align: right; font-weight: bold; color: #4fc3f7; font-size: 12px;">${stats.completionRate}% (past 30 days)</td>
            </tr>
          </table>
        </div>
      `, subject);

    } else if (type === 'weekly') {
      const weekKey = url.searchParams.get('week') || getWeekString(today);
      const weekRange = getWeekRange(today);

      const weekResult = await client.execute(
        'SELECT * FROM weekly_tasks WHERE week_key = ?',
        [weekKey]
      );

      const report = weekResult.rows[0];

      if (!report || !report.is_saved) {
        return new Response(JSON.stringify({ error: `no submitted weekly report found for ${weekKey}` }), {
          status: 404,
          headers: CORS_HEADERS,
        });
      }

      // Calculate filled vs not done
      let filledCount = 0;
      let notDoneCount = 0;
      const weeklyFields = [
        report.oss1, report.oss2, report.project_repo,
        report.codechef, report.codeforces, report.leetcode,
        report.hackathon, report.ctf, report.revision
      ];
      weeklyFields.forEach(val => {
        if (!val) return;
        if (val === '__NOT_DONE__') {
          notDoneCount++;
        } else if (val.trim() !== '') {
          filledCount++;
        }
      });

      const allWeeklyResult = await client.execute('SELECT * FROM weekly_tasks');
      const weeklyStats = calculateWeeklyStreakStats(allWeeklyResult.rows, weekKey);

      subject = `tasks: weekly log [ ${weekKey} ]`;
      emailHtml = wrapEmailHtml(`
        <h3 style="font-size: 14px; font-weight: bold; color: #ffffff; border-bottom: 1px dotted #ff5555; padding-bottom: 6px; margin: 0 0 16px 0;">[ report // weekly logs // ${weekRange} ]</h3>
        
        <div style="margin-bottom: 16px; font-size: 12px; font-weight: bold; color: #ffffff;">
          stats: ${filledCount} filled, ${notDoneCount} not done (streak: ${weeklyStats.streak}w, max: ${weeklyStats.maxStreak}w)
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: #ffffff; font-size: 12px; margin: 0 0 6px 0;">[ open source contributions ]</h4>
          <div style="background-color: #1f1f1f; border: 1px solid #2e2e2e; padding: 10px; font-size: 11px; margin-bottom: 12px;">
            1. ${formatLinkOrValue(report.oss1)}<br>
            2. ${formatLinkOrValue(report.oss2)}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: #ffffff; font-size: 12px; margin: 0 0 6px 0;">[ neovim coding project ]</h4>
          <div style="background-color: #1f1f1f; border: 1px solid #2e2e2e; padding: 10px; font-size: 11px; margin-bottom: 12px;">
            repo: ${formatLinkOrValue(report.project_repo)}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: #ffffff; font-size: 12px; margin: 0 0 6px 0;">[ competitive programming contests ]</h4>
          <div style="background-color: #1f1f1f; border: 1px solid #2e2e2e; padding: 10px; font-size: 11px; margin-bottom: 12px;">
            codechef: ${formatLinkOrValue(report.codechef)}<br>
            codeforces: ${formatLinkOrValue(report.codeforces)}<br>
            leetcode: ${formatLinkOrValue(report.leetcode)}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: #ffffff; font-size: 12px; margin: 0 0 6px 0;">[ hackathons & contests ]</h4>
          <div style="background-color: #1f1f1f; border: 1px solid #2e2e2e; padding: 10px; font-size: 11px; margin-bottom: 12px;">
            details: ${formatLinkOrValue(report.hackathon)}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: #ffffff; font-size: 12px; margin: 0 0 6px 0;">[ ctf solve logs ]</h4>
          <div style="background-color: #1f1f1f; border: 1px solid #2e2e2e; padding: 10px; font-size: 11px; margin-bottom: 12px;">
            details: ${formatLinkOrValue(report.ctf)}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: #ffffff; font-size: 12px; margin: 0 0 6px 0;">[ weekly revision ]</h4>
          <div style="background-color: #1f1f1f; border: 1px solid #2e2e2e; padding: 10px; font-size: 11px; margin-bottom: 12px;">
            topics: ${formatLinkOrValue(report.revision)}
          </div>
        </div>
      `, subject);

    } else if (type === 'monthly') {
      const monthKey = url.searchParams.get('month') || getMonthString(today);
      const printableMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase();

      const monthResult = await client.execute(
        'SELECT * FROM monthly_tasks WHERE month_key = ?',
        [monthKey]
      );

      const report = monthResult.rows[0];

      if (!report || !report.is_saved) {
        return new Response(JSON.stringify({ error: `no submitted monthly milestone found for ${monthKey}` }), {
          status: 404,
          headers: CORS_HEADERS,
        });
      }

      // Calculate filled vs not done
      let filledCount = 0;
      let notDoneCount = 0;
      const monthlyFields = [report.blog1, report.blog2, report.lang_commit];
      monthlyFields.forEach(val => {
        if (!val) return;
        if (val === '__NOT_DONE__') {
          notDoneCount++;
        } else if (val.trim() !== '') {
          filledCount++;
        }
      });

      const allMonthlyResult = await client.execute('SELECT * FROM monthly_tasks');
      const monthlyStats = calculateMonthlyStreakStats(allMonthlyResult.rows, monthKey);

      subject = `tasks: monthly log [ ${monthKey} ]`;
      emailHtml = wrapEmailHtml(`
        <h3 style="font-size: 14px; font-weight: bold; color: #ffffff; border-bottom: 1px dotted #ff5555; padding-bottom: 6px; margin: 0 0 16px 0;">[ report // monthly milestones // ${printableMonth} ]</h3>
        
        <div style="margin-bottom: 16px; font-size: 12px; font-weight: bold; color: #ffffff;">
          stats: ${filledCount} filled, ${notDoneCount} not done (streak: ${monthlyStats.streak}m, max: ${monthlyStats.maxStreak}m)
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: #ffffff; font-size: 12px; margin: 0 0 6px 0;">[ written publications ]</h4>
          <div style="background-color: #1f1f1f; border: 1px solid #2e2e2e; padding: 10px; font-size: 11px; margin-bottom: 12px;">
            1. ${formatLinkOrValue(report.blog1)}<br>
            2. ${formatLinkOrValue(report.blog2)}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: #ffffff; font-size: 12px; margin: 0 0 6px 0;">[ programming language / compiler feature ]</h4>
          <div style="background-color: #1f1f1f; border: 1px solid #2e2e2e; padding: 10px; font-size: 11px; margin-bottom: 12px;">
            commit / pr: ${formatLinkOrValue(report.lang_commit)}
          </div>
        </div>
      `, subject);

    } else {
      return new Response(JSON.stringify({ error: 'invalid type parameter' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // 3. Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'tasks <onboarding@resend.dev>',
        to: ['anvekarprathamesh13@gmail.com'],
        subject: subject,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errBody = await resendResponse.text();
      throw new Error(`resend API error: ${errBody}`);
    }

    const resendData = await resendResponse.json();

    return new Response(JSON.stringify({ success: true, resendId: (resendData as any).id }), {
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
