import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../services/interfaces';

@Component({
  selector: 'app-checkbox-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkbox-item.component.html',
  styleUrl: './checkbox-item.component.scss'
})
export class CheckboxItemComponent {
  @Input() task!: Task;
  @Input() index!: number;
  @Output() toggleComplete = new EventEmitter<number>();

  onToggleComplete() {
    this.toggleComplete.emit(this.task.id);
  }
}
