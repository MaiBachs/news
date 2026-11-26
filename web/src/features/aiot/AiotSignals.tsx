import { useEffect, useState } from 'react';
import { archiveTopicLabels } from '../../../../shared/bulletins';
import type { ArchivePage } from '../../../../shared/bulletins';
import { errorMessage } from '../../shared/http';
import { marketLabels } from '../../shared/market-labels';
import { getArchivePage } from '../bulletins/bulletin-api';
import { formatBulletinDate } from '../bulletins/bulletin-date';
import { storyText } from '../bulletins/story-text';

const signalTopics = ['aiot', 'giong-noi', 'chatbot'] as const;

export function AiotSignals() {
  const [topic, setTopic] = useState<(typeof signalTopics)[number]>('aiot');
  return (
    <section aria-label="Tín hiệu AIoT và chatbot">
      <div className="profile-tabs" aria-label="Chủ đề tín hiệu">
        {signalTopics.map((entry) => <button key={entry} type="button" className="button" aria-pressed={entry === topic}
          onClick={() => setTopic(entry)}>{archiveTopicLabels[entry]}</button>)}
      </div>
      <SignalList key={topic} topic={topic} />
    </section>
  );
}

function SignalList({ topic }: { topic: (typeof signalTopics)[number] }) {
  const [data, setData] = useState<ArchivePage>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getArchivePage({ bulletinDate: null, market: null, search: '', topic, minScore: 4, offset: 0 }, controller.signal)
      .then(setData).catch((failure) => {
        if (!controller.signal.aborted) setError(errorMessage(failure, 'Chưa đọc được tín hiệu từ Kho tin.'));
      });
    return () => controller.abort();
  }, [topic, attempt]);

  if (error) return <div className="panel empty-state">
    <p role="alert">{error}</p>
    <button type="button" className="button" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Thử lại</button>
  </div>;
  if (!data) return <p className="page-description" role="status">Đang tải tín hiệu…</p>;
  const matching = data.groups.find((group) => group.topic === topic);
  if (!matching?.count) return <p className="page-description">Chưa có tín hiệu từ 4 điểm cho chủ đề này.</p>;

  return <>
    <p className="page-description">{matching.stories.length} / {matching.count} tín hiệu mới nhất đạt từ 4 điểm.</p>
    <div className="story-grid">
      {matching.stories.map((story) => {
        const { title, source, summary } = storyText(story);
        return <article key={story.url} className="panel bulletin-panel story-card">
          <p className="story-meta">{marketLabels[story.market]} · {source} · {story.score}/12 điểm</p>
          <h3><a href={story.url}>{title}</a></h3>
          {summary && <p>{summary}</p>}
          <p className="story-meta">{story.publishedOn
            ? <time dateTime={story.publishedOn}>{formatBulletinDate(story.publishedOn)}</time> : 'Chưa rõ ngày đăng'}</p>
        </article>;
      })}
    </div>
  </>;
}
