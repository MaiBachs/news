import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createRankingService } from '../dist/server/src/features/rankings/application/ranking-service.js';
import { sqliteRankingRepository } from '../dist/server/src/features/rankings/infrastructure/sqlite-ranking-repository.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const migrations = fileURLToPath(new URL('../server/migrations', import.meta.url));
const base = {
  id: 'docs', title: 'Chứng từ', rationale: 'Thử một mẫu phiếu.', competition: 'Chưa có đủ dữ liệu.',
  ratings: { demand: 4, monetization: 3, soloFit: 4, momentum: 3 }, sourceIds: ['reference'],
};
const industry = { ...base, nearTerm: 'Thử quy trình.', mediumTerm: 'Đo tỷ lệ lặp.', watch: 'Thời gian xử lý.' };
const niche = { ...base, id: 'delivery', industryId: 'docs', revenueModel: 'Phí theo lô.', test: 'Đo lỗi nhập liệu.' };
const report = {
  date: '2026-11-21', overview: 'Ưu tiên quy trình hẹp.', limits: 'Chưa có số liệu cạnh tranh.',
  sources: [{ id: 'reference', label: 'Nguồn', url: 'https://example.com/reference' }],
  industries: [industry],
  niches: [niche],
};

test('ranking reports calculate comparable scores, tie equal entries, and replace reports for the same date', (context) => {
  const database = openDatabase(':memory:', migrations);
  context.after(() => database.close());
  const service = createRankingService(sqliteRankingRepository(database));
  assert.equal(service.latest(), null);
  const tied = { ...niche, id: 'same', title: 'Tương đương' };
  const lower = { ...niche, id: 'lower', title: 'Khác', ratings: { ...niche.ratings, demand: 2 } };
  service.import({ ...report, niches: [lower, tied, niche] });
  assert.deepEqual(service.latest().niches.map(({ score, rank }) => [score, rank]), [[54, 1], [54, 1], [44, 3]]);
  assert.equal(service.latest().industries[0].score, 54);

  service.import({ ...report, date: '2026-11-20', overview: 'Bản trước.' });
  service.import({ ...report, overview: 'Bản cập nhật.' });
  assert.equal(service.latest().date, '2026-11-21');
  assert.equal(service.latest().overview, 'Bản cập nhật.');
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM ranking_assessments').get().count, 2);
});

test('an invalid ranking report is rejected before it can replace a valid report', (context) => {
  const database = openDatabase(':memory:', migrations);
  context.after(() => database.close());
  const service = createRankingService(sqliteRankingRepository(database));
  service.import(report);
  assert.throws(() => service.import({ ...report, date: '2026-02-30' }), /valid assessment date/);
  assert.throws(() => service.import({ ...report, industries: [{ ...industry, sourceIds: ['unknown'] }] }), /known sources/);
  assert.throws(() => service.import({ ...report, niches: [{ ...niche, industryId: 'unknown' }] }), /unknown industry/);
  assert.throws(() => service.import({ ...report, niches: [{ ...niche, ratings: { ...niche.ratings, demand: 6 } }] }), /0 to 5/);
  assert.throws(() => service.import({ ...report, sources: [{ ...report.sources[0], url: 'javascript:alert(1)' }] }), /source URL/);
  assert.equal(service.latest().overview, report.overview);
});

test('market rankings use six criteria and omit direct major competitors from ranking positions', (context) => {
  const database = openDatabase(':memory:', migrations);
  context.after(() => database.close());
  const service = createRankingService(sqliteRankingRepository(database));
  const signal = { assessment: 'Tín hiệu có nguồn.', sourceIds: ['reference'] };
  const competitor = { name: 'Nhà cung cấp', type: 'MAJOR', overlap: 'PLATFORM', coverage: 'Cung cấp OCR.', sourceId: 'reference' };
  const market = { decision: 'PILOT', demand: signal, competitors: [competitor], opening: 'Thử một lô.',
    operation: { level: 'INDEPENDENT', details: 'Dùng định dạng mở và tự tìm khách.' },
    aiPotential: signal, vietnam: signal, validation: 'Đo thời gian.' };
  const ratings = { ...base.ratings, competitionRoom: 3, vietnamFit: 4 };
  const eligible = { ...niche, ratings, market, crossFieldLearning: 'Học đối chiếu dữ liệu từ bảng tính.' };
  const excluded = { ...niche, id: 'excluded', ratings: { ...ratings, demand: 5 }, market: {
    ...market, decision: 'EXCLUDE', competitors: [{ ...competitor, overlap: 'DIRECT' }],
  } };
  const marketReport = { ...report, method: 'MARKET', industries: [{ ...industry, ratings, market }], niches: [excluded, eligible] };

  service.import(marketReport);
  assert.equal(service.latest().method, 'MARKET');
  assert.deepEqual(service.latest().niches.map(({ id, score, rank }) => [id, score, rank]), [
    [eligible.id, 71, 1], [excluded.id, 76, null],
  ]);
  assert.deepEqual(service.latest().niches[0].market.operation, market.operation);
  assert.equal(service.latest().niches[0].crossFieldLearning, eligible.crossFieldLearning);
  assert.throws(() => service.import({ ...marketReport, niches: [{ ...eligible, market: { ...market, operation: undefined } }] }), /operating conditions/);
  assert.throws(() => service.import({ ...report, niches: [{ ...niche, crossFieldLearning: eligible.crossFieldLearning }] }), /market assessment/);
  assert.throws(() => service.import({ ...marketReport, niches: [{ ...eligible, market: { ...market, operation: { level: 'UNKNOWN' } } }] }), /operation level/);
  assert.throws(() => service.import({ ...marketReport, niches: [{ ...eligible, ratings: base.ratings }] }), /competitionRoom/);
  assert.throws(() => service.import({ ...marketReport, method: 'UNKNOWN' }), /Unknown ranking method/);
  assert.throws(() => service.import({ ...marketReport, niches: [{ ...eligible, market: { ...market, decision: 'EXCLUDE' } }] }), /same market and workflow/);
  assert.throws(() => service.import({ ...marketReport, niches: [{ ...eligible, market: { ...excluded.market, decision: 'PILOT' } }] }), /same market and workflow/);
  assert.throws(() => service.import({ ...marketReport, niches: [{ ...eligible, market: { ...market, vietnam: { ...signal, sourceIds: ['unknown'] } } }] }), /known sources/);
});
