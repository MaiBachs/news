import { useEffect, useId, useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';

export function PanelDialog({ title, context, bodyLabel, footer, onClose, children }: {
  title: string;
  context: string;
  bodyLabel: string;
  footer: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pressedBackdrop = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="panel story-summary-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onPointerDown={(event) => { pressedBackdrop.current = event.isPrimary && event.button === 0 && isBackdrop(event); }}
      onPointerCancel={() => { pressedBackdrop.current = false; }}
      onClick={(event) => {
        const startedOutside = pressedBackdrop.current;
        pressedBackdrop.current = false;
        if (startedOutside && isBackdrop(event)) event.currentTarget.close();
      }}
    >
      <header className="story-summary-header">
        <p className="story-meta">{context}</p>
        <button type="button" className="button" onClick={() => dialog.current?.close()}>Đóng</button>
      </header>
      <div className="story-summary-body" role="region" aria-label={bodyLabel} tabIndex={0}>
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
      <footer className="story-summary-footer">{footer}</footer>
    </dialog>
  );
}

function isBackdrop(event: MouseEvent<HTMLDialogElement>) {
  if (event.target !== event.currentTarget) return false;
  const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
  return event.clientX < left || event.clientX >= right || event.clientY < top || event.clientY >= bottom;
}
