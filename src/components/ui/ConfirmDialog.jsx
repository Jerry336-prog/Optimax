import { useEffect, useRef, useId } from "react";
export default function ConfirmDialog({
  title,
  children,
  onCancel,
  onConfirm,
  busy,
  cancelLabel = "Keep product",
  confirmLabel = "Delete product",
}) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="gallery-dialog confirm-modal"
      onCancel={onCancel}
    >
      <h2 id={titleId}>{title}</h2>
      {children}
      <div className="inline-actions">
        <button className="button secondary" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button className="button primary" disabled={busy} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
