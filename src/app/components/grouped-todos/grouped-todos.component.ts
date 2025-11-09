import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppService } from '../../services/app.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Category, INIT_CATEGORY, PAGES, TOAST_TYPE } from '../../services/interfaces';
import { CheckboxItemComponent } from '../checkbox-item/checkbox-item.component';

@Component({
  selector: 'app-grouped-todos',
  standalone: true,
  imports: [FormsModule, CommonModule, CheckboxItemComponent],
  templateUrl: './grouped-todos.component.html',
  styleUrl: './grouped-todos.component.scss'
})
export class GroupedTodosComponent implements OnInit {
  groupedTasks: Category[] = [];

  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService) { }

  ngOnInit(): void {
    this.buildGroupedTasks();
  }
  private buildGroupedTasks() {
    const uncategorized: Category = { ...INIT_CATEGORY };
    uncategorized.tasks = [];
    const categoriesMap: { [key: number]: Category } = {};
    this.appService.tasks.forEach(task => {
      const categoryId = task.categoryId;
      if (categoryId) {
        if (categoriesMap[categoryId]) {
          if (categoriesMap[categoryId].tasks) {
            categoriesMap[categoryId].tasks.push(task);
          } else {
            categoriesMap[categoryId].tasks = [task];
          }
        } else {
          if(this.appService.categoriesMap[categoryId]) {
            categoriesMap[categoryId] = {...this.appService.categoriesMap[categoryId]};
            categoriesMap[categoryId].tasks = [task];
          } else {
            console.log('Category not found for ID:', categoryId);
            uncategorized.tasks.push(task);
          }
        }
      } else {
        uncategorized.tasks.push(task);
      }
    });
    console.log(categoriesMap)

    this.groupedTasks = Object.values(categoriesMap);
    if (uncategorized.tasks.length > 0) {
      uncategorized.title = 'Uncategorized';
      this.groupedTasks.unshift(uncategorized);
    }
  }
  ut_refreshTask() {
    this.appService.fetchTasks();
    // Rebuild grouped tasks after fetching
    setTimeout(() => {
      this.buildGroupedTasks();
    }, 100);
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
        // Rebuild grouped tasks after toggling
        setTimeout(() => {
          this.buildGroupedTasks();
        }, 100);
      },
      error: (error) => {
        if (error.error && error.error.message) {
          this.toastService.showToastAuto('Error', error.error.message, TOAST_TYPE.ERROR);
        } else {
          this.toastService.showToastAuto('Error', 'An unknown error occurred.', TOAST_TYPE.ERROR);
        }
        this.appService.isLoading = false;
      },
      complete: () => {
        this.appService.isLoading = false;
      }
    });
  }

}
