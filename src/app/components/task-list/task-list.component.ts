import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from '../../services/app.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ACTIONS, Task } from '../../services/interfaces';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent {
  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService) { }

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
  handleEdit(task: Task) {
    this.appService.eventEmitter.emit({ action: ACTIONS.EDIT_TASK, data: task });
  }
}
