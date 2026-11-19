import { Category } from "../services/interfaces";

export function orderCategoriesAsTree(categories: Category[]): Category[] {
  const byParent = new Map<number | null, Category[]>();
  for (const c of categories) {
    const key = c.parentId ?? null;
    const group = byParent.get(key) ?? [];
    group.push(c);
    byParent.set(key, group);
  }
  for (const group of byParent.values()) {
    group.sort((a, b) => a.title.localeCompare(b.title));
  }
  const result: Category[] = [];
  const visit = (parentId: number | null) => {
    const children = byParent.get(parentId) ?? [];
    for (const child of children) {
      result.push(child);
      visit(child.id);
    }
  };
  visit(null);
  // Orphans whose parent is missing from the list
  if (result.length < categories.length) {
    const seen = new Set(result.map(c => c.id));
    for (const c of categories) {
      if (!seen.has(c.id)) {
        result.push(c);
      }
    }
  }
  return result;
}