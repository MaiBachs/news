import type { Market } from './sources.js';

export const libraryKinds = ['YOUTUBE', 'BLOG', 'CASE_STUDY', 'COMMUNITY'] as const;
export type LibraryKind = (typeof libraryKinds)[number];
export const libraryThemes = ['BUSINESS', 'AI', 'IOT', 'MAKING', 'FARMING', 'TOOLS'] as const;
export type LibraryTheme = (typeof libraryThemes)[number];

export interface LibraryCaseStudy {
  product: string;
  customer: string;
  pricing: string;
  acquisition?: string;
  reportedRevenue?: string;
}

interface LibraryResourceDetails {
  url: string;
  title: string;
  publisher: string;
  kind: LibraryKind;
  market: Market;
  summary: string;
  theme?: LibraryTheme;
  topics: string[];
}

export type LibraryResource = LibraryResourceDetails & (
  | { fromFeed?: never; takeaway: string; caseStudy?: LibraryCaseStudy; startHere?: { label: string; url: string } }
  | { fromFeed: true; takeaway?: never; caseStudy?: never; startHere?: never;
    publishedOn?: string | null; translation?: { title: string; summary: string } }
);

export type LibraryItem = LibraryResource & { saved: boolean };

export const youtubeChannelUrlPattern = /^https:\/\/(?:www\.)?youtube\.com\/(?:@[a-zA-Z0-9._-]+|channel\/UC[\w-]{22})\/?$/;

export interface ChannelVideo {
  url: string;
  title: string;
  publishedOn: string | null;
  summary: string;
  keyPoints?: string[];
  basis: 'EDITORIAL' | 'DESCRIPTION';
}
