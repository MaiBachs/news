import { Router } from 'express';
import { youtubeChannelUrlPattern } from '../../../../../shared/library.js';
import type { createChannelVideoService } from '../application/channel-video-service.js';
import type { createLibraryService } from '../application/library-service.js';
import { parseLibraryUrl } from '../domain/library-resource.js';

export function libraryRoutes(service: ReturnType<typeof createLibraryService>, videos: ReturnType<typeof createChannelVideoService>) {
  const router = Router();
  router.get('/', (_request, response) => response.json(service.list()));
  router.get('/channel-videos', (request, response) => {
    const url = parseLibraryUrl(request.query.channelUrl);
    if (!url || !youtubeChannelUrlPattern.test(url)) {
      response.status(400).json({ error: 'Đường dẫn kênh YouTube không hợp lệ.' });
      return;
    }
    const items = videos.list(url);
    if (!items) {
      response.status(404).json({ error: 'Không tìm thấy kênh YouTube trong Thư viện.' });
      return;
    }
    response.json(items);
  });
  router.patch('/bookmark', (request, response) => {
    const url = parseLibraryUrl(request.body?.url);
    const saved: unknown = request.body?.saved;
    if (!url || typeof saved !== 'boolean') {
      response.status(400).json({ error: 'Đường dẫn hoặc trạng thái lưu không hợp lệ.' });
      return;
    }
    if (!service.setSaved(url, saved)) {
      response.status(404).json({ error: 'Không tìm thấy tài liệu.' });
      return;
    }
    response.status(204).end();
  });
  return router;
}
