import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TOAST_TYPE } from '../../services/interfaces';
import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { ApiService } from '../../services/api.service';
import { AppService } from '../../services/app.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-checkbox-item',
  standalone: true,
  imports: [CommonModule, MarkdownPipe],
  templateUrl: './checkbox-item.component.html',
  styleUrl: './checkbox-item.component.scss'
})
export class CheckboxItemComponent {
  @Input() task!: Task;
  @Input() index!: number;
  @Input() isVisibleBorder: boolean = false;
  @Input() compact = false;

  @Output() toggleComplete = new EventEmitter<number>();

  isDetailsOpen = false;
  isUnmarkConfirmOpen = false;
  isUnmarking = false;
  isMarkingAgain = false;

  constructor(
    private apiService: ApiService,
    private appService: AppService,
    private toastService: ToastService
  ) { }

  onToggleComplete() {
    this.toggleComplete.emit(this.task.id);
  }

  openDetails(event?: Event) {
    event?.stopPropagation();
    this.isDetailsOpen = true;
  }

  closeDetails() {
    this.closeUnmarkConfirm();
    this.isDetailsOpen = false;
  }

  markAgain() {
    if (this.isMarkingAgain) {
      return;
    }
    this.isMarkingAgain = true;
    this.appService.isLoading = true;
    let timestamp = 0;
    if (this.appService.date && this.appService.time) {
      timestamp = new Date(this.appService.date + ' ' + this.appService.time).getTime();
    }
    const apiCall = timestamp > 0
      ? this.apiService.markTaskCompletedByTimestamp(this.task.id, timestamp, true)
      : this.apiService.markTaskCompleted(this.task.id, true);
    apiCall.subscribe({
      next: () => {
        this.isMarkingAgain = false;
        this.appService.fetchTrackers();
      },
      error: (error) => {
        this.isMarkingAgain = false;
        this.appService.isLoading = false;
        if (error.error && error.error.message) {
          this.toastService.showToastAuto('Error', error.error.message, TOAST_TYPE.ERROR);
        } else {
          this.toastService.showToastAuto('Error', 'An unknown error occurred.', TOAST_TYPE.ERROR);
        }
      }
    });
  }

  openUnmarkConfirm() {
    if (!this.task.lastUpdatedAt) {
      return;
    }
    this.isUnmarkConfirmOpen = true;
  }

  closeUnmarkConfirm() {
    if (this.isUnmarking) {
      return;
    }
    this.isUnmarkConfirmOpen = false;
  }

  confirmUnmark() {
    if (!this.task.lastUpdatedAt || this.isUnmarking) {
      return;
    }
    this.isUnmarking = true;
    this.appService.isLoading = true;
    this.apiService.unmarkTaskCompletedByTimestamp(this.task.id, this.task.lastUpdatedAt).subscribe({
      next: () => {
        this.isUnmarking = false;
        this.isUnmarkConfirmOpen = false;
        this.appService.fetchTrackers();
      },
      error: (error) => {
        this.isUnmarking = false;
        this.appService.isLoading = false;
        if (error.error && error.error.message) {
          this.toastService.showToastAuto('Error', error.error.message, TOAST_TYPE.ERROR);
        } else {
          this.toastService.showToastAuto('Error', 'An unknown error occurred.', TOAST_TYPE.ERROR);
        }
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.isUnmarkConfirmOpen) {
      this.closeUnmarkConfirm();
      return;
    }
    if (this.isDetailsOpen) {
      this.closeDetails();
    }
  }
}
