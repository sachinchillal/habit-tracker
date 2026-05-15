import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { BorderItem, THEME_TYPE as TT } from '../../services/interfaces';
import { SettingsService } from '../../services/settings.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit, OnDestroy {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  readonly THEME_TYPE = TT;

  borderItems: BorderItem[] = [];
  private borderSub?: Subscription;

  constructor(
    public themeService: ThemeService,
    public settingsService: SettingsService
  ) { }

  ngOnInit(): void {
    this.borderSub = this.settingsService.borderItems$.subscribe(items => {
      this.borderItems = items;
    });
  }

  ngOnDestroy(): void {
    this.borderSub?.unsubscribe();
  }

  onClose(): void {
    this.close.emit();
  }

  onThemePick(theme: TT): void {
    this.themeService.changeTheme(theme);
    this.onClose();
  }

  onBorderChange(item: BorderItem, checked: boolean): void {
    this.settingsService.setBorderChecked(item.label, checked);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open) this.onClose();
  }
}
