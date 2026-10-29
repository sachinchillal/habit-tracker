import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [],
  templateUrl: './search-box.component.html',
  styleUrl: './search-box.component.scss',
  host: {
    '[class.is-toolbar]': 'variant === "toolbar"',
  },
})
export class SearchBoxComponent implements OnDestroy {
  @Input() value = '';
  @Input() placeholder = 'Search...';
  @Input() variant: 'field' | 'toolbar' = 'field';
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly idleMs = 30_000;

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.emitValue(value);
  }

  clear(): void {
    this.emitValue('');
    this.searchInput?.nativeElement.focus();
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.repeat || event.shiftKey || event.altKey || event.metaKey || !event.ctrlKey) {
      return;
    }
    if (event.key.toLowerCase() !== 'k') {
      return;
    }
    event.preventDefault();
    const input = this.searchInput?.nativeElement;
    if (!input) {
      return;
    }
    input.focus();
    input.select();
  }

  ngOnDestroy(): void {
    this.clearIdleTimer();
  }

  private emitValue(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
    this.scheduleIdleClear();
  }

  private scheduleIdleClear(): void {
    this.clearIdleTimer();
    if (!this.value.trim()) {
      return;
    }
    this.idleTimer = setTimeout(() => {
      this.idleTimer = null;
      this.value = '';
      this.valueChange.emit('');
    }, this.idleMs);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }
}
