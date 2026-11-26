// A module card (or, without a summary, a small button) that opens its content in a native modal
// dialog. The browser handles focus, the Esc key and returning focus. Content stays mounted.
import { useId, useRef, type ReactNode } from 'react';

export default function Modal({ title, summary, children }: { title: string; summary?: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button type="button" className={summary ? 'module' : undefined} aria-haspopup="dialog" onClick={() => ref.current?.showModal()}>
        {summary ? <><strong>{title}</strong><span>{summary}</span></> : title}
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
