import { Injectable } from '@angular/core';
import { Toast, ToastType } from './interfaces';


@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private nextId = 1;

  toasts: Toast[] = [];

  constructor() { }

  showToastAuto(message: string, body: string, type: ToastType, duration: number = 5000) {
    this.showToast(message, body, type, duration);
  }
  showToast(message: string, body: string, type: ToastType, duration?: number) {
    const toast: Toast = {
      id: this.nextId++,
      message,
      body,
      type,
      duration,
      isDeleted: false
    };
    this.toasts.push(toast);
    // Automatically remove the toast after the duration
    if (duration) {

      setTimeout(() => { toast.isDeleted = true; }, duration);
      setTimeout(() => this.removeToast(toast.id), duration + 500);
    }
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }
}
