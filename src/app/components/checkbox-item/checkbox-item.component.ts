import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
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
  @Input() isVisibleBorder: boolean = false;

  @Output() toggleComplete = new EventEmitter<number>();

  isDetailsOpen = false;

  onToggleComplete() {
    this.toggleComplete.emit(this.task.id);
  }

  openDetails(event?: Event) {
    event?.stopPropagation();
    this.isDetailsOpen = true;
  }

  closeDetails() {
    this.isDetailsOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.isDetailsOpen) this.closeDetails();
  }
}
