import { Router } from 'express';
import type { createAiotCatalogService } from '../application/aiot-catalog-service.js';

export function aiotRoutes(service: ReturnType<typeof createAiotCatalogService>) {
  const router = Router();
  router.get('/latest', (_request, response) => response.json(service.latest()));
  return router;
}
