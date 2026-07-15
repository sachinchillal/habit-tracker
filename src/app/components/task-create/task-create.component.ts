import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { ApiService } from '../../services/api.service';
import {
  ACTIONS,
  INIT_TASK_CREATE,
  TaskCreate,
  TOAST_TYPE,
  WeekDay,
  WeekDayPreset,
  formatSelectedWeekDays,
  shouldOmitWeekDaysFromApi,
  WEEK_DAY_OPTIONS,
  weekDaysForPreset,
} from '../../services/interfaces';
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
  task: TaskCreate = { ...INIT_TASK_CREATE };
  readonly weekDayOptions = WEEK_DAY_OPTIONS;

  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService) { }

  ngOnInit() {
    this.appService.eventEmitter.subscribe((event) => {
      if (event.action === ACTIONS.EDIT_TASK) {
        const data = event.data as TaskCreate;
        this.task = {
          ...data,
          weekDays: data.weekDays?.length ? [...data.weekDays] : [],
        };
      }
    });
  }

  get selectedDaysSummary(): string {
    return formatSelectedWeekDays(this.task.weekDays);
  }

  isWeekDaySelected(day: WeekDay): boolean {
    return (this.task.weekDays ?? []).includes(day);
  }

  toggleWeekDay(day: WeekDay): void {
    const current = [...(this.task.weekDays ?? [])];
    const index = current.indexOf(day);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(day);
      current.sort((a, b) => a - b);
    }
    this.task.weekDays = current;
  }

  setWeekDays(days: WeekDay[]): void {
    this.task.weekDays = [...days].sort((a, b) => a - b);
  }

  selectAllDays(): void {
    this.task.weekDays = [];
  }

  applyWeekDayPreset(preset: WeekDayPreset): void {
    this.setWeekDays(weekDaysForPreset(preset));
  }

  onSubmit() {
    this.task.title = this.task.title.trim();
    this.task.description = this.task.description.trim();
    if (!this.task.title) {
      this.toastService.showToastAuto('Error', 'Task title is required.', TOAST_TYPE.ERROR);
      return;
    }
    const payload = this.buildPayload();
    this.appService.isLoading = true;
    if (this.task.id) {
      this.apiService.taskUpdate(payload).subscribe({
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
          this.appService.isLoading = false;
        }
      });
    } else {
      this.apiService.taskCreate(payload).subscribe({
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
          this.appService.isLoading = false;
        }
      });
    }
  }

  resetForm() {
    this.task = { ...INIT_TASK_CREATE };
  }

  private buildPayload(): TaskCreate {
    const payload: TaskCreate = {
      ...this.task,
      title: this.task.title,
      description: this.task.description,
    };
    if (this.task.categoryId) {
      payload.categoryId = +this.task.categoryId;
    }
    if (!shouldOmitWeekDaysFromApi(this.task.weekDays)) {
      payload.weekDays = [...(this.task.weekDays ?? [])];
    } else {
      delete payload.weekDays;
    }
    return payload;
  }
}
