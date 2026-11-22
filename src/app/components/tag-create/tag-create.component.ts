import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ACTIONS, HabitTag, INIT_TAG, TOAST_TYPE, TagWrite } from '../../services/interfaces';
import { AppService } from '../../services/app.service';
import { ToastService } from '../../services/toast.service';
import { TagChipsComponent } from '../tag-chips/tag-chips.component';
import {
  TAG_COLOR_PRESETS,
  normalizeTagColor,
  validateTagFields,
} from '../../utils/tag.util';

@Component({
  selector: 'app-tag-create',
  standalone: true,
  imports: [CommonModule, FormsModule, TagChipsComponent],
  templateUrl: './tag-create.component.html',
})
export class TagCreateComponent implements OnInit {
  tag: HabitTag = { ...INIT_TAG };
  readonly colorPresets = TAG_COLOR_PRESETS;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    public appService: AppService,
    private apiService: ApiService,
    private toastService: ToastService,
  ) { }

  ngOnInit() {
    this.appService.eventEmitter
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.action !== ACTIONS.EDIT_TAG) {
          return;
        }
        const data = event.data as HabitTag;
        if (!data?.id) {
          return;
        }
        this.tag = {
          ...INIT_TAG,
          ...data,
          description: data.description ?? '',
          color: normalizeTagColor(data.color),
        };
      });
  }

  get isEditing(): boolean {
    return !!this.tag.id;
  }

  get previewTags(): HabitTag[] {
    return [{
      ...this.tag,
      name: this.tag.name.trim() || 'Tag',
      color: normalizeTagColor(this.tag.color),
    }];
  }

  isColorSelected(color: string): boolean {
    return this.tag.color.toLowerCase() === color.toLowerCase();
  }

  selectColor(color: string) {
    this.tag.color = normalizeTagColor(color);
  }

  onSubmit() {
    this.tag.name = this.tag.name.trim();
    this.tag.description = (this.tag.description ?? '').trim();
    this.tag.color = normalizeTagColor(this.tag.color);

    const error = validateTagFields(this.tag, this.appService.tags, this.tag.id || undefined);
    if (error) {
      this.toastService.showToastAuto('Error', error, TOAST_TYPE.ERROR);
      return;
    }

    const payload: TagWrite = {
      name: this.tag.name,
      description: this.tag.description,
      color: this.tag.color,
    };
    this.appService.isLoading = true;
    const request = this.tag.id
      ? this.apiService.tagUpdate(this.tag.id, payload)
      : this.apiService.tagCreate(payload);
    const message = this.tag.id ? 'Tag updated successfully.' : 'Tag created successfully.';
    request.subscribe({
      next: () => this.onSuccess(message),
      error: (err) => this.onError(err),
    });
  }

  resetForm() {
    this.tag = { ...INIT_TAG };
  }

  private onSuccess(message: string) {
    if (this.appService.autoClear) {
      this.resetForm();
    }
    this.toastService.showToastAuto('Success', message, TOAST_TYPE.SUCCESS);
    this.appService.fetchTags();
  }

  private onError(error: { error?: { message?: string } }) {
    const message = error?.error?.message || 'An unknown error occurred.';
    this.toastService.showToastAuto('Error', message, TOAST_TYPE.ERROR);
    this.appService.isLoading = false;
  }
}
