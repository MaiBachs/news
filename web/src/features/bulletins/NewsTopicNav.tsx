import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import type { StoryTopic } from './story-topics';
import { storyTopicLabels, topicSearch } from './story-topics';

export function NewsTopicNav({ params, active, choices, total }: {
  params: URLSearchParams;
  active: StoryTopic | undefined;
  choices: { topic: StoryTopic; count: number }[];
  total: number;
}) {
  const navigate = useNavigate();
  if (!choices.length) return null;
  const searchFor = (topic?: StoryTopic) => ({ search: topicSearch(params, topic) });
  return (
    <nav className="news-topic-nav" aria-label="Chủ đề tin">
      <div className="news-topic-links">
        <Link className="button" to={searchFor()} aria-current={!active ? 'page' : undefined}>
          Tất cả chủ đề <span>{total}</span>
        </Link>
        {choices.map(({ topic, count }) => (
          <Link className="button" key={topic} to={searchFor(topic)} aria-current={topic === active ? 'page' : undefined}>
            {storyTopicLabels[topic]} <span>{count}</span>
          </Link>
        ))}
      </div>
      <label className="field news-topic-select">
        <span>Chủ đề</span>
        <select value={active ?? ''} onChange={(event) => {
          const chosen = choices.find(({ topic }) => topic === event.target.value);
          void navigate(searchFor(chosen?.topic));
        }}>
          <option value="">Tất cả chủ đề ({total})</option>
          {choices.map(({ topic, count }) => (
            <option key={topic} value={topic}>{storyTopicLabels[topic]} ({count})</option>
          ))}
        </select>
      </label>
    </nav>
  );
}

export function NewsTopicSection({ topic, count, children }: { topic: StoryTopic; count: number; children: ReactNode }) {
  const headingId = `news-topic-${topic}`;
  return (
    <section className="news-topic-section" aria-labelledby={headingId}>
      <header className="news-topic-heading">
        <h2 id={headingId}>{storyTopicLabels[topic]}</h2>
        <span className="secondary">{count} tin</span>
      </header>
      {children}
    </section>
  );
}
