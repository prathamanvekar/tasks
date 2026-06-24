import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Unlock, 
  Sparkles, 
  Terminal, 
  Undo,
  Database
} from 'lucide-react';
import ClickSpark from './components/ClickSpark';
import Loader from './components/Loader';
import ThemeToggle from './components/ThemeToggle';
import Checkbox from './components/Checkbox';
import Input from './components/Input';
import SplitText from './components/SplitText';
import { playSuccessSound, playTickSound, playScratchSound } from './utils/sounds';

// Helper to format Date into YYYY-MM-DD
function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper to get ISO Week String YYYY-Www
function getWeekString(date: Date): string {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year
  tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  week1.setDate(week1.getDate() + 3 - (week1.getDay() + 6) % 7);
  const millisecondDiff = tempDate.getTime() - week1.getTime();
  const weekNum = 1 + Math.round(millisecondDiff / 604800000);
  return `${tempDate.getFullYear()}-w${String(weekNum).padStart(2, '0')}`;
}

// Helper to get printable Week Range
function getWeekRange(date: Date): string {
  const currentDay = date.getDay();
  // distance to Monday
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(date);
  monday.setDate(date.getDate() + distanceToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString('en-US', options)} - ${sunday.toLocaleDateString('en-US', options)}`;
}

// Helper to get YYYY-MM Month String
function getMonthString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// Helper to check if a date is the last day of its month
function isLastDayOfMonth(date: Date): boolean {
  const test = new Date(date.getTime());
  const currentMonth = test.getMonth();
  test.setDate(test.getDate() + 1);
  return test.getMonth() !== currentMonth;
}

// Types for Task States
interface DailyTaskState {
  bootdev: boolean;
  neetcode: boolean;
  ailearning: boolean;
  twitter: boolean;
  jobhunt: boolean;
}

interface WeeklyTaskState {
  oss1: string;
  oss2: string;
  projectRepo: string;
  codechef: string;
  codeforces: string;
  leetcode: string;
  hackathon: string;
  ctf: string;
  revision: string;
  isSaved?: boolean;
}

interface MonthlyTaskState {
  blog1: string;
  blog2: string;
  langCommit: string;
  isSaved?: boolean;
}

const DEFAULT_DAILY: DailyTaskState = {
  bootdev: false,
  neetcode: false,
  ailearning: false,
  twitter: false,
  jobhunt: false
};

const DEFAULT_WEEKLY: WeeklyTaskState = {
  oss1: '',
  oss2: '',
  projectRepo: '',
  codechef: '',
  codeforces: '',
  leetcode: '',
  hackathon: '',
  ctf: '',
  revision: '',
  isSaved: false
};

const DEFAULT_MONTHLY: MonthlyTaskState = {
  blog1: '',
  blog2: '',
  langCommit: '',
  isSaved: false
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'insights'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Date overrides for debugging / simulating Sandbox
  const [simulateSunday, setSimulateSunday] = useState(false);
  const [simulateMonthlyUnlock, setSimulateMonthlyUnlock] = useState(false);
  const [customDateStr, setCustomDateStr] = useState('');
  const [showSandbox, setShowSandbox] = useState(false);

  // Daily Tasks State
  const [dailyTasks, setDailyTasks] = useState<DailyTaskState>(DEFAULT_DAILY);
  
  // Weekly Tasks State
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTaskState>(DEFAULT_WEEKLY);
  
  // Monthly Tasks State
  const [monthlyTasks, setMonthlyTasks] = useState<MonthlyTaskState>(DEFAULT_MONTHLY);

  // Streak State
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  // Sync State
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error' | 'unconfigured'>('unconfigured');
  const [syncKey, setSyncKey] = useState(() => localStorage.getItem('sync_key') || '');

  const triggerSync = async (keyToUse = syncKey) => {
    if (!keyToUse) {
      setSyncStatus('unconfigured');
      return;
    }
    setSyncStatus('syncing');
    try {
      const response = await fetch('/api/sync', {
        headers: {
          'Authorization': `Bearer ${keyToUse}`,
        },
      });

      if (response.status === 401) {
        setSyncStatus('error');
        return;
      }

      if (!response.ok) {
        setSyncStatus('error');
        return;
      }

      const data = await response.json();
      
      if (data.daily) {
        data.daily.forEach((item: any) => {
          localStorage.setItem(`tasks_daily_${item.dateKey}`, JSON.stringify({
            bootdev: item.bootdev,
            neetcode: item.neetcode,
            ailearning: item.ailearning,
            twitter: item.twitter,
            jobhunt: item.jobhunt,
          }));
        });
      }

      if (data.weekly) {
        data.weekly.forEach((item: any) => {
          localStorage.setItem(`tasks_weekly_${item.weekKey}`, JSON.stringify({
            oss1: item.oss1,
            oss2: item.oss2,
            projectRepo: item.projectRepo,
            codechef: item.codechef,
            codeforces: item.codeforces,
            leetcode: item.leetcode,
            hackathon: item.hackathon,
            ctf: item.ctf,
            revision: item.revision,
            isSaved: item.isSaved,
          }));
        });
      }

      if (data.monthly) {
        data.monthly.forEach((item: any) => {
          localStorage.setItem(`tasks_monthly_${item.monthKey}`, JSON.stringify({
            blog1: item.blog1,
            blog2: item.blog2,
            langCommit: item.langCommit,
            isSaved: item.isSaved,
          }));
        });
      }

      setSyncStatus('synced');

      // Refresh current states from local storage
      const activeDateStr = formatDateString(currentDate);
      const dailySaved = localStorage.getItem(`tasks_daily_${activeDateStr}`);
      if (dailySaved) setDailyTasks(JSON.parse(dailySaved));
      
      const activeWeekStr = getWeekString(currentDate);
      const weeklySaved = localStorage.getItem(`tasks_weekly_${activeWeekStr}`);
      if (weeklySaved) setWeeklyTasks(JSON.parse(weeklySaved));
      
      const activeMonthStr = getMonthString(currentDate);
      const monthlySaved = localStorage.getItem(`tasks_monthly_${activeMonthStr}`);
      if (monthlySaved) setMonthlyTasks(JSON.parse(monthlySaved));

      calculateStreaks();
    } catch {
      setSyncStatus('offline');
    }
  };

  const pushSync = async (payload: {
    type: 'daily' | 'weekly' | 'monthly';
    dateKey?: string;
    weekKey?: string;
    monthKey?: string;
    data: any;
  }) => {
    const key = localStorage.getItem('sync_key');
    if (!key) {
      setSyncStatus('unconfigured');
      return;
    }
    setSyncStatus('syncing');
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
      }
    } catch {
      setSyncStatus('offline');
    }
  };

  // Trigger sync on component mount
  useEffect(() => {
    const key = localStorage.getItem('sync_key') || '';
    if (key) {
      triggerSync(key);
    } else {
      setSyncStatus('unconfigured');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [hoveredTooltip, setHoveredTooltip] = useState<{
    dateStr: string;
    x: number;
    y: number;
    tasks: { label: string; checked: boolean }[];
  } | null>(null);

  const getTasksForDate = (dateKey: string) => {
    const key = `tasks_daily_${dateKey}`;
    const saved = localStorage.getItem(key);
    let state = {
      bootdev: false,
      neetcode: false,
      ailearning: false,
      twitter: false,
      jobhunt: false
    };
    if (saved) {
      try {
        state = { ...state, ...JSON.parse(saved) };
      } catch {}
    }
    return [
      { label: 'boot.dev', checked: state.bootdev },
      { label: 'neetcode', checked: state.neetcode },
      { label: 'ai learning', checked: state.ailearning },
      { label: 'twitter post', checked: state.twitter },
      { label: 'job hunt', checked: state.jobhunt },
    ];
  };

  // Load theme preference on load
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Handle Simulated date change
  useEffect(() => {
    if (customDateStr) {
      const parts = customDateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        if (!isNaN(d.getTime())) {
          setCurrentDate(d);
        }
      }
    }
  }, [customDateStr]);

  // Keyboard listener to toggle developer sandbox controls (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSandbox(prev => !prev);
        playTickSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeDateKey = formatDateString(currentDate);
  const activeWeekKey = getWeekString(currentDate);
  const activeMonthKey = getMonthString(currentDate);

  // Load Daily Tasks for Active Date
  useEffect(() => {
    const key = `tasks_daily_${activeDateKey}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setDailyTasks(JSON.parse(saved));
    } else {
      setDailyTasks(DEFAULT_DAILY);
    }
  }, [activeDateKey]);

  // Load Weekly Tasks for Active Week
  useEffect(() => {
    const key = `tasks_weekly_${activeWeekKey}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setWeeklyTasks(JSON.parse(saved));
    } else {
      setWeeklyTasks(DEFAULT_WEEKLY);
    }
  }, [activeWeekKey]);

  // Load Monthly Tasks for Active Month
  useEffect(() => {
    const key = `tasks_monthly_${activeMonthKey}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setMonthlyTasks(JSON.parse(saved));
    } else {
      setMonthlyTasks(DEFAULT_MONTHLY);
    }
  }, [activeMonthKey]);

  // Calculate Streak based on all localstorage records
  useEffect(() => {
    calculateStreaks();
  }, [dailyTasks, activeDateKey]);

  const calculateStreaks = () => {
    let currentRun = 0;
    let maxRun = 0;
    let displayStreak = 0;
    let countingDisplay = true;

    // Scan last 365 days
    const scanDate = new Date();
    scanDate.setHours(0,0,0,0);

    // Check today's status
    const todayStr = formatDateString(scanDate);
    const todayVal = localStorage.getItem(`tasks_daily_${todayStr}`);
    let todayDone = false;
    if (todayVal) {
      const state = JSON.parse(todayVal) as DailyTaskState;
      todayDone = state.bootdev && state.neetcode && state.ailearning && state.twitter && state.jobhunt;
    }

    // Check yesterday's status
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateString(yesterday);
    const yesterdayVal = localStorage.getItem(`tasks_daily_${yesterdayStr}`);
    let yesterdayDone = false;
    if (yesterdayVal) {
      const state = JSON.parse(yesterdayVal) as DailyTaskState;
      yesterdayDone = state.bootdev && state.neetcode && state.ailearning && state.twitter && state.jobhunt;
    }

    const canHaveStreak = todayDone || yesterdayDone;

    for (let i = 0; i < 365; i++) {
      const keyStr = formatDateString(scanDate);
      const val = localStorage.getItem(`tasks_daily_${keyStr}`);
      let allDone = false;
      if (val) {
        const state = JSON.parse(val) as DailyTaskState;
        allDone = state.bootdev && state.neetcode && state.ailearning && state.twitter && state.jobhunt;
      }

      if (allDone) {
        currentRun++;
        if (currentRun > maxRun) maxRun = currentRun;
        
        if (canHaveStreak && countingDisplay) {
          if (todayDone || i > 0) {
            displayStreak++;
          }
        }
      } else {
        currentRun = 0;
        if (i > 0 || todayDone) {
          countingDisplay = false;
        }
      }
      
      scanDate.setDate(scanDate.getDate() - 1);
    }
    
    setStreak(displayStreak);
    setMaxStreak(maxRun);
  };

  const updateDailyTask = (key: keyof DailyTaskState, val: boolean) => {
    const nextState = { ...dailyTasks, [key]: val };
    setDailyTasks(nextState);
    localStorage.setItem(`tasks_daily_${activeDateKey}`, JSON.stringify(nextState));

    pushSync({
      type: 'daily',
      dateKey: activeDateKey,
      data: nextState,
    });

    const wasAllDone = dailyTasks.bootdev && dailyTasks.neetcode && dailyTasks.ailearning && dailyTasks.twitter && dailyTasks.jobhunt;
    const isAllDone = nextState.bootdev && nextState.neetcode && nextState.ailearning && nextState.twitter && nextState.jobhunt;
    if (isAllDone && !wasAllDone) {
      playSuccessSound();
    }
  };

  // Submission complete checks: all fields must be non-empty
  const isWeeklyComplete = 
    weeklyTasks.oss1.trim() !== '' &&
    weeklyTasks.oss2.trim() !== '' &&
    weeklyTasks.projectRepo.trim() !== '' &&
    weeklyTasks.codechef.trim() !== '' &&
    weeklyTasks.codeforces.trim() !== '' &&
    weeklyTasks.leetcode.trim() !== '' &&
    weeklyTasks.hackathon.trim() !== '' &&
    weeklyTasks.ctf.trim() !== '' &&
    weeklyTasks.revision.trim() !== '';

  const isMonthlyComplete = 
    monthlyTasks.blog1.trim() !== '' &&
    monthlyTasks.blog2.trim() !== '' &&
    monthlyTasks.langCommit.trim() !== '';

  // Dynamic submitted flag (resets immediately if a field becomes empty)
  const isWeeklySubmitted = !!(weeklyTasks.isSaved && isWeeklyComplete);
  const isMonthlySubmitted = !!(monthlyTasks.isSaved && isMonthlyComplete);

  const updateWeeklyField = (field: keyof WeeklyTaskState, val: string) => {
    const nextState = { ...weeklyTasks, [field]: val };
    
    // Check if everything remains completed
    const checkComplete = 
      nextState.oss1.trim() !== '' &&
      nextState.oss2.trim() !== '' &&
      nextState.projectRepo.trim() !== '' &&
      nextState.codechef.trim() !== '' &&
      nextState.codeforces.trim() !== '' &&
      nextState.leetcode.trim() !== '' &&
      nextState.hackathon.trim() !== '' &&
      nextState.ctf.trim() !== '' &&
      nextState.revision.trim() !== '';

    nextState.isSaved = checkComplete ? weeklyTasks.isSaved : false;
    setWeeklyTasks(nextState);
    localStorage.setItem(`tasks_weekly_${activeWeekKey}`, JSON.stringify(nextState));
  };

  const updateMonthlyField = (field: keyof MonthlyTaskState, val: string) => {
    const nextState = { ...monthlyTasks, [field]: val };

    const checkComplete = 
      nextState.blog1.trim() !== '' &&
      nextState.blog2.trim() !== '' &&
      nextState.langCommit.trim() !== '';

    nextState.isSaved = checkComplete ? monthlyTasks.isSaved : false;
    setMonthlyTasks(nextState);
    localStorage.setItem(`tasks_monthly_${activeMonthKey}`, JSON.stringify(nextState));
  };

  const handleWeeklySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWeeklyComplete) return;
    const nextState = { ...weeklyTasks, isSaved: true };
    setWeeklyTasks(nextState);
    localStorage.setItem(`tasks_weekly_${activeWeekKey}`, JSON.stringify(nextState));
    
    pushSync({
      type: 'weekly',
      weekKey: activeWeekKey,
      data: nextState,
    });

    playSuccessSound();
  };

  const handleMonthlySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMonthlyComplete) return;
    const nextState = { ...monthlyTasks, isSaved: true };
    setMonthlyTasks(nextState);
    localStorage.setItem(`tasks_monthly_${activeMonthKey}`, JSON.stringify(nextState));

    pushSync({
      type: 'monthly',
      monthKey: activeMonthKey,
      data: nextState,
    });

    playSuccessSound();
  };

  // Locks rules
  const isSunday = currentDate.getDay() === 0;
  const isWeeklyEditable = isSunday || simulateSunday;

  const isEndMonth = isLastDayOfMonth(currentDate);
  const isMonthlyEditable = isEndMonth || simulateMonthlyUnlock;

  // Time of Day Greeting
  const getGreeting = () => {
    const hours = currentDate.getHours();
    if (hours < 12) return 'good morning';
    if (hours < 17) return 'good afternoon';
    if (hours < 21) return 'good evening';
    return 'good night';
  };

  // Navigating Dates

  const resetToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setCustomDateStr(formatDateString(today));
    playTickSound();
  };

  const adjustDate = (type: 'year' | 'month' | 'day', amount: number) => {
    const next = new Date(currentDate.getTime());
    if (type === 'year') {
      next.setFullYear(next.getFullYear() + amount);
    } else if (type === 'month') {
      next.setMonth(next.getMonth() + amount);
    } else if (type === 'day') {
      next.setDate(next.getDate() + amount);
    }
    setCurrentDate(next);
    setCustomDateStr(formatDateString(next));
    playTickSound();
  };

  // Percentage Calculations
  const completedDailyCount = Object.values(dailyTasks).filter(Boolean).length;
  const dailyPercent = Math.round((completedDailyCount / 5) * 100);

  // Dynamic Bocchi React Avatar settings based on completion count
  const getBocchiAvatar = () => {
    if (completedDailyCount === 0) {
      return {
        src: '/bocchi%20sad.png',
        className: 'anxious-jitter-avatar'
      };
    } else if (completedDailyCount === 5) {
      return {
        src: '/bocchi%20happy.png',
        className: 'bocchi-glow-avatar'
      };
    } else {
      return {
        src: '/bocchi.png',
        className: ''
      };
    }
  };

  const bocchiAvatar = getBocchiAvatar();

  // Calendar Day Navigation Setup
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();
  const startDayIndex = firstDayOfMonth.getDay(); // Sunday=0, Monday=1...
  
  // Align grid (Monday as first column)
  const offsetDays = startDayIndex === 0 ? 6 : startDayIndex - 1;

  const selectCalendarDay = (day: number) => {
    const selected = new Date(year, month, day);
    setCurrentDate(selected);
    setCustomDateStr(formatDateString(selected));
    playTickSound();
  };

  // Check if a day has completed all tasks (for dot highlights)
  const isCalendarDayCompleted = (day: number): boolean => {
    const checkDate = new Date(year, month, day);
    const key = `tasks_daily_${formatDateString(checkDate)}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const state = JSON.parse(saved) as DailyTaskState;
      return state.bootdev && state.neetcode && state.ailearning && state.twitter && state.jobhunt;
    }
    return false;
  };

  // Quick navigation months
  const shiftMonth = (offset: number) => {
    const next = new Date(year, month + offset, 1);
    setCurrentDate(next);
    setCustomDateStr(formatDateString(next));
    playTickSound();
  };

  if (loading) {
    return <Loader onComplete={() => setLoading(false)} />;
  }

  return (
    <ClickSpark>
      <div className="min-h-screen pb-24 relative select-none">
        
        {/* HEADER AREA */}
        <header className="flex justify-between items-center mb-12 relative z-50">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <img 
                src={bocchiAvatar.src} 
                alt="bocchi logo" 
                className={`w-12 h-12 rounded border-[1.5px] border-[var(--text-h)] object-cover shadow-[3px_3px_0_var(--accent)] select-none pointer-events-none transition-all duration-300 ${bocchiAvatar.className}`}
              />
              {completedDailyCount === 5 && (
                <div className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center animate-bounce">
                  <svg 
                    viewBox="0 0 7 6" 
                    className="w-full h-full text-[var(--accent)] fill-current pixel-badge-outline"
                  >
                    <path d="M1,0 h2 v1 h-2 z M4,0 h2 v1 h-2 z
                             M0,1 h7 v1 h-7 z
                             M0,2 h7 v1 h-7 z
                             M1,3 h5 v1 h-5 z
                             M2,4 h3 v1 h-3 z
                             M3,5 h1 v1 h-1 z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <SplitText 
                text={`${getGreeting()}, pratham.`}
                className="text-3xl font-extrabold text-[var(--text-h)] lowercase leading-none tracking-tight"
                tag="h1"
                delay={40}
                duration={0.85}
              />
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {/* Monospace Capsule Date */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--code-bg)] border border-[var(--border)] rounded font-mono text-2xs text-[var(--text-h)] lowercase select-none">
                  <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>[ {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toLowerCase()} ]</span>
                </div>
                
                {streak > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--code-bg)] border border-[var(--border)] rounded font-mono text-2xs text-[var(--text-h)] lowercase select-none">
                    <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>[ uptime: {streak}d ]</span>
                  </div>
                )}
                
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--code-bg)] border border-[var(--border)] rounded font-mono text-2xs text-[var(--text-h)] lowercase select-none">
                  <Database className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>[ sync: <span className={
                    syncStatus === 'synced' ? 'text-emerald-500 font-bold' :
                    syncStatus === 'syncing' ? 'text-amber-500 animate-pulse' :
                    syncStatus === 'offline' ? 'text-rose-400' :
                    syncStatus === 'error' ? 'text-rose-500 font-bold' : 'text-[var(--text-muted)]'
                  }>{syncStatus}</span> ]</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
          </div>
        </header>

        {/* CENTERED TABS NAVIGATION */}
        <nav className="flex justify-center border-b border-[var(--border)] mb-10 relative">
          {(['daily', 'weekly', 'monthly', 'insights'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  playTickSound();
                }}
                className={`relative px-6 py-3 text-sm font-semibold tracking-wider transition-colors duration-200 focus:outline-none lowercase cursor-pointer ${
                  isActive ? 'text-[var(--text-h)]' : 'text-[var(--text-muted)] hover:text-[var(--text-h)]'
                }`}
              >
                {tab}
                {isActive && (
                  <motion.div 
                    layoutId="active-tab-line"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* TAB PANELS */}
        <main className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* DAILY PANEL */}
            {activeTab === 'daily' && (
              <motion.div
                key="daily"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Progress bar */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-mono text-[var(--text-muted)] lowercase">
                    <span>daily index</span>
                    <span>{dailyPercent}%</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2.5 w-full select-none">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const isFilled = completedDailyCount > idx;
                      return (
                        <div 
                          key={idx} 
                          className={`h-3.5 border-[1.5px] border-[var(--text-h)] rounded-sm transition-all duration-300 ${
                            isFilled 
                              ? 'bg-[var(--accent)] shadow-[2px_2px_0_var(--text-h)] translate-y-[-1px] translate-x-[-1px]' 
                              : 'bg-[var(--code-bg)] opacity-40 shadow-none translate-y-0 translate-x-0'
                          }`} 
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Split Column Design: Left Column (Tasks), Right Column (Calendar View) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Left checklist (Static brutal border, no hover lift) */}
                  <div className="md:col-span-7 bg-[var(--code-bg)] border border-[var(--border)] p-6 rounded-lg space-y-6">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                      <h2 className="text-sm font-bold text-[var(--text-h)] lowercase">
                        daily items
                      </h2>
                      <span className="font-mono text-2xs text-[var(--accent)]">[ {activeDateKey} ]</span>
                    </div>

                    <div className="space-y-5">
                      <Checkbox 
                        id="bootdev"
                        checked={dailyTasks.bootdev}
                        onChange={(val) => updateDailyTask('bootdev', val)}
                        label="boot.dev (min 2 lessons)"
                      />
                      <Checkbox 
                        id="neetcode"
                        checked={dailyTasks.neetcode}
                        onChange={(val) => updateDailyTask('neetcode', val)}
                        label="neetcode (min 2 problems)"
                      />
                      <Checkbox 
                        id="ailearning"
                        checked={dailyTasks.ailearning}
                        onChange={(val) => updateDailyTask('ailearning', val)}
                        label="ai learning (min 0.5 chapter)"
                      />
                      <Checkbox 
                        id="twitter"
                        checked={dailyTasks.twitter}
                        onChange={(val) => updateDailyTask('twitter', val)}
                        label="twitter post (min 1 post)"
                      />
                      <Checkbox 
                        id="jobhunt"
                        checked={dailyTasks.jobhunt}
                        onChange={(val) => updateDailyTask('jobhunt', val)}
                        label="job hunt (apply / search)"
                      />
                    </div>
                  </div>

                  {/* Right side calendar scroller */}
                  <div className="md:col-span-5 bg-[var(--code-bg)] border border-[var(--border)] p-5 rounded-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                      <button 
                        onClick={() => shiftMonth(-1)}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <span className="font-mono text-2xs text-[var(--text-h)] lowercase font-bold">
                        [ {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase()} ]
                      </span>
                      
                      <button 
                        onClick={() => shiftMonth(1)}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] text-[var(--text-muted)] font-bold lowercase border-b border-[var(--border)]/50 pb-1.5 select-none">
                      <span>m</span>
                      <span>t</span>
                      <span>w</span>
                      <span>t</span>
                      <span>f</span>
                      <span>s</span>
                      <span>s</span>
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1.5 pt-1">
                      {/* Blank offset days */}
                      {Array.from({ length: offsetDays }).map((_, i) => (
                        <div key={`offset-${i}`} className="w-8 h-8 opacity-0 pointer-events-none" />
                      ))}

                      {/* Day cells */}
                      {Array.from({ length: totalDays }).map((_, i) => {
                        const dayNum = i + 1;
                        const isSelected = currentDate.getDate() === dayNum;
                        const isCompleted = isCalendarDayCompleted(dayNum);
                        const cellDateKey = formatDateString(new Date(year, month, dayNum));

                        const onMouseEnter = (e: React.MouseEvent) => {
                          setHoveredTooltip({
                            dateStr: cellDateKey,
                            x: e.clientX,
                            y: e.clientY,
                            tasks: getTasksForDate(cellDateKey)
                          });
                        };

                        const onMouseMove = (e: React.MouseEvent) => {
                          setHoveredTooltip(prev => prev ? {
                            ...prev,
                            x: e.clientX,
                            y: e.clientY
                          } : null);
                        };

                        const onMouseLeave = () => {
                          setHoveredTooltip(null);
                        };

                        return (
                          <div 
                            key={`day-${dayNum}`} 
                            className={`tab-group flex items-center justify-center ${isCompleted ? 'completed' : ''}`}
                            onMouseEnter={onMouseEnter}
                            onMouseMove={onMouseMove}
                            onMouseLeave={onMouseLeave}
                          >
                            <input 
                              type="radio" 
                              name="calendar-day" 
                              id={`cal-day-${dayNum}`}
                              checked={isSelected}
                              onChange={() => selectCalendarDay(dayNum)}
                            />
                            <label 
                              htmlFor={`cal-day-${dayNum}`} 
                            >
                              <span>{dayNum}</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-[var(--border)]/50">
                      <button 
                        onClick={resetToToday}
                        className="text-3xs font-mono text-[var(--text-muted)] border border-[var(--border)] px-2 py-0.5 rounded hover:bg-[var(--text-h)] hover:text-[var(--bg)] transition-all cursor-pointer lowercase"
                      >
                        back to today
                      </button>
                      <span className="text-[9px] font-mono text-[var(--text-muted)] flex items-center gap-1.5 lowercase">
                        <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full inline-block"></span> completed day
                      </span>
                    </div>

                  </div>

                </div>

                {dailyPercent === 100 && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-3 p-4 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-lg text-[var(--accent)] justify-center font-semibold text-sm select-none"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    all items completed for today. streak maintained.
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* WEEKLY PANEL */}
            {activeTab === 'weekly' && (
              <motion.div
                key="weekly"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center bg-[var(--code-bg)] border border-[var(--border)] p-3 rounded-lg">
                  <div className="font-mono text-2xs text-[var(--text-h)] flex items-center gap-1.5 lowercase select-none">
                    [ week // {getWeekRange(currentDate)} ]
                  </div>
                  <span className="font-mono text-2xs flex items-center gap-1.5">
                    {isWeeklyEditable ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <Unlock className="w-3.5 h-3.5" /> inputs unlocked
                      </span>
                    ) : (
                      <span className="text-rose-500 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> locked
                      </span>
                    )}
                  </span>
                </div>

                {/* Sleek Minimal Quote Warning */}
                {!isWeeklyEditable && (
                  <div className="py-6 text-center italic text-xs font-mono text-[var(--text-muted)] lowercase tracking-wider select-none">
                    "weekly entries are locked until sunday. focus on daily habits."
                  </div>
                )}

                {/* Main panel container (Static brutal border, no hover lift) */}
                <form onSubmit={handleWeeklySubmit} className="bg-[var(--code-bg)] border border-[var(--border)] p-8 rounded-lg space-y-8">
                  <div>
                    <h3 className="form-section-title">
                      open source contributions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input 
                        id="oss1"
                        label="repo / pr link 1"
                        value={weeklyTasks.oss1}
                        onChange={(v) => updateWeeklyField('oss1', v)}
                        disabled={!isWeeklyEditable}
                        required
                      />
                      <Input 
                        id="oss2"
                        label="repo / pr link 2"
                        value={weeklyTasks.oss2}
                        onChange={(v) => updateWeeklyField('oss2', v)}
                        disabled={!isWeeklyEditable}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="form-section-title">
                      neovim coding project
                    </h3>
                    <Input 
                      id="projectRepo"
                      label="nvim project repo link"
                      value={weeklyTasks.projectRepo}
                      onChange={(v) => updateWeeklyField('projectRepo', v)}
                      disabled={!isWeeklyEditable}
                      required
                    />
                  </div>

                  <div>
                    <h3 className="form-section-title">
                      weekly contest links
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Input 
                        id="codechef"
                        label="codechef profile/link"
                        value={weeklyTasks.codechef}
                        onChange={(v) => updateWeeklyField('codechef', v)}
                        disabled={!isWeeklyEditable}
                        required
                      />
                      <Input 
                        id="codeforces"
                        label="codeforces profile/link"
                        value={weeklyTasks.codeforces}
                        onChange={(v) => updateWeeklyField('codeforces', v)}
                        disabled={!isWeeklyEditable}
                        required
                      />
                      <Input 
                        id="leetcode"
                        label="leetcode profile/link"
                        value={weeklyTasks.leetcode}
                        onChange={(v) => updateWeeklyField('leetcode', v)}
                        disabled={!isWeeklyEditable}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="form-section-title">
                      hackathons & contests
                    </h3>
                    <Input 
                      id="hackathon"
                      label="hackathon details/link"
                      value={weeklyTasks.hackathon}
                      onChange={(v) => updateWeeklyField('hackathon', v)}
                      disabled={!isWeeklyEditable}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="form-section-title">
                        ctfs
                      </h3>
                      <Input 
                        id="ctf"
                        label="ctf solve details/link"
                        value={weeklyTasks.ctf}
                        onChange={(v) => updateWeeklyField('ctf', v)}
                        disabled={!isWeeklyEditable}
                        required
                      />
                    </div>
                    <div>
                      <h3 className="form-section-title">
                        weekly revision
                      </h3>
                      <Input 
                        id="revision"
                        label="revision topics/links"
                        value={weeklyTasks.revision}
                        onChange={(v) => updateWeeklyField('revision', v)}
                        disabled={!isWeeklyEditable}
                        required
                      />
                    </div>
                  </div>

                  {isWeeklyEditable && (
                    <button
                      type="submit"
                      disabled={!isWeeklyComplete}
                      className={`brutal-btn w-full ${!isWeeklyComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="brutal-btn-top w-full py-3 px-6 text-center text-sm font-extrabold uppercase">
                        save weekly report
                      </span>
                    </button>
                  )}
                </form>
              </motion.div>
            )}

            {/* MONTHLY PANEL */}
            {activeTab === 'monthly' && (
              <motion.div
                key="monthly"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center bg-[var(--code-bg)] border border-[var(--border)] p-3 rounded-lg">
                  <div className="font-mono text-2xs text-[var(--text-h)] flex items-center gap-1.5 lowercase select-none">
                    [ month // {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase()} ]
                  </div>
                  <span className="font-mono text-2xs flex items-center gap-1.5">
                    {isMonthlyEditable ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <Unlock className="w-3.5 h-3.5" /> inputs unlocked
                      </span>
                    ) : (
                      <span className="text-rose-500 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> locked
                      </span>
                    )}
                  </span>
                </div>

                {/* Sleek Minimal Quote Warning */}
                {!isMonthlyEditable && (
                  <div className="py-6 text-center italic text-xs font-mono text-[var(--text-muted)] lowercase tracking-wider select-none">
                    "monthly milestones are locked until the last day of the month. consistency is key."
                  </div>
                )}

                {/* Main monthly container (Static brutal border, no hover lift) */}
                <form onSubmit={handleMonthlySubmit} className="bg-[var(--code-bg)] border border-[var(--border)] p-8 rounded-lg space-y-8">
                  <div>
                    <h3 className="form-section-title">
                      written publications (min 1-2 articles)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input 
                        id="blog1"
                        label="blog/article link 1"
                        value={monthlyTasks.blog1}
                        onChange={(v) => updateMonthlyField('blog1', v)}
                        disabled={!isMonthlyEditable}
                        required
                      />
                      <Input 
                        id="blog2"
                        label="blog/article link 2"
                        value={monthlyTasks.blog2}
                        onChange={(v) => updateMonthlyField('blog2', v)}
                        disabled={!isMonthlyEditable}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="form-section-title">
                      programming language feature
                    </h3>
                    <Input 
                      id="langCommit"
                      label="compiler feature commit/PR link"
                      value={monthlyTasks.langCommit}
                      onChange={(v) => updateMonthlyField('langCommit', v)}
                      disabled={!isMonthlyEditable}
                      required
                    />
                  </div>

                  {isMonthlyEditable && (
                    <button
                      type="submit"
                      disabled={!isMonthlyComplete}
                      className={`brutal-btn w-full ${!isMonthlyComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="brutal-btn-top w-full py-3 px-6 text-center text-sm font-extrabold uppercase">
                        save monthly milestone
                      </span>
                    </button>
                  )}
                </form>
              </motion.div>
            )}

            {/* INSIGHTS / HISTORY PANEL */}
            {activeTab === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Stats Dashboard - using brutal-hover-card for small tiles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="brutal-hover-card flex flex-col justify-between">
                    <span className="text-xs font-mono text-[var(--text-muted)] lowercase">current streak</span>
                    <div className="flex items-baseline gap-2 mt-4">
                      <span className="text-4xl font-extrabold text-[var(--text-h)]">{streak}</span>
                      <span className="text-xs font-mono text-[var(--text-muted)]">days</span>
                    </div>
                    <div className="text-[var(--accent)] flex items-center gap-1 text-2xs mt-2 font-mono">
                      <Terminal className="w-3.5 h-3.5" /> uptime online
                    </div>
                  </div>

                  <div className="brutal-hover-card flex flex-col justify-between">
                    <span className="text-xs font-mono text-[var(--text-muted)] lowercase">personal record</span>
                    <div className="flex items-baseline gap-2 mt-4">
                      <span className="text-4xl font-extrabold text-[var(--text-h)]">{maxStreak}</span>
                      <span className="text-xs font-mono text-[var(--text-muted)]">days</span>
                    </div>
                    <div className="text-[var(--accent)] flex items-center gap-1 text-2xs mt-2 font-mono">
                      <Sparkles className="w-3.5 h-3.5" /> all-time high
                    </div>
                  </div>

                  <div className="brutal-hover-card flex flex-col justify-between">
                    <span className="text-xs font-mono text-[var(--text-muted)] lowercase">completion rate</span>
                    <div className="flex items-baseline gap-2 mt-4">
                      <span className="text-4xl font-extrabold text-[var(--text-h)]">
                        {(() => {
                          let totals = 0;
                          let completed = 0;
                          for (let i = 0; i < 30; i++) {
                            const d = new Date();
                            d.setDate(d.getDate() - i);
                            const key = `tasks_daily_${formatDateString(d)}`;
                            const val = localStorage.getItem(key);
                            if (val) {
                              totals++;
                              const state = JSON.parse(val);
                              if (state.bootdev && state.neetcode && state.ailearning && state.twitter && state.jobhunt) {
                                completed++;
                              }
                            }
                          }
                          return totals > 0 ? Math.round((completed / totals) * 100) : 0;
                        })()}
                        %
                      </span>
                      <span className="text-xs font-mono text-[var(--text-muted)]">past 30 days</span>
                    </div>
                    <div className="text-[var(--go-blue)] flex items-center gap-1 text-2xs mt-2 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> habit index
                    </div>
                  </div>
                </div>

                {/* Completion Grid (Github contribution style) */}
                <div className="brutal-card">
                  <h3 className="text-sm font-bold text-[var(--text-h)] lowercase mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--accent)]" /> habit grid (past 30 days)
                  </h3>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-[var(--code-bg)] border border-[var(--border)] rounded">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (29 - i));
                      const dateKey = formatDateString(d);
                      const val = localStorage.getItem(`tasks_daily_${dateKey}`);
                      
                      let checkedCount = 0;
                      if (val) {
                        const parsed = JSON.parse(val);
                        checkedCount = Object.values(parsed).filter(Boolean).length;
                      }

                      const colors = [
                        'bg-[var(--border)] opacity-30',
                        'bg-[var(--accent)]/20',
                        'bg-[var(--accent)]/45',
                        'bg-[var(--accent)]/65',
                        'bg-[var(--accent)]/85',
                        'bg-[var(--accent)] font-bold shadow-[0_0_8px_var(--accent)]'
                      ];

                      const onMouseEnter = (e: React.MouseEvent) => {
                        setHoveredTooltip({
                          dateStr: dateKey,
                          x: e.clientX,
                          y: e.clientY,
                          tasks: getTasksForDate(dateKey)
                        });
                      };

                      const onMouseMove = (e: React.MouseEvent) => {
                        setHoveredTooltip(prev => prev ? {
                          ...prev,
                          x: e.clientX,
                          y: e.clientY
                        } : null);
                      };

                      const onMouseLeave = () => {
                        setHoveredTooltip(null);
                      };

                      return (
                        <div 
                          key={dateKey} 
                          className={`w-6 h-6 rounded-sm ${colors[checkedCount]} transition-all duration-300 hover:scale-110 cursor-help flex items-center justify-center text-[8px] font-mono font-bold select-none text-white`}
                          onMouseEnter={onMouseEnter}
                          onMouseMove={onMouseMove}
                          onMouseLeave={onMouseLeave}
                        >
                          {checkedCount > 0 && checkedCount}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center text-3xs font-mono text-[var(--text-muted)] mt-3 lowercase">
                    <span>30 days ago</span>
                    <div className="flex items-center gap-1">
                      <span>less</span>
                      <span className="w-2.5 h-2.5 bg-[var(--border)] opacity-30 inline-block rounded-xs"></span>
                      <span className="w-2.5 h-2.5 bg-[var(--accent)]/25 inline-block rounded-xs"></span>
                      <span className="w-2.5 h-2.5 bg-[var(--accent)]/55 inline-block rounded-xs"></span>
                      <span className="w-2.5 h-2.5 bg-[var(--accent)] inline-block rounded-xs"></span>
                      <span>more</span>
                    </div>
                    <span>today</span>
                  </div>
                </div>

                {/* Submissions Log */}
                <div className="brutal-card space-y-4">
                  <h3 className="text-sm font-bold text-[var(--text-h)] lowercase border-b border-[var(--border)] pb-2">
                    weekly & monthly submissions
                  </h3>
                  <div className="space-y-3 font-mono text-xs">
                    
                    {/* Weekly Links */}
                    <div className="p-3 bg-[var(--code-bg)] border border-[var(--border)] rounded">
                      <div className="font-bold text-[var(--text-h)] mb-1 flex justify-between lowercase">
                        <span>current week: {getWeekRange(currentDate)}</span>
                        <span className={isWeeklySubmitted ? 'text-emerald-500' : 'text-amber-500'}>
                          {isWeeklySubmitted ? 'submitted' : 'pending'}
                        </span>
                      </div>
                      {isWeeklySubmitted ? (
                        <ul className="list-disc pl-4 space-y-1 mt-2 text-[var(--text-muted)]">
                          {weeklyTasks.projectRepo && (
                            <li>
                              nvim project: <a href={weeklyTasks.projectRepo} target="_blank" rel="noopener noreferrer" className="animated-link truncate max-w-xs inline-block align-bottom">{weeklyTasks.projectRepo}</a>
                            </li>
                          )}
                          {(weeklyTasks.oss1 || weeklyTasks.oss2) && (
                            <li>
                              oss contributions: {weeklyTasks.oss1 && <a href={weeklyTasks.oss1} target="_blank" rel="noopener noreferrer" className="animated-link mr-2">{weeklyTasks.oss1}</a>}
                              {weeklyTasks.oss2 && <a href={weeklyTasks.oss2} target="_blank" rel="noopener noreferrer" className="animated-link">{weeklyTasks.oss2}</a>}
                            </li>
                          )}
                          {(weeklyTasks.codechef || weeklyTasks.codeforces || weeklyTasks.leetcode) && (
                            <li>
                              contests: {[weeklyTasks.codechef, weeklyTasks.codeforces, weeklyTasks.leetcode].filter(Boolean).map((link, idx) => (
                                <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="animated-link mr-2 truncate max-w-[120px] inline-block align-bottom">{link}</a>
                              ))}
                            </li>
                          )}
                          {weeklyTasks.hackathon && (
                            <li>
                              hackathon: <a href={weeklyTasks.hackathon} target="_blank" rel="noopener noreferrer" className="animated-link truncate max-w-xs inline-block align-bottom">{weeklyTasks.hackathon}</a>
                            </li>
                          )}
                          {weeklyTasks.ctf && (
                            <li>
                              ctf: <a href={weeklyTasks.ctf} target="_blank" rel="noopener noreferrer" className="animated-link truncate max-w-xs inline-block align-bottom">{weeklyTasks.ctf}</a>
                            </li>
                          )}
                          {weeklyTasks.revision && (
                            <li>
                              revision: <a href={weeklyTasks.revision} target="_blank" rel="noopener noreferrer" className="animated-link truncate max-w-xs inline-block align-bottom">{weeklyTasks.revision}</a>
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="italic text-[var(--text-muted)] mt-2">weekly log is incomplete. all fields must be filled to submit.</p>
                      )}
                    </div>

                    {/* Monthly Links */}
                    <div className="p-3 bg-[var(--code-bg)] border border-[var(--border)] rounded">
                      <div className="font-bold text-[var(--text-h)] mb-1 flex justify-between lowercase">
                        <span>current month: {currentDate.toLocaleDateString('en-US', { month: 'long' }).toLowerCase()}</span>
                        <span className={isMonthlySubmitted ? 'text-emerald-500' : 'text-amber-500'}>
                          {isMonthlySubmitted ? 'submitted' : 'pending'}
                        </span>
                      </div>
                      {isMonthlySubmitted ? (
                        <ul className="list-disc pl-4 space-y-1 mt-2 text-[var(--text-muted)]">
                          {(monthlyTasks.blog1 || monthlyTasks.blog2) && (
                            <li>
                              blogs: {monthlyTasks.blog1 && <a href={monthlyTasks.blog1} target="_blank" rel="noopener noreferrer" className="animated-link mr-2">{monthlyTasks.blog1}</a>}
                              {monthlyTasks.blog2 && <a href={monthlyTasks.blog2} target="_blank" rel="noopener noreferrer" className="animated-link">{monthlyTasks.blog2}</a>}
                            </li>
                          )}
                          {monthlyTasks.langCommit && (
                            <li>
                              compiler feature: <a href={monthlyTasks.langCommit} target="_blank" rel="noopener noreferrer" className="animated-link truncate max-w-xs inline-block align-bottom">{monthlyTasks.langCommit}</a>
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="italic text-[var(--text-muted)] mt-2">monthly log is incomplete. all fields must be filled to submit.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* BOTTOM SANDBOX DRAWER (Retro Terminal look, toggled by Ctrl+K) */}
        {showSandbox && (
          <footer className="mt-16 relative z-50">
            <details className="group font-mono text-2xs cursor-pointer" open>
              <summary className="list-none flex items-center justify-between select-none p-3 bg-[var(--code-bg)] border border-[var(--border)] hover:border-[var(--text-h)] rounded transition-all duration-200">
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[var(--accent)] animate-pulse" />
                  <span className="font-mono text-2xs text-[var(--text-h)] font-bold lowercase">habits.sh - developer sandbox controls</span>
                </span>
                <span className="text-[10px] font-bold text-[var(--accent)] lowercase group-open:hidden">[expand]</span>
                <span className="text-[10px] font-bold text-[var(--accent)] lowercase hidden group-open:inline">[collapse]</span>
              </summary>
              
              <div className="p-4 border-x border-b border-[var(--border)] bg-[var(--dropdown-bg)] rounded-b space-y-4 cursor-default">
                <div className="flex flex-wrap items-center gap-6 text-2xs text-[var(--text)]">
                  
                  {/* Custom ASCII Checkbox 1 */}
                  <button 
                    type="button"
                    onClick={() => {
                      setSimulateSunday(!simulateSunday);
                      playScratchSound();
                    }}
                    className="flex items-center gap-2 hover:text-[var(--accent)] transition-colors select-none font-mono text-left cursor-pointer focus:outline-none"
                  >
                    <span className="text-[var(--accent)] font-bold text-sm leading-none">
                      {simulateSunday ? '[■]' : '[ ]'}
                    </span>
                    <span>bypass sunday weekly lock</span>
                  </button>

                  {/* Custom ASCII Checkbox 2 */}
                  <button 
                    type="button"
                    onClick={() => {
                      setSimulateMonthlyUnlock(!simulateMonthlyUnlock);
                      playScratchSound();
                    }}
                    className="flex items-center gap-2 hover:text-[var(--accent)] transition-colors select-none font-mono text-left cursor-pointer focus:outline-none"
                  >
                    <span className="text-[var(--accent)] font-bold text-sm leading-none">
                      {simulateMonthlyUnlock ? '[■]' : '[ ]'}
                    </span>
                    <span>bypass last day monthly lock</span>
                  </button>

                  {/* Retro Clock Segment Date adjustment widget */}
                  <div className="flex items-center gap-3 font-mono text-2xs select-none">
                    <span>travel date:</span>
                    <div className="flex items-center border border-[var(--border)] bg-[var(--code-bg)] rounded overflow-hidden">
                      {/* Year segment */}
                      <div className="flex flex-col items-center px-2 py-0.5 border-r border-[var(--border)]">
                        <button type="button" onClick={() => adjustDate('year', 1)} className="text-[8px] hover:text-[var(--accent)] cursor-pointer focus:outline-none leading-none select-none">▲</button>
                        <span className="text-[var(--text-h)] font-bold my-0.5">{currentDate.getFullYear()}</span>
                        <button type="button" onClick={() => adjustDate('year', -1)} className="text-[8px] hover:text-[var(--accent)] cursor-pointer focus:outline-none leading-none select-none">▼</button>
                      </div>
                      {/* Month segment */}
                      <div className="flex flex-col items-center px-2 py-0.5 border-r border-[var(--border)]">
                        <button type="button" onClick={() => adjustDate('month', 1)} className="text-[8px] hover:text-[var(--accent)] cursor-pointer focus:outline-none leading-none select-none">▲</button>
                        <span className="text-[var(--text-h)] font-bold my-0.5">{String(currentDate.getMonth() + 1).padStart(2, '0')}</span>
                        <button type="button" onClick={() => adjustDate('month', -1)} className="text-[8px] hover:text-[var(--accent)] cursor-pointer focus:outline-none leading-none select-none">▼</button>
                      </div>
                      {/* Day segment */}
                      <div className="flex flex-col items-center px-2 py-0.5">
                        <button type="button" onClick={() => adjustDate('day', 1)} className="text-[8px] hover:text-[var(--accent)] cursor-pointer focus:outline-none leading-none select-none">▲</button>
                        <span className="text-[var(--text-h)] font-bold my-0.5">{String(currentDate.getDate()).padStart(2, '0')}</span>
                        <button type="button" onClick={() => adjustDate('day', -1)} className="text-[8px] hover:text-[var(--accent)] cursor-pointer focus:outline-none leading-none select-none">▼</button>
                      </div>
                    </div>

                    {/* Reset date travel button */}
                    {activeDateKey !== formatDateString(new Date()) && (
                      <button 
                        type="button"
                        onClick={() => {
                          setCustomDateStr('');
                          resetToToday();
                        }}
                        className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-0.5 cursor-pointer lowercase font-mono focus:outline-none border border-[var(--border)] px-1.5 py-1 rounded bg-[var(--code-bg)]"
                      >
                        <Undo className="w-2.5 h-2.5" /> [reset today]
                      </button>
                    )}
                  </div>

                  {/* Sync Settings */}
                  <div className="flex items-center gap-2 font-mono text-2xs select-none">
                    <span>sync key:</span>
                    <input
                      type="password"
                      value={syncKey}
                      onChange={(e) => {
                        setSyncKey(e.target.value);
                        localStorage.setItem('sync_key', e.target.value);
                      }}
                      placeholder="api_secret"
                      className="bg-[var(--code-bg)] border border-[var(--border)] px-2 py-0.5 rounded text-2xs text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] font-mono w-24"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        triggerSync(syncKey);
                        playTickSound();
                      }}
                      className="text-3xs font-mono text-[var(--text-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded hover:bg-[var(--text-h)] hover:text-[var(--bg)] transition-all cursor-pointer lowercase focus:outline-none"
                    >
                      [sync now]
                    </button>
                  </div>

                </div>
                
                <div className="text-3xs text-[var(--text-muted)] font-mono leading-relaxed border-t border-[var(--border)] pt-3 select-none lowercase">
                  $ info: sandbox overrides are applied locally to localstorage caches. these settings enable rapid manual testing of calendars, completion states, and lock conditions.
                </div>
              </div>
            </details>
          </footer>
        )}
        {hoveredTooltip && (
          <div 
            className="fixed z-[9999] pointer-events-none bg-[var(--dropdown-bg)] border-[1.5px] border-[var(--text-h)] p-2.5 rounded font-mono text-3xs text-[var(--text)] shadow-[3px_3px_0_var(--text-h)] select-none lowercase"
            style={{
              left: hoveredTooltip.x + 12,
              top: hoveredTooltip.y + 12,
            }}
          >
            <div className="font-bold border-b border-[var(--border)] pb-1 mb-1.5 text-[var(--text-h)]">
              {hoveredTooltip.dateStr}
            </div>
            <div className="space-y-1">
              {hoveredTooltip.tasks.map((t, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className={t.checked ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-muted)]'}>
                    {t.checked ? '[■]' : '[ ]'}
                  </span>
                  <span className={t.checked ? 'text-[var(--text-h)]' : 'text-[var(--text-muted)]'}>
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ClickSpark>
  );
}
