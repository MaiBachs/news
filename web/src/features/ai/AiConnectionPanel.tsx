import { useEffect, useState } from 'react';
import type { AiStatus } from '../../../../shared/ai';
import { errorMessage } from '../../shared/http';
import { checkAiConnection, getAiStatus } from './connection-api';

export function AiConnectionPanel() {
  const [status, setStatus] = useState<AiStatus>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getAiStatus(controller.signal)
      .then(setStatus)
      .catch((failure) => {
        if (!controller.signal.aborted) setError(errorMessage(failure, 'Chưa đọc được cấu hình AI.'));
      });
    return () => controller.abort();
  }, []);

  async function verifyConnection() {
    setBusy(true);
    setError('');
    setVerified(false);
    try {
      await checkAiConnection();
      setVerified(true);
    } catch (failure) {
      setError(errorMessage(failure, 'Chưa kiểm tra được kết nối AI.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel ai-panel" aria-labelledby="ai-heading">
      <h2 id="ai-heading">Kết nối AI</h2>
      {!status && !error && <p className="secondary" role="status">Đang đọc cấu hình AI…</p>}
      {status && (
        <>
          <dl className="ai-models">
            <div><dt>Cấu hình</dt><dd>{status.profile === 'codex' ? 'Codex · OpenAI' : 'Claude · Anthropic'}</dd></div>
            <div><dt>Xử lý tin</dt><dd>{status.crawlModel}</dd></div>
            <div><dt>Kết luận và dự báo</dt><dd>{status.analysisModel}</dd></div>
          </dl>
          {status.connection === 'missing-key' && <p className="secondary">Thiếu <code>OPENAI_API_KEY</code> trên máy chủ.</p>}
          {status.connection === 'unavailable' && <p className="secondary">Cấu hình Claude đang được chọn.</p>}
          {status.connection === 'ready' && (
            <button className="button" onClick={verifyConnection} disabled={busy}>
              {busy ? 'Đang kiểm tra…' : 'Kiểm tra kết nối OpenAI'}
            </button>
          )}
        </>
      )}
      {verified && <p className="feedback success" role="status">OpenAI đã trả về phản hồi.</p>}
      {error && <p className="feedback error" role="alert">{error}</p>}
    </section>
  );
}
