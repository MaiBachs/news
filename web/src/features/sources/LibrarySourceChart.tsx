import { useEffect, useState } from 'react';
import type { FeedSource } from '../../../../shared/sources';
import { errorMessage } from '../../shared/http';
import { SourceStatusChart } from './SourceStatusChart';
import { listSources } from './source-api';

export function LibrarySourceChart() {
  const [sources, setSources] = useState<FeedSource[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    listSources(controller.signal).then(setSources).catch((failure) => {
      if (!controller.signal.aborted) setError(errorMessage(failure, 'Chưa đọc được nguồn Thư viện.'));
    });
    return () => controller.abort();
  }, []);

  if (error) return <p className="feedback error" role="alert">{error}</p>;
  if (!sources) return <p className="page-description" role="status">Đang tải thống kê nguồn…</p>;
  return <SourceStatusChart sources={sources} mode="library" />;
}
