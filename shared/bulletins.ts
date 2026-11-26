import type { Market } from './sources.js';

export const newsTopics = [
  'giong-noi', 'ai-agent', 'mo-hinh-ai', 'aiot', 'chatbot', 'phan-cung', 'phan-mem', 'ha-tang-so', 'bao-mat',
  'kinh-doanh', 'tai-chinh', 'nghe-tay-trai', 'nong-nghiep', 'khoa-hoc',
] as const;
export type NewsTopic = (typeof newsTopics)[number];
export const archiveTopics = [...newsTopics, 'khac'] as const;
export type ArchiveTopic = (typeof archiveTopics)[number];

export const archiveTopicLabels: Record<ArchiveTopic, string> = {
  'giong-noi': 'AI giọng nói', 'ai-agent': 'AI agent', 'mo-hinh-ai': 'Mô hình & ứng dụng AI',
  aiot: 'AIoT & thiết bị thông minh', chatbot: 'Chatbot & trợ lý ảo', 'phan-cung': 'Phần cứng & chip', 'phan-mem': 'Phần mềm & công cụ',
  'ha-tang-so': 'Mạng & hạ tầng số', 'bao-mat': 'An toàn dữ liệu', 'kinh-doanh': 'Kinh doanh & sản phẩm',
  'tai-chinh': 'Tài chính & bảo hiểm', 'nghe-tay-trai': 'Nghề tay trái', 'nong-nghiep': 'Nông nghiệp & chăn nuôi',
  'khoa-hoc': 'Khoa học & môi trường', khac: 'Chưa phân loại',
};

export const storySourceLabels = new Map([
  ['36Kr 快讯', '36Kr · Tin nhanh'], ['36Kr 科技创投', '36Kr · Công nghệ và đầu tư'], ['IT之家 (ITHome)', 'ITHome'],
  ['开源中国 OSCHINA', 'OSCHINA'], ['爱范儿 iFanr', 'iFanr'], ['量子位 QbitAI', 'QbitAI'], ['钛媒体 TMTPost', 'TMTPost'],
]);

export const archivePageSize = 20;

export interface ArchiveQuery {
  bulletinDate: string | null;
  market: Market | null;
  topic: ArchiveTopic | null;
  search: string;
  offset: number;
  minScore?: number;
}

export interface ArchiveDateCounts {
  dates: { date: string; count: number }[];
  olderCount: number;
  undatedCount: number;
}

export interface ArchivePage {
  total: number;
  selectedTotal: number;
  activeTopic: ArchiveTopic | null;
  choices: { topic: ArchiveTopic; count: number }[];
  groups: { topic: ArchiveTopic; count: number; stories: BulletinStory[] }[];
  chart: ArchiveDateCounts;
}

export interface StoryDigest {
  basis: 'ARTICLE' | 'SOURCE_PREVIEW';
  keyPoints: string[];
  hasDetails?: true;
}

export interface StoryDigestSection {
  heading: string;
  paragraphs: string[];
}

export interface StoryTranslation {
  title: string;
  summary: string;
}

export interface BulletinStory {
  title: string;
  summary: string;
  market: Market;
  source: string;
  url: string;
  publishedOn: string | null;
  topic?: NewsTopic;
  fromFeed?: true;
  digest?: StoryDigest;
  translation?: StoryTranslation;
  score?: number;
}

export interface Bulletin {
  date: string;
  headline: string;
  summary: string;
  opportunity: { title: string; evidence: string; experiment: string };
  stories: BulletinStory[];
}

export interface OpportunityMonth {
  month: string;
  count: number;
}
