import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { HabitTag } from '../../services/interfaces';
import { tagTextColor } from '../../utils/tag.util';

@Component({
  selector: 'app-tag-chips',
  standalone: true,
  imports: [NgClass],
  templateUrl: './tag-chips.component.html',
  styleUrl: './tag-chips.component.scss',
})
export class TagChipsComponent {
  @Input() tags: HabitTag[] = [];
  @Input() selectedIds: number[] = [];
  @Input() selectable = false;
  @Input() ariaLabel = 'Tags';
  @Output() toggled = new EventEmitter<number>();

  isSelected(id: number): boolean {
    return this.selectedIds.includes(id);
  }

  textColor(color: string): string {
    return tagTextColor(color);
  }
}
