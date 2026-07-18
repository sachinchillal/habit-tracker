export interface DateProps {
  createdAt: number;
  updatedAt: number;
}
export interface BaseProps extends DateProps {
  id: number;
  title: string;
  description: string;

  isActive: boolean;
}

export interface ApiTask extends BaseProps {
  isPaused: boolean;

  categoryId?: number; // Optional category ID
  weekDays?: WeekDay[];
}
export interface Task extends ApiTask {
  // UI-only (set in app.service)
  categoryName?: string;
  isDone: boolean;
  lastUpdatedAt: number;
  lastUpdated: string;
  lastUpdatedColor: string;
}
export const INIT_TASK: Task = {
  id: 0,
  title: '',
  description: '',
  categoryId: undefined,
  weekDays: undefined,
  isActive: false,
  isPaused: false,
  createdAt: +new Date(),
  updatedAt: +new Date(),
  categoryName: undefined,
  isDone: false,
  lastUpdatedAt: 0,
  lastUpdated: '',
  lastUpdatedColor: 'text-slate-red dark:text-red-400',
};
export interface ApiCategory extends BaseProps {
  parentId?: number;
}
export interface Category extends ApiCategory {
}
export const INIT_UI_CATEGORY: Category = {
  id: 0,
  title: '',
  description: '',
  isActive: false,
  createdAt: +new Date(),
  updatedAt: +new Date(),
  parentId: undefined
};

export interface ApiMarksObject {
  [key: number]: number[]
}

export interface DayInfo extends DateProps {
  id: number;
  color: string;
  status: string;
}
export const INIT_DAY_INFO: DayInfo = {
  id: 1,
  status: 'Pending',
  color: 'bg-gray-300 dark:bg-gray-600',
  createdAt: +new Date(),
  updatedAt: +new Date()
}

/** Sunday-first display order; values match API / JS `Date.getDay()` (0–6). */
export const WEEK_DAY_OPTIONS = [
  { value: 0, label: 'Sunday', shortLabel: 'Su' },
  { value: 1, label: 'Monday', shortLabel: 'Mo' },
  { value: 2, label: 'Tuesday', shortLabel: 'Tu' },
  { value: 3, label: 'Wednesday', shortLabel: 'We' },
  { value: 4, label: 'Thursday', shortLabel: 'Th' },
  { value: 5, label: 'Friday', shortLabel: 'Fr' },
  { value: 6, label: 'Saturday', shortLabel: 'Sa' },
] as const;

export type WeekDay = (typeof WEEK_DAY_OPTIONS)[number]['value'];
export type WeekDayOption = (typeof WEEK_DAY_OPTIONS)[number];

export type WeekDayPreset = 'weekdays' | 'weekends' | 'alternate' | 'monWedFri';

const WEEK_DAY_PRESET_FILTERS: Record<WeekDayPreset, (day: WeekDay) => boolean> = {
  weekdays: (day) => day >= 1 && day <= 5,
  weekends: (day) => day === 0 || day === 6,
  alternate: (day) => day % 2 === 0,
  monWedFri: (day) => day === 1 || day === 3 || day === 5,
};

export function weekDaysForPreset(preset: WeekDayPreset): WeekDay[] {
  return WEEK_DAY_OPTIONS.filter((opt) => WEEK_DAY_PRESET_FILTERS[preset](opt.value)).map(
    (opt) => opt.value,
  );
}

export function isAllWeekDaysSelected(weekDays?: WeekDay[]): boolean {
  if (!weekDays?.length || weekDays.length !== WEEK_DAY_OPTIONS.length) {
    return false;
  }
  return WEEK_DAY_OPTIONS.every((opt) => weekDays.includes(opt.value));
}

/** Omit from API when none or all days are selected (every day). */
export function shouldOmitWeekDaysFromApi(weekDays?: WeekDay[]): boolean {
  return !weekDays?.length || isAllWeekDaysSelected(weekDays);
}

export function formatSelectedWeekDays(weekDays?: WeekDay[]): string {
  if (!weekDays?.length || isAllWeekDaysSelected(weekDays)) {
    return 'Every day';
  }
  return WEEK_DAY_OPTIONS.filter((opt) => weekDays.includes(opt.value))
    .map((opt) => opt.label)
    .join(', ');
}

export function isTaskScheduledForWeekDay(
  weekDays: WeekDay[] | undefined,
  day: WeekDay,
): boolean {
  return !!weekDays?.length
    && !isAllWeekDaysSelected(weekDays)
    && weekDays.includes(day);
}

export interface TaskCreate {
  id?: number;

  title: string;
  description: string;
  categoryId?: number; // Optional category ID
  weekDays?: WeekDay[];
}
export const INIT_TASK_CREATE: TaskCreate = {
  id: undefined,
  title: '',
  description: '',
  categoryId: undefined,
  weekDays: [],
};
export interface HT_Status extends DateProps {
  day: number;
  isDone: boolean;
}
export interface HT_Pause_History extends DateProps {
  // startDay: number;
  // endDay: number;
  paused: boolean;
}
export interface HT_Tracker extends DateProps {
  id: number;
  status: HT_Status[];
  pauseHistory: HT_Pause_History[];
  paused: boolean;
  currentStreak: number;
  longestStreak: number;

  //  Additional properties can be added as needed
  color?: string; // Optional color for UI representation
  statusString?: string; // Optional status string for UI representation

  daysList?: DayInfo[];
}
export const INIT_HT_TRACKER = () => {
  const id = +new Date();
  const R: HT_Tracker = {
    id,
    status: [],
    pauseHistory: [],
    paused: false,
    currentStreak: 0,
    longestStreak: 0,
    createdAt: id,
    updatedAt: id
  }
  return R;
}
export interface HT_Tracker_Obj {
  [key: number]: HT_Tracker
}

export type ToastType = 'success' | 'error';
export enum TOAST_TYPE {
  SUCCESS = 'success',
  ERROR = 'error'
};

export interface Toast {
  id: number;
  message: string;
  body: string;
  type: ToastType;
  duration?: number; // Duration in milliseconds
  isDeleted: boolean;
}

export enum THEME_TYPE {
  AUTO = 'auto',
  DARK = 'dark',
  LIGHT = 'light'
};

export enum ACTIONS {
  EDIT_CATEGORY = "EDIT_CATEGORY",
  EDIT_TASK = "EDIT_TASK",
}

export enum PAGES {
  HOME,
  CREATE_HABIT,
  TODOS,
  HABIT_TREE,
  GROUPED_TODOS,
  HABIT_LIST,
  HABIT_CATEGORY,
}

export enum BORDER_ITEMS {
  LEVEL_1_BORDER = 'Level 1 Border',
  LEVEL_2_BORDER = 'Level 2 Border',
}
export type BorderItem = { label: BORDER_ITEMS; checked: boolean };
