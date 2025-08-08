export interface DateProps {
  createdAt: number;
  updatedAt: number;
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

export interface Task extends DateProps {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  isDone: boolean;
  isActive: boolean;
}
export const INIT_TASK: Task = {
  id: 0,
  title: '',
  description: '',
  date: '',
  time: '',
  isDone: false,
  isActive: false,
  createdAt: +new Date(),
  updatedAt: +new Date()
}

export interface HT_Status extends DateProps {
  day: number;
  isDone: boolean;
}
export interface HT_Pause_History extends DateProps {
  startDay: number;
  endDay: number;
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