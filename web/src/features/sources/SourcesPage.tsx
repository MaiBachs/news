import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { markets, purposes, sourceLimits } from '../../../../shared/sources';
import type { FeedSource } from '../../../../shared/sources';
import { errorMessage } from '../../shared/http';
import { marketLabels } from '../../shared/market-labels';
import { SourceStatusChart } from './SourceStatusChart';
import { addSource, listSources, setSourceEnabled } from './source-api';
import { purposeLabels } from './source-labels';

const byName = new Intl.Collator('vi');

export function SourcesPage() {
  const [sources, setSources] = useState<FeedSource[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [market, setMarket] = useState<string>(markets[0]);
  const [purpose, setPurpose] = useState<string>(purposes[0]);

  useEffect(() => {
    const controller = new AbortController();
    listSources(controller.signal)
      .then(setSources)
      .catch((failure) => {
        if (!controller.signal.aborted) setError(errorMessage(failure, 'Chưa đọc được danh sách nguồn.'));
      });
    return () => controller.abort();
  }, [attempt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const market = markets.find((value) => value === fields.get('market'));
    const purpose = purposes.find((value) => value === fields.get('purpose'));
    if (!market || !purpose) return;

    setBusy('add');
    setError('');
    setNotice('');
    try {
      const added = await addSource({
        name: String(fields.get('name') ?? ''),
        feedUrl: String(fields.get('feedUrl') ?? ''),
        market,
        purpose,
        ...(market === 'CHINA' && purpose === 'LIBRARY' && fields.has('community') ? { libraryKind: 'COMMUNITY' } : {}),
      });
      setSources((current) => [...(current ?? []), added]);
      form.reset();
      setMarket(markets[0]);
      setPurpose(purposes[0]);
      setNotice(`Đã thêm nguồn ${added.name}.`);
    } catch (failure) {
      setError(errorMessage(failure, 'Chưa thêm được nguồn.'));
    } finally {
      setBusy(null);
    }
  }

  async function changeStatus(source: FeedSource) {
    setBusy(source.id);
    setError('');
    setNotice('');
    try {
      const enabled = !source.enabled;
      await setSourceEnabled(source.id, enabled);
      setSources((current) => current?.map((item) => item.id === source.id ? { ...item, enabled } : item) ?? null);
      setNotice(`${enabled ? 'Đã bật' : 'Đã tắt'} nguồn ${source.name}.`);
    } catch (failure) {
      setError(errorMessage(failure, 'Chưa đổi được trạng thái nguồn.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <p className="page-description">Đăng ký feed RSS hoặc Atom cho Kho tin và Thư viện.</p>
      {error && <p className="feedback error" role="alert">{error}</p>}
      {notice && <p className="feedback success" role="status">{notice}</p>}
      {sources === null ? (
        <div className="panel empty-state">
          {error ? <button className="button" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Thử lại</button>
            : <p role="status">Đang tải danh sách nguồn…</p>}
        </div>
      ) : (
        <div className="admin-grid">
          <section className="panel form-panel" aria-labelledby="add-source">
            <h2 id="add-source">Thêm nguồn</h2>
            <form onSubmit={submit}>
              <label className="field">
                <span>Tên nguồn</span>
                <input name="name" maxLength={sourceLimits.name} required />
              </label>
              <label className="field">
                <span>URL RSS/Atom</span>
                <input type="url" name="feedUrl" placeholder="https://example.com/feed.xml" maxLength={sourceLimits.feedUrl} required />
              </label>
              <div className="fields-row">
                <label className="field">
                  <span>Thị trường</span>
                  <select name="market" value={market} onChange={(event) => setMarket(event.target.value)}>
                    {markets.map((market) => <option key={market} value={market}>{marketLabels[market]}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Mục sử dụng</span>
                  <select name="purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)}>
                    {purposes.map((purpose) => <option key={purpose} value={purpose}>{purposeLabels[purpose]}</option>)}
                  </select>
                </label>
              </div>
              {market === 'CHINA' && purpose === 'LIBRARY' && <label className="library-saved-filter">
                <input type="checkbox" name="community" /> Nguồn thảo luận cộng đồng
              </label>}
              <button type="submit" className="button button-primary" disabled={busy !== null}>{busy === 'add' ? 'Đang thêm…' : 'Thêm nguồn'}</button>
            </form>
          </section>
          <section className="panel source-panel" aria-labelledby="registered-sources">
            <h2 id="registered-sources">Danh sách nguồn</h2>
            {sources.length === 0 ? <p className="secondary">Chưa có nguồn nào.</p> : (
              <ul className="source-list">
                {[...sources].sort((left, right) => byName.compare(left.name, right.name)).map((source) => (
                  <li key={source.id}>
                    <div className="source-detail">
                      <h3>{source.name}</h3>
                      <a className="source-url" href={source.feedUrl}>{source.feedUrl}</a>
                      <p className="source-meta">
                        {marketLabels[source.market]} · {purposeLabels[source.purpose]}
                        {source.libraryKind === 'COMMUNITY' && ' · Cộng đồng'} · {source.enabled ? 'Đang bật' : 'Đã tắt'}
                      </p>
                    </div>
                    <button className="button" disabled={busy !== null} onClick={() => changeStatus(source)}
                      aria-label={`${source.enabled ? 'Tắt' : 'Bật'} ${source.name}`}>
                      {busy === source.id ? 'Đang lưu…' : source.enabled ? 'Tắt' : 'Bật'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
      {sources && <SourceStatusChart sources={sources} mode="admin" />}
    </>
  );
}
