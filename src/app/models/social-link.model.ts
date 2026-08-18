export interface SocialLink {
  /** Matches the platform keys in SocialLinksComponent.iconPaths (e.g. 'email', 'github', 'discord', 'linkedin') */
  platform: string;
  url: string;
  /** Accessible/visible name of the channel (e.g. 'GitHub'). */
  label: string;
  /** Public handle rendered beside the icon in the contact list (e.g. '@calcite'). */
  handle: string;
}
