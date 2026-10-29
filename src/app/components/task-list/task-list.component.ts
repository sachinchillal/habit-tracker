import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from '../../services/app.service';
import { SearchBoxComponent } from '../search-box/search-box.component';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ACTIONS, Task } from '../../services/interfaces';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, SearchBoxComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent {
  tasks: Task[] = [];

  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService) { }

  ngOnInit() {
    this.tasks = this.appService.tasksOriginal;
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

  private applySearchFilter() {
    this.tasks = this.appService.searchText.trim() === '' ? this.appService.tasksOriginal :
      this.appService.tasksOriginal.filter(task => {
        const searchKey = this.appService.searchText.toLowerCase();
        return task.title.toLowerCase().includes(searchKey) ||
          (task.description && task.description.toLowerCase().includes(searchKey)) ||
          (task.categoryName && task.categoryName.toLowerCase().includes(searchKey));
      });
  }
  /**
   * trackBy function for ngFor to improve performance.
   * @param index - The index of the item.
   * @param task - The task object.
   * @returns The unique ID of the task.
   */
  trackCategoryById(index: number, task: any) {
    return task.id;
  }
  handleDelete(task: Task) {
    this.appService.isLoading = true;
    this.apiService.taskDelete(task.id).subscribe({
      next: (response) => {
        this.appService.isLoading = false;
        this.toastService.showToastAuto('Success', 'Task deleted successfully.', 'success');
        this.appService.fetchTasks();
      },
      error: (error) => {
        this.appService.isLoading = false;
        if (error.error && error.error.message) {
          this.toastService.showToastAuto('Error', error.error.message, 'error');
        } else {
          this.toastService.showToastAuto('Error', 'An unknown error occurred.', 'error');
        }
      },
    });
  }
  handlePause(task: Task) {
    this.apiService.pauseTask(task.id).subscribe({
      next: (response) => {
        this.toastService.showToastAuto('Success', 'Task paused successfully.', 'success');
        this.appService.fetchTasks();
      },
      error: (error) => {
        if (error.error && error.error.message) {
          this.toastService.showToastAuto('Error', error.error.message, 'error');
        } else {
          this.toastService.showToastAuto('Error', 'An unknown error occurred.', 'error');
        }
      },
    });
  }
  handleResume(task: Task) {
    this.apiService.resumeTask(task.id).subscribe({
      next: (response) => {
        this.toastService.showToastAuto('Success', 'Task resumed successfully.', 'success');
        this.appService.fetchTasks();
      },
      error: (error) => {
        if (error.error && error.error.message) {
          this.toastService.showToastAuto('Error', error.error.message, 'error');
        } else {
          this.toastService.showToastAuto('Error', 'An unknown error occurred.', 'error');
        }
      },
    });
  }
  handleEdit(task: Task) {
    this.appService.eventEmitter.emit({ action: ACTIONS.EDIT_TASK, data: task });
  }
}
