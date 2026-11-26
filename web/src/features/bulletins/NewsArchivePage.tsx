import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { archivePageSize, archiveTopics } from '../../../../shared/bulletins';
import type { ArchivePage, BulletinStory } from '../../../../shared/bulletins';
import { markets } from '../../../../shared/sources';
import type { Market } from '../../../../shared/sources';
import { errorMessage } from '../../shared/http';
import { marketLabels } from '../../shared/market-labels';
import { getArchivePage } from './bulletin-api';
import { formatBulletinDate } from './bulletin-date';
import { PublicationDateChart } from './BulletinChart';
import { NewsTopicNav, NewsTopicSection } from './NewsTopicNav';
import { StoryDigestDialog } from './StoryDigestDialog';
import { storyText } from './story-text';
import { storyTopicLabels, topicSearch } from './story-topics';

export function NewsArchivePage() {
  const [params] = useSearchParams();
  const bulletinDate = params.get('ban-tin');
  return <ArchiveResults key={bulletinDate ?? 'all'} bulletinDate={bulletinDate} />;
}

function ArchiveResults({ bulletinDate }: { bulletinDate: string | null }) {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<{ key: string; data: ArchivePage }>();
  const [market, setMarket] = useState<Market | null>(null);
  const [search, setSearch] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<{ key: string; message: string }>();
  const [selectedStory, setSelectedStory] = useState<BulletinStory>();
  const topic = archiveTopics.find((value) => value === params.get('chu-de')) ?? null;
  const page = Number(params.get('trang'));
  const offset = topic && page >= 1 && Number.isSafeInteger(page * archivePageSize) && Number.isInteger(page) ? (page - 1) * archivePageSize : 0;
  const requestKey = JSON.stringify([bulletinDate, market, topic, search, offset, attempt]);

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(params);
    if (nextPage > 1) next.set('trang', String(nextPage));
    else next.delete('trang');
    setParams(next);
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      getArchivePage({ bulletinDate, market, topic, search, offset }, controller.signal)
        .then((data) => { if (!controller.signal.aborted) setResult({ key: requestKey, data }); })
        .catch((error) => {
          if (!controller.signal.aborted) setFailure({ key: requestKey, message: errorMessage(error, 'Chưa đọc được Kho tin.') });
        });
    }, search ? 180 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [bulletinDate, market, topic, search, offset, requestKey]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [topic, offset]);
  const data = result?.key === requestKey ? result.data : undefined;
  const error = failure?.key === requestKey ? failure.message : undefined;
  const currentPage = offset / archivePageSize + 1;

  return (
    <>
      <p className="page-description">
        {bulletinDate === null ? 'Toàn bộ bài đã lưu' : (
          <>Bài nguồn của bản tin ngày <time dateTime={bulletinDate}>{formatBulletinDate(bulletinDate)}</time></>
        )}
      </p>
      {bulletinDate !== null && <Link className="archive-reset" to="/kho-tin">Xem toàn bộ Kho tin</Link>}
      <div className="archive-filters">
        <label className="field">
          <span>Tìm tin</span>
          <input type="search" value={search} maxLength={500} onChange={(event) => {
            setSearch(event.target.value);
            if (offset) goToPage(1);
          }} placeholder="Tiêu đề, nguồn hoặc từ khóa" />
        </label>
        <label className="field">
          <span>Thị trường</span>
          <select value={market ?? ''} onChange={(event) => {
            setMarket(markets.find((value) => value === event.target.value) ?? null);
            if (offset) goToPage(1);
          }}>
            <option value="">Tất cả thị trường</option>
            {markets.map((entry) => <option key={entry} value={entry}>{marketLabels[entry]}</option>)}
          </select>
        </label>
      </div>
      {error ? <div className="panel empty-state">
        <p role="alert">{error}</p>
        <button type="button" className="button" onClick={() => setAttempt(attempt + 1)}>Thử lại</button>
      </div> : data ? <>
        <NewsTopicNav params={params} active={data.activeTopic ?? undefined} total={data.total} choices={data.choices} />
        <p className="secondary" role="status" aria-atomic="true">
          {data.selectedTotal ? `${data.selectedTotal} mục` : 'Chưa có tin phù hợp.'}
        </p>
        {data.groups.map(({ topic, count, stories }) => (
          <NewsTopicSection key={topic} topic={topic} count={count}>
            <div className="story-grid">
              {stories.map((story) => <StoryCard key={story.url} story={story} onOpen={setSelectedStory} />)}
            </div>
            {!data.activeTopic && count > stories.length && <p className="news-topic-more">
              <Link to={{ search: topicSearch(params, topic) }}>Xem cả {count} tin · {storyTopicLabels[topic]}</Link>
            </p>}
          </NewsTopicSection>
        ))}
        {data.activeTopic && (offset > 0 || data.selectedTotal > archivePageSize) && <nav className="archive-actions" aria-label="Trang Kho tin">
          {offset > 0 && <button type="button" className="button" onClick={() => goToPage(currentPage - 1)}>Trang trước</button>}
          <span>Trang {currentPage}</span>
          {offset + archivePageSize < data.selectedTotal && <button type="button" className="button" onClick={() => goToPage(currentPage + 1)}>Trang sau</button>}
          {offset >= data.selectedTotal && <button type="button" className="button" onClick={() => goToPage(1)}>Về trang đầu</button>}
        </nav>}
        <PublicationDateChart {...data.chart} />
      </> : <p className="page-description" role="status">Đang tải Kho tin…</p>}
      {selectedStory && <StoryDigestDialog story={selectedStory} onClose={() => setSelectedStory(undefined)} />}
    </>
  );
}

function StoryCard({ story, onOpen }: { story: BulletinStory; onOpen: (story: BulletinStory) => void }) {
  const { title, summary, source } = storyText(story);
  return (
    <article className="panel bulletin-panel story-card">
      <p className="story-meta">
        {marketLabels[story.market]} · {story.publishedOn
          ? <time dateTime={story.publishedOn}>{formatBulletinDate(story.publishedOn)}</time>
          : 'Chưa rõ ngày đăng'}
      </p>
      <h3><a href={story.url}>{title}</a></h3>
      {summary && <p>{summary}</p>}
      <p className="story-meta">{source}{story.fromFeed && (story.translation ? ' · Bản dịch từ nguồn' : ' · Tiêu đề và trích đoạn từ nguồn')}</p>
      <button type="button" className="button" aria-haspopup="dialog" aria-label={`Tóm tắt ${title}`}
        onClick={() => onOpen(story)}>Tóm tắt</button>
    </article>
  );
}
