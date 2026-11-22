import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import {
  ACTIONS,
  Category,
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
import { TagChipsComponent } from '../tag-chips/tag-chips.component';

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TagChipsComponent],
  templateUrl: './task-create.component.html',
  styleUrl: './task-create.component.scss'
})
export class TaskCreateComponent implements OnInit {
  task: TaskCreate = { ...INIT_TASK_CREATE };
  categoryQuery = '';
  categoryDropdownOpen = false;
  highlightedIndex = -1;
  readonly weekDayOptions = WEEK_DAY_OPTIONS;

  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService) { }

  ngOnInit() {
    this.appService.eventEmitter.subscribe((event) => {
      if (event.action === ACTIONS.EDIT_TASK) {
        const data = event.data as TaskCreate;
        this.task = {
          ...data,
          weekDays: data.weekDays?.length ? [...data.weekDays] : [],
          tagIds: data.tagIds?.length ? [...data.tagIds] : [],
        };
        this.syncCategoryQueryFromSelection();
        this.categoryDropdownOpen = false;
        this.highlightedIndex = -1;
      }
    });
  }

  get selectedDaysSummary(): string {
    return formatSelectedWeekDays(this.task.weekDays);
  }

  get selectedCategoryPath(): string {
    if (!this.task.categoryId) {
      return '';
    }
    return this.appService.getCategoryPath(+this.task.categoryId);
  }

  get filteredCategories(): Category[] {
    let search = this.categoryQuery.trim().toLowerCase();
    const selectedPath = this.selectedCategoryPath.toLowerCase();
    if (selectedPath && search === selectedPath) {
      search = '';
    }
    return this.appService.categories.filter((category) => {
      if (this.appService.leafOnly && !this.appService.isLeafCategory(category)) {
        return false;
      }
      if (!search) {
        return true;
      }
      const path = this.appService.getCategoryPath(category).toLowerCase();
      const title = category.title.toLowerCase();
      const description = (category.description ?? '').toLowerCase();
      return path.includes(search) || title.includes(search) || description.includes(search);
    });
  }

  categoryOptionLabel(category: Category): string {
    const path = this.appService.getCategoryPath(category);
    const count = this.appService.categoryTaskMap[category.id ?? 0]?.length ?? 0;
    return `${path} (${count})`;
  }

  openCategoryDropdown(): void {
    this.categoryDropdownOpen = true;
    if (this.highlightedIndex < 0) {
      this.highlightedIndex = 0;
    }
  }

  onCategoryQueryChange(): void {
    this.openCategoryDropdown();
    this.highlightedIndex = 0;
  }

  selectCategory(category: Category): void {
    this.task.categoryId = category.id;
    this.categoryQuery = this.appService.getCategoryPath(category);
    this.categoryDropdownOpen = false;
    this.highlightedIndex = -1;
  }

  clearCategory(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.task.categoryId = undefined;
    this.categoryQuery = '';
    this.categoryDropdownOpen = false;
    this.highlightedIndex = -1;
  }

  onCategoryKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.categoryDropdownOpen) {
          this.openCategoryDropdown();
        } else {
          this.moveHighlight(1);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this.categoryDropdownOpen) {
          this.openCategoryDropdown();
        } else {
          this.moveHighlight(-1);
        }
        break;
      case 'Enter':
        if (this.categoryDropdownOpen) {
          event.preventDefault();
          const category = this.filteredCategories[this.highlightedIndex];
          if (category) {
            this.selectCategory(category);
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closeCategoryDropdown();
        break;
      case 'Tab':
        this.closeCategoryDropdown();
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.categoryDropdownOpen) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('.category-typeahead')) {
      return;
    }
    this.closeCategoryDropdown();
  }

  private closeCategoryDropdown(): void {
    this.categoryDropdownOpen = false;
    this.highlightedIndex = -1;
    if (!this.categoryQuery.trim()) {
      this.task.categoryId = undefined;
      this.categoryQuery = '';
      return;
    }
    this.syncCategoryQueryFromSelection();
  }

  private moveHighlight(delta: number): void {
    const count = this.filteredCategories.length;
    if (count === 0) {
      this.highlightedIndex = -1;
      return;
    }
    const current = this.highlightedIndex < 0 ? 0 : this.highlightedIndex;
    this.highlightedIndex = (current + delta + count) % count;
  }

  private syncCategoryQueryFromSelection(): void {
    this.categoryQuery = this.selectedCategoryPath;
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

  toggleTag(id: number): void {
    const current = [...(this.task.tagIds ?? [])];
    const index = current.indexOf(id);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(id);
    }
    this.task.tagIds = current;
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
          if (this.appService.autoClear) {
            this.resetForm();
          }
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
          if (this.appService.autoClear) {
            this.resetForm();
          }
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
    this.task = { ...INIT_TASK_CREATE, tagIds: [] };
    this.categoryQuery = '';
    this.categoryDropdownOpen = false;
    this.highlightedIndex = -1;
  }

  private buildPayload(): TaskCreate {
    const payload: TaskCreate = {
      ...this.task,
      title: this.task.title,
      description: this.task.description,
      tagIds: [...(this.task.tagIds ?? [])],
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
