import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { buildInfo } from './environments/build-info';

console.info(
  `Habit Tracker v${buildInfo.version} (${buildInfo.commit}${buildInfo.dirty ? '-dirty' : ''}) built ${buildInfo.builtAt}`
);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
