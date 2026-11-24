import { EventEmitter, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { ACTIONS, ApiMarksObject, ApiTask, INIT_TASK, PAGES, Task, Category, HabitTag } from './interfaces';
import { ApiService } from './api.service';
import { StoreService } from './store.service';
import { AuthService } from './auth.service';
import { orderCategoriesAsTree } from '../utils/category.util';

interface AppEventEmitter {
  action: ACTIONS,
  data: Task | Category | Partial<Category> | HabitTag
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
  readonly tags: HabitTag[] = [];
  tagsMap: { [key: number]: HabitTag } = {};
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
  /** Todos page tag filter: a task shows if it has any of these tags (empty = no filter). */
  selectedTagIds: number[] = [];
  autoClear = true;
  leafOnly = false;

  constructor(private apiService: ApiService, private storeService: StoreService, private authService: AuthService) {
    // AppService is created on every page (header, root component), including the public
    // landing and sign-in pages. Only load habits for a signed-in user; signing in always
    // arrives with a fresh page load (back from SSO, or a reload after another tab signed in).
    if (this.authService.isAuthenticated()) {
      this.initStore();
    }
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
    this.initTags();
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
    const apiTasks = this.storeService.getTasks();
    if (apiTasks.length > 0) {
      this.assignTasks(apiTasks);
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
      case PAGES.HABIT_TAGS:
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
      case PAGES.HABIT_TAGS:
        this.fetchTags();
        break;

      default:
        console.warn('No page found for', this.currentPage);
        break;
    }
  }

  toggleTagFilter(tagId: number) {
    this.selectedTagIds = this.selectedTagIds.includes(tagId)
      ? this.selectedTagIds.filter(id => id !== tagId)
      : [...this.selectedTagIds, tagId];
    this.applySearchFilter();
  }

  clearTagFilter() {
    this.selectedTagIds = [];
    this.applySearchFilter();
  }

  /**
   * Base task list for the current page. The Todos page never shows paused tasks, keeps only
   * tasks with any selected tag, and lists the least recently marked first
   * (returns a new array; tasksOriginal is never re-ordered).
   */
  private visibleTasksForPage(): Task[] {
    const all = this.tasksOriginal();
    if (this.currentPage !== PAGES.TODOS) {
      return all;
    }
    const tagIds = this.selectedTagIds;
    return all
      .filter(t => !t.isPaused && (tagIds.length === 0 || !!t.tagIds?.some(id => tagIds.includes(id))))
      .sort((a, b) => (a.lastUpdatedAt ?? 0) - (b.lastUpdatedAt ?? 0));
  }

  private applySearchFilter() {
    const source = this.visibleTasksForPage();
    this.tasks.length = 0;
    if (this.searchText.trim() === '') {
      this.tasks.push(...source);
    } else {
      const searchLower = this.searchText.toLowerCase();
      const filteredTasks = source.filter(task =>
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
    // Hiding paused tasks and sorting by last mark (oldest first) happen in visibleTasksForPage()
    this.applySearchFilter();
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
    // Tasks may have loaded first: refresh their categoryName from the new categories.
    this.buildUIProps();
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

  // TAGS
  private initTags() {
    const tags = this.storeService.getTags();
    if (tags.length > 0) {
      this.assignTags(tags);
    } else {
      this.fetchTags();
    }
  }

  public fetchTags() {
    this.isLoading = true;
    this.apiService.getTags().subscribe({
      next: (res) => {
        const tags: HabitTag[] = Array.isArray(res.data) ? res.data : [];
        this.storeService.saveTags(tags);
        this.assignTags(tags);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  private assignTags(tags: HabitTag[]): void {
    this.tags.length = 0;
    this.tagsMap = {};
    const active = tags.filter((tag) => tag.isActive !== false);
    active.forEach((tag) => {
      this.tagsMap[tag.id] = tag;
    });
    this.tags.push(...active.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })));

    // Drop filter selections for tags that were deleted or deactivated, so they can't hide tasks unseen.
    const stillValid = this.selectedTagIds.filter((id) => !!this.tagsMap[id]);
    if (stillValid.length !== this.selectedTagIds.length) {
      this.selectedTagIds = stillValid;
      if (this.currentPage === PAGES.TODOS) {
        this.applySearchFilter();
      }
    }
  }

  getTagsForTask(task: { tagIds?: number[] }): HabitTag[] {
    if (!task.tagIds?.length) {
      return [];
    }
    return task.tagIds
      .map((id) => this.tagsMap[id])
      .filter((tag): tag is HabitTag => !!tag);
  }

  habitCountForTag(tagId: number): number {
    return this.tasksOriginal().filter((task) => task.tagIds?.includes(tagId)).length;
  }

  // TASKS
  public fetchTasks() {
    this.isLoading = true;
    this.apiService.getTasks().subscribe({
      next: (res) => {
        // Cache only what the API returned; UI fields are rebuilt in assignTasks on every load.
        const apiTasks: ApiTask[] = res.data ?? [];
        this.storeService.saveTasks(apiTasks);
        if (apiTasks.length > 0) {
          this.eventEmitterStateChanges.emit({ action: STATE_ACTIONS.TASKS_CHANGED });
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private assignTasks(apiTasks: ApiTask[]): void {
    // Fresh UI objects from raw API data; buildUIProps() fills in the UI-only fields.
    const tasks: Task[] = apiTasks.map((task) => ({ ...INIT_TASK, ...task }));
    this.tasks.length = 0; // Clear existing tasks
    this.tasks.push(...tasks);
    this.tasksOriginal.set(tasks);
    this._tasks.set(tasks);
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
    const today = new Date();
    this.tasksOriginal().forEach(task => this.applyTaskUIProps(task, today));
    // Calculate noOfTasksDone from tasksOriginal to get accurate count
    this.noOfTasksDone = this.tasksOriginal().filter(t => t.isDone).length;

    // Rebuild the visible list after any task or marks load: an active search needs re-filtering,
    // and the Todos page needs paused tasks hidden and the order refreshed from new mark times.
    if (this.currentPage === PAGES.TODOS || this.searchText.trim() !== '') {
      this.applySearchFilter();
    }
  }
  /** Recomputes every UI-only field of a task from categories and marks (never from storage). */
  private applyTaskUIProps(task: Task, today: Date) {
    task.categoryName = task.categoryId ? this.categoriesMap[task.categoryId]?.title : undefined;
    // Reset first so a task whose marks were removed doesn't keep its old state
    task.isDone = INIT_TASK.isDone;
    task.lastUpdatedAt = INIT_TASK.lastUpdatedAt;
    task.lastUpdated = INIT_TASK.lastUpdated;
    task.lastUpdatedColor = INIT_TASK.lastUpdatedColor;

    const timestamps = this.marks[task.id];
    if (!timestamps || timestamps.length === 0) {
      return;
    }
    const lastTs = Math.max(...timestamps);
    const lastCreatedAt = new Date(lastTs);
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

}
