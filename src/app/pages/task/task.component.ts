import { Component, OnInit } from '@angular/core';
import { TaskCreateComponent } from '../../components/task-create/task-create.component';
import { TaskListComponent } from '../../components/task-list/task-list.component';
import { AppService } from '../../services/app.service';
import { PAGES } from '../../services/interfaces';

@Component({
  selector: 'app-task',
  standalone: true,

  imports: [TaskListComponent, TaskCreateComponent],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss'
})
export class TaskComponent implements OnInit {

  constructor(public appService: AppService) { }

  ngOnInit(): void {
    this.appService.setCurrentPage(PAGES.CREATE);
  }


}
