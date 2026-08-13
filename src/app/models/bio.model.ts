export type BioTextTone = 'cyan' | 'blue' | 'purple' | 'pink';

export interface BioTextSegment {
  readonly text: string;
  readonly emphasis?: boolean;
  readonly tone?: BioTextTone;
  readonly href?: string;
  readonly external?: boolean;
  readonly sideNote?: boolean;
}

export interface BioHistoryEntry {
  readonly index: string;
  readonly id: string;
  readonly title: string;
  readonly tone: BioTextTone;
  readonly segments: readonly BioTextSegment[];
}

export interface BioAbout {
  readonly intro: readonly BioTextSegment[];
  readonly history: readonly BioHistoryEntry[];
}

export interface Bio {
  name: string;
  alias: string;
  title: string;
  tagline: string;
  email: string;
  about: BioAbout;
}
