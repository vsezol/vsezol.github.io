import { IconProp } from '@fortawesome/fontawesome-svg-core';

export interface ContactLink {
  icon: IconProp;
  link: string;
  description: string;
  ariaLabel: string;
  withText?: boolean;
}

export type ContactLinkGroups = Record<
  'messenger' | 'work' | 'lifestyle',
  ContactLink[]
>;

export const CONTACT_LINK_GROUPS: ContactLinkGroups = {
  messenger: [
    {
      icon: ['fab', 'telegram'],
      link: 'https://t.me/vsezold',
      description: 'Telegram',
      ariaLabel: 'Link to my Telegram profile',
    },
    {
      icon: ['fas', 'envelope'],
      link: 'mailto:vsezold@gmail.com',
      description: 'Mail',
      ariaLabel: 'Click to write me email',
    },
  ],
  work: [
    {
      icon: ['fab', 'github'],
      link: 'https://github.com/vsezol',
      description: 'Github',
      ariaLabel: 'Link to my Github profile',
    },
    {
      icon: ['fab', 'linkedin'],
      link: 'https://www.linkedin.com/in/vsezol',
      description: 'LinkedIn',
      ariaLabel: 'Link to my LinkedIn profile',
    },
  ],
  lifestyle: [
    {
      icon: ['fab', 'instagram'],
      link: 'https://www.instagram.com/vsezol',
      description: 'Instagram',
      ariaLabel: 'Link to Instagram profile',
    },
    {
      icon: ['fab', 'vk'],
      link: 'https://vk.com/vsezol',
      description: 'VK',
      ariaLabel: 'Link to my VK profile',
    },
    {
      icon: ['fas', 'newspaper'],
      link: 'https://t.me/lifeindev',
      description: 'My channel',
      withText: true,
      ariaLabel: 'Link to my channel in Telegram',
    },
  ],
};
