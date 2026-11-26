import { readFile } from 'node:fs/promises';
import { createChannelVideos } from '../dist/server/src/app.js';
import { readConfig } from '../dist/server/src/config.js';
import { youtubeDataClient } from '../dist/server/src/features/library/infrastructure/youtube-data-client.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const args = process.argv.slice(2);
if (args.length !== 0 && (args.length !== 2 || args[0] !== '--import')) {
  throw new Error('Cách chạy: npm run collect:youtube -- [--import <tệp JSON>]');
}
const config = readConfig(process.env);
if (!args.length && !config.youtubeApiKey) {
  console.error('Chưa có YOUTUBE_API_KEY. Radar có thể nhập video chọn lọc bằng --import.');
  process.exitCode = 1;
} else {
  const database = openDatabase(config.dbPath, config.migrationsDirectory);
  try {
    const videos = createChannelVideos(database);
    if (args.length) {
      const input = JSON.parse(await readFile(args[1], 'utf8'));
      console.log(`Đã nhập ${videos.import(input)} video chọn lọc.`);
    } else {
      const results = await videos.collect(youtubeDataClient(config.youtubeApiKey));
      for (const row of results) {
        console.log(`${row.channel.publisher}: ${'error' in row ? row.error : `Đã đọc ${row.count} video`}`);
      }
      process.exitCode = results.some((row) => 'error' in row) ? 1 : 0;
    }
  } finally {
    database.close();
  }
}
