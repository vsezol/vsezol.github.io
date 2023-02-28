import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContactLink } from '@app/declarations/interfaces/contact-link.interface';
import { getCurrentGreeting } from '@app/functions/common/get-current-greeting.function';

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
})
export class WelcomePageComponent {
  public readonly contacts: ContactLink[][] = CONTACT_LINKS;

  public readonly avatarSrc: SafeResourceUrl;

  public readonly currentGreeting: string = getCurrentGreeting();

  constructor(sanitizer: DomSanitizer) {
    this.avatarSrc = sanitizer.bypassSecurityTrustResourceUrl(
      'assets/my-avatar.webp'
    );
  }
}
