import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AppService } from '../../services/app.service';
import { Category, PAGES, TOAST_TYPE, Task } from '../../services/interfaces';
import { ToastService } from '../../services/toast.service';

interface TreeNodeVm {
  category: Category;
  children: TreeNodeVm[];
  tasks: Task[];
  totalTaskCount: number;
  visibleTaskCount: number;
  hasVisibleContent: boolean;
}

@Component({
  selector: 'app-tree',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tree.component.html',
  styleUrl: './tree.component.scss'
})
export class TreeComponent implements OnInit {
  searchText = '';
  readonly expandedNodeIds = new Set<number>();
  private nodeMap = new Map<number, TreeNodeVm>();

  constructor(
    public appService: AppService,
    private apiService: ApiService,
    private toastService: ToastService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.appService.setCurrentPage(this.activatedRoute.snapshot.data['page'] ?? PAGES.HABIT_TREE);
  }

  ngOnInit(): void {
    this.expandRootCategories();
  }

  get rootNodes(): TreeNodeVm[] {
    return this.buildTree();
  }

  get visibleRootNodes(): TreeNodeVm[] {
    return this.rootNodes.filter((node) => node.hasVisibleContent);
  }

  get totalVisibleTasks(): number {
    return this.appService.tasks.filter((task) => this.matchesTaskSearch(task)).length;
  }

  get completedTasks(): number {
    return this.appService.tasks.filter((task) => this.matchesTaskSearch(task) && task.isDone).length;
  }

  get rootCategoryCount(): number {
    return this.appService.categories.filter((category) => !category.categoryId).length;
  }

  trackNodeById(index: number, node: TreeNodeVm): number {
    return node.category.id;
  }

  trackTaskById(index: number, task: Task): number {
    return task.id;
  }

  isExpanded(node: TreeNodeVm): boolean {
    return this.expandedNodeIds.has(node.category.id);
  }

  canExpand(node: TreeNodeVm): boolean {
    return this.visibleChildren(node).length > 0 || this.visibleTasks(node).length > 0;
  }

  toggleNode(node: TreeNodeVm, event?: Event): void {
    event?.stopPropagation();
    if (!this.canExpand(node)) {
      return;
    }
    if (this.expandedNodeIds.has(node.category.id)) {
      this.expandedNodeIds.delete(node.category.id);
      return;
    }
    this.expandedNodeIds.add(node.category.id);
  }

  expandAllVisible(): void {
    this.visibleRootNodes.forEach((node) => this.expandNodeRecursive(node));
  }

  collapseAll(): void {
    this.expandedNodeIds.clear();
    this.expandRootCategories();
  }

  clearSearch(): void {
    this.searchText = '';
  }

  onSearchChange(): void {
    if (!this.searchText.trim()) {
      return;
    }
    this.visibleRootNodes.forEach((node) => this.expandMatchingBranches(node));
  }

  visibleChildren(node: TreeNodeVm): TreeNodeVm[] {
    return node.children.filter((child) => child.hasVisibleContent);
  }

  visibleTasks(node: TreeNodeVm): Task[] {
    return node.tasks.filter((task) => this.matchesTaskSearch(task));
  }

  categoryPath(category: Category): string {
    return this.appService.getCategoryPath(category);
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

  private buildTree(): TreeNodeVm[] {
    this.nodeMap.clear();
    const tasksByCategory = new Map<number, Task[]>();
    this.appService.tasks
      .filter((task) => !task.isPaused && !!task.categoryId)
      .forEach((task) => {
        const categoryId = task.categoryId as number;
        const list = tasksByCategory.get(categoryId) ?? [];
        list.push(task);
        tasksByCategory.set(categoryId, list);
      });

    const byParent = new Map<number | null, Category[]>();
    this.appService.categories.forEach((category) => {
      const key = category.categoryId ?? null;
      const list = byParent.get(key) ?? [];
      list.push(category);
      byParent.set(key, list);
    });
    byParent.forEach((list) => list.sort((a, b) => a.title.localeCompare(b.title)));

    const buildNode = (category: Category): TreeNodeVm => {
      const children = (byParent.get(category.id) ?? []).map(buildNode);
      const tasks = (tasksByCategory.get(category.id) ?? []).sort((a, b) => a.title.localeCompare(b.title));
      const visibleTaskCount = tasks.filter((task) => this.matchesTaskSearch(task)).length;
      const childTaskCount = children.reduce((sum, child) => sum + child.totalTaskCount, 0);
      const hasVisibleContent = this.matchesCategorySearch(category)
        || visibleTaskCount > 0
        || children.some((child) => child.hasVisibleContent);

      const node: TreeNodeVm = {
        category,
        children,
        tasks,
        totalTaskCount: tasks.length + childTaskCount,
        visibleTaskCount,
        hasVisibleContent,
      };
      this.nodeMap.set(category.id, node);
      return node;
    };

    return (byParent.get(null) ?? []).map(buildNode);
  }

  private matchesCategorySearch(category: Category): boolean {
    const term = this.searchText.trim().toLowerCase();
    if (!term) {
      return true;
    }
    return category.title.toLowerCase().includes(term)
      || !!category.description?.toLowerCase().includes(term)
      || this.categoryPath(category).toLowerCase().includes(term);
  }

  private matchesTaskSearch(task: Task): boolean {
    const term = this.searchText.trim().toLowerCase();
    if (!term) {
      return !task.isPaused;
    }
    return !task.isPaused
      && (task.title.toLowerCase().includes(term)
        || !!task.description?.toLowerCase().includes(term)
        || !!task.categoryName?.toLowerCase().includes(term));
  }

  private expandRootCategories(): void {
    this.appService.categories
      .filter((category) => !category.categoryId)
      .forEach((category) => this.expandedNodeIds.add(category.id));
  }

  private expandNodeRecursive(node: TreeNodeVm): void {
    this.expandedNodeIds.add(node.category.id);
    node.children.forEach((child) => this.expandNodeRecursive(child));
  }

  private expandMatchingBranches(node: TreeNodeVm): void {
    const matchingChildren = this.visibleChildren(node);
    const hasMatchingTasks = this.visibleTasks(node).length > 0;
    if (matchingChildren.length || hasMatchingTasks) {
      this.expandedNodeIds.add(node.category.id);
    }
    matchingChildren.forEach((child) => this.expandMatchingBranches(child));
  }
}
