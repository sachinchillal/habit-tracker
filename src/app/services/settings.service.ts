import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BORDER_ITEMS, BorderItem } from './interfaces';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly borderStorageKey = 'settings:borderItems';

  private readonly borderItemsSubject = new BehaviorSubject<BorderItem[]>([
    { label: BORDER_ITEMS.LEVEL_1_BORDER, checked: true },
    { label: BORDER_ITEMS.LEVEL_2_BORDER, checked: true },
  ]);

  readonly borderItems$ = this.borderItemsSubject.asObservable();

  constructor() {
    this.loadBorderItemsFromStorage();
  }

  getBorderItemsSnapshot(): BorderItem[] {
    return this.borderItemsSubject.value;
  }

  setBorderChecked(label: string, checked: boolean): void {
    const next = this.borderItemsSubject.value.map(item =>
      item.label === label ? { ...item, checked } : item
    );

    this.borderItemsSubject.next(next);
    this.saveBorderItemsToStorage(next);
  }

  private loadBorderItemsFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.borderStorageKey);
      if (!raw) return;

      const saved = JSON.parse(raw) as BorderItem[];
      if (!Array.isArray(saved)) return;

      const savedMap = new Map(saved.map(i => [i.label, !!i.checked]));
      const next = this.borderItemsSubject.value.map(item => ({
        ...item,
        checked: savedMap.has(item.label) ? savedMap.get(item.label)! : item.checked,
      }));

      this.borderItemsSubject.next(next);
    } catch {
      // keep defaults
    }
  }

  private saveBorderItemsToStorage(items: BorderItem[]): void {
    try {
      localStorage.setItem(this.borderStorageKey, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }
}
