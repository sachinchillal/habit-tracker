import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ApiTask, TaskCreate, Category } from './interfaces';

const API = environment.API_URL + 'habitTracker/';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private httpClient: HttpClient) { }

  // App API Requests
  categoryCreate(category: Category) {
    const body: Record<string, unknown> = {
      title: category.title,
      description: category.description,
    };
    if (category.parentId) {
      body['parentId'] = category.parentId;
    }
    return this.httpClient.post(API + 'category', body);
  }
  categoryUpdate(category: Category) {
    const body = {
      id: category.id,
      title: category.title,
      description: category.description,
      parentId: category.parentId ?? null,
    };
    return this.httpClient.put(API + 'category', body);
  }
  categoryDelete(id: number) {
    return this.httpClient.delete(API + 'category/' + id);
  }
  getCategories() {
    return this.httpClient.get(API + 'category');
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
  getTasks() {
    return this.httpClient.get<{ data: ApiTask[] }>(API + 'task');
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
  pauseTask(id: number) {
    return this.httpClient.put(API + 'task/pause/' + id, {});
  }
  resumeTask(id: number) {
    return this.httpClient.put(API + 'task/resume/' + id, {});
  }
  taskDelete(id: number) {
    return this.httpClient.delete(API + 'task/' + id);
  }

  markTaskCompleted(id: number) {
    return this.httpClient.get(API + 'task/' + id + '/mark');
  }
  markTaskCompletedByTimestamp(id: number, timestamp: number) {
    return this.httpClient.get(API + 'task/' + id + '/mark/' + timestamp);
  }
  getMarks() {
    return this.httpClient.get(API + 'marks');
  }
}
