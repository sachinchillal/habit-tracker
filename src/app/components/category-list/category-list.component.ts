import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../services/app.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ACTIONS, Category } from '../../services/interfaces';
import { SearchBoxComponent } from '../search-box/search-box.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchBoxComponent],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss'
})
export class CategoryListComponent {
  searchText = '';
  private appliedSearch = '';
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService) { }

  get filteredCategories(): Category[] {
    const search = this.appliedSearch.trim().toLowerCase();
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

  onSearch() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.appliedSearch = this.searchText;
      this.timeoutId = null;
    }, 300);
  }

  /**
   * trackBy function for ngFor to improve performance.
   * @param index - The index of the item.
   * @param category - The category object.
   * @returns The unique ID of the category.
   */
  trackCategoryById(index: number, category: any) {
    return category.id;
  }

  handleDelete(category: Category) {
    this.appService.isLoading = true;
    this.apiService.categoryDelete(category.id).subscribe({
      next: () => {
        this.appService.isLoading = false;
        this.toastService.showToastAuto('Success', 'Category deleted successfully.', 'success');
        this.appService.fetchCategories();
      },
      error: (error) => {
        this.appService.isLoading = false;
        if (error.error && error.error.message) {
          this.toastService.showToastAuto('Error', error.error.message, 'error');
        } else {
          this.toastService.showToastAuto('Error', 'An unknown error occurred.', 'error');
        }
      },
    });
  }

  handleEdit(category: Category) {
    this.appService.eventEmitter.emit({ action: ACTIONS.EDIT_CATEGORY, data: category });
  }

  handleAddChild(category: Category) {
    this.appService.eventEmitter.emit({
      action: ACTIONS.EDIT_CATEGORY,
      data: { parentId: category.id },
    });
  }
}
