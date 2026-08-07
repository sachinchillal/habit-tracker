import { Component, OnDestroy, OnInit } from '@angular/core';
import { AppService } from '../../services/app.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { DayInfo, INIT_DAY_INFO, Task } from '../../services/interfaces';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface TaskWithDayInfo extends Task {
  dayInfo: DayInfo[];
  streaks: { current: number; longest: number };
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  // Define the number of days to display in the grid
  readonly daysToShow = 7 * 3; // 5 weeks
  readonly tasks: TaskWithDayInfo[] = [];

  private habitsSub?: Subscription;

  constructor(public appService: AppService, private activatedRoute: ActivatedRoute) {
    this.appService.setCurrentPage(this.activatedRoute.snapshot.data['page']);
  }

  ngOnInit(): void {
    this.rebuildView();
    this.habitsSub = this.appService.habitsDataChanged.subscribe(() => this.rebuildView());
  }

  ngOnDestroy(): void {
    this.habitsSub?.unsubscribe();
  }

  private rebuildView(): void {
    this.tasks.length = 0;
    for (const task of this.appService.tasks) {
      const timestamps = this.appService.marks[task.id] ?? [];
      this.tasks.push({
        ...task,
        dayInfo: this.buildDaysList(timestamps),
        streaks: this.computeStreaks(timestamps),
      });
    }
  }

  private buildDaysList(timestamps: number[]): DayInfo[] {
    const uniqueDays = this.dedupeByDay(timestamps);
    if (uniqueDays.length === 0) {
      return [];
    }

    const daysList: DayInfo[] = [];
    let prevDayKey: number | null = null;
    let prevCreatedAt = 0;

    for (const [dayKey, createdAt] of uniqueDays) {
      if (prevDayKey !== null) {
        for (let day = prevDayKey + 1; day < dayKey; day++) {
          const di = { ...INIT_DAY_INFO };
          di.id = daysList.length + 1;
          di.status = 'Missed';
          di.color = 'bg-rose-900';
          di.createdAt = prevCreatedAt + (day - prevDayKey) * MS_PER_DAY;
          daysList.push(di);
        }
      }

      const di = { ...INIT_DAY_INFO };
      di.id = daysList.length + 1;
      di.status = 'Done';
      di.color = 'bg-emerald-500';
      di.createdAt = createdAt;
      daysList.push(di);

      prevDayKey = dayKey;
      prevCreatedAt = createdAt;
    }

    const lastCreatedAt = new Date(uniqueDays[uniqueDays.length - 1][1]);
    lastCreatedAt.setHours(0, 0, 0, 0);

    const today = new Date();
    if (lastCreatedAt.getDate() !== today.getDate() ||
      lastCreatedAt.getMonth() !== today.getMonth() ||
      lastCreatedAt.getFullYear() !== today.getFullYear()) {

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const day = lastCreatedAt;
      day.setDate(day.getDate() + 1);
      for (; day <= yesterday; day.setDate(day.getDate() + 1)) {
        const di = { ...INIT_DAY_INFO };
        di.id = daysList.length + 1;
        di.status = 'Missed';
        di.color = 'bg-rose-900';
        di.createdAt = new Date(day).getTime();
        daysList.push(di);
      }

      const di = { ...INIT_DAY_INFO };
      di.id = daysList.length + 1;
      daysList.push(di);
    }

    if (daysList.length > this.daysToShow) {
      return daysList.slice(-this.daysToShow);
    }
    return daysList;
  }

  private computeStreaks(timestamps: number[]): { current: number; longest: number } {
    const dayKeys = this.dedupeByDay(timestamps).map(([day]) => day);
    if (dayKeys.length === 0) {
      return { current: 0, longest: 0 };
    }

    let longest = 1;
    let run = 1;
    for (let i = 1; i < dayKeys.length; i++) {
      if (dayKeys[i] === dayKeys[i - 1] + 1) {
        run++;
        longest = Math.max(longest, run);
      } else {
        run = 1;
      }
    }

    const todayKey = Math.floor(Date.now() / MS_PER_DAY);
    const lastKey = dayKeys[dayKeys.length - 1];
    let current = 0;
    if (lastKey === todayKey || lastKey === todayKey - 1) {
      current = 1;
      for (let i = dayKeys.length - 2; i >= 0; i--) {
        if (dayKeys[i] === dayKeys[i + 1] - 1) {
          current++;
        } else {
          break;
        }
      }
    }

    return { current, longest };
  }

  private dedupeByDay(timestamps: number[]): [number, number][] {
    const sorted = [...(timestamps ?? [])].filter((t) => Number.isFinite(t)).sort((a, b) => a - b);
    const dayToTimestamp = new Map<number, number>();
    for (const ts of sorted) {
      const dayKey = Math.floor(ts / MS_PER_DAY);
      if (!dayToTimestamp.has(dayKey)) {
        dayToTimestamp.set(dayKey, ts);
      }
    }
    return [...dayToTimestamp.entries()].sort((a, b) => a[0] - b[0]);
  }
}
