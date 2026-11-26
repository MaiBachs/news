import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { libraryKinds, libraryThemes, youtubeChannelUrlPattern } from '../../../../shared/library';
import type { LibraryCaseStudy, LibraryItem, LibraryKind, LibraryTheme } from '../../../../shared/library';
import { markets } from '../../../../shared/sources';
import { CountChart } from '../../shared/CountChart';
import { errorMessage } from '../../shared/http';
import { marketLabels } from '../../shared/market-labels';
import { PanelDialog } from '../../shared/PanelDialog';
import { normalizeSearch } from '../../shared/search-text';
import { ChannelVideosDialog } from './ChannelVideosDialog';
import { LibraryHighlights } from './LibraryHighlights';
import { getLibraryItems, setLibrarySaved } from './library-api';

const kindLabels: Record<LibraryKind, string> = {
  YOUTUBE: 'Kênh YouTube', BLOG: 'Blog', CASE_STUDY: 'Case study', COMMUNITY: 'Cộng đồng Trung Quốc',
};
const libraryPageSize = 12;
const librarySections = { YOUTUBE: 'youtube', BLOG: 'blog', CASE_STUDY: 'case-study', COMMUNITY: 'cong-dong-trung-quoc' } as const;
const topicIds = [...libraryThemes, 'UNCLASSIFIED'] as const;
type LibraryTopic = LibraryTheme | 'UNCLASSIFIED';
const topicLabels: Record<LibraryTopic, string> = {
  BUSINESS: 'Kinh doanh độc lập & SaaS', AI: 'AI & tự động hóa', IOT: 'IoT & thiết bị',
  MAKING: 'Thiết kế & chế tạo', FARMING: 'Chăn nuôi & làm nông', TOOLS: 'Công cụ & vận hành',
  UNCLASSIFIED: 'Chưa phân loại',
};
const communityTopicLabels = { ...topicLabels, BUSINESS: 'Kiếm tiền, định giá & tìm khách', TOOLS: 'Sản phẩm & xu hướng' };
const topicOf = (item: LibraryItem): LibraryTopic => item.theme ?? 'UNCLASSIFIED';

export function LibraryPage() {
  const [params, setParams] = useSearchParams();
  const section = params.get('muc');
  const highlights = section === 'noi-bat';
  const kind = libraryKinds.find((entry) => librarySections[entry] === section);

  return (
    <>
      <nav className="library-nav" aria-label="Mục Thư viện">
        <Link className="button library-highlights-link" to="?muc=noi-bat" aria-current={highlights ? 'page' : undefined}>Nổi bật</Link>
        <Link className="button" to="." aria-current={!kind && !highlights ? 'page' : undefined}>Tất cả</Link>
        {libraryKinds.map((entry) => (
          <Link key={entry} className={entry === 'COMMUNITY' ? 'button library-community-link' : 'button'}
            to={`?muc=${librarySections[entry]}`} aria-current={kind === entry ? 'page' : undefined}>
            {kindLabels[entry]}
          </Link>
        ))}
      </nav>
      {highlights ? <LibraryHighlights /> : <LibraryCatalog kind={kind} params={params} onChangeTopic={(next) => setParams(next, { replace: true })} />}
    </>
  );
}

function LibraryCatalog({ kind, params, onChangeTopic }: {
  kind: LibraryKind | undefined;
  params: URLSearchParams;
  onChangeTopic: (next: URLSearchParams) => void;
}) {
  const [items, setItems] = useState<LibraryItem[]>();
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [market, setMarket] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [channel, setChannel] = useState<LibraryItem>();
  const [visibleByGroup, setVisibleByGroup] = useState<Record<string, number>>({});

  useEffect(() => {
    const controller = new AbortController();
    getLibraryItems(controller.signal).then(setItems).catch((failure) => {
      if (!controller.signal.aborted) setError(errorMessage(failure, 'Chưa đọc được Thư viện.'));
    });
    return () => controller.abort();
  }, [attempt]);

  async function toggleSaved(item: LibraryItem) {
    setError('');
    setPending(item.url);
    try {
      const saved = !item.saved;
      await setLibrarySaved(item.url, saved);
      setItems((current) => current?.map((resource) => resource.url === item.url ? { ...resource, saved } : resource));
    } catch (failure) {
      setError(errorMessage(failure, 'Chưa cập nhật được tài liệu đã lưu.'));
    } finally {
      setPending(null);
    }
  }

  if (!items && error) {
    return (
      <div className="panel empty-state">
        <p role="alert">{error}</p>
        <button type="button" className="button" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Thử lại</button>
      </div>
    );
  }
  if (!items) return <p className="page-description" role="status">Đang tải Thư viện…</p>;

  const sectionItems = kind ? items.filter((item) => item.kind === kind) : items;
  const community = kind === 'COMMUNITY';
  const labels = community ? communityTopicLabels : topicLabels;
  const topics = topicIds.filter((topic) => sectionItems.some((item) => topicOf(item) === topic));
  const topic = topics.find((entry) => entry === params.get('chu-de'));
  const keyword = normalizeSearch(search.trim());
  const matching = sectionItems.filter((item) => (
    (!topic || topicOf(item) === topic) && (community || !market || item.market === market) && (!savedOnly || item.saved)
    && (!keyword || normalizeSearch([
      item.title, item.publisher, labels[topicOf(item)], ...item.topics, item.summary,
      item.fromFeed && item.translation?.title, item.fromFeed && item.translation?.summary,
    ].filter(Boolean).join(' ')).includes(keyword))
  ));
  const directory = community ? matching.filter((item) => !item.fromFeed) : [];
  const groupItems = community ? matching.filter((item) => item.fromFeed) : matching;
  const groups = kind ? topics.map((entry) => ({
    id: entry, label: labels[entry], items: groupItems.filter((item) => topicOf(item) === entry),
  })) : libraryKinds.map((entry) => ({
    id: entry, label: kindLabels[entry], items: matching.filter((item) => item.kind === entry),
  }));

  return (
    <>
      {community && <p className="page-description">Thảo luận công khai về sản phẩm mới, tìm khách và cách thu tiền. Các kết quả kinh doanh do thành viên chia sẻ cần được đối chiếu.</p>}
      <div className={community ? 'library-filters community-filters' : 'library-filters'}>
        <label className="field">
          <span>Tìm tài liệu</span>
          <input type="search" value={search} onChange={(event) => {
            setSearch(event.target.value);
            setVisibleByGroup({});
          }} placeholder="Tên, nguồn hoặc chủ đề" />
        </label>
        <label className="field">
          <span>Chủ đề</span>
          <select value={topic ?? ''} onChange={(event) => {
            const chosen = event.target.value;
            const next = new URLSearchParams(params);
            if (chosen) next.set('chu-de', chosen);
            else next.delete('chu-de');
            setVisibleByGroup({});
            onChangeTopic(next);
          }}>
            <option value="">Tất cả chủ đề</option>
            {topics.map((entry) => <option key={entry} value={entry}>{labels[entry]}</option>)}
          </select>
        </label>
        {!community && <label className="field">
          <span>Thị trường</span>
          <select value={market} onChange={(event) => {
            setMarket(event.target.value);
            setVisibleByGroup({});
          }}>
            <option value="">Tất cả thị trường</option>
            {markets.map((entry) => <option key={entry} value={entry}>{marketLabels[entry]}</option>)}
          </select>
        </label>}
      </div>
      <label className="library-saved-filter">
        <input type="checkbox" checked={savedOnly} onChange={(event) => {
          setSavedOnly(event.target.checked);
          setVisibleByGroup({});
        }} />
        Chỉ hiện mục đã lưu
      </label>
      <p className="secondary" role="status" aria-atomic="true">
        {matching.length ? (community ? `${groupItems.length} thảo luận · ${directory.length} nguồn` : `${matching.length} tài liệu`)
          : 'Chưa có tài liệu phù hợp.'}
      </p>
      {error && <p className="feedback error" role="alert">{error}</p>}

      {directory.length > 0 && (
        <details className="panel library-group community-directory">
          <summary>Diễn đàn & nhóm thảo luận <span className="secondary">· {directory.length} nguồn</span></summary>
          <div className="story-grid">
            {directory.map((item) => <LibraryCard key={item.url} item={item} pending={pending} onSave={toggleSaved} onShowVideos={setChannel} />)}
          </div>
        </details>
      )}
      {groups.filter((group) => group.items.length > 0).map((group) => {
        const visible = visibleByGroup[group.id] ?? libraryPageSize;
        return (
          <section className="library-group" key={group.id} aria-labelledby={`library-group-${group.id}`}>
            <h2 id={`library-group-${group.id}`}>{group.label}</h2>
            <div className="story-grid">
              {group.items.slice(0, visible).map((item) => (
                <LibraryCard key={item.url} item={item} pending={pending} onSave={toggleSaved} onShowVideos={setChannel} />
              ))}
            </div>
            {group.items.length > visible && (
              <div className="archive-actions">
                <button type="button" className="button" aria-label={`Xem thêm ${community ? 'thảo luận' : 'tài liệu'} · ${group.label}`}
                  onClick={() => setVisibleByGroup((current) => ({ ...current, [group.id]: visible + libraryPageSize }))}>
                  Xem thêm tài liệu
                </button>
                <span className="story-meta">{visible} / {group.items.length} tài liệu</span>
              </div>
            )}
          </section>
        );
      })}
      <CountChart
        title={community ? 'Thảo luận theo chủ đề' : kind ? 'Tài liệu theo chủ đề' : 'Tài liệu theo loại'}
        data={groups.map(({ label, items: resources }) => ({ label, count: resources.length }))}
        unit={community ? 'bài' : 'mục'}
      />
      {channel && <ChannelVideosDialog channel={channel} onClose={() => setChannel(undefined)} />}
    </>
  );
}

function LibraryCard({ item, pending, onSave, onShowVideos }: {
  item: LibraryItem;
  pending: string | null;
  onSave: (item: LibraryItem) => void;
  onShowVideos: (item: LibraryItem) => void;
}) {
  const [excerptOpen, setExcerptOpen] = useState(false);
  const discussion = item.kind === 'COMMUNITY' && item.fromFeed;
  const translation = item.fromFeed ? item.translation : undefined;
  const title = translation?.title ?? item.title;
  const summary = translation?.summary ?? item.summary;
  const saveLabel = item.saved ? 'Bỏ lưu' : 'Lưu tài liệu';
  const buttonText = pending === item.url ? 'Đang cập nhật…' : saveLabel;
  return (
    <article className="panel bulletin-panel library-card">
      <p className="story-meta">
        {item.kind === 'COMMUNITY' ? (discussion ? 'Thảo luận' : 'Cộng đồng') : item.fromFeed && item.kind === 'YOUTUBE' ? 'Video YouTube' : kindLabels[item.kind]}
        {' · '}{marketLabels[item.market]} · {item.publisher}
        {discussion && item.publishedOn && <> · <time dateTime={item.publishedOn}>{item.publishedOn.split('-').reverse().join('/')}</time></>}
        {item.fromFeed && !discussion && ' · Cập nhật từ RSS/Atom'}
      </p>
      <h3><a href={item.url}>{title}</a></h3>
      {summary && <p className={discussion ? 'community-excerpt' : undefined}>{summary}</p>}
      {item.topics.length > 0 && (
        <ul className="library-tags" aria-label="Chủ đề của tài liệu">
          {item.topics.map((tag) => <li key={tag}>{tag}</li>)}
        </ul>
      )}
      {item.takeaway && <p><strong>Gợi ý thực hành</strong><br />{item.takeaway}</p>}
      {item.startHere && <p><a className="library-start-link" href={item.startHere.url}>{item.startHere.label}</a></p>}
      {item.caseStudy && <CaseStudyDetails study={item.caseStudy} />}
      <div className="library-card-actions">
        {discussion && summary && (
          <button type="button" className="button" aria-haspopup="dialog" aria-label={`Xem trích đoạn ${title}`} onClick={() => setExcerptOpen(true)}>
            Xem trích đoạn
          </button>
        )}
        {item.kind === 'YOUTUBE' && !item.fromFeed && youtubeChannelUrlPattern.test(item.url) && (
          <button type="button" className="button button-primary" aria-haspopup="dialog" aria-label={`Xem video của ${item.publisher}`}
            onClick={() => onShowVideos(item)}>Xem video</button>
        )}
        <button type="button" className="button" disabled={pending !== null} aria-label={`${buttonText} ${title}`} onClick={() => onSave(item)}>
          {buttonText}
        </button>
      </div>
      {excerptOpen && (
        <PanelDialog title={title} context={`${item.publisher} · ${translation ? 'Bản dịch trích đoạn' : 'Trích đoạn nguồn'} từ RSS/Atom`}
          bodyLabel="Trích đoạn thảo luận" onClose={() => setExcerptOpen(false)}
          footer={<a className="story-original" href={item.url}>Đọc thảo luận gốc</a>}>
          <p>{summary}</p>
          {translation && <details><summary>Đối chiếu trích đoạn gốc</summary><p>{item.summary}</p></details>}
        </PanelDialog>
      )}
    </article>
  );
}

function CaseStudyDetails({ study }: { study: LibraryCaseStudy }) {
  return (
    <details className="library-case">
      <summary>Mô hình kiếm tiền</summary>
      <dl className="library-facts">
        <div><dt>Sản phẩm</dt><dd>{study.product}</dd></div>
        <div><dt>Khách hàng</dt><dd>{study.customer}</dd></div>
        <div><dt>Cách thu tiền</dt><dd>{study.pricing}</dd></div>
        {study.acquisition && <div><dt>Cách tìm khách</dt><dd>{study.acquisition}</dd></div>}
        {study.reportedRevenue && <div><dt>Doanh thu tự báo cáo</dt><dd>{study.reportedRevenue}</dd></div>}
      </dl>
    </details>
  );
}
