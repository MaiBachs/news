import { Router } from 'express';
import type { SourceService } from '../application/source-service.js';
import { InvalidSourceError } from '../domain/source.js';

export function sourceRoutes(service: SourceService) {
  const router = Router();

  router.get('/', (_request, response) => {
    response.json(service.list());
  });

  router.post('/', (request, response) => {
    try {
      const source = service.add(request.body);
      if (!source) {
        response.status(409).json({ error: 'Feed này đã có trong mục sử dụng đã chọn.' });
        return;
      }
      response.status(201).json(source);
    } catch (error) {
      if (!(error instanceof InvalidSourceError)) throw error;
      response.status(400).json({ error: error.message });
    }
  });

  router.patch('/:id', (request, response) => {
    const enabled: unknown = request.body?.enabled;
    if (typeof enabled !== 'boolean') {
      response.status(400).json({ error: 'Trạng thái nguồn không hợp lệ.' });
      return;
    }
    if (!service.setEnabled(request.params.id, enabled)) {
      response.status(404).json({ error: 'Không tìm thấy nguồn.' });
      return;
    }
    response.status(204).end();
  });

  return router;
}
