import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { INIT_TASK, Task, TOAST_TYPE } from '../../services/interfaces';
import { ApiService } from '../../services/api.service';
import { AppService } from '../../services/app.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class CreateComponent {
  task: Task = { ...INIT_TASK };

  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService) { }

  onSubmit() {
    this.task.title = this.task.title.trim();
    this.task.description = this.task.description.trim();
    if (!this.task.title) {
      this.toastService.showToastAuto('Error', 'Task title is required.', TOAST_TYPE.ERROR);
      return;
    }
    this.appService.isLoading = true;
    this.apiService.createTask(this.task).subscribe({
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

  resetForm() {
    this.task = { ...INIT_TASK };
  }

}
