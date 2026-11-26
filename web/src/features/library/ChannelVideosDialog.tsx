import { useEffect, useState } from 'react';
import type { ChannelVideo, LibraryItem } from '../../../../shared/library';
import { errorMessage } from '../../shared/http';
import { PanelDialog } from '../../shared/PanelDialog';
import { getChannelVideos } from './library-api';

const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeZone: 'UTC' });

export function ChannelVideosDialog({ channel, onClose }: { channel: LibraryItem; onClose: () => void }) {
  const [videos, setVideos] = useState<ChannelVideo[]>();
  const [selected, setSelected] = useState<ChannelVideo>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getChannelVideos(channel.url, controller.signal).then(setVideos).catch((failure) => {
      if (!controller.signal.aborted) setError(errorMessage(failure, 'Chưa tải được video của kênh.'));
    });
    return () => controller.abort();
  }, [attempt, channel.url]);

  return (
    <>
      <PanelDialog
        title={channel.publisher}
        context="Kênh YouTube"
        bodyLabel="Danh sách video"
        footer={<a className="story-original" href={channel.url}>Mở kênh trên YouTube</a>}
        onClose={onClose}
      >
        {error ? (
          <div className="story-summary-retry">
            <p className="feedback error" role="alert">{error}</p>
            <button type="button" className="button" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Thử lại</button>
          </div>
        ) : videos ? (
          videos.length ? (
            <ul className="channel-video-list">
              {videos.map((video) => (
                <li key={video.url}>
                  {video.publishedOn && <p className="story-meta"><time dateTime={video.publishedOn}>
                    {dateFormat.format(new Date(video.publishedOn))}
                  </time></p>}
                  <h3><a href={video.url}>{video.title}</a></h3>
                  {video.summary && <p className="channel-video-preview">{video.summary}</p>}
                  <button type="button" className="button" aria-haspopup="dialog" aria-label={`Tóm tắt ${video.title}`}
                    onClick={() => setSelected(video)}>Tóm tắt</button>
                </li>
              ))}
            </ul>
          ) : <p className="secondary" role="status">Chưa có video được lưu cho kênh này.</p>
        ) : <p className="secondary" role="status">Đang tải danh sách video…</p>}
      </PanelDialog>
      {selected && (
        <PanelDialog
          title={selected.title}
          context={channel.publisher}
          bodyLabel="Nội dung tóm tắt video"
          footer={<a className="story-original" href={selected.url}>Xem video gốc trên YouTube</a>}
          onClose={() => setSelected(undefined)}
        >
          {selected.basis === 'EDITORIAL' ? (
            <>
              <p className="story-meta">Tóm tắt biên tập từ thông tin công khai của video.</p>
              <p>{selected.summary}</p>
              <h3>Ý chính</h3>
              <ul className="story-key-points">{selected.keyPoints?.map((point) => <li key={point}>{point}</li>)}</ul>
            </>
          ) : (
            <>
              <h3>Mô tả từ YouTube</h3>
              <p>{selected.summary || 'YouTube chưa cung cấp mô tả cho video này.'}</p>
            </>
          )}
        </PanelDialog>
      )}
    </>
  );
}
