import { Injectable } from '@angular/core';
import { ApiMarksObject, ApiTask, Category, HabitTag, ViewMode, THEME_TYPE, toApiTask } from './interfaces';
import { environment } from '../../environments/environment';

const LOCAL_STORAGE_KEY = environment.localStorageKey;
const CATEGORIES_KEY = LOCAL_STORAGE_KEY + 'Categories';
const TASKS_KEY = LOCAL_STORAGE_KEY + 'Tasks';
const MARKS_KEY = LOCAL_STORAGE_KEY + 'Marks';
const TAGS_KEY = LOCAL_STORAGE_KEY + 'Tags';
const TODOS_VIEW_KEY = LOCAL_STORAGE_KEY + 'TodosView';
// Also read before Angular boots by the inline theme script in src/index.html
// ('habitTrackerThemeType'); update that script if this key changes.
const THEME_TYPE_KEY = LOCAL_STORAGE_KEY + 'ThemeType';

@Injectable({
  providedIn: 'root'
})
export class StoreService {


  getTodosView(): ViewMode {
    return localStorage.getItem(TODOS_VIEW_KEY) == 'list' ? 'list' : 'board';
  }

  saveTodosView(view: ViewMode): void {
    localStorage.setItem(TODOS_VIEW_KEY, view);
  }
  getThemeType(): THEME_TYPE {
    const value = localStorage.getItem(THEME_TYPE_KEY);
    return value == THEME_TYPE.DARK ? THEME_TYPE.DARK : value == THEME_TYPE.LIGHT ? THEME_TYPE.LIGHT : THEME_TYPE.AUTO;
  }
  saveThemeType(type: THEME_TYPE): void {
    localStorage.setItem(THEME_TYPE_KEY, type);
  }

  getCategories(): Category[] {
    return this.getJSON<Category[]>(CATEGORIES_KEY, []);
  }

  /** Raw API tasks. UI fields are never stored; AppService rebuilds them on every load. */
  getTasks(): ApiTask[] {
    const stored = this.getJSON<ApiTask[]>(TASKS_KEY, []);
    if (!Array.isArray(stored)) return [];
    const tasks = stored.map(toApiTask);
    // Older builds cached UI fields too: rewrite that cache once as raw API data.
    if (tasks.some((task, i) => Object.keys(task).length !== Object.keys(stored[i]).length)) {
      try {
        this.saveTasks(tasks);
      } catch {
        // ignore storage errors; the next fetch rewrites the cache
      }
    }
    return tasks;
  }

  getMarks(): ApiMarksObject {
    return this.getJSON<ApiMarksObject>(MARKS_KEY, {});
  }

  getTags(): HabitTag[] {
    return this.getJSON<HabitTag[]>(TAGS_KEY, []);
  }

  saveCategories(categories: Category[]): void {
    this.setJSON(CATEGORIES_KEY, categories);
  }

  saveTasks(tasks: ApiTask[]): void {
    this.setJSON(TASKS_KEY, tasks.map(toApiTask));
  }

  saveMarks(marks: ApiMarksObject): void {
    this.setJSON(MARKS_KEY, marks);
  }

  saveTags(tags: HabitTag[]): void {
    this.setJSON(TAGS_KEY, tags);
  }

  clearCategories(): void {
    localStorage.removeItem(CATEGORIES_KEY);
  }

  clearTasks(): void {
    localStorage.removeItem(TASKS_KEY);
  }

  clearMarks(): void {
    localStorage.removeItem(MARKS_KEY);
  }

  clearTags(): void {
    localStorage.removeItem(TAGS_KEY);
  }

  clearAll(): void {
    this.clearCategories();
    this.clearTasks();
    this.clearMarks();
    this.clearTags();
  }

  private getJSON<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data) as T;
    } catch {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore storage errors
      }
      return fallback;
    }
  }

  private setJSON(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
