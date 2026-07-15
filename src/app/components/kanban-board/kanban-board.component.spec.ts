import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { KanbanBoardComponent } from './kanban-board.component';
import { AppService } from '../../services/app.service';
import { SettingsService } from '../../services/settings.service';
import { INIT_TASK, Task, WeekDay } from '../../services/interfaces';

describe('KanbanBoardComponent', () => {
  let component: KanbanBoardComponent;
  let fixture: ComponentFixture<KanbanBoardComponent>;
  let mockAppService: { tasks: Task[]; categories: [] };

  const makeTask = (overrides: Partial<Task>): Task => ({
    ...INIT_TASK,
    id: overrides.id ?? 1,
    title: overrides.title ?? 'Task',
    ...overrides,
  });

  beforeEach(async () => {
    mockAppService = { tasks: [], categories: [] };

    await TestBed.configureTestingModule({
      imports: [KanbanBoardComponent],
      providers: [
        { provide: AppService, useValue: mockAppService },
        {
          provide: SettingsService,
          useValue: { borderItems$: new BehaviorSubject([]).asObservable() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KanbanBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('today column', () => {
    const today = new Date().getDay() as WeekDay;
    const otherDay = ((today + 1) % 7) as WeekDay;

    it('includes a today column with tasks scheduled for the current weekday', () => {
      const scheduledToday = makeTask({ id: 1, title: 'Due today', weekDays: [today] });
      const scheduledOther = makeTask({ id: 2, title: 'Other day', weekDays: [otherDay] });
      const noSchedule = makeTask({ id: 3, title: 'No schedule' });

      mockAppService.tasks = [scheduledToday, scheduledOther, noSchedule];
      fixture.detectChanges();

      const todayCol = component.columns.find(c => c.id === 'today');
      expect(todayCol).toBeDefined();
      expect(todayCol?.tasks.map(t => t.id)).toEqual([1]);
    });

    it('omits the today column when no tasks match', () => {
      mockAppService.tasks = [
        makeTask({ id: 1, weekDays: [otherDay] }),
        makeTask({ id: 2, weekDays: [] }),
      ];
      fixture.detectChanges();

      expect(component.columns.find(c => c.id === 'today')).toBeUndefined();
    });

    it('places the today column before recent', () => {
      const scheduledToday = makeTask({
        id: 1,
        weekDays: [today],
        lastUpdatedAt: Date.now(),
      });
      mockAppService.tasks = [scheduledToday];
      fixture.detectChanges();

      const ids = component.columns.map(c => c.id);
      const todayIdx = ids.indexOf('today');
      const recentIdx = ids.indexOf('recent');
      expect(todayIdx).toBeGreaterThanOrEqual(0);
      if (recentIdx >= 0) {
        expect(todayIdx).toBeLessThan(recentIdx);
      }
    });
  });
});
