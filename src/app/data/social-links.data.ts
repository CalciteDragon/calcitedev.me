import { SocialLink } from '../models/social-link.model';

// Handles are placeholders until the real account names are confirmed; the URLs
// they are derived from are the live profiles.
export const socialLinksData: readonly SocialLink[] = [
  {
    platform: 'github',
    url: 'https://github.com/CalciteDragon',
    label: 'GitHub',
    handle: '@CalciteDragon',
  },
  {
    platform: 'discord',
    url: 'https://discord.com/users/calcite',
    label: 'Discord',
    handle: '@calcite',
  },
  {
    platform: 'linkedin',
    url: 'https://linkedin.com/in/tyler-hawthorn',
    label: 'LinkedIn',
    handle: 'in/tyler-hawthorn',
  },
];
