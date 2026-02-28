import { Component, OnInit } from '@angular/core';
import { TaskCreateComponent } from '../../components/task-create/task-create.component';
import { TaskListComponent } from '../../components/task-list/task-list.component';
import { AppService } from '../../services/app.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-task',
  standalone: true,

  imports: [TaskListComponent, TaskCreateComponent],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss'
})
export class TaskComponent {

  constructor(public appService: AppService, private activatedRoute: ActivatedRoute) {
    this.appService.setCurrentPage(this.activatedRoute.snapshot.data['page']);
  }

}
