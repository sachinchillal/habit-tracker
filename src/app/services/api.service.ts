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
  getTasks() {
    return this.httpClient.get(API + 'habitTracker/task');
  }
  createTask(task: Task) {
    return this.httpClient.post(API + 'habitTracker/task', task);
  }
  markTaskCompleted(id: number) {
    return this.httpClient.get(API + 'habitTracker/check/' + id);
  }
  getTrackers() {
    return this.httpClient.get(API + 'habitTracker/trackers');
  }
}
