import React, { useState } from 'react';

interface HeatmapProps {
  currentDate: Date;
}

interface DailyTaskState {
  bootdev: boolean;
  neetcode: boolean;
  ailearning: boolean;
  twitter: boolean;
  jobhunt: boolean;
}

// Helper to format Date into YYYY-MM-DD
function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const Heatmap: React.FC<HeatmapProps> = ({ currentDate }) => {
  const [hoveredDay, setHoveredDay] = useState<{ dateStr: string; count: number } | null>(null);

  // Generate the grid dates: 12 weeks = 84 days
  // To keep it rectangular, align the end of the grid to the Saturday of the current week.
  const getGridDays = () => {
    const days: Date[] = [];
    const temp = new Date(currentDate.getTime());
    
    // Find the current week's Saturday
    const currentDayOfWeek = temp.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToSaturday = 6 - currentDayOfWeek;
    
    const endDate = new Date(temp.getTime());
    endDate.setDate(temp.getDate() + daysToSaturday);
    endDate.setHours(0, 0, 0, 0);

    // Go back 83 days from that Saturday
    for (let i = 83; i >= 0; i--) {
      const d = new Date(endDate.getTime());
      d.setDate(endDate.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const days = getGridDays();

  // Group 84 days into 12 columns (each column is a week of 7 days, Sunday to Saturday)
  const weeks: Date[][] = [];
  for (let i = 0; i < 12; i++) {
    weeks.push(days.slice(i * 7, (i + 1) * 7));
  }

  // Helper to count completions for a date
  const getCompletionCount = (date: Date): number => {
    const dateStr = formatDateString(date);
    const saved = localStorage.getItem(`tasks_daily_${dateStr}`);
    if (!saved) return 0;
    try {
      const state = JSON.parse(saved) as DailyTaskState;
      let count = 0;
      if (state.bootdev) count++;
      if (state.neetcode) count++;
      if (state.ailearning) count++;
      if (state.twitter) count++;
      if (state.jobhunt) count++;
      return count;
    } catch {
      return 0;
    }
  };

  // Get color scale based on completion count
  const getColorClass = (count: number) => {
    switch (count) {
      case 0:
        return 'border border-[var(--border)] bg-transparent hover:border-[var(--text-muted)]';
      case 1:
      case 2:
        return 'bg-[var(--accent)] opacity-25 hover:opacity-40';
      case 3:
      case 4:
        return 'bg-[var(--accent)] opacity-60 hover:opacity-75';
      case 5:
        return 'bg-[var(--accent)] shadow-[0_0_6px_var(--accent)] hover:scale-105';
      default:
        return 'border border-[var(--border)] bg-transparent';
    }
  };

  const dayLabels = ['s', 'm', 't', 'w', 't', 'f', 's'];

  return (
    <div className="border border-[var(--border)] rounded p-5 bg-[var(--dropdown-bg)] relative z-20 select-none">
      <div className="flex justify-between items-center mb-4 border-b border-[var(--border)] pb-2">
        <h3 className="font-mono text-xs font-bold text-[var(--text-h)] lowercase">
          [ log history // past 12 weeks ]
        </h3>
        <div className="font-mono text-3xs text-[var(--text-muted)] flex items-center gap-1.5 lowercase">
          <span>less</span>
          <div className="w-2.5 h-2.5 rounded-2xs border border-[var(--border)]"></div>
          <div className="w-2.5 h-2.5 rounded-2xs bg-[var(--accent)] opacity-25"></div>
          <div className="w-2.5 h-2.5 rounded-2xs bg-[var(--accent)] opacity-60"></div>
          <div className="w-2.5 h-2.5 rounded-2xs bg-[var(--accent)] shadow-[0_0_3px_var(--accent)]"></div>
          <span>more</span>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        {/* Day of Week Labels */}
        <div className="grid grid-rows-7 gap-1 font-mono text-[9px] text-[var(--text-muted)] text-right w-3 select-none leading-3 pr-1 lowercase">
          {dayLabels.map((lbl, idx) => (
            <div key={idx} className="h-3 flex items-center justify-end">
              {lbl}
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-rows-7 gap-1 flex-shrink-0">
              {week.map((date, dayIdx) => {
                const count = getCompletionCount(date);
                const dateStr = formatDateString(date);
                return (
                  <div
                    key={dayIdx}
                    onMouseEnter={() => setHoveredDay({ dateStr, count })}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`w-3 h-3 rounded-2xs cursor-pointer transition-all duration-200 ${getColorClass(count)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Status Text Line */}
      <div className="mt-3 pt-3 border-t border-[var(--border)] font-mono text-3xs text-[var(--text-muted)] lowercase min-h-[16px]">
        {hoveredDay ? (
          <span>
            $ log: {hoveredDay.dateStr} &raquo;{' '}
            <span className="text-[var(--accent)] font-bold">
              {hoveredDay.count}/5 daily tasks completed
            </span>
          </span>
        ) : (
          <span>$ log: hover a pixel to scan historical completion index...</span>
        )}
      </div>
    </div>
  );
};
