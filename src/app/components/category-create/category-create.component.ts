import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { ApiService } from '../../services/api.service';
import { ACTIONS, Category, INIT_CATEGORY, TOAST_TYPE } from '../../services/interfaces';
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
  category: Category = { ...INIT_CATEGORY };

  constructor(public appService: AppService, private apiService: ApiService, private toastService: ToastService) { }

  ngOnInit() {
    this.appService.eventEmitter.subscribe((event) => {
      if (event.action === ACTIONS.EDIT_CATEGORY) {
        const eventData = event.data as Category;
        if (!eventData || !eventData.id) {
          return;
        }
        this.category = { ...eventData };
      }
    });
  }

  onSubmit() {
    this.category.title = this.category.title.trim();
    this.category.description = this.category.description.trim();
    if (!this.category.title) {
      this.toastService.showToastAuto('Error', 'Title is required.', TOAST_TYPE.ERROR);
      return;
    }
    this.appService.isLoading = true;
    if (this.category.id) {
      this.apiService.categoryUpdate(this.category).subscribe({
        next: (response) => {
          this.resetForm();
          this.toastService.showToastAuto('Success', 'Category updated successfully.', TOAST_TYPE.SUCCESS);
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
      this.apiService.categoryCreate(this.category).subscribe({
        next: (response) => {
          this.resetForm();
          this.toastService.showToastAuto('Success', 'Category created successfully.', TOAST_TYPE.SUCCESS);
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
    this.category = { ...INIT_CATEGORY };
  }
}
