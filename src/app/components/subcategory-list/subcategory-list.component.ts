import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from '../../services/app.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ACTIONS, Category } from '../../services/interfaces';

@Component({
  selector: 'app-subcategory-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subcategory-list.component.html',
  styleUrl: './subcategory-list.component.scss'
})
export class SubcategoryListComponent {

  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService) { }

  get subcategories(): Category[] {
    return this.appService.categories.filter(c => !!c.categoryId);
  }

  /**
   * trackBy function for ngFor to improve performance.
   * @param index - The index of the item.
   * @param subcategory - The subcategory object.
   * @returns The unique ID of the subcategory.
   */
  trackSubcategoryById(index: number, subcategory: any) {
    return subcategory.id;
  }
  handleDelete(subcategory: Category) {
    this.appService.isLoading = true;
    this.apiService.categoryDelete(subcategory.id).subscribe({
      next: (response) => {
        this.appService.isLoading = false;
        this.toastService.showToastAuto('Success', 'Subcategory deleted successfully.', 'success');
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
  handleEdit(subcategory: Category) {
    this.appService.eventEmitter.emit({ action: ACTIONS.EDIT_SUBCATEGORY, data: subcategory });
  }
}