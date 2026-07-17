import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { TaskCreate, Task, SubcategoryCreate } from './interfaces';

const API = environment.API_URL + 'habitTracker/';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private httpClient: HttpClient) { }

  // App API Requests
  categoryCreate(category: Task) {
    const body = {
      title: category.title,
      description: category.description,
    }
    return this.httpClient.post(API + 'category', body);
  }
  categoryUpdate(category: Task) {
    const body = {
      id: category.id,
      title: category.title,
      description: category.description,
    }
    return this.httpClient.put(API + 'category', body);
  }
  categoryDelete(id: number) {
    return this.httpClient.delete(API + 'category/' + id);
  }
  getCategories() {
    return this.httpClient.get(API + 'category');
  }

  subCategoryCreate(subcategory: SubcategoryCreate) {
    const body = {
      title: subcategory.title,
      description: subcategory.description,
      categoryId: subcategory.categoryId,
    }
    return this.httpClient.post(API + 'category', body);
  }
  subCategoryUpdate(subcategory: SubcategoryCreate) {
    const body = {
      id: subcategory.id,
      title: subcategory.title,
      description: subcategory.description,
      categoryId: subcategory.categoryId,
    }
    return this.httpClient.put(API + 'category', body);
  }

  taskCreate(task: TaskCreate) {
    const body: any = {
      title: task.title,
      description: task.description
    }
    if (task.categoryId) {
      body.categoryId = task.categoryId;
    }
    if (task.weekDays) {
      body.weekDays = task.weekDays;
    }
    return this.httpClient.post(API + 'task', body);
  }
  taskUpdate(task: TaskCreate) {
    const body: any = {
      id: task.id,
      title: task.title,
      description: task.description
    }
    if (task.categoryId) {
      body.categoryId = task.categoryId;
    }
    if (task.weekDays) {
      body.weekDays = task.weekDays;
    }
    return this.httpClient.put(API + 'task', body);
  }
  taskDelete(id: number) {
    return this.httpClient.delete(API + 'task/' + id);
  }
  getTasks() {
    return this.httpClient.get(API + 'task');
  }

  markTaskCompleted(id: number) {
    return this.httpClient.get(API + 'check/' + id);
  }
  markTaskCompletedByTimestamp(id: number, timestamp: number) {
    return this.httpClient.get(API + 'check/' + id + "/" + timestamp);
  }
  getTrackers() {
    return this.httpClient.get(API + 'trackers');
  }
  pauseTask(id: number) {
    return this.httpClient.put(API + 'pause/' + id, {});
  }
  resumeTask(id: number) {
    return this.httpClient.put(API + 'resume/' + id, {});
  }
}
