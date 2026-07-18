import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CheckboxItemComponent } from '../../components/checkbox-item/checkbox-item.component';
import { ApiService } from '../../services/api.service';
import { AppService } from '../../services/app.service';
import { PAGES, TOAST_TYPE, Task, Category } from '../../services/interfaces';
import { ToastService } from '../../services/toast.service';

interface TreeNodeVm {
  category: Category;
  children: TreeNodeVm[];
  depth: number;
  directHabitCount: number;
  descendantHabitCount: number;
  totalHabitCount: number;
  childCategoryCount: number;
  descendantCategoryCount: number;
  matchesSearch: boolean;
  hasMatchingDescendant: boolean;
}

@Component({
  selector: 'app-tree-modern',
  standalone: true,
  imports: [CommonModule, FormsModule, CheckboxItemComponent],
  templateUrl: './tree-modern.component.html',
  styleUrl: './tree-modern.component.scss'
})
export class TreeModernComponent implements OnInit {
  searchText = '';
  private nodeMap = new Map<number, TreeNodeVm>();
  readonly expandedNodeIds = new Set<number>();
  selectedCategoryId?: number;

  constructor(
    public appService: AppService,
    private apiService: ApiService,
    private toastService: ToastService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.appService.setCurrentPage(this.activatedRoute.snapshot.data['page'] ?? PAGES.HABIT_TREE);
  }

  ngOnInit(): void {
    this.initializeTreeState();
  }

  get rootNodes(): TreeNodeVm[] {
    return this.buildTree();
  }

  get visibleRootNodes(): TreeNodeVm[] {
    return this.rootNodes.filter((node) => this.isNodeVisible(node));
  }

  get selectedNode(): TreeNodeVm | undefined {
    if (this.selectedCategoryId == null) {
      return undefined;
    }
    return this.nodeMap.get(this.selectedCategoryId);
  }

  get selectedCategory(): Category | undefined {
    return this.selectedNode?.category;
  }

  get selectedCategoryPath(): string {
    return this.selectedCategory ? this.appService.getCategoryPath(this.selectedCategory) : '';
  }

  get selectedDirectHabits(): Task[] {
    const selectedId = this.selectedCategoryId;
    if (selectedId == null) {
      return [];
    }
    return this.appService.tasks
      .filter((task) => task.categoryId === selectedId && !task.isPaused)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  get selectedChildCategories(): Category[] {
    const selectedId = this.selectedCategoryId;
    if (selectedId == null) {
      return [];
    }
    return this.appService.categories
      .filter((category) => category.parentId === selectedId)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  get totalRootCategories(): number {
    return this.appService.categories.filter((category) => !category.parentId).length;
  }

  get totalNestedCategories(): number {
    return this.appService.categories.filter((category) => !!category.parentId).length;
  }

  get totalActiveHabits(): number {
    return this.appService.tasks.filter((task) => !task.isPaused).length;
  }

  get selectedBranchDepth(): number {
    return this.selectedCategory ? this.appService.getCategoryDepth(this.selectedCategory) + 1 : 0;
  }

  trackNodeById(index: number, node: TreeNodeVm): number {
    return node.category.id;
  }

  trackTaskById(index: number, task: Task): number {
    return task.id;
  }

  trackCategoryById(index: number, category: Category): number {
    return category.id;
  }

  toggleNode(node: TreeNodeVm, event?: Event): void {
    event?.stopPropagation();
    if (!node.children.length) {
      return;
    }
    if (this.expandedNodeIds.has(node.category.id)) {
      this.expandedNodeIds.delete(node.category.id);
      return;
    }
    this.expandedNodeIds.add(node.category.id);
  }

  selectNode(node: TreeNodeVm): void {
    this.selectedCategoryId = node.category.id;
    this.expandAncestors(node.category);
  }

  selectCategoryById(categoryId: number): void {
    const category = this.appService.categoriesMap[categoryId];
    if (!category) {
      return;
    }
    this.selectedCategoryId = categoryId;
    this.expandAncestors(category);
  }

  isExpanded(node: TreeNodeVm): boolean {
    return this.expandedNodeIds.has(node.category.id);
  }

  isSelected(node: TreeNodeVm): boolean {
    return this.selectedCategoryId === node.category.id;
  }

  hasSearch(): boolean {
    return this.searchText.trim().length > 0;
  }

  clearSearch(): void {
    this.searchText = '';
    this.expandRootNodes();
  }

  getParentPath(node: TreeNodeVm): string {
    return this.appService.getCategoryParentPath(node.category);
  }

  getProgressPercent(node: TreeNodeVm): number {
    if (node.totalHabitCount === 0) {
      return 0;
    }
    const complete = this.getCompletedHabitCount(node);
    return Math.round((complete / node.totalHabitCount) * 100);
  }

  getCompletedHabitCount(node: TreeNodeVm): number {
    return this.getTasksForBranch(node).filter((task) => task.isDone).length;
  }

  handleToggleComplete(taskId: number): void {
    this.appService.isLoading = true;
    this.apiService.markTaskCompleted(taskId).subscribe({
      next: () => {
        this.appService.fetchTrackers();
      },
      error: (error) => {
        if (error?.error?.message) {
          this.toastService.showToastAuto('Error', error.error.message, TOAST_TYPE.ERROR);
        } else {
          this.toastService.showToastAuto('Error', 'An unknown error occurred.', TOAST_TYPE.ERROR);
        }
        this.appService.isLoading = false;
      }
    });
  }

  private initializeTreeState(): void {
    const roots = this.buildTree();
    this.expandRootNodes();
    if (!roots.length) {
      this.selectedCategoryId = undefined;
      return;
    }
    const preferredSelection = roots.find((node) => node.totalHabitCount > 0) ?? roots[0];
    this.selectedCategoryId = preferredSelection.category.id;
    this.expandAncestors(preferredSelection.category);
  }

  private buildTree(): TreeNodeVm[] {
    this.nodeMap.clear();
    const categories = [...this.appService.categories];
    const tasksByCategoryId = new Map<number, Task[]>();
    this.appService.tasks
      .filter((task) => !task.isPaused && !!task.categoryId)
      .forEach((task) => {
        const categoryId = task.categoryId as number;
        const list = tasksByCategoryId.get(categoryId) ?? [];
        list.push(task);
        tasksByCategoryId.set(categoryId, list);
      });

    const byParent = new Map<number | null, Category[]>();
    categories.forEach((category) => {
      const key = category.parentId ?? null;
      const list = byParent.get(key) ?? [];
      list.push(category);
      byParent.set(key, list);
    });
    byParent.forEach((list) => list.sort((a, b) => a.title.localeCompare(b.title)));

    const search = this.searchText.trim().toLowerCase();
    const visit = (category: Category, depth: number): TreeNodeVm => {
      const children = (byParent.get(category.id) ?? []).map((child) => visit(child, depth + 1));
      const directHabitCount = (tasksByCategoryId.get(category.id) ?? []).length;
      const descendantHabitCount = children.reduce((sum, child) => sum + child.totalHabitCount, 0);
      const descendantCategoryCount = children.reduce(
        (sum, child) => sum + 1 + child.descendantCategoryCount,
        0,
      );
      const matchesSearch = !search || this.matchesSearch(category, search);
      const hasMatchingDescendant = children.some((child) => child.matchesSearch || child.hasMatchingDescendant);
      const node: TreeNodeVm = {
        category,
        children,
        depth,
        directHabitCount,
        descendantHabitCount,
        totalHabitCount: directHabitCount + descendantHabitCount,
        childCategoryCount: children.length,
        descendantCategoryCount,
        matchesSearch,
        hasMatchingDescendant,
      };
      this.nodeMap.set(category.id, node);
      return node;
    };

    const roots = (byParent.get(null) ?? []).map((category) => visit(category, 0));
    if (this.selectedCategoryId != null && !this.nodeMap.has(this.selectedCategoryId)) {
      this.selectedCategoryId = roots[0]?.category.id;
    }
    return roots;
  }

  private matchesSearch(category: Category, search: string): boolean {
    return category.title.toLowerCase().includes(search)
      || category.description?.toLowerCase().includes(search)
      || this.appService.getCategoryPath(category).toLowerCase().includes(search);
  }

  isNodeVisible(node: TreeNodeVm): boolean {
    if (!this.hasSearch()) {
      return true;
    }
    return node.matchesSearch || node.hasMatchingDescendant;
  }

  visibleChildren(node: TreeNodeVm): TreeNodeVm[] {
    return node.children.filter((child) => this.isNodeVisible(child));
  }

  private expandRootNodes(): void {
    this.expandedNodeIds.clear();
    this.appService.categories
      .filter((category) => !category.parentId)
      .forEach((category) => this.expandedNodeIds.add(category.id));
  }

  private expandAncestors(category: Category): void {
    let current: Category | undefined = category;
    const visited = new Set<number>();
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      this.expandedNodeIds.add(current.id);
      current = current.parentId ? this.appService.categoriesMap[current.parentId] : undefined;
    }
  }

  private getTasksForBranch(node: TreeNodeVm): Task[] {
    const ids = new Set<number>();
    const collect = (current: TreeNodeVm): void => {
      ids.add(current.category.id);
      current.children.forEach(collect);
    };
    collect(node);
    return this.appService.tasks.filter((task) => !!task.categoryId && ids.has(task.categoryId));
  }
}
