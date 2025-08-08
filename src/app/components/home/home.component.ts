import { Component, OnInit } from '@angular/core';
import { AppService } from '../../services/app.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  // Define the number of days to display in the grid
  readonly daysToShow = 35; // 5 weeks

  constructor(public appService: AppService) { }

  ngOnInit(): void { }

  ut_refresh() {
    this.appService.fetchTrackers();
  }
}
