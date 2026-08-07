import { EventEmitter, Injectable } from '@angular/core';
import { ACTIONS, ApiMarksObject, ApiTask, INIT_TASK, PAGES, Task, Category } from './interfaces';
import { ApiService } from './api.service';

const LOCAL_STORAGE_KEY = 'habitTracker';
interface LocalStorageData {
  categories: Category[];
  tasks: Task[];
  marks: ApiMarksObject;
}
interface AppEventEmitter {
  action: ACTIONS,
  data: Task | Category | Partial<Category>
}

@Injectable({
  providedIn: 'root'
})
export class AppService {
  isLoading: boolean = false;

  readonly categories: Category[] = [];
  readonly tasks: Task[] = [];
  readonly tasksOriginal: Task[] = [];
  noOfTasksDone: number = 0;
  marks: ApiMarksObject = {};
  tasksMap: { [key: number]: Task } = {};
  categoriesMap: { [key: number]: Category } = {};

  eventEmitter = new EventEmitter<AppEventEmitter>();
  /** Fired when tasks or marks are reassigned so views can rebuild derived UI. */
  habitsDataChanged = new EventEmitter<void>();

  currentPage: PAGES = PAGES.HOME;

  date: string = '';
  time: string = '';
  searchText: string = '';

  constructor(private apiService: ApiService) {
    this.initStore();
  }
  private initStore() {
    const d = this.getLocalStorage();
    if (d.categories && d.categories.length > 0) {
      this.assignCategories(d.categories);
    } else {
      this.fetchCategories();
    }
    if (d.tasks && d.tasks.length > 0) {
      this.assignTasks(d.tasks);
    } else {
      this.fetchTasks();
    }
    if (d.marks && Object.keys(d.marks).length > 0) {
      this.assignMarks(d.marks);
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
        this.fetchTrackers();
        break;
      case PAGES.CREATE_HABIT:
        this.fetchTasks();
        break;
      case PAGES.TODOS:
        this.fetchTasks();
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
      this.tasks.push(...this.tasksOriginal);
    } else {
      const searchLower = this.searchText.toLowerCase();
      const filteredTasks = this.tasksOriginal.filter(task =>
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
    const todoTasksOriginal = this.tasksOriginal.filter(task => !task.isDone);
    const combinedTasksOriginal = todoTasksOriginal.concat(this.tasksOriginal.filter(task => task.isDone)).filter(t => !t.isPaused);
    combinedTasksOriginal.sort((a, b) => (a.lastUpdatedAt - b.lastUpdatedAt));
    this.tasksOriginal.length = 0;
    this.tasksOriginal.push(...combinedTasksOriginal);

    // Then apply search filter if active, otherwise use all tasksOriginal
    if (this.searchText.trim() !== '') {
      this.applySearchFilter();
    } else {
      this.tasks.length = 0;
      this.tasks.push(...this.tasksOriginal);
    }
  }
  private rearrangeTasksForPageHabitList() {
    // show all tasks
    this.tasks.sort((a, b) => a.id - b.id);

    this.tasksOriginal.sort((a, b) => a.id - b.id);
  }


  // CATEGORIES
  public fetchCategories() {
    this.isLoading = true;
    this.apiService.getCategories().subscribe({
      next: (tasks: any) => {
        this.saveCategories(tasks.data);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
      },
    });
  }

  public saveCategories(categories: Category[]): void {
    this.assignCategories(categories);
    const d = this.getLocalStorage();
    d.categories = this.categories;
    this.saveToLocalStorage(d);
  }
  private assignCategories(categories: Category[]): void {
    this.categories.length = 0; // Clear existing categories
    this.categoriesMap = {}; // Reset the category map
    categories.forEach(c => {
      this.categoriesMap[c.id] = c;
    });
    // Depth-first tree order so parents appear above their children
    this.categories.push(...this.orderCategoriesAsTree(categories));
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
    return this.orderCategoriesAsTree(this.categories.filter(c => !excluded.has(c.id)));
  }

  private orderCategoriesAsTree(categories: Category[]): Category[] {
    const byParent = new Map<number | null, Category[]>();
    for (const c of categories) {
      const key = c.parentId ?? null;
      const group = byParent.get(key) ?? [];
      group.push(c);
      byParent.set(key, group);
    }
    for (const group of byParent.values()) {
      group.sort((a, b) => a.title.localeCompare(b.title));
    }
    const result: Category[] = [];
    const visit = (parentId: number | null) => {
      const children = byParent.get(parentId) ?? [];
      for (const child of children) {
        result.push(child);
        visit(child.id);
      }
    };
    visit(null);
    // Orphans whose parent is missing from the list
    if (result.length < categories.length) {
      const seen = new Set(result.map(c => c.id));
      for (const c of categories) {
        if (!seen.has(c.id)) {
          result.push(c);
        }
      }
    }
    return result;
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
            : undefined,
        }));
        this.saveTasks(_tasks);
        this.isLoading = false;
      },
      error: () => {
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
    this.tasksOriginal.length = 0; // Clear existing original tasks
    this.tasksOriginal.push(...tasks);
    this.tasksMap = {}; // Reset the task map
    this.tasks.forEach(task => {
      // Initialize the task map for quick access
      this.tasksMap[task.id] = task;
    });
    this.buildUIProps();
    this.habitsDataChanged.emit();
  }
  //  MARKS
  public fetchTrackers() {
    this.isLoading = true;
    this.apiService.getMarks().subscribe({
      next: (res) => {
        this.saveMarks(res.data ?? {});
        this.setCurrentPage(this.currentPage); // to rearrange tasks if on todos page
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching marks:', error);
        this.isLoading = false;
      }
    });
  }
  public saveMarks(marks: ApiMarksObject): void {
    this.assignMarks(marks);
    const d = this.getLocalStorage();
    d.marks = this.marks;
    this.saveToLocalStorage(d);
  }
  private assignMarks(marks: ApiMarksObject): void {
    this.marks = marks ?? {};
    this.buildUIProps();
    this.habitsDataChanged.emit();
  }
  // UI Properties
  private buildUIProps() {
    this.buildUIPropsForTasks();
  }
  private buildUIPropsForTasks() {
    // Update tasksOriginal to ensure all tasks are updated, not just filtered ones
    this.tasksOriginal.forEach(task => {
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
    this.noOfTasksDone = this.tasksOriginal.filter(t => t.isDone).length;

    // Re-apply search filter immediately if there's an active search
    if (this.searchText.trim() !== '') {
      this.applySearchFilter();
    }
  }

  // Storage Management

  private getLocalStorage(): LocalStorageData {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : { tasks: [], marks: {}, categories: [] };
  }
  private saveToLocalStorage(d: LocalStorageData): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(d));
  }
}
