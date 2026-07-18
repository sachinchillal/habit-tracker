import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppService } from '../../services/app.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Task, TOAST_TYPE } from '../../services/interfaces';
import { CheckboxItemComponent } from '../../components/checkbox-item/checkbox-item.component';
import { ActivatedRoute } from '@angular/router';

interface GroupedCategoryVm {
  id: number;
  title: string;
  tasks: Task[];
}

@Component({
  selector: 'app-grouped-todos',
  standalone: true,
  imports: [FormsModule, CommonModule, CheckboxItemComponent],
  templateUrl: './grouped-todos.component.html',
  styleUrl: './grouped-todos.component.scss'
})
export class GroupedTodosComponent implements OnInit {
  groupedTasks: GroupedCategoryVm[] = [];

  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService, private activatedRoute: ActivatedRoute) {
    this.appService.setCurrentPage(this.activatedRoute.snapshot.data['page']);
  }

  ngOnInit(): void {
    this.buildGroupedTasks();
  }
  private buildGroupedTasks() {
    const uncategorized: GroupedCategoryVm = { id: 0, title: 'Uncategorized', tasks: [] };
    const categoriesMap: { [key: number]: GroupedCategoryVm } = {};
    this.appService.tasks.forEach(task => {
      const categoryId = task.categoryId;
      if (categoryId) {
        if (categoriesMap[categoryId]) {
          categoriesMap[categoryId].tasks.push(task);
        } else {
          const category = this.appService.categoriesMap[categoryId];
          if (category) {
            categoriesMap[categoryId] = { id: category.id, title: category.title, tasks: [task] };
          } else {
            uncategorized.tasks.push(task);
          }
        }
      } else {
        uncategorized.tasks.push(task);
      }
    });

    this.groupedTasks = Object.values(categoriesMap);
    if (uncategorized.tasks.length > 0) {
      this.groupedTasks.unshift(uncategorized);
    }
  }

  /**
   * trackBy function for ngFor to improve performance.
   * @param index - The index of the item.
   * @param task - The task object.
   * @returns The unique ID of the task.
   */
  trackTaskById(index: number, task: Task) {
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
      }
    });
  }

  /**
   * Get the number of completed tasks in a category
   * @param tasks - Array of tasks
   * @returns Number of completed tasks
   */
  getCompletedCount(tasks: Task[]): number {
    return tasks.filter(task => task.isDone).length;
  }

  /**
   * Get the completion percentage for a category
   * @param tasks - Array of tasks
   * @returns Completion percentage (0-100)
   */
  getCompletionPercentage(tasks: Task[]): number {
    if (tasks.length === 0) return 0;
    const completed = this.getCompletedCount(tasks);
    return Math.round((completed / tasks.length) * 100);
  }

  /**
   * Get the progress dash array for the circular progress indicator
   * @param tasks - Array of tasks
   * @returns Dash array string for SVG
   */
  getProgressDashArray(tasks: Task[]): string {
    const circumference = 2 * Math.PI * 15.9155; // radius = 15.9155
    return `${circumference} ${circumference}`;
  }

  /**
   * Get the progress dash offset for the circular progress indicator
   * @param tasks - Array of tasks
   * @returns Dash offset for SVG
   */
  getProgressDashOffset(tasks: Task[]): string {
    const circumference = 2 * Math.PI * 15.9155; // radius = 15.9155
    const percentage = this.getCompletionPercentage(tasks);
    return `${circumference - (percentage / 100) * circumference}`;
  }

  /**
   * Get category color based on index
   * @param index - Category index
   * @param isGradient - Whether to return gradient classes
   * @returns CSS classes for category color
   */
  getCategoryColor(index: number, isGradient: boolean = false): string {
    const colors = [
      'bg-gradient-to-r from-blue-500 to-blue-600',
      'bg-gradient-to-r from-purple-500 to-purple-600',
      'bg-gradient-to-r from-green-500 to-green-600',
      'bg-gradient-to-r from-orange-500 to-orange-600',
      'bg-gradient-to-r from-pink-500 to-pink-600',
      'bg-gradient-to-r from-indigo-500 to-indigo-600',
      'bg-gradient-to-r from-teal-500 to-teal-600',
      'bg-gradient-to-r from-red-500 to-red-600'
    ];

    const colorIndex = index % colors.length;
    return colors[colorIndex];
  }

}
