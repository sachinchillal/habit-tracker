import { Component } from '@angular/core';
import { TaskCreateComponent } from '../task-create/task-create.component';
import { TaskListComponent } from '../task-list/task-list.component';

@Component({
  selector: 'app-task',
  standalone: true,

  imports: [TaskListComponent, TaskCreateComponent],
    templateUrl: './task.component.html',
  styleUrl: './task.component.scss'
})
export class TaskComponent {

}
