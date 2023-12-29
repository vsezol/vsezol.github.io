import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { ContactLink } from '@app/declarations/interfaces/contact-link.interface';
import { SnowflakeComponent } from '@app/features/snowflake/snowflake.component';
import { getCurrentGreeting } from '@app/functions/common/get-current-greeting.function';
import { PupaCardModule } from '@bimeister/pupakit.kit';
import { ContactsModule } from './components/contacts/contacts.module';

const CONTACT_LINKS: ContactLink[][] = [
  [
    {
      icon: 'logo-tg',
      link: 'https://t.me/vsezold',
      description: 'Telegram',
      ariaLabel: 'Link to my Telegram profile',
    },
    {
      icon: 'ios-mail',
      link: 'mailto:vsezold@gmail.com',
      description: 'Mail',
      ariaLabel: 'Click to write me email',
    },
  ],
  [
    {
      icon: 'logo-github',
      link: 'https://github.com/vsezol',
      description: 'Github',
      ariaLabel: 'Link to my Github profile',
    },
    {
      icon: 'logo-linkedin',
      link: 'https://www.linkedin.com/in/vsezol',
      description: 'LinkedIn',
      ariaLabel: 'Link to my LinkedIn profile',
    },
  ],
  [
    {
      icon: 'logo-instagram',
      link: 'https://www.instagram.com/vsezol',
      description: 'Instagram',
      ariaLabel: 'Link to Instagram profile',
    },
    {
      icon: 'logo-vk',
      link: 'https://vk.com/vsezol',
      description: 'VK',
      ariaLabel: 'Link to my VK profile',
    },
    {
      icon: 'ios-paper',
      link: 'https://t.me/lifeindev',
      description: 'My channel',
      withText: true,
      ariaLabel: 'Link to my channel in Telegram',
    },
  ],
];

@Component({
  selector: 'app-welcome-page',
  templateUrl: './welcome-page.component.html',
  styleUrls: ['./welcome-page.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ContactsModule,
    PupaCardModule,
    NgOptimizedImage,
    SnowflakeComponent,
  ],
})
export class WelcomePageComponent {
  public readonly contacts: ContactLink[][] = CONTACT_LINKS;

  public readonly currentGreeting: string = getCurrentGreeting();
}
