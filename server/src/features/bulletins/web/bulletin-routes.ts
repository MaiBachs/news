import { Router } from 'express';
import { archiveTopics } from '../../../../../shared/bulletins.js';
import { markets } from '../../../../../shared/sources.js';
import type { ArchiveQuery } from '../../../../../shared/bulletins.js';
import type { createBulletinService } from '../application/bulletin-service.js';
import { isCalendarDate, storyUrl } from '../domain/bulletin.js';

export function bulletinRoutes(service: ReturnType<typeof createBulletinService>) {
  const router = Router();
  router.get('/latest', (_request, response) => response.json(service.latest()));
  router.get('/stories', (request, response) => {
    const { bulletinDate } = request.query;
    if (bulletinDate !== undefined && !isCalendarDate(bulletinDate)) {
      response.status(400).json({ error: 'Ngày bản tin cần có dạng YYYY-MM-DD và là ngày hợp lệ.' });
      return;
    }
    response.json(service.archivedStories(bulletinDate ?? null));
  });
  router.get('/archive', (request, response) => {
    const query = archiveQuery(request.query);
    if (!query) {
      response.status(400).json({ error: 'Bộ lọc Kho tin không hợp lệ.' });
      return;
    }
    response.json(service.archivePage(query));
  });
  router.get('/opportunity-activity', (_request, response) => response.json(service.opportunityActivity()));
  router.get('/story-summary', (request, response) => {
    let url;
    try {
      url = storyUrl(request.query.url);
    } catch {
      response.status(400).json({ error: 'Link bài gốc không hợp lệ.' });
      return;
    }
    const sections = service.digestSections(url);
    if (sections === null) {
      response.status(404).json({ error: 'Bài này chưa có bản tóm tắt chi tiết.' });
      return;
    }
    response.json(sections);
  });
  return router;
}

function archiveQuery(params: Record<string, unknown>): ArchiveQuery | undefined {
  const { bulletinDate, market, topic, search, offset, minScore } = params;
  if (bulletinDate !== undefined && !isCalendarDate(bulletinDate)) return;
  const allowedMarket = markets.find((value) => value === market);
  const allowedTopic = archiveTopics.find((value) => value === topic);
  if ((market !== undefined && !allowedMarket) || (topic !== undefined && !allowedTopic)) return;
  if (search !== undefined && (typeof search !== 'string' || search.length > 500)) return;
  if (offset !== undefined && (typeof offset !== 'string' || !/^\d+$/.test(offset) || !Number.isSafeInteger(Number(offset)))) return;
  if (minScore !== undefined && (typeof minScore !== 'string' || !/^(?:[0-9]|1[0-2])$/.test(minScore))) return;
  return { bulletinDate: bulletinDate ?? null, market: allowedMarket ?? null, topic: allowedTopic ?? null,
    search: search ?? '', offset: Number(offset ?? 0), ...(minScore === undefined ? {} : { minScore: Number(minScore) }) };
}
