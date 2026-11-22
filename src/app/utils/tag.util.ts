import { HabitTag } from '../services/interfaces';

export const DEFAULT_TAG_COLOR = '#64748b';
export const TAG_NAME_MIN = 2;
export const TAG_NAME_MAX = 40;
export const TAG_DESCRIPTION_MAX = 200;

export const TAG_COLOR_PRESETS = [
  { name: 'Slate', value: '#64748b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
] as const;

const TAG_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export function isTagColor(value: string): boolean {
  return TAG_COLOR_PATTERN.test(value.trim());
}

export function normalizeTagColor(value: string | undefined | null): string {
  const color = (value ?? '').trim();
  return isTagColor(color) ? color.toLowerCase() : DEFAULT_TAG_COLOR;
}

/** Dark or light label text so a filled chip stays readable. */
export function tagTextColor(color: string): string {
  const hex = normalizeTagColor(color);
  const channel = (byte: number) => {
    const s = byte / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = channel(parseInt(hex.slice(1, 3), 16));
  const g = channel(parseInt(hex.slice(3, 5), 16));
  const b = channel(parseInt(hex.slice(5, 7), 16));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.179 ? '#0f172a' : '#ffffff';
}

/**
 * Mirrors the habit-tracker tag API. Returns an error message, or null when the fields can be sent.
 */
export function validateTagFields(
  tag: { name: string; description: string; color: string },
  existing: HabitTag[],
  excludeId?: number,
): string | null {
  const name = tag.name.trim();
  if (name.length < TAG_NAME_MIN || name.length > TAG_NAME_MAX) {
    return `Name must be ${TAG_NAME_MIN}–${TAG_NAME_MAX} characters.`;
  }
  const description = tag.description.trim();
  if (description.length > TAG_DESCRIPTION_MAX) {
    return `Description must be ${TAG_DESCRIPTION_MAX} characters or fewer.`;
  }
  if (!isTagColor(tag.color)) {
    return 'Color must be a hex value like #64748b.';
  }
  const normalized = name.toLowerCase();
  const duplicate = existing.some((item) =>
    item.isActive !== false
    && item.id !== excludeId
    && item.name.trim().toLowerCase() === normalized
  );
  if (duplicate) {
    return 'Tag name already exists';
  }
  return null;
}
