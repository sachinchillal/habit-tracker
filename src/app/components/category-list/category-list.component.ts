import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from '../../services/app.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ACTIONS, Category } from '../../services/interfaces';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss'
})
export class CategoryListComponent {

  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService) { }

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
      next: (response) => {
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
}
