import { Component } from '@angular/core';
import { CategoryListComponent } from '../../components/category-list/category-list.component';
import { CategoryCreateComponent } from '../../components/category-create/category-create.component';
import { ActivatedRoute } from '@angular/router';
import { AppService } from '../../services/app.service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CategoryListComponent, CategoryCreateComponent],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss'
})
export class CategoryComponent {
  constructor(public appService: AppService, private activatedRoute: ActivatedRoute) {
    this.appService.setCurrentPage(this.activatedRoute.snapshot.data['page']);
  }

}
