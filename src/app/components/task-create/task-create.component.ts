import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { ApiService } from '../../services/api.service';
import { ACTIONS, INIT_TASK, Task, TOAST_TYPE } from '../../services/interfaces';
import { AppService } from '../../services/app.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-create.component.html',
  styleUrl: './task-create.component.scss'
})
export class TaskCreateComponent implements OnInit {
  task: Task = { ...INIT_TASK };

  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService) { }

  ngOnInit() {
    this.appService.eventEmitter.subscribe((event) => {
      if (event.action === ACTIONS.EDIT_TASK) {
        this.task = { ...event.data };
      }
    });
  }

  onSubmit() {
    this.task.title = this.task.title.trim();
    this.task.description = this.task.description.trim();
    if (!this.task.title) {
      this.toastService.showToastAuto('Error', 'Task title is required.', TOAST_TYPE.ERROR);
      return;
    }
    this.appService.isLoading = true;
    if (this.task.categoryId) {
      this.task.categoryId = +this.task.categoryId;
    }
    if (this.task.id) {
      this.apiService.taskUpdate(this.task).subscribe({
        next: (response) => {
          this.resetForm();
          this.toastService.showToastAuto('Success', 'Task updated successfully.', TOAST_TYPE.SUCCESS);
          this.appService.fetchTasks();
        },
        error: (error) => {
          if (error.error && error.error.message) {
            this.toastService.showToastAuto('Error', error.error.message, TOAST_TYPE.ERROR);
          } else {
            this.toastService.showToastAuto('Error', 'An unknown error occurred.', TOAST_TYPE.ERROR);
          }
        },
        complete: () => {
          this.appService.isLoading = false;
        }
      });
    } else {
      this.apiService.taskCreate(this.task).subscribe({
        next: (response) => {
          this.resetForm();
          this.toastService.showToastAuto('Success', 'Task created successfully.', TOAST_TYPE.SUCCESS);
          this.appService.fetchTasks();
        },
        error: (error) => {
          if (error.error && error.error.message) {
            this.toastService.showToastAuto('Error', error.error.message, TOAST_TYPE.ERROR);
          } else {
            this.toastService.showToastAuto('Error', 'An unknown error occurred.', TOAST_TYPE.ERROR);
          }
        },
        complete: () => {
          this.appService.isLoading = false;
        }
      });
    }
  }

  resetForm() {
    this.task = { ...INIT_TASK };
  }
}
