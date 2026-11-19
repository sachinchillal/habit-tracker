import { EventEmitter, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { ACTIONS, ApiMarksObject, ApiTask, INIT_TASK, PAGES, Task, Category } from './interfaces';
import { ApiService } from './api.service';
import { StoreService } from './store.service';
import { orderCategoriesAsTree } from '../utils/category.util';

interface AppEventEmitter {
  action: ACTIONS,
  data: Task | Category | Partial<Category>
}

export enum STATE_ACTIONS {
  CATEGORIES_CHANGED = 'CATEGORIES_CHANGED',
  TASKS_CHANGED = 'TASKS_CHANGED',
  MARKS_CHANGED = 'MARKS_CHANGED',
}

interface StateChange {
  action: STATE_ACTIONS
}

@Injectable({
  providedIn: 'root'
})
export class AppService {
  isLoading: boolean = false;

  readonly categories: Category[] = [];
  readonly _tasks = signal<Task[]>([]);
  readonly tasks: Task[] = [];
  readonly tasksOriginal = signal<Task[]>([]);
  noOfTasksDone: number = 0;
  marks: ApiMarksObject = {};
  tasksMap: { [key: number]: Task } = {};
  categoriesMap: { [key: number]: Category } = {};
  categoryTaskMap: { [key: number]: number[] } = {};

  readonly eventEmitter = new EventEmitter<AppEventEmitter>();
  /** Fired when tasks or marks are reassigned so views can rebuild derived UI. */
  private readonly eventEmitterStateChanges = new EventEmitter<StateChange>();

  currentPage: PAGES = PAGES.HOME;

  date: string = '';
  time: string = '';
  searchText: string = '';
  autoClear = true;
  leafOnly = false;

  constructor(private apiService: ApiService, private storeService: StoreService) {
    this.initStore();
    this.initStateChanges();
  }
  private initStateChanges() {
    this.eventEmitterStateChanges.subscribe((stateChange) => {
      switch (stateChange.action) {
        case STATE_ACTIONS.CATEGORIES_CHANGED:
          this.initCategories();
          break;
        case STATE_ACTIONS.TASKS_CHANGED:
          this.initTasks();
          break;
        case STATE_ACTIONS.MARKS_CHANGED:
          this.initMarks();
          break;
        default:
          console.warn('No state change found for', stateChange.action);
          break;
      }
    });
  }
  private initStore() {
    this.initCategories();
    this.initTasks();
    this.initMarks();
  }
  private initCategories() {
    const categories = this.storeService.getCategories();
    if (categories && categories.length > 0) {
      this.assignCategories(categories);
    } else {
      this.fetchCategories();
    }
  }
  private initTasks() {
    const tasks = this.storeService.getTasks();
    if (tasks && tasks.length > 0) {
      this.assignTasks(tasks);
      this._tasks.set(tasks);
    } else {
      this.fetchTasks();
    }
  }
  private initMarks() {
    const marks = this.storeService.getMarks();
    if (marks && Object.keys(marks).length > 0) {
      this.assignMarks(marks);
    } else {
      this.fetchTrackers();
    }
  }
  // Public
  setCurrentPage(page: PAGES) {
    this.currentPage = page;
    switch (page) {
      case PAGES.CREATE_HABIT:
        this.rearrangeTasksForPageCreate();
        break;
      case PAGES.TODOS:
        this.rearrangeTasksForPageTodos();
        break;
      case PAGES.HABIT_LIST:
        this.rearrangeTasksForPageHabitList();
        break;

      default:
        console.warn('No page found for', page);
        break;
    }
  }
  private timeoutId: any;
  onSearch() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.applySearchFilter();
      this.timeoutId = null;
    }, 300);
  }
  handleRefreshFromHeader() {
    // fetchTrackers
    switch (this.currentPage) {
      case PAGES.HOME:
        this.fetchTasks();
        this.fetchTrackers();
        break;
      case PAGES.CREATE_HABIT:
        this.fetchTasks();
        break;
      case PAGES.TODOS:
        this.fetchTasks();
        this.fetchTrackers();
        break;
      case PAGES.GROUPED_TODOS:
        this.fetchTasks();
        break;
      case PAGES.HABIT_LIST:
        this.fetchTasks();
        break;
      case PAGES.HABIT_CATEGORY:
        this.fetchCategories();
        break;

      default:
        console.warn('No page found for', this.currentPage);
        break;
    }
  }

  private applySearchFilter() {
    // Implement search logic here
    this.tasks.length = 0;
    if (this.searchText.trim() === '') {
      this.tasks.push(...this.tasksOriginal());
    } else {
      const searchLower = this.searchText.toLowerCase();
      const filteredTasks = this.tasksOriginal().filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower))
      );
      this.tasks.push(...filteredTasks);
    }
  }

  private rearrangeTasksForPageCreate() {
    // show all tasks
    this.tasks.sort((a, b) => a.title.localeCompare(b.title));
  }
  private rearrangeTasksForPageTodos() {
    // First rearrange tasksOriginal
    const todoTasksOriginal = this.tasksOriginal().filter(task => !task.isDone);
    const combinedTasksOriginal = todoTasksOriginal.concat(this.tasksOriginal().filter(task => task.isDone)).filter(t => !t.isPaused);
    combinedTasksOriginal.sort((a, b) => (a.lastUpdatedAt - b.lastUpdatedAt));
    // this.tasksOriginal.length = 0;
    // this.tasksOriginal.push(...combinedTasksOriginal);

    // Then apply search filter if active, otherwise use all tasksOriginal
    if (this.searchText.trim() !== '') {
      this.applySearchFilter();
    } else {
      this.tasks.length = 0;
      this.tasks.push(...combinedTasksOriginal);
    }
  }
  private rearrangeTasksForPageHabitList() {
    // show all tasks
    this.tasks.sort((a, b) => a.id - b.id);

    this.tasksOriginal().sort((a, b) => a.id - b.id);
  }


  // CATEGORIES
  public fetchCategories() {
    this.isLoading = true;
    this.apiService.getCategories().subscribe({
      next: (res: any) => {
        const categories: Category[] = res.data ?? [];
        this.storeService.saveCategories(categories);
        if (categories.length > 0) {
          this.eventEmitterStateChanges.emit({ action: STATE_ACTIONS.CATEGORIES_CHANGED });
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
      },
    });
  }

  private assignCategories(categories: Category[]): void {
    this.categories.length = 0; // Clear existing categories
    this.categoriesMap = {}; // Reset the category map
    categories.forEach(c => {
      this.categoriesMap[c.id] = c;
      c.taskCount = this.categoryTaskMap[c.id]?.length ?? 0;
    });
    // Depth-first tree order so parents appear above their children
    this.categories.push(...orderCategoriesAsTree(categories));
  }

  /** Full ancestry path including the category itself, e.g. "Sports › Running › Tempo". */
  getCategoryPath(category: Category | number): string {
    const start = typeof category === 'number' ? this.categoriesMap[category] : category;
    if (!start) {
      return '';
    }
    const parts: string[] = [];
    let current: Category | undefined = start;
    const visited = new Set<number>();
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      parts.unshift(current.title);
      current = current.parentId ? this.categoriesMap[current.parentId] : undefined;
    }
    return parts.join(' > ');
  }

  /** Path of ancestors only (parent → … → root), for badges. */
  getCategoryParentPath(category: Category): string {
    if (!category.parentId) {
      return '';
    }
    const parent = this.categoriesMap[category.parentId];
    return parent ? this.getCategoryPath(parent) : '';
  }

  getCategoryDepth(category: Category): number {
    let depth = 0;
    let current: Category | undefined = category;
    const visited = new Set<number>();
    while (current?.parentId && !visited.has(current.id)) {
      visited.add(current.id);
      depth++;
      current = this.categoriesMap[current.parentId];
    }
    return depth;
  }

  isLeafCategory(category: Category): boolean {
    return !this.categories.some((c) => c.parentId === category.id);
  }


  /**
   * Categories that can be chosen as a parent.
   * Excludes `excludeId` and all of its descendants to avoid cycles when editing.
   */
  getValidParentOptions(excludeId?: number): Category[] {
    const excluded = new Set<number>();
    if (excludeId != null) {
      excluded.add(excludeId);
      let changed = true;
      while (changed) {
        changed = false;
        for (const c of this.categories) {
          if (c.parentId && excluded.has(c.parentId) && !excluded.has(c.id)) {
            excluded.add(c.id);
            changed = true;
          }
        }
      }
    }
    return orderCategoriesAsTree(this.categories.filter(c => !excluded.has(c.id)));
  }

  // TASKS
  public fetchTasks() {
    this.isLoading = true;
    this.apiService.getTasks().subscribe({
      next: (res) => {
        const apiTasks: ApiTask[] = res.data ?? [];
        const _tasks: Task[] = apiTasks.map((task) => ({
          ...INIT_TASK,
          ...task,
          categoryName: task.categoryId
            ? this.categoriesMap[task.categoryId]?.title
            : undefined
        }));
        this.storeService.saveTasks(_tasks);
        if (_tasks.length > 0) {
          this.eventEmitterStateChanges.emit({ action: STATE_ACTIONS.TASKS_CHANGED });
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private assignTasks(tasks: Task[]): void {
    this.tasks.length = 0; // Clear existing tasks
    this.tasks.push(...tasks);
    this.tasksOriginal.set(tasks);
    this.tasksMap = {}; // Reset the task map
    this.categoryTaskMap = {}; // Reset the category task map
    this.tasks.forEach(task => {
      // Initialize the task map for quick access
      this.tasksMap[task.id] = task;
      if (task.categoryId) {
        if (this.categoryTaskMap[task.categoryId]) {
          this.categoryTaskMap[task.categoryId].push(task.id);
        } else {
          this.categoryTaskMap[task.categoryId] = [task.id];
        }
      }
    });
    this.categories.forEach(c => {
      c.taskCount = this.categoryTaskMap[c.id]?.length ?? 0;
    });
    this.buildUIProps();
  }
  //  MARKS
  public fetchTrackers() {
    this.isLoading = true;
    this.apiService.getMarks().subscribe({
      next: (res) => {
        const marks: ApiMarksObject = res.data ?? {};
        this.storeService.saveMarks(marks);
        if (Object.keys(marks).length > 0) {
          this.eventEmitterStateChanges.emit({ action: STATE_ACTIONS.MARKS_CHANGED });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching marks:', error);
        this.isLoading = false;
      }
    });
  }
  private assignMarks(marks: ApiMarksObject): void {
    this.marks = marks ?? {};
    this.buildUIProps();
  }
  // UI Properties
  private buildUIProps() {
    this.buildUIPropsForTasks();
  }
  private buildUIPropsForTasks() {
    // Update tasksOriginal to ensure all tasks are updated, not just filtered ones
    this.tasksOriginal().forEach(task => {
      const timestamps = this.marks[task.id];
      if (timestamps && timestamps.length > 0) {
        const lastTs = Math.max(...timestamps);
        const lastCreatedAt = new Date(lastTs);
        const today = new Date();
        const isToday = lastCreatedAt.getDate() === today.getDate() &&
          lastCreatedAt.getMonth() === today.getMonth() &&
          lastCreatedAt.getFullYear() === today.getFullYear();
        task.isDone = isToday;

        const differenceInDays = Math.floor((today.getTime() - lastCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
        const differenceInHours = Math.floor((today.getTime() - lastCreatedAt.getTime()) / (1000 * 60 * 60));
        if (differenceInDays < 2) {
          if (differenceInHours === 0) {
            task.lastUpdated = 'a few moments ago';
            task.lastUpdatedColor = 'text-green-500 dark:text-green-400';
          } else {
            task.lastUpdated = `${differenceInHours} hours ago`;
            task.lastUpdatedColor = 'text-green-200 dark:text-green-100';
          }
        } else {
          if (differenceInDays === 1) {
            task.lastUpdated = 'Yesterday';
            task.lastUpdatedColor = 'text-green-600 dark:text-green-500';
          } else {
            task.lastUpdated = `${differenceInDays} days ago`;
            task.lastUpdatedColor = 'text-red-500 dark:text-red-400';
          }
        }

        task.lastUpdatedAt = lastTs;
      }
    });
    // Calculate noOfTasksDone from tasksOriginal to get accurate count
    this.noOfTasksDone = this.tasksOriginal().filter(t => t.isDone).length;

    // Re-apply search filter immediately if there's an active search
    if (this.searchText.trim() !== '') {
      this.applySearchFilter();
    }
  }

}
