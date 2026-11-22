import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ApiMarksObject, ApiTask, TaskCreate, Category, HabitTag, TagWrite } from './interfaces';

const API = `${environment.api.baseUrl}${environment.api.habitTracker}`;
/** Shared awb auth routes (the same backend SSO uses). */
const AUTH_API = `${environment.api.baseUrl}auth/`;

export interface UserInfoResponse {
  data?: unknown;
  message?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private httpClient: HttpClient) { }

  // Auth: 403 when the SSO session was revoked or the token is invalid.
  getUserInfo() {
    return this.httpClient.get<UserInfoResponse>(AUTH_API + 'userinfo');
  }

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
    // An empty list clears tags. Omitting the field leaves them unchanged.
    if (task.tagIds !== undefined) {
      body.tagIds = task.tagIds;
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
    // An empty list clears tags. Omitting the field leaves them unchanged.
    if (task.tagIds !== undefined) {
      body.tagIds = task.tagIds;
    }
    return this.httpClient.put(API + 'task', body);
  }
  pauseTask(id: number) {
    return this.httpClient.put(API + `task/${id}/pause`, {});
  }
  resumeTask(id: number) {
    return this.httpClient.put(API + `task/${id}/resume`, {});
  }
  taskDelete(id: number) {
    return this.httpClient.delete(API + `task/${id}`);
  }

  markTaskCompleted(id: number, multiple = false) {
    const options = multiple ? { params: { multiple: 'true' } } : {};
    return this.httpClient.get(API + `task/${id}/mark`, options);
  }
  markTaskCompletedByTimestamp(id: number, timestamp: number, multiple = false) {
    const options = multiple ? { params: { multiple: 'true' } } : {};
    return this.httpClient.get(API + `task/${id}/mark/${timestamp}`, options);
  }
  unmarkTaskCompletedByTimestamp(id: number, timestamp: number) {
    return this.httpClient.get(API + `task/${id}/unmark/${timestamp}`);
  }
  getMarks() {
    return this.httpClient.get<{ data: ApiMarksObject }>(API + 'marks');
  }

  getTags() {
    return this.httpClient.get<{ data: HabitTag[] }>(API + 'tags');
  }
  tagCreate(tag: TagWrite) {
    const body: any = {
      name: tag.name,
      description: tag.description,
      color: tag.color,
    }
    if (!tag.description) {
      delete body.description;
    }
    return this.httpClient.post<{ data: HabitTag }>(API + 'tags', body);
  }
  tagUpdate(id: number, tag: TagWrite) {
    return this.httpClient.put<{ data: HabitTag }>(API + `tags/${id}`, {
      name: tag.name,
      description: tag.description,
      color: tag.color,
    });
  }
  tagDelete(id: number) {
    return this.httpClient.delete(API + `tags/${id}`);
  }
}
