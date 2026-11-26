import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import express from 'express';
import type { ErrorRequestHandler } from 'express';
import type { AiProfile } from '../../shared/ai.js';
import { createConnectionService } from './features/ai/application/connection-service.js';
import { openAiResponses } from './features/ai/infrastructure/openai-responses.js';
import { connectionRoutes } from './features/ai/web/connection-routes.js';
import { createAiotCatalogService } from './features/aiot/application/aiot-catalog-service.js';
import { sqliteAiotCatalog } from './features/aiot/infrastructure/sqlite-aiot-catalog.js';
import { aiotRoutes } from './features/aiot/web/aiot-routes.js';
import { createBulletinService } from './features/bulletins/application/bulletin-service.js';
import { localizeStories } from './features/bulletins/application/localize-stories.js';
import { chromeNewsTranslator } from './features/bulletins/infrastructure/chrome-news-translator.js';
import { sqliteBulletinRepository } from './features/bulletins/infrastructure/sqlite-bulletin-repository.js';
import { sqliteStoryLocalization } from './features/bulletins/infrastructure/sqlite-story-localization.js';
import { bulletinRoutes } from './features/bulletins/web/bulletin-routes.js';
import { createCollection } from './features/collection/application/collect-feeds.js';
import { publicFeedClient } from './features/collection/infrastructure/public-feed-client.js';
import { createFarmCatalog } from './features/farming/application/farm-catalog.js';
import { sqliteFarmCatalog } from './features/farming/infrastructure/sqlite-farm-catalog.js';
import { farmRoutes } from './features/farming/web/farm-routes.js';
import { createChannelVideoService } from './features/library/application/channel-video-service.js';
import { createLibraryService } from './features/library/application/library-service.js';
import { sqliteChannelVideoRepository } from './features/library/infrastructure/sqlite-channel-video-repository.js';
import { sqliteCommunityLocalization } from './features/library/infrastructure/sqlite-community-localization.js';
import { sqliteLibraryRepository } from './features/library/infrastructure/sqlite-library-repository.js';
import { libraryRoutes } from './features/library/web/library-routes.js';
import { createRankingService } from './features/rankings/application/ranking-service.js';
import { sqliteRankingRepository } from './features/rankings/infrastructure/sqlite-ranking-repository.js';
import { rankingRoutes } from './features/rankings/web/ranking-routes.js';
import { createServiceProfiles } from './features/services/application/service-profiles.js';
import { sqliteServiceProfiles } from './features/services/infrastructure/sqlite-service-profiles.js';
import { serviceRoutes } from './features/services/web/service-routes.js';
import { SourceService } from './features/sources/application/source-service.js';
import { sqliteSourceRepository } from './features/sources/infrastructure/sqlite-source-repository.js';
import { sourceRoutes } from './features/sources/web/source-routes.js';

interface AppOptions {
  webDirectory?: string;
  ai: AiProfile;
  openAiApiKey?: string;
}

export function createFeedCollection(database: DatabaseSync) {
  const sources = new SourceService(sqliteSourceRepository(database));
  const bulletins = createBulletinService(sqliteBulletinRepository(database));
  const library = createLibraryService(sqliteLibraryRepository(database));
  return {
    register: (source: unknown) => sources.add(source),
    run: createCollection({
      listSources: () => sources.list(), readFeed: publicFeedClient(),
      saveStories: bulletins.saveCollected, saveResources: library.saveCollected,
    }),
  };
}

export function translateCollectedNews(database: DatabaseSync, options: Parameters<typeof chromeNewsTranslator>[0], onProgress: (count: number, total: number) => void) {
  return localizeStories(sqliteStoryLocalization(database), chromeNewsTranslator(options), Number.MAX_SAFE_INTEGER, onProgress);
}

export function translateCommunityDiscussions(database: DatabaseSync, options: Parameters<typeof chromeNewsTranslator>[0], onProgress: (count: number, total: number) => void) {
  return localizeStories(sqliteCommunityLocalization(database), chromeNewsTranslator(options), Number.MAX_SAFE_INTEGER, onProgress);
}

export function createChannelVideos(database: DatabaseSync, listLibrary = createLibraryService(sqliteLibraryRepository(database)).list) {
  const repository = sqliteChannelVideoRepository(database);
  repository.deleteExpired(Date.now());
  return createChannelVideoService(repository, listLibrary);
}

export function createApp(database: DatabaseSync, options: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_request, response, next) => {
    response.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    });
    next();
  });

  const api = express.Router();
  const sources = new SourceService(sqliteSourceRepository(database));
  const bulletins = createBulletinService(sqliteBulletinRepository(database));
  const library = createLibraryService(sqliteLibraryRepository(database));
  const rankings = createRankingService(sqliteRankingRepository(database));
  const openAi = options.ai.provider === 'openai' && options.openAiApiKey
    ? openAiResponses(options.openAiApiKey)
    : undefined;
  const ai = createConnectionService(options.ai, openAi);

  api.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    // Browser writes require a non-simple header. The API does not enable CORS.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.get('X-Radar-Request') !== '1') {
      response.status(403).json({ error: 'Yêu cầu không hợp lệ.' });
      return;
    }
    next();
  });
  api.use(express.json({ limit: '16kb' }));
  api.get('/health', (_request, response) => response.json({ status: 'ok' }));
  api.use('/sources', sourceRoutes(sources));
  api.use('/bulletins', bulletinRoutes(bulletins));
  api.use('/farming', farmRoutes(createFarmCatalog(sqliteFarmCatalog(database))));
  api.use('/aiot', aiotRoutes(createAiotCatalogService(sqliteAiotCatalog(database))));
  api.use('/library', libraryRoutes(library, createChannelVideos(database, library.list)));
  api.use('/rankings', rankingRoutes(rankings));
  api.use('/services', serviceRoutes(createServiceProfiles(sqliteServiceProfiles(database))));
  api.use('/ai', connectionRoutes(ai));
  api.use((_request, response) => response.status(404).json({ error: 'Không tìm thấy API.' }));
  app.use('/api', api);

  const index = options.webDirectory && join(options.webDirectory, 'index.html');
  if (options.webDirectory && index && existsSync(index)) {
    app.use('/assets', express.static(join(options.webDirectory, 'assets'), {
      index: false,
      redirect: false,
      maxAge: '365d',
      immutable: true,
    }));
    app.use('/assets', (_request, response) => response.set('Cache-Control', 'no-store').sendStatus(404));
    app.use(express.static(options.webDirectory, { index: false }));
    app.get('/{*path}', (_request, response) => response.sendFile(index));
  }

  const handleError: ErrorRequestHandler = (error: unknown, _request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }
    const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined;
    if (status === 400 || status === 413) {
      response.status(status).json({ error: 'Dữ liệu yêu cầu sai định dạng hoặc quá lớn.' });
      return;
    }
    console.error(error);
    response.status(500).json({ error: 'Radar gặp lỗi. Thử lại sau.' });
  };
  app.use(handleError);
  return app;
}
