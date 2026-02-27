import { Component, Input, Output, EventEmitter, ViewChildren, QueryList, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from '../../services/app.service';
import { Task, Category } from '../../services/interfaces';
import { CheckboxItemComponent } from '../checkbox-item/checkbox-item.component';

export interface KanbanColumn {
  id: number | 'uncategorized';
  title: string;
  tasks: Task[];
}

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, CheckboxItemComponent],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.scss'
})
export class KanbanBoardComponent implements AfterViewChecked {
  @Input() scrollToColumnId: number | 'uncategorized' | null = null;
  @Output() toggleComplete = new EventEmitter<number>();

  @ViewChildren('columnRef') columnRefs?: QueryList<ElementRef<HTMLElement>>;

  private lastScrollToId: number | 'uncategorized' | null = null;

  constructor(public appService: AppService) {}

  ngAfterViewChecked(): void {
    if (this.scrollToColumnId == null) {
      this.lastScrollToId = null;
      return;
    }
    if (this.scrollToColumnId === this.lastScrollToId || !this.columnRefs?.length) return;
    const idx = this.columns.findIndex(c => c.id === this.scrollToColumnId);
    if (idx === -1) return;
    const el = this.columnRefs.get(idx)?.nativeElement;
    if (el) {
      this.lastScrollToId = this.scrollToColumnId;
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }, 0);
    }
  }

  /** Board columns: Uncategorized first, then one column per category. */
  get columns(): KanbanColumn[] {
    const result: KanbanColumn[] = [];
    const uncategorized = this.appService.tasks.filter(
      t => !t.categoryId || !this.appService.categoriesMap[t.categoryId]
    );
    if (uncategorized.length > 0 || this.appService.categories.length === 0) {
      result.push({ id: 'uncategorized', title: 'Uncategorized', tasks: uncategorized });
    }
    this.appService.categories.forEach((cat: Category) => {
      const tasks = this.appService.tasks.filter(t => t.categoryId === cat.id && !t.isPaused);
      result.push({ id: cat.id, title: cat.title, tasks });
    });
    return result;
  }

  onToggleComplete(id: number) {
    this.toggleComplete.emit(id);
  }

  trackTaskById(_index: number, task: Task) {
    return task.id;
  }

  trackColumnById(_index: number, col: KanbanColumn) {
    return col.id;
  }
}
