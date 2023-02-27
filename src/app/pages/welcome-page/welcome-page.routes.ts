import { Route } from '@angular/router';
import { WelcomePageComponent } from './welcome-page.component';

export const welcomePageRoutes: Route[] = [
  {
    path: '',
    component: WelcomePageComponent,
  },
];
