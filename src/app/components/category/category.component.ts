import { Component } from '@angular/core';
import { CategoryListComponent } from '../category-list/category-list.component';
import { CategoryCreateComponent } from '../category-create/category-create.component';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CategoryListComponent, CategoryCreateComponent],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss'
})
export class CategoryComponent {

}
