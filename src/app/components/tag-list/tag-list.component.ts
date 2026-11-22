import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from '../../services/app.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ACTIONS, HabitTag, TOAST_TYPE } from '../../services/interfaces';
import { SearchBoxComponent } from '../search-box/search-box.component';

@Component({
  selector: 'app-tag-list',
  standalone: true,
  imports: [CommonModule, SearchBoxComponent],
  templateUrl: './tag-list.component.html',
  styleUrl: './tag-list.component.scss',
})
export class TagListComponent {
  searchText = '';
  appliedSearch = '';
  pendingDeleteId: number | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    public appService: AppService,
    private apiService: ApiService,
    private toastService: ToastService,
  ) { }

  get filteredTags(): HabitTag[] {
    const search = this.appliedSearch.trim().toLowerCase();
    if (!search) {
      return this.appService.tags;
    }
    return this.appService.tags.filter((tag) => {
      const name = tag.name.toLowerCase();
      const description = (tag.description ?? '').toLowerCase();
      return name.includes(search) || description.includes(search);
    });
  }

  onSearch() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.appliedSearch = this.searchText;
      this.timeoutId = null;
    }, 300);
  }

  habitLabel(tag: HabitTag): string {
    const count = this.appService.habitCountForTag(tag.id);
    const noun = count === 1 ? 'habit' : 'habits';
    return `${count} ${noun}`;
  }

  askDelete(tag: HabitTag) {
    this.pendingDeleteId = tag.id;
  }

  cancelDelete() {
    this.pendingDeleteId = null;
  }

  confirmDelete(tag: HabitTag) {
    this.appService.isLoading = true;
    this.apiService.tagDelete(tag.id).subscribe({
      next: () => {
        this.pendingDeleteId = null;
        this.toastService.showToastAuto('Success', 'Tag deleted successfully.', TOAST_TYPE.SUCCESS);
        this.appService.fetchTags();
        this.appService.fetchTasks();
      },
      error: (error) => {
        this.appService.isLoading = false;
        const message = error?.error?.message || 'An unknown error occurred.';
        this.toastService.showToastAuto('Error', message, TOAST_TYPE.ERROR);
      },
    });
  }

  handleEdit(tag: HabitTag) {
    this.pendingDeleteId = null;
    this.appService.eventEmitter.emit({ action: ACTIONS.EDIT_TAG, data: tag });
  }
}
