import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { logoTgIcon } from '@app/declarations/constants/icons/logo-tg.icon';
import { SharedModule } from '@app/shared/shared.module';
import {
  iosMailIcon,
  iosPaperIcon,
  logoGithubIcon,
  logoInstagramIcon,
  logoVkIcon,
  PupaIconsModule,
} from '@bimeister/pupakit.icons';
import { ContactsComponent } from './components/contacts/contacts.component';
import { WelcomePageComponent } from './welcome-page.component';
import { welcomePageRoutes } from './welcome-page.routes';

@NgModule({
  declarations: [WelcomePageComponent, ContactsComponent],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(welcomePageRoutes),
    PupaIconsModule.forFeature([
      logoVkIcon,
      logoGithubIcon,
      logoTgIcon,
      iosMailIcon,
      logoInstagramIcon,
      iosPaperIcon,
    ]),
  ],
})
export class WelcomePageModule {}
