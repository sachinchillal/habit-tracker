import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';

/** Brand used in page titles. Fixed on purpose: environment.appTitle can differ per deployment. */
export const APP_NAME = 'Habit Tracker';

/** Keep in sync with the <title> in src/index.html. */
export const DEFAULT_TITLE = 'Habit Tracker – Daily habits, to-dos and streaks | Addhuri';

const INDEXABLE_ROBOTS = 'index, follow, max-image-preview:large';
const PRIVATE_ROBOTS = 'noindex, nofollow';

/**
 * Brands every route title ("ToDos | Habit Tracker") and sets the robots meta tag:
 * only routes with `data: { indexable: true }` (the landing page) may be indexed; all
 * other pages show the user's habits and are kept out of search results.
 */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title, private readonly meta: Meta) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.title.setTitle(pageTitle ? `${pageTitle} | ${APP_NAME}` : DEFAULT_TITLE);
    this.meta.updateTag({
      name: 'robots',
      content: this.isIndexable(snapshot.root) ? INDEXABLE_ROBOTS : PRIVATE_ROBOTS,
    });
  }

  private isIndexable(route: ActivatedRouteSnapshot): boolean {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data['indexable'] === true;
  }
}
