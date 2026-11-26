import { readFile } from 'node:fs/promises';
import { createFeedCollection, translateCollectedNews, translateCommunityDiscussions } from '../dist/server/src/app.js';
import { readConfig } from '../dist/server/src/config.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const args = process.argv.slice(2);
const translateOnly = args.includes('--translate-only');
const chinaCommunityOnly = args.includes('--china-community');
if (args.some((argument) => !['--seed', '--backfill', '--translate-only', '--china-community'].includes(argument))
  || new Set(args).size !== args.length || (translateOnly && (args.includes('--seed') || args.includes('--backfill')))) {
  throw new Error('Cách chạy: npm run collect -- [--china-community] [--seed] [--backfill] hoặc npm run collect -- [--china-community] --translate-only');
}
const config = readConfig(process.env);
const database = openDatabase(config.dbPath, config.migrationsDirectory);
try {
  if (!translateOnly) {
    const collection = createFeedCollection(database);
    if (args.includes('--seed')) {
      const starterFeeds = JSON.parse(await readFile(new URL('./starter-feeds.json', import.meta.url), 'utf8'));
      const inserted = starterFeeds.filter((source) => (!chinaCommunityOnly || source.libraryKind === 'COMMUNITY') && collection.register(source));
      console.log(`Đã thêm ${inserted.length} nguồn khởi đầu.`);
    }
    const results = await collection.run({ backfill: args.includes('--backfill'), chinaCommunityOnly });
    for (const row of results) {
      const source = `${row.source.name} [${row.source.market}/${row.source.purpose}]`;
      console.log('error' in row ? `${source} | Bỏ qua: ${row.error}` : `${source} | Đọc ${row.found}, chọn ${row.selected}, thêm ${row.added}`);
    }
    if (!results.length) console.log('Chưa có nguồn nào đang bật.');
    if (results.some((row) => 'error' in row)) process.exitCode = 1;
  }
  if (config.newsTranslation) {
    if (!chinaCommunityOnly) {
      const result = await translateCollectedNews(database, config.newsTranslation, (saved, total) => {
        console.log(`Đã lưu ${saved}/${total} bản dịch tiếng Việt cho Kho tin.`);
      });
      if (!result.candidates) console.log('Kho tin không còn bài cần dịch.');
    }
    const community = await translateCommunityDiscussions(database, config.newsTranslation, (saved, total) => {
      console.log(`Đã lưu ${saved}/${total} bản dịch tiếng Việt cho thảo luận cộng đồng.`);
    });
    if (chinaCommunityOnly && !community.candidates) console.log('Cộng đồng Trung Quốc không còn thảo luận cần dịch.');
  } else if (translateOnly) {
    throw new Error('Cần cấu hình RADAR_NEWS_CHROME để dịch tin.');
  } else {
    console.log('Tin đã được lưu. Radar cần bộ dịch cục bộ để tạo bản tiếng Việt cho các bài tiếng nước ngoài.');
  }
} finally {
  database.close();
}
