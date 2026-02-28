import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AppService } from './services/app.service';
import { LoaderComponent } from './components/loader/loader.component';
import { ToastComponent } from "./components/toast/toast.component";
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, LoaderComponent, ToastComponent, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'habit-tracker';

  constructor(public appService: AppService) { }
}
