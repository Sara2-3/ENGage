// A module card that opens its content in a native modal dialog. The browser handles focus,
// the Esc key and returning focus to the card. Content stays mounted, so drafts are kept.
import { useId, useRef, type ReactNode } from 'react';

export default function Modal({ title, summary, children }: { title: string; summary: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button type="button" className="module" aria-haspopup="dialog" onClick={() => ref.current?.showModal()}>
        <strong>{title}</strong>
        <span>{summary}</span>
      </button>
      <dialog ref={ref} className="modal" aria-labelledby={titleId}>
        <div className="modal-head">
          <h1 id={titleId}>{title}</h1>
          <form method="dialog"><button autoFocus>Close</button></form>
        </div>
        {children}
      </dialog>
    </>
  );
}
