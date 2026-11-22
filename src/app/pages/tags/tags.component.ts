import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TagListComponent } from '../../components/tag-list/tag-list.component';
import { TagCreateComponent } from '../../components/tag-create/tag-create.component';
import { AppService } from '../../services/app.service';

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [TagListComponent, TagCreateComponent],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.scss',
})
export class TagsComponent {
  constructor(public appService: AppService, private activatedRoute: ActivatedRoute) {
    this.appService.setCurrentPage(this.activatedRoute.snapshot.data['page']);
  }
}
