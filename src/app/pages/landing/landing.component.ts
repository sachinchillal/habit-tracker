import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

interface Feature {
  title: string;
  text: string;
}

/** Public intro page at "/". The only route search engines may index (see SeoTitleStrategy). */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  readonly features: Feature[] = [
    {
      title: 'Daily check-ins',
      text: "Check off today's habits from a list or a board, filtered by date and time.",
    },
    {
      title: 'Streaks at a glance',
      text: 'See the current and longest streak for every habit, with the last three weeks as a color grid.',
    },
    {
      title: 'Categories and a habit tree',
      text: 'Group habits into nested categories and browse them all in one tree.',
    },
  ];
}
