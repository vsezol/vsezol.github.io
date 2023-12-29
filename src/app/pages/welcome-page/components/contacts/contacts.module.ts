import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { NgModule } from '@angular/core';
import { logoTgIcon } from '@app/declarations/constants/icons/logo-tg.icon';
import { AriaLabelDirective } from '@app/directives/aria-label.directive';
import {
  PupaIconsModule,
  iosMailIcon,
  iosPaperIcon,
  logoGithubIcon,
  logoInstagramIcon,
  logoLinkedinIcon,
  logoVkIcon,
} from '@bimeister/pupakit.icons';
import { PupaButtonsModule, PupaTooltipModule } from '@bimeister/pupakit.kit';
import { ContactsComponent } from './contacts.component';

@NgModule({
  imports: [
    PupaIconsModule.forFeature([
      logoVkIcon,
      logoGithubIcon,
      logoTgIcon,
      iosMailIcon,
      logoInstagramIcon,
      iosPaperIcon,
      logoLinkedinIcon,
    ]),
    PupaButtonsModule,
    PupaTooltipModule,
    NgFor,
    NgIf,
    NgTemplateOutlet,
    AriaLabelDirective,
  ],
  declarations: [ContactsComponent],
  exports: [ContactsComponent],
})
export class ContactsModule {}
