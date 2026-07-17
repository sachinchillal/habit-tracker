import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppService } from '../../services/app.service';
import { CategoryListComponent } from '../../components/category-list/category-list.component';
import { SubcategoryCreateComponent } from '../../components/subcategory-create/subcategory-create.component';

@Component({
  selector: 'app-subcategories',
  standalone: true,
  imports: [CategoryListComponent, SubcategoryCreateComponent],
  templateUrl: './subcategories.component.html',
  styleUrl: './subcategories.component.scss'
})
export class SubcategoriesComponent {
  constructor(public appService: AppService, private activatedRoute: ActivatedRoute) {
    this.appService.setCurrentPage(this.activatedRoute.snapshot.data['page']);
  }

}
