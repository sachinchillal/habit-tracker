import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { ApiService } from '../../services/api.service';
import { ACTIONS, INIT_UI_CATEGORY, TOAST_TYPE, Category } from '../../services/interfaces';
import { AppService } from '../../services/app.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-category-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-create.component.html',
  styleUrl: './category-create.component.scss'
})
export class CategoryCreateComponent implements OnInit {
  category: Category = { ...INIT_UI_CATEGORY };

  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService) { }

  ngOnInit() {
    this.appService.eventEmitter.subscribe((event) => {
      if (event.action !== ACTIONS.EDIT_CATEGORY) {
        return;
      }
      const eventData = event.data as Partial<Category> | undefined;
      if (!eventData) {
        return;
      }
      if (eventData.id) {
        this.category = { ...INIT_UI_CATEGORY, ...eventData } as Category;
        return;
      }
      // Add-child: pre-fill parent only
      if (eventData.parentId) {
        this.resetForm();
        this.category.parentId = eventData.parentId;
      }
    });
  }

  get parentOptions() {
    return this.appService.getValidParentOptions(this.category.id || undefined);
  }

  parentLabel(category: { id: number }): string {
    return this.appService.getCategoryPath(category.id);
  }

  get isEditing(): boolean {
    return !!this.category.id;
  }

  onSubmit() {
    this.category.title = this.category.title.trim();
    this.category.description = this.category.description.trim();
    if (!this.category.title) {
      this.toastService.showToastAuto('Error', 'Title is required.', TOAST_TYPE.ERROR);
      return;
    }

    this.category.parentId = this.category.parentId ? +this.category.parentId : undefined;
    this.appService.isLoading = true;

    if (this.category.id) {
      this.apiService.categoryUpdate(this.category).subscribe({
        next: () => this.onSuccess('Category updated successfully.'),
        error: (error) => this.onError(error),
      });
    } else {
      this.apiService.categoryCreate(this.category).subscribe({
        next: () => this.onSuccess('Category created successfully.'),
        error: (error) => this.onError(error),
      });
    }
  }

  resetForm() {
    this.category = { ...INIT_UI_CATEGORY };
  }

  private onSuccess(message: string) {
    this.resetForm();
    this.toastService.showToastAuto('Success', message, TOAST_TYPE.SUCCESS);
    this.appService.fetchCategories();
  }

  private onError(error: any) {
    if (error.error && error.error.message) {
      this.toastService.showToastAuto('Error', error.error.message, TOAST_TYPE.ERROR);
    } else {
      this.toastService.showToastAuto('Error', 'An unknown error occurred.', TOAST_TYPE.ERROR);
    }
    this.appService.isLoading = false;
  }
}
