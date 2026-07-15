import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { TaskCreate, Task } from './interfaces';

const API = environment.API_URL;

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
    return this.httpClient.post(API + 'habitTracker/category', body);
  }
  categoryUpdate(category: Task) {
    const body = {
      id: category.id,
      title: category.title,
      description: category.description,
    }
    return this.httpClient.put(API + 'habitTracker/category', body);
  }
  categoryDelete(id: number) {
    return this.httpClient.delete(API + 'habitTracker/category/' + id);
  }
  getCategories() {
    return this.httpClient.get(API + 'habitTracker/category');
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
    return this.httpClient.post(API + 'habitTracker/task', body);
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
    return this.httpClient.put(API + 'habitTracker/task', body);
  }
  taskDelete(id: number) {
    return this.httpClient.delete(API + 'habitTracker/task/' + id);
  }
  getTasks() {
    return this.httpClient.get(API + 'habitTracker/task');
  }

  markTaskCompleted(id: number) {
    return this.httpClient.get(API + 'habitTracker/check/' + id);
  }
  markTaskCompletedByTimestamp(id: number, timestamp: number) {
    return this.httpClient.get(API + 'habitTracker/check/' + id + "/" + timestamp);
  }
  getTrackers() {
    return this.httpClient.get(API + 'habitTracker/trackers');
  }
  pauseTask(id: number) {
    return this.httpClient.put(API + 'habitTracker/pause/' + id, {});
  }
  resumeTask(id: number) {
    return this.httpClient.put(API + 'habitTracker/resume/' + id, {});
  }
}
