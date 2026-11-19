import { Injectable } from '@angular/core';
import { ApiMarksObject, Task, Category, ViewMode, THEME_TYPE } from './interfaces';
import { environment } from '../../environments/environment';

const LOCAL_STORAGE_KEY = environment.localStorageKey;
const CATEGORIES_KEY = LOCAL_STORAGE_KEY + 'Categories';
const TASKS_KEY = LOCAL_STORAGE_KEY + 'Tasks';
const MARKS_KEY = LOCAL_STORAGE_KEY + 'Marks';
const TODOS_VIEW_KEY = LOCAL_STORAGE_KEY + 'TodosView';
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

  getTasks(): Task[] {
    return this.getJSON<Task[]>(TASKS_KEY, []);
  }

  getMarks(): ApiMarksObject {
    return this.getJSON<ApiMarksObject>(MARKS_KEY, {});
  }

  saveCategories(categories: Category[]): void {
    this.setJSON(CATEGORIES_KEY, categories);
  }

  saveTasks(tasks: Task[]): void {
    this.setJSON(TASKS_KEY, tasks);
  }

  saveMarks(marks: ApiMarksObject): void {
    this.setJSON(MARKS_KEY, marks);
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

  clearAll(): void {
    this.clearCategories();
    this.clearTasks();
    this.clearMarks();
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
