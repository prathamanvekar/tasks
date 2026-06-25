import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import gsap from 'gsap';
import { 
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
import { playSuccessSound, playTickSound, playScratchSound, playMechanicalKeyboardClick, playHoverTick } from './utils/sounds';
import { Magnetic } from './components/Magnetic';

const TABS_ORDER = ['inbox', 'daily', 'weekly', 'monthly', 'pomo', 'insights'] as const;

const tabVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0
  })
};

const tabTransition = {
  x: { type: 'spring', stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 }
} as const;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  }
} as const;

const scrollRevealVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
} as const;

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
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 250 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  const [isHoveringGreetingOrPfp, setIsHoveringGreetingOrPfp] = useState(false);
  const [dittoFrame, setDittoFrame] = useState(1);

  const progressBarRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeTab, setActiveTab] = useState<'inbox' | 'daily' | 'weekly' | 'monthly' | 'pomo' | 'insights'>('daily');
  const [direction, setDirection] = useState(0);

  // Tactile hover ticks state
  const [isHoverSoundActive, setIsHoverSoundActive] = useState<boolean>(() => {
    return localStorage.getItem('hover_sounds_active') === 'true';
  });

  const handleTabChange = (newTab: 'inbox' | 'daily' | 'weekly' | 'monthly' | 'pomo' | 'insights') => {
    const currentIndex = TABS_ORDER.indexOf(activeTab);
    const newIndex = TABS_ORDER.indexOf(newTab);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTab);
    playTickSound();
  };

  const handleMouseEnter = () => {
    if (isHoverSoundActive) {
      playHoverTick();
    }
  };

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

  interface InboxTask {
    id: string;
    text: string;
    completed: boolean;
    position: number;
  }

  // Inbox State
  const [inboxTasks, setInboxTasks] = useState<InboxTask[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const editingTaskIdRef = useRef<string | null>(null);
  editingTaskIdRef.current = editingTaskId;
  const [editingText, setEditingText] = useState('');
  const [newInboxText, setNewInboxText] = useState('');

  // Streak State
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [weeklyStreak, setWeeklyStreak] = useState(0);
  const [maxWeeklyStreak, setMaxWeeklyStreak] = useState(0);
  const [monthlyStreak, setMonthlyStreak] = useState(0);
  const [maxMonthlyStreak, setMaxMonthlyStreak] = useState(0);

  // Pomodoro Timer State
  const [pomoMode, setPomoMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [pomoTime, setPomoTime] = useState(1500); // default to 25m
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoCyclesCompleted, setPomoCyclesCompleted] = useState(0);
  const [pomoSuggestion, setPomoSuggestion] = useState<'work' | 'shortBreak' | 'longBreak' | null>(null);

  const pomoModeRef = useRef(pomoMode);
  pomoModeRef.current = pomoMode;
  const pomoCyclesRef = useRef(pomoCyclesCompleted);
  pomoCyclesRef.current = pomoCyclesCompleted;

  useEffect(() => {
    let timerId: any = null;
    if (pomoRunning) {
      timerId = setInterval(() => {
        setPomoTime((prev) => {
          if (prev <= 1) {
            setPomoRunning(false);
            clearInterval(timerId);
            playSuccessSound();

            if (pomoModeRef.current === 'work') {
              const nextCycles = pomoCyclesRef.current + 1;
              setPomoCyclesCompleted(nextCycles);
              if (nextCycles >= 4) {
                setPomoSuggestion('longBreak');
              } else {
                setPomoSuggestion('shortBreak');
              }
            } else {
              setPomoSuggestion('work');
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [pomoRunning]);

  const handlePomoModeChange = (mode: 'work' | 'shortBreak' | 'longBreak') => {
    setPomoMode(mode);
    setPomoRunning(false);
    setPomoSuggestion(null); // Clear suggestion on explicit mode change
    if (mode === 'work') setPomoTime(1500);
    else if (mode === 'shortBreak') setPomoTime(300);
    else if (mode === 'longBreak') setPomoTime(600);
    playTickSound();
  };

  // Selected cell overlay state
  const [selectedCellInfo, setSelectedCellInfo] = useState<{
    type: 'daily' | 'weekly' | 'monthly';
    key: string;
  } | null>(null);

  // Sync State
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error' | 'unconfigured'>('unconfigured');
  const [syncKey, setSyncKey] = useState(() => localStorage.getItem('sync_key') || '');

  // Percentage Calculations
  const completedDailyCount = Object.values(dailyTasks).filter(Boolean).length;
  const dailyPercent = Math.round((completedDailyCount / 5) * 100);

  // Keyboard Click Soundscape State
  const [isKeyboardSoundActive, setIsKeyboardSoundActive] = useState<boolean>(() => {
    return localStorage.getItem('keyboard_sound_active') === 'true';
  });

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

      if (data.inbox) {
        localStorage.setItem('tasks_inbox', JSON.stringify(data.inbox));
        setInboxTasks(data.inbox);
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

      const inboxSaved = localStorage.getItem('tasks_inbox');
      if (inboxSaved) setInboxTasks(JSON.parse(inboxSaved));

      calculateStreaks();
    } catch {
      setSyncStatus('offline');
    }
  };

  const pushSync = async (payload: {
    type: 'daily' | 'weekly' | 'monthly' | 'inbox';
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
    tasks: { label: string; status: 'checked' | 'not-done' | 'pending' }[];
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
      { label: 'boot.dev', status: state.bootdev ? 'checked' : 'pending' },
      { label: 'neetcode', status: state.neetcode ? 'checked' : 'pending' },
      { label: 'ai learning', status: state.ailearning ? 'checked' : 'pending' },
      { label: 'twitter post', status: state.twitter ? 'checked' : 'pending' },
      { label: 'job hunt', status: state.jobhunt ? 'checked' : 'pending' },
    ] as { label: string; status: 'checked' | 'not-done' | 'pending' }[];
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

  // Load inbox tasks from local storage on mount
  useEffect(() => {
    const inboxSaved = localStorage.getItem('tasks_inbox');
    if (inboxSaved) {
      try {
        setInboxTasks(JSON.parse(inboxSaved));
      } catch {}
    }
  }, []);

  // Circular View Transition Theme Toggler
  const handleThemeToggle = (e: React.MouseEvent<HTMLInputElement>) => {
    const doc = document as any;
    if (!doc.startViewTransition || isMobile) {
      setIsDark(!isDark);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || (rect.left + rect.width / 2);
    const y = e.clientY || (rect.top + rect.height / 2);

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = doc.startViewTransition(() => {
      setIsDark(!isDark);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 400,
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    });
  };

  // GSAP Progress Bar Spring Animation
  useEffect(() => {
    if (!progressBarRef.current) return;
    const segments = progressBarRef.current.children;
    
    for (let i = 0; i < 5; i++) {
      const segment = segments[i] as HTMLElement;
      if (!segment) continue;
      const isFilled = completedDailyCount > i;
      
      if (isFilled) {
        const alreadyFilled = segment.getAttribute('data-filled') === 'true';
        if (!alreadyFilled) {
          segment.setAttribute('data-filled', 'true');
          // Snappy material bounce
          gsap.fromTo(segment, 
            { scale: 0.8, y: 0, x: 0 }, 
            { 
              scale: 1, 
              y: -1, 
              x: -1, 
              duration: 0.4, 
              ease: "back.out(2.5)",
              overwrite: "auto"
            }
          );
        }
      } else {
        segment.removeAttribute('data-filled');
        gsap.to(segment, { 
          scale: 1, 
          y: 0, 
          x: 0, 
          duration: 0.25, 
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    }
  }, [completedDailyCount]);

  // Ditto cursor tracking logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Offset so the Ditto sits centered at the pointer
      mouseX.set(e.clientX - 26);
      mouseY.set(e.clientY - 26);
    };

    if (isHoveringGreetingOrPfp && !isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHoveringGreetingOrPfp, isMobile, mouseX, mouseY]);

  // Ditto frame cycle logic
  useEffect(() => {
    if (!isHoveringGreetingOrPfp || isMobile) return;
    const interval = setInterval(() => {
      setDittoFrame((prev) => (prev % 4) + 1);
    }, 110);
    return () => clearInterval(interval);
  }, [isHoveringGreetingOrPfp, isMobile]);

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
      } else if (e.key === 'Escape') {
        setShowSandbox(false);
        setSelectedCellInfo(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keyboard keydown listener for keyclick sounds
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Play click sound if typing in inputs/textareas
      if (isKeyboardSoundActive) {
        const activeEl = document.activeElement;
        if (activeEl && (
          activeEl.tagName === 'INPUT' || 
          activeEl.tagName === 'TEXTAREA' || 
          activeEl.getAttribute('contenteditable') === 'true'
        )) {
          const ignoredKeys = ['Control', 'Shift', 'Alt', 'Meta', 'CapsLock', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
          if (!ignoredKeys.includes(e.key)) {
            playMechanicalKeyboardClick();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isKeyboardSoundActive]);

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

    // 2. Weekly Streaks (scan last 52 weeks)
    let curWeeklyRun = 0;
    let maxWeeklyRun = 0;
    let displayWeeklyStreak = 0;
    let countingWeeklyDisplay = true;

    const weeklyScanDate = new Date();
    const currentWeekStr = getWeekString(weeklyScanDate);
    const currentWeekVal = localStorage.getItem(`tasks_weekly_${currentWeekStr}`);
    let currentWeekDone = false;
    if (currentWeekVal) {
      const state = JSON.parse(currentWeekVal) as WeeklyTaskState;
      currentWeekDone = !!state.isSaved && 
        state.oss1.trim() !== '' &&
        state.oss2.trim() !== '' &&
        state.projectRepo.trim() !== '' &&
        state.codechef.trim() !== '' &&
        state.codeforces.trim() !== '' &&
        state.leetcode.trim() !== '' &&
        state.hackathon.trim() !== '' &&
        state.ctf.trim() !== '' &&
        state.revision.trim() !== '';
    }

    const prevWeekDate = new Date();
    prevWeekDate.setDate(prevWeekDate.getDate() - 7);
    const prevWeekStr = getWeekString(prevWeekDate);
    const prevWeekVal = localStorage.getItem(`tasks_weekly_${prevWeekStr}`);
    let prevWeekDone = false;
    if (prevWeekVal) {
      const state = JSON.parse(prevWeekVal) as WeeklyTaskState;
      prevWeekDone = !!state.isSaved && 
        state.oss1.trim() !== '' &&
        state.oss2.trim() !== '' &&
        state.projectRepo.trim() !== '' &&
        state.codechef.trim() !== '' &&
        state.codeforces.trim() !== '' &&
        state.leetcode.trim() !== '' &&
        state.hackathon.trim() !== '' &&
        state.ctf.trim() !== '' &&
        state.revision.trim() !== '';
    }

    const canHaveWeeklyStreak = currentWeekDone || prevWeekDone;

    for (let i = 0; i < 52; i++) {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - i * 7);
      const wKey = getWeekString(testDate);
      const val = localStorage.getItem(`tasks_weekly_${wKey}`);
      let isDone = false;
      if (val) {
        const state = JSON.parse(val) as WeeklyTaskState;
        isDone = !!state.isSaved && 
          state.oss1.trim() !== '' &&
          state.oss2.trim() !== '' &&
          state.projectRepo.trim() !== '' &&
          state.codechef.trim() !== '' &&
          state.codeforces.trim() !== '' &&
          state.leetcode.trim() !== '' &&
          state.hackathon.trim() !== '' &&
          state.ctf.trim() !== '' &&
          state.revision.trim() !== '';
      }

      if (isDone) {
        curWeeklyRun++;
        if (curWeeklyRun > maxWeeklyRun) maxWeeklyRun = curWeeklyRun;
        
        if (canHaveWeeklyStreak && countingWeeklyDisplay) {
          if (currentWeekDone || i > 0) {
            displayWeeklyStreak++;
          }
        }
      } else {
        curWeeklyRun = 0;
        if (i > 0 || currentWeekDone) {
          countingWeeklyDisplay = false;
        }
      }
    }

    setWeeklyStreak(displayWeeklyStreak);
    setMaxWeeklyStreak(maxWeeklyRun);

    // 3. Monthly Streaks (scan last 24 months)
    let curMonthlyRun = 0;
    let maxMonthlyRun = 0;
    let displayMonthlyStreak = 0;
    let countingMonthlyDisplay = true;

    const monthlyScanDate = new Date();
    const currentMonthStr = getMonthString(monthlyScanDate);
    const currentMonthVal = localStorage.getItem(`tasks_monthly_${currentMonthStr}`);
    let currentMonthDone = false;
    if (currentMonthVal) {
      const state = JSON.parse(currentMonthVal) as MonthlyTaskState;
      currentMonthDone = !!state.isSaved && 
        state.blog1.trim() !== '' &&
        state.blog2.trim() !== '' &&
        state.langCommit.trim() !== '';
    }

    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonthStr = getMonthString(prevMonthDate);
    const prevMonthVal = localStorage.getItem(`tasks_monthly_${prevMonthStr}`);
    let prevMonthDone = false;
    if (prevMonthVal) {
      const state = JSON.parse(prevMonthVal) as MonthlyTaskState;
      prevMonthDone = !!state.isSaved && 
        state.blog1.trim() !== '' &&
        state.blog2.trim() !== '' &&
        state.langCommit.trim() !== '';
    }

    const canHaveMonthlyStreak = currentMonthDone || prevMonthDone;

    for (let i = 0; i < 24; i++) {
      const testDate = new Date();
      testDate.setMonth(testDate.getMonth() - i);
      const mKey = getMonthString(testDate);
      const val = localStorage.getItem(`tasks_monthly_${mKey}`);
      let isDone = false;
      if (val) {
        const state = JSON.parse(val) as MonthlyTaskState;
        isDone = !!state.isSaved && 
          state.blog1.trim() !== '' &&
          state.blog2.trim() !== '' &&
          state.langCommit.trim() !== '';
      }

      if (isDone) {
        curMonthlyRun++;
        if (curMonthlyRun > maxMonthlyRun) maxMonthlyRun = curMonthlyRun;
        
        if (canHaveMonthlyStreak && countingMonthlyDisplay) {
          if (currentMonthDone || i > 0) {
            displayMonthlyStreak++;
          }
        }
      } else {
        curMonthlyRun = 0;
        if (i > 0 || currentMonthDone) {
          countingMonthlyDisplay = false;
        }
      }
    }

    setMonthlyStreak(displayMonthlyStreak);
    setMaxMonthlyStreak(maxMonthlyRun);
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

  const addInboxTask = (text: string) => {
    if (text.trim() === '') return;
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const newTask: InboxTask = {
      id: newId,
      text: text.trim(),
      completed: false,
      position: inboxTasks.length ? Math.max(...inboxTasks.map(t => t.position)) + 1 : 0
    };
    const newTasks = [...inboxTasks, newTask];
    setInboxTasks(newTasks);
    localStorage.setItem('tasks_inbox', JSON.stringify(newTasks));
    pushSync({
      type: 'inbox',
      data: newTasks
    });
    playTickSound();
  };

  const deleteInboxTask = (id: string) => {
    const newTasks = inboxTasks.filter(t => t.id !== id);
    const formatted = newTasks.map((t, idx) => ({ ...t, position: idx }));
    setInboxTasks(formatted);
    localStorage.setItem('tasks_inbox', JSON.stringify(formatted));
    pushSync({
      type: 'inbox',
      data: formatted
    });
    playScratchSound();
  };

  const toggleInboxTask = (id: string) => {
    const newTasks = inboxTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setInboxTasks(newTasks);
    localStorage.setItem('tasks_inbox', JSON.stringify(newTasks));
    pushSync({
      type: 'inbox',
      data: newTasks
    });
    
    // Play completion sound if task toggled to true
    const nextTask = newTasks.find(t => t.id === id);
    if (nextTask && nextTask.completed) {
      playSuccessSound();
    } else {
      playScratchSound();
    }
  };

  const editInboxTask = (id: string, newText: string) => {
    if (newText.trim() === '') return;
    const newTasks = inboxTasks.map(t => t.id === id ? { ...t, text: newText.trim() } : t);
    setInboxTasks(newTasks);
    localStorage.setItem('tasks_inbox', JSON.stringify(newTasks));
    pushSync({
      type: 'inbox',
      data: newTasks
    });
    playTickSound();
  };

  const moveInboxTask = (id: string, direction: 'up' | 'down') => {
    const idx = inboxTasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= inboxTasks.length) return;

    const copy = [...inboxTasks];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;

    const formatted = copy.map((t, index) => ({ ...t, position: index }));
    setInboxTasks(formatted);
    localStorage.setItem('tasks_inbox', JSON.stringify(formatted));
    pushSync({
      type: 'inbox',
      data: formatted
    });
    playTickSound();
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

  const toggleWeeklyFieldNotDone = (field: keyof WeeklyTaskState) => {
    const currentVal = weeklyTasks[field] || '';
    const nextVal = currentVal === '__NOT_DONE__' ? '' : '__NOT_DONE__';
    updateWeeklyField(field, nextVal);
  };

  const toggleMonthlyFieldNotDone = (field: keyof MonthlyTaskState) => {
    const currentVal = monthlyTasks[field] || '';
    const nextVal = currentVal === '__NOT_DONE__' ? '' : '__NOT_DONE__';
    updateMonthlyField(field, nextVal);
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
    const hours = new Date().getHours();
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

  const dailyRate = (() => {
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
  })();

  const weeklyRate = (() => {
    let totals = 0;
    let completed = 0;
    for (let i = 0; i < 11; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const wKey = getWeekString(d);
      const val = localStorage.getItem(`tasks_weekly_${wKey}`);
      if (val) {
        totals++;
        const state = JSON.parse(val);
        if (state.isSaved && 
            state.oss1.trim() !== '' &&
            state.oss2.trim() !== '' &&
            state.projectRepo.trim() !== '' &&
            state.codechef.trim() !== '' &&
            state.codeforces.trim() !== '' &&
            state.leetcode.trim() !== '' &&
            state.hackathon.trim() !== '' &&
            state.ctf.trim() !== '' &&
            state.revision.trim() !== '') {
          completed++;
        }
      }
    }
    return totals > 0 ? Math.round((completed / totals) * 100) : 0;
  })();

  const monthlyRate = (() => {
    let totals = 0;
    let completed = 0;
    for (let i = 0; i < 11; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mKey = getMonthString(d);
      const val = localStorage.getItem(`tasks_monthly_${mKey}`);
      if (val) {
        totals++;
        const state = JSON.parse(val);
        if (state.isSaved && 
            state.blog1.trim() !== '' &&
            state.blog2.trim() !== '' &&
            state.langCommit.trim() !== '') {
          completed++;
        }
      }
    }
    return totals > 0 ? Math.round((completed / totals) * 100) : 0;
  })();

  if (loading) {
    return <Loader onComplete={() => setLoading(false)} />;
  }

  return (
    <ClickSpark>
      <div className="min-h-screen pb-24 relative select-none">
        
        {/* HEADER AREA */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8 md:mb-12 relative z-50">
          
          {/* Mobile-only header top bar (Avatar + Settings + Theme Switch) */}
          <div className="flex md:hidden justify-between items-center w-full">
            <div className="relative flex-shrink-0">
              <img 
                src={bocchiAvatar.src} 
                alt="bocchi logo" 
                className={`w-12 h-12 rounded border-[1.5px] border-[var(--text-h)] object-cover shadow-[2px_2px_0_var(--accent)] select-none pointer-events-none transition-all duration-300 ${bocchiAvatar.className}`}
              />
              {completedDailyCount === 5 && (
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center animate-bounce">
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
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSandbox(prev => !prev);
                  playTickSound();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--code-bg)] border border-[var(--border)] rounded font-mono text-2xs text-[var(--text-h)] hover:bg-[var(--text-h)] hover:text-[var(--bg)] cursor-pointer select-none lowercase transition-all active:scale-95 focus:outline-none"
                title="toggle developer sandbox"
              >
                <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>[ settings ]</span>
              </button>
              <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
            </div>
          </div>

          {/* Desktop/Tablet-ready layout block */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Desktop-only Avatar */}
            <div 
              className="hidden md:block relative flex-shrink-0"
              onMouseEnter={() => !isMobile && setIsHoveringGreetingOrPfp(true)}
              onMouseLeave={() => !isMobile && setIsHoveringGreetingOrPfp(false)}
            >
              <img 
                src={bocchiAvatar.src} 
                alt="bocchi logo" 
                className={`w-14 h-14 rounded border-[1.5px] border-[var(--text-h)] object-cover shadow-[3px_3px_0_var(--accent)] select-none pointer-events-none transition-all duration-300 ${bocchiAvatar.className}`}
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
            
            {/* Greeting + Capsules */}
            <div 
              className="flex flex-col gap-2 w-full md:w-auto"
              onMouseEnter={() => !isMobile && setIsHoveringGreetingOrPfp(true)}
              onMouseLeave={() => !isMobile && setIsHoveringGreetingOrPfp(false)}
            >
              <SplitText 
                text={`${getGreeting()}, pratham.`}
                className="text-2xl md:text-3xl font-extrabold text-[var(--text-h)] lowercase leading-none tracking-tight"
                tag="h1"
                delay={40}
                duration={0.85}
              />
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {/* Monospace Capsule Date */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[var(--code-bg)] border border-[var(--border)] rounded font-mono text-2xs text-[var(--text-h)] lowercase select-none">
                  <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>[ {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toLowerCase()} ]</span>
                </div>
                
                {streak > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[var(--code-bg)] border border-[var(--border)] rounded font-mono text-2xs text-[var(--text-h)] lowercase select-none">
                    <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>[ uptime: {streak}d ]</span>
                  </div>
                )}
                
                {syncStatus !== 'synced' && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[var(--code-bg)] border border-[var(--border)] rounded font-mono text-2xs text-[var(--text-h)] lowercase select-none">
                    <Database className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>[ sync: <span className={
                      syncStatus === 'syncing' ? 'text-amber-500 animate-pulse' :
                      syncStatus === 'offline' ? 'text-rose-400' :
                      syncStatus === 'error' ? 'text-rose-500 font-bold' : 'text-[var(--text-muted)]'
                    }>{syncStatus}</span> ]</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Desktop-only Controls */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
          </div>
        </header>

        {/* CENTERED TABS NAVIGATION */}
        <nav className="flex justify-center border-b border-[var(--border)] mb-10 relative">
          {TABS_ORDER.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Magnetic key={tab}>
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  onMouseEnter={handleMouseEnter}
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
              </Magnetic>
            );
          })}
        </nav>

        {/* TAB PANELS */}
        <main className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* INBOX PANEL */}
            {activeTab === 'inbox' && (
              <motion.div
                key="inbox"
                custom={direction}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={tabTransition}
                className="space-y-8 tab-content-wrapper"
              >
                {/* Inbox header */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-mono text-[var(--text-muted)] lowercase">
                    <span>inbox tasks index</span>
                    <span>{inboxTasks.filter(t => t.completed).length} / {inboxTasks.length} completed</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-3.5 border-[1.5px] border-[var(--text-h)] rounded-sm bg-[var(--code-bg)] relative overflow-hidden shadow-[2px_2px_0_var(--text-h)]">
                    <motion.div 
                      className="h-full bg-[var(--accent)]"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: inboxTasks.length ? `${(inboxTasks.filter(t => t.completed).length / inboxTasks.length) * 100}%` : '0%' 
                      }}
                      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    />
                  </div>
                </div>

                {/* List Container Card */}
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="bg-[var(--code-bg)] border border-[var(--border)] p-4 md:p-6 rounded-lg space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <h2 className="text-sm font-bold text-[var(--text-h)] lowercase">
                      inbox checklist
                    </h2>
                    <span className="font-mono text-2xs text-[var(--accent)]">[ {inboxTasks.length} items ]</span>
                  </div>

                  {/* Tasks List */}
                  <motion.div layout className="space-y-4 max-h-[400px] overflow-y-auto overflow-x-hidden no-scrollbar pr-1">
                    <AnimatePresence mode="popLayout">
                      {inboxTasks.length === 0 ? (
                        <motion.div 
                          key="empty-inbox"
                          layout
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                          className="py-12 text-center text-xs font-mono text-[var(--text-muted)] lowercase italic"
                        >
                          inbox is empty. add tasks below.
                        </motion.div>
                      ) : (
                        [...inboxTasks]
                          .sort((a, b) => a.position - b.position)
                          .map((task, idx) => {
                            const isEditing = editingTaskId === task.id;
                            return (
                              <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="flex items-center justify-between gap-3 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-md transition-all hover:border-[var(--text-h)] hover:shadow-[2px_2px_0_var(--text-h)] group"
                              >
                                <div className="flex items-center gap-3 flex-grow min-w-0">
                                  {/* Custom Checkbox */}
                                  <Checkbox
                                    id={`inbox-${task.id}`}
                                    checked={task.completed}
                                    onChange={() => toggleInboxTask(task.id)}
                                    label=""
                                    onMouseEnter={handleMouseEnter}
                                  />
                                  
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editingText}
                                      onChange={(e) => setEditingText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          editInboxTask(task.id, editingText);
                                          setEditingTaskId(null);
                                        } else if (e.key === 'Escape') {
                                          setEditingTaskId(null);
                                        }
                                      }}
                                      onBlur={() => {
                                        setTimeout(() => {
                                          if (editingTaskIdRef.current === task.id) {
                                            editInboxTask(task.id, editingText);
                                            setEditingTaskId(null);
                                          }
                                        }, 200);
                                      }}
                                      autoFocus
                                      className="font-mono text-sm border-b border-[var(--accent)] text-[var(--text-h)] focus:outline-none bg-transparent w-full"
                                    />
                                  ) : (
                                    <span 
                                      className={`font-sans text-base transition-all duration-300 truncate lowercase select-none ${
                                        task.completed ? 'line-through text-[var(--text-muted)] opacity-60' : 'text-[var(--text-h)] font-medium'
                                      }`}
                                      onDoubleClick={() => {
                                        setEditingTaskId(task.id);
                                        setEditingText(task.text);
                                        playTickSound();
                                      }}
                                    >
                                      {task.text}
                                    </span>
                                  )}
                                </div>

                                {/* Inbox action buttons */}
                                <div className="flex items-center gap-1.5 flex-shrink-0 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => moveInboxTask(task.id, 'up')}
                                    disabled={idx === 0}
                                    onMouseEnter={handleMouseEnter}
                                    className="p-1 border border-[var(--border)] rounded text-xs bg-[var(--code-bg)] hover:bg-[var(--text-h)] hover:text-[var(--bg)] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer focus:outline-none"
                                    title="move up"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveInboxTask(task.id, 'down')}
                                    disabled={idx === inboxTasks.length - 1}
                                    onMouseEnter={handleMouseEnter}
                                    className="p-1 border border-[var(--border)] rounded text-xs bg-[var(--code-bg)] hover:bg-[var(--text-h)] hover:text-[var(--bg)] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer focus:outline-none"
                                    title="move down"
                                  >
                                    ▼
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => {
                                      if (isEditing) {
                                        e.preventDefault();
                                      }
                                    }}
                                    onClick={() => {
                                      if (isEditing) {
                                        editInboxTask(task.id, editingText);
                                        setEditingTaskId(null);
                                      } else {
                                        setEditingTaskId(task.id);
                                        setEditingText(task.text);
                                        playTickSound();
                                      }
                                    }}
                                    onMouseEnter={handleMouseEnter}
                                    className="px-1.5 py-0.5 border border-[var(--border)] rounded text-2xs font-mono bg-[var(--code-bg)] hover:bg-[var(--text-h)] hover:text-[var(--bg)] transition-all cursor-pointer focus:outline-none"
                                  >
                                    {isEditing ? 'save' : 'edit'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteInboxTask(task.id)}
                                    onMouseEnter={handleMouseEnter}
                                    className="px-1.5 py-0.5 border border-rose-500/30 rounded text-2xs font-mono bg-[var(--code-bg)] text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer focus:outline-none"
                                    title="delete task"
                                  >
                                    [ x ]
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Add task form input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addInboxTask(newInboxText);
                      setNewInboxText('');
                    }}
                    className="flex items-center gap-3 pt-3 border-t border-[var(--border)]"
                  >
                    <input
                      type="text"
                      placeholder="add task to inbox..."
                      value={newInboxText}
                      onChange={(e) => setNewInboxText(e.target.value)}
                      onMouseEnter={handleMouseEnter}
                      className="bg-[var(--bg)] border border-[var(--border)] px-4 py-2.5 rounded-lg text-sm text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] font-mono w-full"
                    />
                    <button
                      type="submit"
                      onMouseEnter={handleMouseEnter}
                      className="brutal-btn flex-shrink-0"
                    >
                      <span className="brutal-btn-top py-2.5 px-5 font-bold font-mono">
                        [ add ]
                      </span>
                    </button>
                  </form>
                </motion.div>
              </motion.div>
            )}

            {/* DAILY PANEL */}
            {activeTab === 'daily' && (
              <motion.div
                key="daily"
                custom={direction}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={tabTransition}
                className="space-y-8 tab-content-wrapper"
              >
                {/* Progress bar */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-mono text-[var(--text-muted)] lowercase">
                    <span>daily index</span>
                    <span>{dailyPercent}%</span>
                  </div>
                  <div ref={progressBarRef} className="grid grid-cols-5 gap-2.5 w-full select-none">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const isFilled = completedDailyCount > idx;
                      return (
                        <div 
                          key={idx} 
                          className={`h-3.5 border-[1.5px] border-[var(--text-h)] rounded-sm ${
                            isFilled 
                              ? 'bg-[var(--accent)] shadow-[2px_2px_0_var(--text-h)]' 
                              : 'bg-[var(--code-bg)] opacity-40 shadow-none'
                          }`} 
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Split Column Design: Left Column (Tasks), Right Column (Calendar View) */}
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start"
                >
                  
                  {/* Left checklist (Static brutal border, no hover lift) */}
                  <motion.div variants={itemVariants} className="md:col-span-7 bg-[var(--code-bg)] border border-[var(--border)] p-4 md:p-6 rounded-lg space-y-6">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                      <h2 className="text-sm font-bold text-[var(--text-h)] lowercase">
                        daily items
                      </h2>
                      <span className="font-mono text-2xs text-[var(--accent)]">[ {activeDateKey} ]</span>
                    </div>

                    <motion.div variants={containerVariants} className="space-y-5">
                      <motion.div variants={itemVariants}>
                        <Checkbox 
                          id="bootdev"
                          checked={dailyTasks.bootdev}
                          onChange={(val) => updateDailyTask('bootdev', val)}
                          label="boot.dev (min 2 lessons)"
                          onMouseEnter={handleMouseEnter}
                        />
                      </motion.div>
                      <motion.div variants={itemVariants}>
                        <Checkbox 
                          id="neetcode"
                          checked={dailyTasks.neetcode}
                          onChange={(val) => updateDailyTask('neetcode', val)}
                          label="neetcode (min 2 problems)"
                          onMouseEnter={handleMouseEnter}
                        />
                      </motion.div>
                      <motion.div variants={itemVariants}>
                        <Checkbox 
                          id="ailearning"
                          checked={dailyTasks.ailearning}
                          onChange={(val) => updateDailyTask('ailearning', val)}
                          label="ai learning (min 0.5 chapter)"
                          onMouseEnter={handleMouseEnter}
                        />
                      </motion.div>
                      <motion.div variants={itemVariants}>
                        <Checkbox 
                          id="twitter"
                          checked={dailyTasks.twitter}
                          onChange={(val) => updateDailyTask('twitter', val)}
                          label="twitter post (min 1 post)"
                          onMouseEnter={handleMouseEnter}
                        />
                      </motion.div>
                      <motion.div variants={itemVariants}>
                        <Checkbox 
                          id="jobhunt"
                          checked={dailyTasks.jobhunt}
                          onChange={(val) => updateDailyTask('jobhunt', val)}
                          label="job hunt (apply / search)"
                          onMouseEnter={handleMouseEnter}
                        />
                      </motion.div>
                    </motion.div>
                  </motion.div>

                  {/* Right side calendar scroller */}
                  <motion.div variants={itemVariants} className="md:col-span-5 bg-[var(--code-bg)] border border-[var(--border)] p-4 md:p-5 rounded-lg space-y-4">
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
                      <Magnetic>
                        <button 
                          onClick={resetToToday}
                          onMouseEnter={handleMouseEnter}
                          className="text-3xs font-mono text-[var(--text-muted)] bg-[var(--code-bg)] border border-[var(--border)] px-2.5 py-0.5 rounded-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all cursor-pointer lowercase focus:outline-none"
                        >
                          back to today
                        </button>
                      </Magnetic>
                      <span className="text-[9px] font-mono text-[var(--text-muted)] flex items-center gap-1.5 lowercase">
                        <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full inline-block"></span> completed day
                      </span>
                    </div>

                  </motion.div>

                </motion.div>

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
                custom={direction}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={tabTransition}
                className="space-y-6 tab-content-wrapper"
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
                <motion.form onSubmit={handleWeeklySubmit} variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="bg-[var(--code-bg)] border border-[var(--border)] p-4 md:p-8 rounded-lg space-y-8">
                  <motion.div variants={itemVariants}>
                    <h3 className="form-section-title">
                      open source contributions
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      <Input 
                        id="oss1"
                        label="repo / pr link 1"
                        value={weeklyTasks.oss1}
                        onChange={(v) => updateWeeklyField('oss1', v)}
                        disabled={!isWeeklyEditable}
                        required
                        onMouseEnter={handleMouseEnter}
                        onToggleNotDone={() => toggleWeeklyFieldNotDone('oss1')}
                      />
                      <Input 
                        id="oss2"
                        label="repo / pr link 2"
                        value={weeklyTasks.oss2}
                        onChange={(v) => updateWeeklyField('oss2', v)}
                        disabled={!isWeeklyEditable}
                        required
                        onMouseEnter={handleMouseEnter}
                        onToggleNotDone={() => toggleWeeklyFieldNotDone('oss2')}
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
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
                      onMouseEnter={handleMouseEnter}
                      onToggleNotDone={() => toggleWeeklyFieldNotDone('projectRepo')}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <h3 className="form-section-title">
                      weekly contest links
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      <Input 
                        id="codechef"
                        label="codechef profile/link"
                        value={weeklyTasks.codechef}
                        onChange={(v) => updateWeeklyField('codechef', v)}
                        disabled={!isWeeklyEditable}
                        required
                        onMouseEnter={handleMouseEnter}
                        onToggleNotDone={() => toggleWeeklyFieldNotDone('codechef')}
                      />
                      <Input 
                        id="codeforces"
                        label="codeforces profile/link"
                        value={weeklyTasks.codeforces}
                        onChange={(v) => updateWeeklyField('codeforces', v)}
                        disabled={!isWeeklyEditable}
                        required
                        onMouseEnter={handleMouseEnter}
                        onToggleNotDone={() => toggleWeeklyFieldNotDone('codeforces')}
                      />
                      <Input 
                        id="leetcode"
                        label="leetcode profile/link"
                        value={weeklyTasks.leetcode}
                        onChange={(v) => updateWeeklyField('leetcode', v)}
                        disabled={!isWeeklyEditable}
                        required
                        onMouseEnter={handleMouseEnter}
                        onToggleNotDone={() => toggleWeeklyFieldNotDone('leetcode')}
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
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
                      onMouseEnter={handleMouseEnter}
                      onToggleNotDone={() => toggleWeeklyFieldNotDone('hackathon')}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6">
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
                        onMouseEnter={handleMouseEnter}
                        onToggleNotDone={() => toggleWeeklyFieldNotDone('ctf')}
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
                        onMouseEnter={handleMouseEnter}
                        onToggleNotDone={() => toggleWeeklyFieldNotDone('revision')}
                      />
                    </div>
                  </motion.div>

                  {isWeeklyEditable && (
                    <motion.div variants={itemVariants}>
                      <Magnetic>
                        <button
                          type="submit"
                          disabled={!isWeeklyComplete}
                          onMouseEnter={handleMouseEnter}
                          className={`brutal-btn w-full ${!isWeeklyComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="brutal-btn-top w-full py-3 px-6 text-center text-sm font-extrabold uppercase">
                            save weekly report
                          </span>
                        </button>
                      </Magnetic>
                    </motion.div>
                  )}
                </motion.form>
              </motion.div>
            )}

            {/* MONTHLY PANEL */}
            {activeTab === 'monthly' && (
              <motion.div
                key="monthly"
                custom={direction}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={tabTransition}
                className="space-y-6 tab-content-wrapper"
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
                 <motion.form onSubmit={handleMonthlySubmit} variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="bg-[var(--code-bg)] border border-[var(--border)] p-4 md:p-8 rounded-lg space-y-8">
                  <motion.div variants={itemVariants}>
                    <h3 className="form-section-title">
                      written publications (min 1-2 articles)
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      <Input 
                        id="blog1"
                        label="blog/article link 1"
                        value={monthlyTasks.blog1}
                        onChange={(v) => updateMonthlyField('blog1', v)}
                        disabled={!isMonthlyEditable}
                        required
                        onMouseEnter={handleMouseEnter}
                        onToggleNotDone={() => toggleMonthlyFieldNotDone('blog1')}
                      />
                      <Input 
                        id="blog2"
                        label="blog/article link 2"
                        value={monthlyTasks.blog2}
                        onChange={(v) => updateMonthlyField('blog2', v)}
                        disabled={!isMonthlyEditable}
                        required
                        onMouseEnter={handleMouseEnter}
                        onToggleNotDone={() => toggleMonthlyFieldNotDone('blog2')}
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
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
                      onMouseEnter={handleMouseEnter}
                      onToggleNotDone={() => toggleMonthlyFieldNotDone('langCommit')}
                    />
                  </motion.div>

                  {isMonthlyEditable && (
                    <motion.div variants={itemVariants}>
                      <Magnetic>
                        <button
                          type="submit"
                          disabled={!isMonthlyComplete}
                          onMouseEnter={handleMouseEnter}
                          className={`brutal-btn w-full ${!isMonthlyComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="brutal-btn-top w-full py-3 px-6 text-center text-sm font-extrabold uppercase">
                            save monthly milestone
                          </span>
                        </button>
                      </Magnetic>
                    </motion.div>
                  )}
                </motion.form>
              </motion.div>
            )}

            {/* POMO TIMER PANEL */}
            {activeTab === 'pomo' && (
              <motion.div
                key="pomo"
                custom={direction}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={tabTransition}
                className="space-y-8 tab-content-wrapper"
              >
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="bg-[var(--code-bg)] border border-[var(--border)] p-6 md:p-8 rounded-lg space-y-8"
                >
                  <div className="flex flex-wrap justify-center gap-4">
                    <button 
                      type="button" 
                      onClick={() => handlePomoModeChange('work')} 
                      onMouseEnter={handleMouseEnter}
                      className={`px-4 py-2 border-2 border-[var(--text-h)] font-mono text-xs font-bold rounded uppercase cursor-pointer select-none transition-all duration-200 ${
                        pomoMode === 'work' ? 'bg-[var(--accent)] text-white shadow-[2px_2px_0_var(--text-h)] -translate-x-[1px] -translate-y-[1px]' : 'bg-[var(--code-bg)] text-[var(--text-muted)] hover:text-[var(--text-h)] shadow-none hover:shadow-[2px_2px_0_var(--text-h)] hover:-translate-x-[1px] hover:-translate-y-[1px]'
                      }`}
                    >
                      [ work - 25m ]
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handlePomoModeChange('shortBreak')} 
                      onMouseEnter={handleMouseEnter}
                      className={`px-4 py-2 border-2 border-[var(--text-h)] font-mono text-xs font-bold rounded uppercase cursor-pointer select-none transition-all duration-200 ${
                        pomoMode === 'shortBreak' ? 'bg-[var(--accent)] text-white shadow-[2px_2px_0_var(--text-h)] -translate-x-[1px] -translate-y-[1px]' : 'bg-[var(--code-bg)] text-[var(--text-muted)] hover:text-[var(--text-h)] shadow-none hover:shadow-[2px_2px_0_var(--text-h)] hover:-translate-x-[1px] hover:-translate-y-[1px]'
                      }`}
                    >
                      [ short break - 5m ]
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handlePomoModeChange('longBreak')} 
                      onMouseEnter={handleMouseEnter}
                      className={`px-4 py-2 border-2 border-[var(--text-h)] font-mono text-xs font-bold rounded uppercase cursor-pointer select-none transition-all duration-200 ${
                        pomoMode === 'longBreak' ? 'bg-[var(--accent)] text-white shadow-[2px_2px_0_var(--text-h)] -translate-x-[1px] -translate-y-[1px]' : 'bg-[var(--code-bg)] text-[var(--text-muted)] hover:text-[var(--text-h)] shadow-none hover:shadow-[2px_2px_0_var(--text-h)] hover:-translate-x-[1px] hover:-translate-y-[1px]'
                      }`}
                    >
                      [ long break - 10m ]
                    </button>
                  </div>

                  <div className="flex flex-col items-center justify-center p-6 space-y-6">
                    <div className={`pomo-hamster-container ${pomoRunning ? 'timer-running' : ''}`}>
                      <div aria-label="Orange and tan hamster running in a metal wheel" role="img" className="wheel-and-hamster">
                        <div className="wheel" />
                        <div className="hamster">
                          <div className="hamster__body">
                            <div className="hamster__head">
                              <div className="hamster__ear" />
                              <div className="hamster__eye" />
                              <div className="hamster__nose" />
                            </div>
                            <div className="hamster__limb hamster__limb--fr" />
                            <div className="hamster__limb hamster__limb--fl" />
                            <div className="hamster__limb hamster__limb--br" />
                            <div className="hamster__limb hamster__limb--bl" />
                            <div className="hamster__tail" />
                          </div>
                        </div>
                        <div className="spoke" />
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-5xl md:text-6xl font-extrabold text-[var(--text-h)] font-mono tracking-wider select-none">
                        {Math.floor(pomoTime / 60).toString().padStart(2, '0')}:{(pomoTime % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-3xs font-mono text-[var(--text-muted)] uppercase tracking-widest mt-2">
                        // work sessions: {pomoCyclesCompleted} / 4 //
                      </div>
                    </div>

                    {/* Suggestions card */}
                    {pomoSuggestion && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-sm border-2 border-[var(--text-h)] bg-[var(--bg)] p-4 rounded shadow-[3px_3px_0_var(--text-h)] text-center space-y-3 font-mono"
                      >
                        <div className="text-2xs uppercase tracking-wider text-[var(--accent)] font-bold">// session complete //</div>
                        <p className="text-xs lowercase text-[var(--text)]">
                          {pomoSuggestion === 'longBreak' && `4 work sessions completed. take a long break (10m)?`}
                          {pomoSuggestion === 'shortBreak' && `work session completed. take a short break (5m)?`}
                          {pomoSuggestion === 'work' && `break completed. start another 25m work session?`}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {pomoSuggestion === 'longBreak' && (
                            <button 
                              type="button"
                              onClick={() => {
                                handlePomoModeChange('longBreak');
                                setPomoRunning(true);
                                setPomoSuggestion(null);
                                setPomoCyclesCompleted(0);
                              }}
                              className="px-2.5 py-1.5 border border-[var(--border)] bg-[var(--code-bg)] hover:bg-[var(--text-h)] hover:text-[var(--bg)] text-3xs uppercase font-bold rounded cursor-pointer transition-all"
                            >
                              [ 10m break ]
                            </button>
                          )}
                          {pomoSuggestion === 'shortBreak' && (
                            <button 
                              type="button"
                              onClick={() => {
                                handlePomoModeChange('shortBreak');
                                setPomoRunning(true);
                                setPomoSuggestion(null);
                              }}
                              className="px-2.5 py-1.5 border border-[var(--border)] bg-[var(--code-bg)] hover:bg-[var(--text-h)] hover:text-[var(--bg)] text-3xs uppercase font-bold rounded cursor-pointer transition-all"
                            >
                              [ 5m break ]
                            </button>
                          )}
                          {pomoSuggestion === 'work' && (
                            <button 
                              type="button"
                              onClick={() => {
                                handlePomoModeChange('work');
                                setPomoRunning(true);
                                setPomoSuggestion(null);
                              }}
                              className="px-2.5 py-1.5 border border-[var(--border)] bg-[var(--code-bg)] hover:bg-[var(--text-h)] hover:text-[var(--bg)] text-3xs uppercase font-bold rounded cursor-pointer transition-all"
                            >
                              [ start work ]
                            </button>
                          )}
                          <button 
                            type="button"
                            onClick={() => {
                              if (pomoSuggestion === 'longBreak') {
                                setPomoCyclesCompleted(0);
                              }
                              handlePomoModeChange('work');
                              setPomoSuggestion(null);
                            }}
                            className="px-2.5 py-1.5 border border-[var(--border)] bg-[var(--code-bg)] hover:bg-[var(--text-h)] hover:text-[var(--bg)] text-3xs uppercase font-bold rounded cursor-pointer transition-all"
                          >
                            [ start new work ]
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPomoSuggestion(null)}
                            className="px-2.5 py-1.5 border border-[var(--border)] bg-[var(--code-bg)] hover:bg-[var(--text-h)] hover:text-[var(--bg)] text-3xs uppercase font-bold rounded cursor-pointer text-[var(--text-muted)] transition-all"
                          >
                            [ dismiss ]
                          </button>
                        </div>
                      </motion.div>
                    )}

                    <div className="flex items-center gap-4">
                      <button 
                        type="button" 
                        onClick={() => { setPomoRunning(!pomoRunning); playTickSound(); }}
                        onMouseEnter={handleMouseEnter}
                        className="brutal-btn w-32 cursor-pointer focus:outline-none"
                      >
                        <span className="brutal-btn-top w-full py-2.5 text-center text-xs font-extrabold uppercase select-none">
                          {pomoRunning ? 'pause' : 'start'}
                        </span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setPomoRunning(false);
                          setPomoSuggestion(null);
                          if (pomoMode === 'work') setPomoTime(1500);
                          else if (pomoMode === 'shortBreak') setPomoTime(300);
                          else if (pomoMode === 'longBreak') setPomoTime(600);
                          playTickSound();
                        }}
                        onMouseEnter={handleMouseEnter}
                        className="px-4 py-2.5 border border-[var(--border)] rounded text-xs font-mono bg-[var(--code-bg)] text-[var(--text)] hover:bg-[var(--text-h)] hover:text-[var(--bg)] transition-all cursor-pointer focus:outline-none uppercase font-bold"
                      >
                        reset
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* INSIGHTS / HISTORY PANEL */}
            {activeTab === 'insights' && (
              <motion.div
                key="insights"
                custom={direction}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={tabTransition}
                className="space-y-10 tab-content-wrapper"
              >
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10">
                  {/* 1. Daily Habits Metrics */}
                  <div className="space-y-3">
                    <div className="font-mono text-2xs text-[var(--text-muted)] lowercase tracking-wider">// daily habits metrics</div>
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
                      {/* Card 1: Daily Current Streak */}
                      <motion.div variants={itemVariants} className="brutal-hover-card flex flex-col justify-between h-28 md:h-32 !p-2.5 sm:!p-4 md:!p-5">
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5 md:pb-2 mb-1.5 md:mb-2">
                          <span className="text-[10px] sm:text-2xs font-bold font-mono text-[var(--text-h)] lowercase truncate">current streak</span>
                          <span className="text-[9px] sm:text-3xs font-mono text-emerald-500 flex-shrink-0">[ active ]</span>
                        </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--text-h)] font-mono">{streak}d</div>
                        <div className="text-[var(--accent)] text-[9px] sm:text-3xs font-mono border-t border-[var(--border)] pt-1 md:pt-1.5 mt-1 md:mt-2 hidden sm:block">
                          &gt;_ daily uptime index
                        </div>
                      </motion.div>

                      {/* Card 2: Daily Max Streak */}
                      <motion.div variants={itemVariants} className="brutal-hover-card flex flex-col justify-between h-28 md:h-32 !p-2.5 sm:!p-4 md:!p-5">
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5 md:pb-2 mb-1.5 md:mb-2">
                          <span className="text-[10px] sm:text-2xs font-bold font-mono text-[var(--text-h)] lowercase truncate">personal record</span>
                          <span className="text-[9px] sm:text-3xs font-mono text-[var(--accent)] flex-shrink-0">[ max ]</span>
                        </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--text-h)] font-mono">{maxStreak}d</div>
                        <div className="text-[var(--accent)] text-[9px] sm:text-3xs font-mono border-t border-[var(--border)] pt-1 md:pt-1.5 mt-1 md:mt-2 hidden sm:block">
                          &gt;_ peak performance log
                        </div>
                      </motion.div>

                      {/* Card 3: Daily Completion Rate */}
                      <motion.div variants={itemVariants} className="brutal-hover-card flex flex-col justify-between h-28 md:h-32 !p-2.5 sm:!p-4 md:!p-5">
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5 md:pb-2 mb-1.5 md:mb-2">
                          <span className="text-[10px] sm:text-2xs font-bold font-mono text-[var(--text-h)] lowercase truncate">completion rate</span>
                          <span className="text-[9px] sm:text-3xs font-mono text-[var(--accent)] flex-shrink-0">[ 30d ]</span>
                        </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--text-h)] font-mono">{dailyRate}%</div>
                        <div className="text-[var(--accent)] text-[9px] sm:text-3xs font-mono border-t border-[var(--border)] pt-1 md:pt-1.5 mt-1 md:mt-2 hidden sm:block">
                          &gt;_ consistency rating
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* 2. Weekly Habits Metrics */}
                  <div className="space-y-3">
                    <div className="font-mono text-2xs text-[var(--text-muted)] lowercase tracking-wider">// weekly habits metrics</div>
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
                      {/* Card 1: Weekly Current Streak */}
                      <motion.div variants={itemVariants} className="brutal-hover-card flex flex-col justify-between h-28 md:h-32 !p-2.5 sm:!p-4 md:!p-5">
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5 md:pb-2 mb-1.5 md:mb-2">
                          <span className="text-[10px] sm:text-2xs font-bold font-mono text-[var(--text-h)] lowercase truncate">weekly streak</span>
                          <span className="text-[9px] sm:text-3xs font-mono text-[var(--go-blue)] flex-shrink-0">[ active ]</span>
                        </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--text-h)] font-mono">{weeklyStreak}w</div>
                        <div className="text-[var(--go-blue)] text-[9px] sm:text-3xs font-mono border-t border-[var(--border)] pt-1 md:pt-1.5 mt-1 md:mt-2 hidden sm:block">
                          &gt;_ weekly sync index
                        </div>
                      </motion.div>

                      {/* Card 2: Weekly Personal Record */}
                      <motion.div variants={itemVariants} className="brutal-hover-card flex flex-col justify-between h-28 md:h-32 !p-2.5 sm:!p-4 md:!p-5">
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5 md:pb-2 mb-1.5 md:mb-2">
                          <span className="text-[10px] sm:text-2xs font-bold font-mono text-[var(--text-h)] lowercase truncate">weekly pr</span>
                          <span className="text-[9px] sm:text-3xs font-mono text-[var(--accent)] flex-shrink-0">[ max ]</span>
                        </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--text-h)] font-mono">{maxWeeklyStreak}w</div>
                        <div className="text-[var(--accent)] text-[9px] sm:text-3xs font-mono border-t border-[var(--border)] pt-1 md:pt-1.5 mt-1 md:mt-2 hidden sm:block">
                          &gt;_ weekly peak index
                        </div>
                      </motion.div>

                      {/* Card 3: Weekly Completion Rate */}
                      <motion.div variants={itemVariants} className="brutal-hover-card flex flex-col justify-between h-28 md:h-32 !p-2.5 sm:!p-4 md:!p-5">
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5 md:pb-2 mb-1.5 md:mb-2">
                          <span className="text-[10px] sm:text-2xs font-bold font-mono text-[var(--text-h)] lowercase truncate">completion rate</span>
                          <span className="text-[9px] sm:text-3xs font-mono text-[var(--accent)] flex-shrink-0">[ 11w ]</span>
                        </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--text-h)] font-mono">{weeklyRate}%</div>
                        <div className="text-[var(--accent)] text-[9px] sm:text-3xs font-mono border-t border-[var(--border)] pt-1 md:pt-1.5 mt-1 md:mt-2 hidden sm:block">
                          &gt;_ weekly consistency
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* 3. Monthly Milestone Metrics */}
                  <div className="space-y-3">
                    <div className="font-mono text-2xs text-[var(--text-muted)] lowercase tracking-wider">// monthly milestone metrics</div>
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
                      {/* Card 1: Monthly Current Streak */}
                      <motion.div variants={itemVariants} className="brutal-hover-card flex flex-col justify-between h-28 md:h-32 !p-2.5 sm:!p-4 md:!p-5">
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5 md:pb-2 mb-1.5 md:mb-2">
                          <span className="text-[10px] sm:text-2xs font-bold font-mono text-[var(--text-h)] lowercase truncate">monthly streak</span>
                          <span className="text-[9px] sm:text-3xs font-mono text-[var(--accent)] flex-shrink-0">[ active ]</span>
                        </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--text-h)] font-mono">{monthlyStreak}m</div>
                        <div className="text-[var(--accent)] text-[9px] sm:text-3xs font-mono border-t border-[var(--border)] pt-1 md:pt-1.5 mt-1 md:mt-2 hidden sm:block">
                          &gt;_ monthly milestone index
                        </div>
                      </motion.div>

                      {/* Card 2: Monthly Personal Record */}
                      <motion.div variants={itemVariants} className="brutal-hover-card flex flex-col justify-between h-28 md:h-32 !p-2.5 sm:!p-4 md:!p-5">
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5 md:pb-2 mb-1.5 md:mb-2">
                          <span className="text-[10px] sm:text-2xs font-bold font-mono text-[var(--text-h)] lowercase truncate">monthly pr</span>
                          <span className="text-[9px] sm:text-3xs font-mono text-[var(--accent)] flex-shrink-0">[ max ]</span>
                        </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--text-h)] font-mono">{maxMonthlyStreak}m</div>
                        <div className="text-[var(--accent)] text-[9px] sm:text-3xs font-mono border-t border-[var(--border)] pt-1 md:pt-1.5 mt-1 md:mt-2 hidden sm:block">
                          &gt;_ monthly peak index
                        </div>
                      </motion.div>

                      {/* Card 3: Monthly Completion Rate */}
                      <motion.div variants={itemVariants} className="brutal-hover-card flex flex-col justify-between h-28 md:h-32 !p-2.5 sm:!p-4 md:!p-5">
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5 md:pb-2 mb-1.5 md:mb-2">
                          <span className="text-[10px] sm:text-2xs font-bold font-mono text-[var(--text-h)] lowercase truncate">completion rate</span>
                          <span className="text-[9px] sm:text-3xs font-mono text-[var(--accent)] flex-shrink-0">[ 11m ]</span>
                        </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--text-h)] font-mono">{monthlyRate}%</div>
                        <div className="text-[var(--accent)] text-[9px] sm:text-3xs font-mono border-t border-[var(--border)] pt-1 md:pt-1.5 mt-1 md:mt-2 hidden sm:block">
                          &gt;_ monthly consistency
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Grids list - stacked vertically and horizontally wide */}
                  <div className="space-y-8">
                    {/* Daily Grid */}
                    <motion.div 
                      variants={scrollRevealVariants}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, margin: "-60px" }}
                      className="brutal-card w-full"
                    >
                      <h3 className="text-sm font-bold text-[var(--text-h)] lowercase mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--accent)]" /> tasks grid (past 30 days)
                      </h3>
                      <div className="flex flex-wrap gap-2.5 p-3 bg-[var(--code-bg)] border border-[var(--border)] rounded justify-start">
                        {Array.from({ length: 30 }).map((_, i) => {
                          const d = new Date();
                          d.setDate(d.getDate() - (29 - i));
                          const dateKey = formatDateString(d);
                          const val = localStorage.getItem(`tasks_daily_${dateKey}`);
                          
                          let checkedCount = 0;
                          if (val) {
                            try {
                              const parsed = JSON.parse(val);
                              checkedCount = Object.values(parsed).filter(Boolean).length;
                            } catch {}
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
                              onClick={() => setSelectedCellInfo({ type: 'daily', key: dateKey })}
                              className={`w-10 h-10 rounded-sm ${colors[checkedCount]} transition-all duration-300 hover:scale-110 cursor-pointer flex items-center justify-center text-xs font-mono font-bold select-none text-white`}
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
                        <span>today</span>
                      </div>
                    </motion.div>

                    {/* Weekly Grid */}
                    <motion.div 
                      variants={scrollRevealVariants}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, margin: "-60px" }}
                      className="brutal-card w-full"
                    >
                      <h3 className="text-sm font-bold text-[var(--text-h)] lowercase mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--accent)]" /> weekly tasks grid (past 11 weeks)
                      </h3>
                      <div className="flex flex-wrap gap-3.5 p-3 bg-[var(--code-bg)] border border-[var(--border)] rounded justify-start">
                        {Array.from({ length: 11 }).map((_, i) => {
                          const d = new Date();
                          d.setDate(d.getDate() - (10 - i) * 7);
                          const wKey = getWeekString(d);
                          const val = localStorage.getItem(`tasks_weekly_${wKey}`);
                          
                          let filledCount = 0;
                          let isSaved = false;
                          if (val) {
                            try {
                              const parsed = JSON.parse(val);
                              isSaved = !!parsed.isSaved;
                              Object.entries(parsed).forEach(([key, value]) => {
                                if (key === 'isSaved') return;
                                if (typeof value === 'string') {
                                  if (value !== '__NOT_DONE__' && value.trim() !== '') {
                                    filledCount++;
                                  }
                                }
                              });
                            } catch {}
                          }

                          const colors = [
                            'bg-[var(--border)] opacity-30',
                            'bg-[var(--accent)]/20',
                            'bg-[var(--accent)]/45',
                            'bg-[var(--accent)]/65',
                            'bg-[var(--accent)]/85',
                            'bg-[var(--accent)] font-bold shadow-[0_0_8px_var(--accent)]'
                          ];

                          let colorClass = colors[0];
                          if (isSaved) {
                            const totalFilled = filledCount;
                            if (totalFilled === 9) {
                              colorClass = colors[5];
                            } else if (totalFilled >= 7) {
                              colorClass = colors[4];
                            } else if (totalFilled >= 5) {
                              colorClass = colors[3];
                            } else if (totalFilled >= 3) {
                              colorClass = colors[2];
                            } else {
                              colorClass = colors[1];
                            }
                          }

                          const getWeeklyTasksForTooltip = (weekKey: string) => {
                            const saved = localStorage.getItem(`tasks_weekly_${weekKey}`);
                            let state = { ...DEFAULT_WEEKLY };
                            if (saved) {
                              try {
                                state = { ...state, ...JSON.parse(saved) };
                              } catch {}
                            }
                            return [
                              { label: 'repo 1', value: state.oss1 },
                              { label: 'repo 2', value: state.oss2 },
                              { label: 'project', value: state.projectRepo },
                              { label: 'codechef', value: state.codechef },
                              { label: 'codeforces', value: state.codeforces },
                              { label: 'leetcode', value: state.leetcode },
                              { label: 'hackathon', value: state.hackathon },
                              { label: 'ctf', value: state.ctf },
                              { label: 'revision', value: state.revision },
                            ];
                          };

                          const onMouseEnter = (e: React.MouseEvent) => {
                            const items = getWeeklyTasksForTooltip(wKey);
                            setHoveredTooltip({
                              dateStr: `week of ${getWeekRange(d)}`,
                              x: e.clientX,
                              y: e.clientY,
                              tasks: items.map(item => ({
                                label: item.label,
                                status: item.value === '__NOT_DONE__' ? 'not-done' : item.value.trim() !== '' ? 'checked' : 'pending'
                              }))
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
                              key={wKey} 
                              onClick={() => setSelectedCellInfo({ type: 'weekly', key: wKey })}
                              className={`flex-1 min-w-[3.5rem] md:min-w-[4.5rem] h-14 rounded transition-all duration-300 hover:scale-110 cursor-pointer flex flex-col items-center justify-center text-[10px] font-mono font-bold select-none text-white ${colorClass}`}
                              onMouseEnter={onMouseEnter}
                              onMouseMove={onMouseMove}
                              onMouseLeave={onMouseLeave}
                            >
                              {isSaved ? `${filledCount}/9` : 'pnd'}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between items-center text-3xs font-mono text-[var(--text-muted)] mt-3 lowercase">
                        <span>11 weeks ago</span>
                        <span>today</span>
                      </div>
                    </motion.div>

                    {/* Monthly Grid */}
                    <motion.div 
                      variants={scrollRevealVariants}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, margin: "-60px" }}
                      className="brutal-card w-full"
                    >
                      <h3 className="text-sm font-bold text-[var(--text-h)] lowercase mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--accent)]" /> monthly tasks grid (past 11 months)
                      </h3>
                      <div className="flex flex-wrap gap-3.5 p-3 bg-[var(--code-bg)] border border-[var(--border)] rounded justify-start">
                        {Array.from({ length: 11 }).map((_, i) => {
                          const d = new Date();
                          d.setMonth(d.getMonth() - (10 - i));
                          const mKey = getMonthString(d);
                          const val = localStorage.getItem(`tasks_monthly_${mKey}`);
                          
                          let filledCount = 0;
                          let isSaved = false;
                          if (val) {
                            try {
                              const parsed = JSON.parse(val);
                              isSaved = !!parsed.isSaved;
                              Object.entries(parsed).forEach(([key, value]) => {
                                if (key === 'isSaved') return;
                                if (typeof value === 'string') {
                                  if (value !== '__NOT_DONE__' && value.trim() !== '') {
                                    filledCount++;
                                  }
                                }
                              });
                            } catch {}
                          }

                          const colors = [
                            'bg-[var(--border)] opacity-30',
                            'bg-[var(--accent)]/30',
                            'bg-[var(--accent)]/65',
                            'bg-[var(--accent)] font-bold shadow-[0_0_8px_var(--accent)]'
                          ];

                          let colorClass = colors[0];
                          if (isSaved) {
                            colorClass = colors[Math.min(filledCount, 3)];
                          }

                          const getMonthlyTasksForTooltip = (monthKey: string) => {
                            const saved = localStorage.getItem(`tasks_monthly_${monthKey}`);
                            let state = { ...DEFAULT_MONTHLY };
                            if (saved) {
                              try {
                                state = { ...state, ...JSON.parse(saved) };
                              } catch {}
                            }
                            return [
                              { label: 'blog 1', value: state.blog1 },
                              { label: 'blog 2', value: state.blog2 },
                              { label: 'compiler feature', value: state.langCommit },
                            ];
                          };

                          const onMouseEnter = (e: React.MouseEvent) => {
                            const items = getMonthlyTasksForTooltip(mKey);
                            setHoveredTooltip({
                              dateStr: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase(),
                              x: e.clientX,
                              y: e.clientY,
                              tasks: items.map(item => ({
                                label: item.label,
                                status: item.value === '__NOT_DONE__' ? 'not-done' : item.value.trim() !== '' ? 'checked' : 'pending'
                              }))
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
                              key={mKey} 
                              onClick={() => setSelectedCellInfo({ type: 'monthly', key: mKey })}
                              className={`flex-1 min-w-[3.5rem] md:min-w-[4.5rem] h-14 rounded transition-all duration-300 hover:scale-110 cursor-pointer flex flex-col items-center justify-center text-[10px] font-mono font-bold select-none text-white ${colorClass}`}
                              onMouseEnter={onMouseEnter}
                              onMouseMove={onMouseMove}
                              onMouseLeave={onMouseLeave}
                            >
                              {isSaved ? `${filledCount}/3` : 'pnd'}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between items-center text-3xs font-mono text-[var(--text-muted)] mt-3 lowercase">
                        <span>11 months ago</span>
                        <span>today</span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
                
                {/* Archive details Command-Palette style modal popup */}
                <AnimatePresence>
                  {selectedCellInfo && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
                      <div className="absolute inset-0 cursor-pointer" onClick={() => { setSelectedCellInfo(null); playTickSound(); }} />
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                        className="relative w-full max-w-md bg-[var(--dropdown-bg)] border-2 border-[var(--text-h)] p-5 rounded shadow-[4px_4px_0_var(--text-h)] font-mono text-2xs z-10 space-y-4 mx-4 cursor-default"
                      >
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                          <span className="flex items-center gap-1.5 font-bold lowercase text-[var(--text-h)] text-xs">
                            <Terminal className="w-4 h-4 text-[var(--accent)]" />
                            <span>archive // {selectedCellInfo.type} - {selectedCellInfo.key}</span>
                          </span>
                          <button 
                            type="button" 
                            onClick={() => { setSelectedCellInfo(null); playTickSound(); }}
                            className="text-[9px] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--text-h)] hover:text-[var(--bg)] px-1.5 py-0.5 rounded lowercase font-semibold cursor-pointer focus:outline-none"
                          >
                            [ close ]
                          </button>
                        </div>

                        <div className="space-y-3 text-xs font-mono lowercase">
                          {(() => {
                            const saved = localStorage.getItem(`tasks_${selectedCellInfo.type}_${selectedCellInfo.key}`);
                            if (!saved) {
                              return (
                                <div className="py-6 text-center italic text-[var(--text-muted)]">
                                  no report submitted for this {selectedCellInfo.type} window.
                                </div>
                              );
                            }

                            try {
                              const data = JSON.parse(saved);
                              
                              if (selectedCellInfo.type === 'daily') {
                                const items = [
                                  { label: 'boot.dev', checked: !!data.bootdev },
                                  { label: 'neetcode', checked: !!data.neetcode },
                                  { label: 'ai learning', checked: !!data.ailearning },
                                  { label: 'twitter post', checked: !!data.twitter },
                                  { label: 'job hunt', checked: !!data.jobhunt },
                                ];
                                return (
                                  <div className="space-y-2">
                                    <div className="text-3xs text-[var(--text-muted)] border-b border-[var(--border)] pb-1 mb-1.5">
                                      completion rate: {items.filter(i => i.checked).length} / 5
                                    </div>
                                    <div className="space-y-1.5">
                                      {items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2 bg-[var(--code-bg)] border border-[var(--border)]/40 rounded">
                                          <span className={item.checked ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-muted)]'}>
                                            {item.checked ? '[■]' : '[ ]'}
                                          </span>
                                          <span className={item.checked ? 'text-[var(--text-h)]' : 'text-[var(--text-muted)]'}>
                                            {item.label}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }

                              if (selectedCellInfo.type === 'weekly') {
                                const items = [
                                  { label: 'repo 1', value: data.oss1 },
                                  { label: 'repo 2', value: data.oss2 },
                                  { label: 'project', value: data.projectRepo },
                                  { label: 'codechef', value: data.codechef },
                                  { label: 'codeforces', value: data.codeforces },
                                  { label: 'leetcode', value: data.leetcode },
                                  { label: 'hackathon', value: data.hackathon },
                                  { label: 'ctf', value: data.ctf },
                                  { label: 'revision', value: data.revision },
                                ];

                                const isSaved = !!data.isSaved;

                                return (
                                  <div className="space-y-2">
                                    <div className="text-3xs text-[var(--text-muted)] border-b border-[var(--border)] pb-1 mb-1.5 flex justify-between">
                                      <span>status: {isSaved ? 'submitted' : 'draft'}</span>
                                      <span>{items.filter(i => i.value && i.value !== '__NOT_DONE__').length} / 9 done</span>
                                    </div>
                                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                                      {items.map((item, idx) => {
                                        const isNotDone = item.value === '__NOT_DONE__';
                                        const isEmpty = !item.value || item.value.trim() === '';
                                        return (
                                          <div key={idx} className="p-2 bg-[var(--code-bg)] border border-[var(--border)]/40 rounded">
                                            <div className="flex justify-between items-center text-3xs font-bold">
                                              <span className="text-[var(--accent)]">{item.label}</span>
                                              {isNotDone && <span className="text-rose-400">not done</span>}
                                              {isEmpty && <span className="text-[var(--text-muted)]">pending</span>}
                                              {!isNotDone && !isEmpty && <span className="text-emerald-500">done</span>}
                                            </div>
                                            {!isEmpty && !isNotDone && (
                                              <div className="text-3xs text-[var(--text)] break-all mt-1 font-sans">
                                                {item.value.startsWith('http') ? (
                                                  <a href={item.value} target="_blank" rel="noopener noreferrer" className="animated-link">
                                                    {item.value}
                                                  </a>
                                                ) : (
                                                  item.value
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              }

                              if (selectedCellInfo.type === 'monthly') {
                                const items = [
                                  { label: 'blog 1', value: data.blog1 },
                                  { label: 'blog 2', value: data.blog2 },
                                  { label: 'compiler feature', value: data.langCommit },
                                ];

                                const isSaved = !!data.isSaved;

                                return (
                                  <div className="space-y-2">
                                    <div className="text-3xs text-[var(--text-muted)] border-b border-[var(--border)] pb-1 mb-1.5 flex justify-between">
                                      <span>status: {isSaved ? 'submitted' : 'draft'}</span>
                                      <span>{items.filter(i => i.value && i.value !== '__NOT_DONE__').length} / 3 done</span>
                                    </div>
                                    <div className="space-y-1.5">
                                      {items.map((item, idx) => {
                                        const isNotDone = item.value === '__NOT_DONE__';
                                        const isEmpty = !item.value || item.value.trim() === '';
                                        return (
                                          <div key={idx} className="p-2 bg-[var(--code-bg)] border border-[var(--border)]/40 rounded">
                                            <div className="flex justify-between items-center text-3xs font-bold">
                                              <span className="text-[var(--accent)]">{item.label}</span>
                                              {isNotDone && <span className="text-rose-400">not done</span>}
                                              {isEmpty && <span className="text-[var(--text-muted)]">pending</span>}
                                              {!isNotDone && !isEmpty && <span className="text-emerald-500">done</span>}
                                            </div>
                                            {!isEmpty && !isNotDone && (
                                              <div className="text-3xs text-[var(--text)] break-all mt-1 font-sans">
                                                {item.value.startsWith('http') ? (
                                                  <a href={item.value} target="_blank" rel="noopener noreferrer" className="animated-link">
                                                    {item.value}
                                                  </a>
                                                ) : (
                                                  item.value
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              }

                            } catch {
                              return (
                                <div className="py-6 text-center italic text-rose-500">
                                  error parsing archived cell details.
                                </div>
                              );
                            }
                          })()}
                        </div>

                        <div className="text-[9px] text-[var(--text-muted)] font-mono leading-relaxed border-t border-[var(--border)] pt-2.5 select-none lowercase">
                          press [esc] or click backdrop to close details.
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* BOTTOM SANDBOX DRAWER (Retro Terminal look, toggled by Ctrl+K) */}
        <AnimatePresence>
          {showSandbox && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
              {/* Modal backdrop closer */}
              <div className="absolute inset-0 cursor-pointer" onClick={() => { setShowSandbox(false); playTickSound(); }} />
              
              {/* Modal Content */}
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="relative w-full max-w-xl bg-[var(--dropdown-bg)] border-2 border-[var(--text-h)] p-6 rounded shadow-[5px_5px_0_var(--text-h)] font-mono text-2xs z-10 space-y-5 mx-4 cursor-default"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <span className="flex items-center gap-2 font-bold lowercase text-[var(--text-h)] text-xs">
                    <Terminal className="w-4 h-4 text-[var(--accent)] animate-pulse" />
                    <span>tasks.sh // developer sandbox controls</span>
                  </span>
                  <span className="text-[9px] text-[var(--text-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded lowercase font-semibold">
                    press [esc] to close
                  </span>
                </div>

                {/* Grid content of options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                  <div className="space-y-4">
                    <h4 className="font-bold border-b border-[var(--border)] pb-1.5 lowercase text-[var(--text-h)] tracking-wide">bypasses & audio</h4>
                    <div className="space-y-3">
                      {/* Option 1: Bypass weekly lock */}
                      <button 
                        type="button"
                        onClick={() => {
                          setSimulateSunday(!simulateSunday);
                          playScratchSound();
                        }}
                        onMouseEnter={handleMouseEnter}
                        className="flex items-start gap-3 hover:text-[var(--accent)] transition-colors select-none font-mono text-left cursor-pointer focus:outline-none w-full"
                      >
                        <span className="text-[var(--accent)] font-bold text-sm leading-none flex-shrink-0 whitespace-nowrap pt-0.5">
                          {simulateSunday ? '[■]' : '[ ]'}
                        </span>
                        <span className="lowercase">bypass sunday weekly lock</span>
                      </button>

                      {/* Option 2: Bypass monthly lock */}
                      <button 
                        type="button"
                        onClick={() => {
                          setSimulateMonthlyUnlock(!simulateMonthlyUnlock);
                          playScratchSound();
                        }}
                        onMouseEnter={handleMouseEnter}
                        className="flex items-start gap-3 hover:text-[var(--accent)] transition-colors select-none font-mono text-left cursor-pointer focus:outline-none w-full"
                      >
                        <span className="text-[var(--accent)] font-bold text-sm leading-none flex-shrink-0 whitespace-nowrap pt-0.5">
                          {simulateMonthlyUnlock ? '[■]' : '[ ]'}
                        </span>
                        <span className="lowercase">bypass last day monthly lock</span>
                      </button>

                      {/* Option 3: Tactile clicks */}
                      <button 
                        type="button"
                        onClick={() => {
                          const next = !isKeyboardSoundActive;
                          setIsKeyboardSoundActive(next);
                          localStorage.setItem('keyboard_sound_active', String(next));
                          playTickSound();
                        }}
                        onMouseEnter={handleMouseEnter}
                        className="flex items-start gap-3 hover:text-[var(--accent)] transition-colors select-none font-mono text-left cursor-pointer focus:outline-none w-full"
                      >
                        <span className="text-[var(--accent)] font-bold text-sm leading-none flex-shrink-0 whitespace-nowrap pt-0.5">
                          {isKeyboardSoundActive ? '[■]' : '[ ]'}
                        </span>
                        <span className="lowercase">tactile keyboard clicks</span>
                      </button>

                      {/* Option 4: Hover sounds */}
                      <button 
                        type="button"
                        onClick={() => {
                          const next = !isHoverSoundActive;
                          setIsHoverSoundActive(next);
                          localStorage.setItem('hover_sounds_active', String(next));
                          playTickSound();
                        }}
                        onMouseEnter={handleMouseEnter}
                        className="flex items-start gap-3 hover:text-[var(--accent)] transition-colors select-none font-mono text-left cursor-pointer focus:outline-none w-full"
                      >
                        <span className="text-[var(--accent)] font-bold text-sm leading-none flex-shrink-0 whitespace-nowrap pt-0.5">
                          {isHoverSoundActive ? '[■]' : '[ ]'}
                        </span>
                        <span className="lowercase">tactile hover sounds</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold border-b border-[var(--border)] pb-1.5 lowercase text-[var(--text-h)] tracking-wide">date travel & sync</h4>
                    <div className="space-y-4">
                      {/* Travel date adjustment */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-3xs text-[var(--text-muted)] lowercase font-mono">travel date:</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-[var(--border)] bg-[var(--code-bg)] rounded overflow-hidden">
                            {/* Year segment */}
                            <div className="flex flex-col items-center px-2 py-0.5 border-r border-[var(--border)]">
                              <button type="button" onClick={() => adjustDate('year', 1)} onMouseEnter={handleMouseEnter} className="text-[8px] hover:text-[var(--accent)] cursor-pointer focus:outline-none leading-none select-none">▲</button>
                              <span className="text-[var(--text-h)] font-bold my-0.5">{currentDate.getFullYear()}</span>
                              <button type="button" onClick={() => adjustDate('year', -1)} onMouseEnter={handleMouseEnter} className="text-[8px] hover:text-[var(--accent)] cursor-pointer focus:outline-none leading-none select-none">▼</button>
                            </div>
                            {/* Month segment */}
                            <div className="flex flex-col items-center px-2 py-0.5 border-r border-[var(--border)]">
                              <button type="button" onClick={() => adjustDate('month', 1)} onMouseEnter={handleMouseEnter} className="text-[8px] hover:text-[var(--accent)] cursor-pointer focus:outline-none leading-none select-none">▲</button>
                              <span className="text-[var(--text-h)] font-bold my-0.5">{String(currentDate.getMonth() + 1).padStart(2, '0')}</span>
                              <button type="button" onClick={() => adjustDate('month', -1)} onMouseEnter={handleMouseEnter} className="text-[8px] hover:text-[var(--accent)] cursor-pointer focus:outline-none leading-none select-none">▼</button>
                            </div>
                            {/* Day segment */}
                            <div className="flex flex-col items-center px-2 py-0.5">
                              <button type="button" onClick={() => adjustDate('day', 1)} onMouseEnter={handleMouseEnter} className="text-[8px] hover:text-[var(--accent)] cursor-pointer focus:outline-none leading-none select-none">▲</button>
                              <span className="text-[var(--text-h)] font-bold my-0.5">{String(currentDate.getDate()).padStart(2, '0')}</span>
                              <button type="button" onClick={() => adjustDate('day', -1)} onMouseEnter={handleMouseEnter} className="text-[8px] hover:text-[var(--accent)] cursor-pointer focus:outline-none leading-none select-none">▼</button>
                            </div>
                          </div>

                          {/* Reset date button */}
                          {activeDateKey !== formatDateString(new Date()) && (
                            <Magnetic>
                              <button 
                                type="button"
                                onClick={() => {
                                  setCustomDateStr('');
                                  resetToToday();
                                }}
                                onMouseEnter={handleMouseEnter}
                                className="text-[9px] text-[var(--accent)] hover:underline flex items-center gap-0.5 cursor-pointer lowercase font-mono focus:outline-none border border-[var(--border)] px-1.5 py-1 rounded bg-[var(--code-bg)]"
                              >
                                <Undo className="w-2.5 h-2.5" /> [reset]
                              </button>
                            </Magnetic>
                          )}
                        </div>
                      </div>

                      {/* Sync secret */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-3xs text-[var(--text-muted)] lowercase font-mono">sync secret key:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={syncKey}
                            onChange={(e) => {
                              setSyncKey(e.target.value);
                              localStorage.setItem('sync_key', e.target.value);
                            }}
                            onMouseEnter={handleMouseEnter}
                            placeholder="api_secret"
                            className="bg-[var(--code-bg)] border border-[var(--border)] px-2 py-1 rounded text-3xs text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)] font-mono w-full"
                          />
                          <Magnetic>
                            <button
                              type="button"
                              onClick={() => {
                                triggerSync(syncKey);
                                playTickSound();
                              }}
                              onMouseEnter={handleMouseEnter}
                              className="text-3xs font-mono text-[var(--text-muted)] border border-[var(--border)] px-2 py-1 rounded hover:bg-[var(--text-h)] hover:text-[var(--bg)] transition-all cursor-pointer lowercase focus:outline-none whitespace-nowrap"
                            >
                              [sync]
                            </button>
                          </Magnetic>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info footer */}
                <div className="text-[9px] text-[var(--text-muted)] font-mono leading-relaxed border-t border-[var(--border)] pt-3 select-none lowercase">
                  $ info: sandbox overrides are applied locally to localstorage caches. these settings enable rapid manual testing of calendars, completion states, and lock conditions.
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
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
                  <span className={
                    t.status === 'checked' ? 'text-[var(--accent)] font-bold' :
                    t.status === 'not-done' ? 'text-rose-500 line-through' : 'text-[var(--text-muted)]'
                  }>
                    {t.status === 'checked' ? '[■]' : t.status === 'not-done' ? '[x]' : '[ ]'}
                  </span>
                  <span className={
                    t.status === 'checked' ? 'text-[var(--text-h)]' :
                    t.status === 'not-done' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-muted)]'
                  }>
                    {t.label} {t.status === 'not-done' && '(not done)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ditto Custom Cursor Follower */}
        <AnimatePresence>
          {isHoveringGreetingOrPfp && !isMobile && (
            <motion.div
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                x: cursorX,
                y: cursorY,
                pointerEvents: 'none',
                zIndex: 999999,
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="flex items-center justify-center select-none"
            >
              <svg 
                viewBox="0 0 498.9 438.9" 
                className="w-14 h-14 overflow-visible drop-shadow-[2px_2px_0_rgba(0,0,0,0.4)]"
              >
                {/* Frame 1 */}
                {dittoFrame === 1 && (
                  <>
                    <path 
                      d="M422.9,15v15h16v15h15v106h-15v46h-16v45h-15v91h15v30h16v31h-16v15h-15v15H227v-15h-76v15H91v-15H60v-15H45v-61h15v-30h16v-31h15v-60H76v-45h15v-16h15v-15h30v-15h45v-15h31V91h15V76h15V61h45v15h46V45h15V30h15V15H422.9z" 
                      fill="#b860e0" 
                      stroke="#000000" 
                      strokeWidth={12} 
                    />
                    <path 
                      d="M287,167v15h-15v-15H287z M181,197v15h-15v-15H181z M287,227v15h-45v15h-45v-15h45v-15H287z" 
                      fill="#383838" 
                      stroke="#383838" 
                      strokeWidth={1}
                    />
                    <path 
                      d="M287,91v30h-30v15h-30v-30h30V91H287z" 
                      fill="#f8f8f8" 
                    />
                  </>
                )}

                {/* Frame 2 */}
                {dittoFrame === 2 && (
                  <>
                    <path 
                      d="M407.9,121v15h31v15h15v31h15v45h-15v30h-15v31h-16v45h16v15h15v46h-15v15h-16v15h-90v-15H197v15H60v-15H30v-15H15v-61h15v-30h15v-46h15v-45h16v-15h15v-15h45v15h30v-15h31v-15h15v-16h30v-15h60v15h46v-15h30v-15H407.9z" 
                      fill="#b860e0" 
                      stroke="#000000" 
                      strokeWidth={12} 
                    />
                    <path 
                      d="M287,242v15h-15v-15H287z M197,257v15h-16v-15H197z M287,303v15h-90v-15H287z" 
                      fill="#383838" 
                      stroke="#383838" 
                      strokeWidth={1}
                    />
                    <path 
                      d="M272,167v30h-30v15h-30v-30h30v-15H272z" 
                      fill="#f8f8f8" 
                    />
                  </>
                )}

                {/* Frame 3 */}
                {dittoFrame === 3 && (
                  <>
                    <path 
                      d="M106,91v15h30v15h61v-15h60v15h30v15h15v15h31v16h30v-16h45v16h15v15h16v45h-16v45h16v31h15v15h15v76h-15v15h-15v15H318v-15H151v15H60v-15H45v-15H30v-31h15v-30h15v-45H45v-31H30v-45H15v-61h15v-30h15v-15h31V91H106z" 
                      fill="#b860e0" 
                      stroke="#000000" 
                      strokeWidth={12} 
                    />
                    <path 
                      d="M212,212v15h-15v-15H212z M302,227v15h-15v-15H302z M287,272v16h-90v-16H287z" 
                      fill="#383838" 
                      stroke="#383838" 
                      strokeWidth={1}
                    />
                    <path 
                      d="M227,121v30h-30v16h-31v-31h31v-15H227z" 
                      fill="#f8f8f8" 
                    />
                  </>
                )}

                {/* Frame 4 */}
                {dittoFrame === 4 && (
                  <>
                    <path 
                      d="M136,76v15h15v15h30V91h16V76h45v15h15v15h15v15h30v15h61v15h15v16h15v15h15v45h-15v61h15v30h15v15h16v61h-16v15h-30v-15h-91v15H76v-15H60v-15H45v-46h15v-30h16v-61H60v-30H45v-30H30v-46h15v-30h15v-15h16V91h15V76H136z" 
                      fill="#b860e0" 
                      stroke="#000000" 
                      strokeWidth={12} 
                    />
                    <path 
                      d="M212,182v15h-15v-15H212z M318,212v15h-16v-15H318z M242,242v15h45v15h-45v-15h-45v-15 H242z" 
                      fill="#383838" 
                      stroke="#383838" 
                      strokeWidth={1}
                    />
                    <path 
                      d="M121,91v15h15v30h-30v-15H91V91H121z" 
                      fill="#f8f8f8" 
                    />
                  </>
                )}
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ClickSpark>
  );
}
