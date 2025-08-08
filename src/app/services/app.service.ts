import { Injectable } from '@angular/core';
import { HT_Status, HT_Tracker, INIT_DAY_INFO, Task } from './interfaces';
import { ApiService } from './api.service';

const LOCAL_STORAGE_KEY = 'habit_tracker';
interface LocalStorageData {
  tasks: Task[];
  trackers: HT_Tracker[];
}

@Injectable({
  providedIn: 'root'
})
export class AppService {
  isLoading: boolean = false;

  readonly tasks: Task[] = [];
  readonly trackers: HT_Tracker[] = [];
  tasksMap: { [key: number]: Task } = {};
  trackersMap: { [key: number]: HT_Tracker } = {};

  constructor(private apiService: ApiService) {
    this.initStore();
  }
  public initStore() {
    const d = this.getLocalStorage();
    if (d.tasks && d.tasks.length > 0) {
      this.assignTasks(d.tasks);
    } else {
      this.fetchTasks();
    }
    if (d.trackers && d.trackers.length > 0) {
      this.assignTrakers(d.trackers);
    } else {
      this.fetchTrackers();
    }
  }
  // TASKS
  public fetchTasks() {
    this.isLoading = true;
    this.apiService.getTasks().subscribe({
      next: (tasks: any) => {
        this.saveTasks(tasks.data);
      },
      error: (error) => { },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  public saveTasks(tasks: Task[]): void {
    this.assignTasks(tasks);
    const d = this.getLocalStorage();
    d.tasks = this.tasks;
    this.saveToLocalStorage(d);
  }
  private assignTasks(tasks: Task[]): void {
    this.tasks.length = 0; // Clear existing tasks
    this.tasks.push(...tasks);
    this.tasksMap = {}; // Reset the task map
    this.tasks.forEach(task => {
      // Initialize the task map for quick access
      this.tasksMap[task.id] = task;
    });
    this.buildUIProps();
  }
  //  TRACKERS
  public fetchTrackers() {
    this.isLoading = true;
    this.apiService.getTrackers().subscribe({
      next: (res: any) => {
        this.saveTrackers(Object.values(res.data));
      },
      error: (error) => {
        console.error('Error fetching trackers:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
  public saveTrackers(trackers: HT_Tracker[]): void {
    this.assignTrakers(trackers);
    const d = this.getLocalStorage();
    d.trackers = this.trackers;
    this.saveToLocalStorage(d);
  }
  private assignTrakers(trackers: HT_Tracker[]): void {
    this.trackers.length = 0; // Clear existing trackers
    this.trackers.push(...trackers);
    this.trackersMap = {}; // Reset the tracker map
    this.trackers.forEach(tracker => {
      // Initialize the tracker map for quick access
      this.trackersMap[tracker.id] = tracker;
    });
    this.buildUIProps();
  }
  // UI Properties
  private buildUIProps() {
    this.buildUIPropsForTasks();
    this.buildUIPropsForTrackers();
  }
  private buildUIPropsForTasks() {
    this.tasks.forEach(task => {
      const t = this.trackersMap[task.id]
      if (t && t.status.length > 0) {
        const lastStatus = t.status[t.status.length - 1];
        const lastCreatedAt = new Date(lastStatus.createdAt);
        const today = new Date();
        // check if the last status was created today
        const isToday = lastCreatedAt.getDate() === today.getDate() &&
          lastCreatedAt.getMonth() === today.getMonth() &&
          lastCreatedAt.getFullYear() === today.getFullYear();
        task.isDone = isToday && lastStatus.isDone;
      }
    });
  }
  private buildUIPropsForTrackers() {
    this.trackers.forEach(tracker => {
      this.dayInfoBuilder(tracker);
    });
  }

  private dayInfoBuilder(tracker: HT_Tracker) {
    tracker.daysList = [];
    const statusMap: { [key: number]: HT_Status } = {}
    let preStatus: HT_Status | null = null;
    for (let index = 0; index < tracker.status.length; index++) {
      const s = tracker.status[index];
      statusMap[s.day] = s;

      if (preStatus) {
        // Fill in the gaps between statuses
        for (let day = preStatus.day + 1; day < s.day; day++) {
          const di = { ...INIT_DAY_INFO };
          di.id = tracker.daysList.length + 1;
          di.status = "Missed";
          di.color = 'bg-rose-500';

          di.createdAt = new Date(preStatus.createdAt).getTime() + (day - preStatus.day) * 24 * 60 * 60 * 1000; // Increment day by day
          tracker.daysList.push(di);
        }
        // Add the current status

        const di = { ...INIT_DAY_INFO };
        di.id = tracker.daysList.length + 1;
        di.status = s.isDone ? 'Done' : 'Missed';
        di.color = s.isDone ? 'bg-emerald-500' : 'bg-rose-500';
        di.createdAt = s.createdAt;
        tracker.daysList.push(di);

      } else {
        const di = { ...INIT_DAY_INFO };
        di.id = 1;
        di.status = s.isDone ? 'Done' : 'Missed';
        di.color = s.isDone ? 'bg-emerald-500' : 'bg-rose-500';
        di.createdAt = s.createdAt;
        tracker.daysList.push(di);
      }
      preStatus = s;
    }
    if (tracker.status.length > 0) {
      const lastStatus = tracker.status[tracker.status.length - 1];
      const lastCreatedAt = new Date(lastStatus.createdAt);
      lastCreatedAt.setHours(0, 0, 0, 0); // Reset time to midnight

      // check lastCreatedAt is today or not, if not then add it as pending
      const today = new Date();
      if (lastCreatedAt.getDate() !== today.getDate() ||
        lastCreatedAt.getMonth() !== today.getMonth() ||
        lastCreatedAt.getFullYear() !== today.getFullYear()) {

        // Also fill in the gap from last status to yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0); // Reset time to midnight
        let day = lastCreatedAt;
        // increment day by 1
        day.setDate(day.getDate() + 1);
        for (; day <= yesterday; day.setDate(day.getDate() + 1)) {
          const di = { ...INIT_DAY_INFO };
          di.id = tracker.daysList.length + 1;
          di.status = "Missed";
          di.color = 'bg-rose-500';
          di.createdAt = new Date(day).getTime(); // Increment day by day
          tracker.daysList.push(di);
        }

        const di = { ...INIT_DAY_INFO };
        di.id = tracker.daysList.length + 1;
        tracker.daysList.push(di);
      }
    }
  }

  // Storage Management

  private getLocalStorage(): LocalStorageData {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : { tasks: [], trackers: [] };
  }
  private saveToLocalStorage(d: LocalStorageData): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(d));
  }
}
