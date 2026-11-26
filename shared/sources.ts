export const markets = ['GLOBAL', 'CHINA', 'VIETNAM'] as const;
export const purposes = ['NEWS', 'LIBRARY'] as const;

export type Market = (typeof markets)[number];
export type SourcePurpose = (typeof purposes)[number];

export interface NewSource {
  name: string;
  feedUrl: string;
  market: Market;
  purpose: SourcePurpose;
  libraryKind?: 'COMMUNITY';
}

export interface FeedSource extends NewSource {
  id: string;
  enabled: boolean;
}

export const sourceLimits = { name: 120, feedUrl: 2048 } as const;
