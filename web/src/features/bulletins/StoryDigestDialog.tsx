import { useEffect, useState } from 'react';
import type { BulletinStory, StoryDigestSection } from '../../../../shared/bulletins';
import { errorMessage } from '../../shared/http';
import { PanelDialog } from '../../shared/PanelDialog';
import { getStoryDigestSections } from './bulletin-api';
import { storyText } from './story-text';

export function StoryDigestDialog({ story, onClose }: { story: BulletinStory; onClose: () => void }) {
  const { url, digest } = story;
  const { title, source } = storyText(story);
  const hasDetails = digest?.hasDetails === true;
  const [sections, setSections] = useState<StoryDigestSection[]>();
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasDetails) return;
    const controller = new AbortController();
    getStoryDigestSections(url, controller.signal).then(setSections).catch((failure) => {
      if (!controller.signal.aborted) setError(errorMessage(failure, 'Chưa tải được tóm tắt chi tiết.'));
    });
    return () => controller.abort();
  }, [attempt, hasDetails, url]);

  return (
    <PanelDialog
      title={title}
      context={source}
      bodyLabel="Nội dung tóm tắt"
      footer={<a className="story-original" href={story.url}>Đọc bài gốc</a>}
      onClose={onClose}
    >
      {sections ? <DigestSections sections={sections} /> : hasDetails && !error ? (
        <p className="secondary" role="status">Đang tải tóm tắt chi tiết…</p>
      ) : (
        <>
          {error && <div className="story-summary-retry">
            <p className="feedback error" role="alert">{error}</p>
            <button type="button" className="button" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Thử lại</button>
          </div>}
          <ShortDigest story={story} />
        </>
      )}
    </PanelDialog>
  );
}

function DigestSections({ sections }: { sections: StoryDigestSection[] }) {
  return <div className="story-digest-sections">
    {sections.map(({ heading, paragraphs }) => (
      <section key={heading}>
        <h3>{heading}</h3>
        {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>
    ))}
  </div>;
}

function ShortDigest({ story }: { story: BulletinStory }) {
  const points = story.digest?.keyPoints;
  const { summary } = storyText(story);
  if (points) {
    return (
      <>
        <h3>Tóm tắt ngắn</h3>
        {story.digest?.basis === 'SOURCE_PREVIEW' && <p className="story-meta">Tóm tắt từ phần giới thiệu của nguồn.</p>}
        <ul className="story-key-points">{points.map((point) => <li key={point}>{point}</li>)}</ul>
      </>
    );
  }
  if (!story.fromFeed) return <><h3>Tóm tắt ngắn</h3><p>{summary}</p></>;
  return (
    <>
      <p className="secondary">Chưa có tóm tắt ý chính cho tin này.</p>
      {summary && <><h3>{story.translation ? 'Bản dịch trích đoạn nguồn' : 'Trích đoạn từ nguồn'}</h3><p>{summary}</p></>}
    </>
  );
}
