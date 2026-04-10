import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppService } from '../../services/app.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { TOAST_TYPE } from '../../services/interfaces';
import { Category } from '../../services/interfaces';
import { CheckboxItemComponent } from '../../components/checkbox-item/checkbox-item.component';
import { KanbanBoardComponent } from '../../components/kanban-board/kanban-board.component';
import { ActivatedRoute } from '@angular/router';

const TODOS_VIEW_STORAGE_KEY = 'habit-tracker-todos-view';

export interface CategoryCount {
  id: number | 'uncategorized';
  title: string;
  count: number;
}

interface QuickSelection {
  label: string;
  date: string;
  time: string;
}

@Component({
  selector: 'app-todos',
  standalone: true,
  imports: [FormsModule, CommonModule, CheckboxItemComponent, KanbanBoardComponent],
  templateUrl: './todos.component.html',
  styleUrl: './todos.component.scss'
})
export class TodosComponent implements OnInit {
  viewMode: 'list' | 'board' = 'list';
  showCategoriesModal = false;
  showQuickSelectionModal = false;
  private readonly validViewModes: ('list' | 'board')[] = ['list', 'board'];
  scrollToColumnId: number | 'uncategorized' | null = null;
  quickSelections: QuickSelection[] = [];

  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService, private activatedRoute: ActivatedRoute) {
    this.appService.setCurrentPage(this.activatedRoute.snapshot.data['page']);
  }

  /** Categories with task count (matches kanban columns: uncategorized + each category). */
  get categoryCounts(): CategoryCount[] {
    const result: CategoryCount[] = [];
    const uncategorized = this.appService.tasks.filter(
      t => !t.categoryId || !this.appService.categoriesMap[t.categoryId]
    );
    if (uncategorized.length > 0 || this.appService.categories.length === 0) {
      result.push({ id: 'uncategorized', title: 'Uncategorized', count: uncategorized.length });
    }
    this.appService.categories.forEach((cat: Category) => {
      const count = this.appService.tasks.filter(t => t.categoryId === cat.id && !t.isPaused).length;
      result.push({ id: cat.id, title: cat.title, count });
    });
    return result;
  }

  openCategoriesModal(): void {
    this.showCategoriesModal = true;
  }

  closeCategoriesModal(): void {
    this.showCategoriesModal = false;
  }

  onSelectCategory(id: number | 'uncategorized'): void {
    this.closeCategoriesModal();
    this.setViewMode('board');
    this.scrollToColumnId = id;
    setTimeout(() => {
      this.scrollToColumnId = null;
    }, 500);
  }

  openQuickSelectionModal(): void {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const times = ['05:00', '07:00', '09:00', '12:00', '15:00', '18:00', '21:00', '23:00'];

    this.quickSelections = times.map(time => ({
      label: `${dateStr} @ ${time}`,
      date: dateStr,
      time
    }));

    this.showQuickSelectionModal = true;
  }

  closeQuickSelectionModal(): void {
    this.showQuickSelectionModal = false;
  }

  applyQuickSelection(selection: QuickSelection): void {
    this.appService.date = selection.date;
    this.appService.time = selection.time;
    this.closeQuickSelectionModal();
  }

  ngOnInit(): void {
    const stored = localStorage.getItem(TODOS_VIEW_STORAGE_KEY);
    if (stored && this.validViewModes.includes(stored as 'list' | 'board')) {
      this.viewMode = stored as 'list' | 'board';
    }
  }

  setViewMode(mode: 'list' | 'board'): void {
    this.viewMode = mode;
    localStorage.setItem(TODOS_VIEW_STORAGE_KEY, mode);
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
    console.log('handleToggleComplete', id);
    console.log('appService.tasks', this.appService.date, this.appService.time);
    this.appService.isLoading = true;
    let timestamp = 0;
    if (this.appService.date && this.appService.time) {
      timestamp = new Date(this.appService.date + " " + this.appService.time).getTime();
    }
    console.log('timestamp', timestamp);
    const apiCall = timestamp > 0 ? this.apiService.markTaskCompletedByTimestamp(id, timestamp) : this.apiService.markTaskCompleted(id);
    // return;
    apiCall.subscribe({
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
