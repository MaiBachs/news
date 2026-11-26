import { markets, purposes, sourceLimits } from '../../../../../shared/sources.js';
import type { NewSource } from '../../../../../shared/sources.js';

export class InvalidSourceError extends Error {}

export function parseNewSource(input: unknown): NewSource {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new InvalidSourceError('Dữ liệu nguồn không hợp lệ.');
  }

  const raw = input as Record<string, unknown>;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name || name.length > sourceLimits.name) {
    throw new InvalidSourceError(`Nhập tên nguồn từ 1 đến ${sourceLimits.name} ký tự.`);
  }

  const market = markets.find((value) => value === raw.market);
  const purpose = purposes.find((value) => value === raw.purpose);
  if (!market || !purpose) {
    throw new InvalidSourceError('Chọn thị trường và mục sử dụng hợp lệ.');
  }
  const { libraryKind } = raw;
  if (libraryKind !== undefined && (libraryKind !== 'COMMUNITY' || market !== 'CHINA' || purpose !== 'LIBRARY')) {
    throw new InvalidSourceError('Nguồn cộng đồng cần thuộc Thư viện và thị trường Trung Quốc.');
  }

  const candidate = typeof raw.feedUrl === 'string' ? raw.feedUrl.trim() : '';
  const url = /^https?:\/\//i.test(candidate) ? URL.parse(candidate) : null;
  if (!url || url.username || url.password || url.href.includes('#') || url.href.length > sourceLimits.feedUrl) {
    throw new InvalidSourceError('Nhập URL RSS/Atom hợp lệ dùng HTTP hoặc HTTPS.');
  }

  return { name, feedUrl: url.href, market, purpose, ...(libraryKind ? { libraryKind } : {}) };
}
