import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Task } from './interfaces';

const API = environment.API_URL;

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private httpClient: HttpClient) { }

  // App API Requests
  categoryCreate(category: Task) {
    return this.httpClient.post(API + 'habitTracker/category', category);
  }
  categoryUpdate(category: Task) {
    return this.httpClient.put(API + 'habitTracker/category', category);
  }
  categoryDelete(id: number) {
    return this.httpClient.delete(API + 'habitTracker/category/' + id);
  }
  getCategories() {
    return this.httpClient.get(API + 'habitTracker/category');
  }

  taskCreate(task: Task) {
    return this.httpClient.post(API + 'habitTracker/task', task);
  }
  taskUpdate(task: Task) {
    return this.httpClient.put(API + 'habitTracker/task', task);
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
