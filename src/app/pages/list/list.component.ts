import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppService } from '../../services/app.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { TOAST_TYPE } from '../../services/interfaces';
import { CheckboxItemComponent } from '../../components/checkbox-item/checkbox-item.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [FormsModule, CommonModule, CheckboxItemComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent implements OnInit {

  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService, private activatedRoute: ActivatedRoute) {
    this.appService.setCurrentPage(this.activatedRoute.snapshot.data['page']);
  }

  ngOnInit(): void {
  }

  /**
   * trackBy function for ngFor to improve performance.
   * @param index - The index of the item.
   * @param task - The task object.
   * @returns The unique ID of the task.
   */
  trackTaskById(index: number, task: any) {
    return task.id;
  }

  /**
   * Toggles the 'completed' status of a specific task.
   * @param {number} id - The ID of the task to toggle.
   */
  handleToggleComplete(id: number) {
    this.appService.isLoading = true;
    this.apiService.markTaskCompleted(id).subscribe({
      next: (response) => {
        this.appService.fetchTrackers();
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
