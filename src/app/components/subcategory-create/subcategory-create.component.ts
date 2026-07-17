import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { ApiService } from '../../services/api.service';
import { ACTIONS, INIT_SUBCATEGORY_CREATE, Subcategory, SubcategoryCreate, TOAST_TYPE } from '../../services/interfaces';
import { AppService } from '../../services/app.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-subcategory-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subcategory-create.component.html',
  styleUrl: './subcategory-create.component.scss'
})
export class SubcategoryCreateComponent implements OnInit {
  subcategory: SubcategoryCreate = { ...INIT_SUBCATEGORY_CREATE };

  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService) { }

  ngOnInit() {
    this.appService.eventEmitter.subscribe((event) => {
      if (event.action === ACTIONS.EDIT_SUBCATEGORY) {
        const eventData = event.data as Subcategory;
        if (!eventData || !eventData.id) {
          return;
        }
        this.subcategory = { ...eventData };
      }
    });
  }

  get isValid(): boolean {
    return !!this.subcategory.title.trim() && !!this.subcategory.categoryId;
  }

  /** Any category may be a parent (unlimited nesting); exclude self + descendants when editing. */
  get parentOptions() {
    return this.appService.getValidParentOptions(this.subcategory.id);
  }

  parentLabel(category: { id: number }): string {
    return this.appService.getCategoryPath(category.id);
  }

  onSubmit() {
    this.subcategory.title = this.subcategory.title.trim();
    this.subcategory.description = this.subcategory.description.trim();
    if (!this.subcategory.title) {
      this.toastService.showToastAuto('Error', 'Title is required.', TOAST_TYPE.ERROR);
      return;
    }
    if (!this.subcategory.categoryId) {
      this.toastService.showToastAuto('Error', 'Please select a category.', TOAST_TYPE.ERROR);
      return;
    }
    const payload: SubcategoryCreate = {
      ...this.subcategory,
      categoryId: +this.subcategory.categoryId,
    };
    this.appService.isLoading = true;
    if (this.subcategory.id) {
      this.apiService.subCategoryUpdate(payload).subscribe({
        next: (response) => {
          this.resetForm();
          this.toastService.showToastAuto('Success', 'Subcategory updated successfully.', TOAST_TYPE.SUCCESS);
          this.appService.fetchCategories();
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
      this.apiService.subCategoryCreate(payload).subscribe({
        next: (response) => {
          this.resetForm();
          this.toastService.showToastAuto('Success', 'Subcategory created successfully.', TOAST_TYPE.SUCCESS);
          this.appService.fetchCategories();
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
    this.subcategory = { ...INIT_SUBCATEGORY_CREATE };
  }
}
