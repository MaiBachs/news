import { Router } from 'express';
import { serviceLines } from '../../../../../shared/services.js';
import type { createServiceProfiles } from '../application/service-profiles.js';

export function serviceRoutes(service: ReturnType<typeof createServiceProfiles>) {
  const router = Router();
  router.get('/latest', (_request, response) => response.json(service.latest()));
  router.get('/:id/history', (request, response) => {
    const id = serviceLines.find((value) => value === request.params.id);
    if (!id) {
      response.status(400).json({ error: 'Mã nghề không hợp lệ.' });
      return;
    }
    response.json(service.history(id));
  });
  return router;
}
