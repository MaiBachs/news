import { useState } from 'react';
import { PanelDialog } from '../../shared/PanelDialog';
import { libraryHighlights } from './library-highlights';

export function LibraryHighlights() {
  const [selected, setSelected] = useState<(typeof libraryHighlights)[number]>();

  return (
    <>
      <p className="page-description">Mỗi nhóm một nội dung chọn lọc, ưu tiên nguồn rõ và dễ áp dụng hoặc xem nhanh.</p>
      <div className="story-grid">
        {libraryHighlights.map((pick) => (
          <section key={pick.id} className="panel library-highlight" aria-labelledby={`highlight-${pick.id}`}>
            <h2 id={`highlight-${pick.id}`}>{pick.category}</h2>
            <p className="story-meta">{pick.format === 'VIDEO' ? 'Video' : 'Bài viết'} · {pick.source}</p>
            <h3><a href={pick.url}>{pick.title}</a></h3>
            <p>{pick.note}</p>
            <button type="button" className="button" aria-haspopup="dialog" aria-label={`Tóm tắt ${pick.title}`} onClick={() => setSelected(pick)}>
              Tóm tắt
            </button>
          </section>
        ))}
      </div>
      {selected && (
        <PanelDialog
          title={selected.title}
          context={selected.source}
          bodyLabel="Nội dung tóm tắt"
          footer={<a className="story-original" href={selected.url}>{selected.format === 'VIDEO' ? 'Xem video gốc' : 'Đọc bài gốc'}</a>}
          onClose={() => setSelected(undefined)}
        >
          <ul className="story-key-points">
            {selected.keyPoints.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </PanelDialog>
      )}
    </>
  );
}
