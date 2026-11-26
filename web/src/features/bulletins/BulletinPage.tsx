import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { Bulletin } from '../../../../shared/bulletins';
import { errorMessage } from '../../shared/http';
import { marketLabels } from '../../shared/market-labels';
import { getLatestBulletin } from './bulletin-api';
import { formatBulletinDate } from './bulletin-date';
import { BulletinMarketChart } from './BulletinChart';
import { NewsTopicNav, NewsTopicSection } from './NewsTopicNav';
import { storyText } from './story-text';
import { groupStories, storyTopicLabels, topicSearch } from './story-topics';

export function BulletinPage() {
  const [params] = useSearchParams();
  const [bulletin, setBulletin] = useState<Bulletin | null>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getLatestBulletin(controller.signal)
      .then(setBulletin)
      .catch((failure) => {
        if (!controller.signal.aborted) setError(errorMessage(failure, 'Chưa đọc được bản tin.'));
      });
    return () => controller.abort();
  }, [attempt]);

  if (error) {
    return (
      <div className="panel empty-state">
        <p role="alert">{error}</p>
        <button type="button" className="button" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Thử lại</button>
      </div>
    );
  }
  if (bulletin === undefined) return <p className="page-description" role="status">Đang tải bản tin…</p>;
  if (bulletin === null) {
    return (
      <>
        <p className="page-description">Chưa có bản tin đã nhập.</p>
        <BulletinMarketChart stories={[]} />
      </>
    );
  }

  const groups = groupStories(bulletin.stories);
  const active = groups.find(({ topic }) => topic === params.get('chu-de'))?.topic;
  const shown = active ? groups.filter(({ topic }) => topic === active) : groups;
  const archiveParams = new URLSearchParams({ 'ban-tin': bulletin.date });

  return (
    <>
      <p className="page-description">Tổng hợp thủ công · <time dateTime={bulletin.date}>{formatBulletinDate(bulletin.date)}</time></p>
      <section className="panel bulletin-panel">
        <h2>{bulletin.headline}</h2>
        <p>{bulletin.summary}</p>
      </section>
      <section className="panel bulletin-panel">
        <h2>Giả thuyết cần kiểm chứng</h2>
        <h3>{bulletin.opportunity.title}</h3>
        <p>{bulletin.opportunity.evidence}</p>
        <p><strong>Cách thử.</strong> {bulletin.opportunity.experiment}</p>
      </section>
      <NewsTopicNav params={params} active={active} choices={groups.map(({ topic, stories }) => ({ topic, count: stories.length }))} total={bulletin.stories.length} />
      {shown.map(({ topic, stories }) => (
        <NewsTopicSection key={topic} topic={topic} count={stories.length}>
          <ul className="bulletin-topic-list">
            {stories.map((story) => {
              const { title, summary, source } = storyText(story);
              return (
                <li key={story.url} className="panel bulletin-topic-story">
                  <p className="story-meta">{marketLabels[story.market]} · {source}</p>
                  <h3><a href={story.url}>{title}</a></h3>
                  <p>{summary}</p>
                </li>
              );
            })}
          </ul>
          <p className="news-topic-more">
            <Link to={{ pathname: '/kho-tin', search: topicSearch(archiveParams, topic) }}>
              Xem trong Kho tin · {storyTopicLabels[topic]}
            </Link>
          </p>
        </NewsTopicSection>
      ))}
      <BulletinMarketChart stories={shown.flatMap(({ stories }) => stories)} />
      <p className="bulletin-footer">
        <Link to={`/kho-tin?ban-tin=${bulletin.date}`}>Xem {bulletin.stories.length} bài nguồn trong Kho tin</Link>
      </p>
    </>
  );
}
