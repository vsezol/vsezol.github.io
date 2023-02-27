import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/welcome-page/welcome-page.module').then(
        // eslint-disable-next-line @typescript-eslint/typedef
        (m) => m.WelcomePageModule
      ),
  },
];
