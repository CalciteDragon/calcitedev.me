export interface SocialLink {
  /** Matches the platform keys in SocialLinksComponent.iconPaths (e.g. 'github', 'discord', 'linkedin') */
  platform: string;
  url: string;
  label: string;
}
