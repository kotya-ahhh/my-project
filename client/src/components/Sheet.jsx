import { useEffect, useId, useRef } from 'react';
import { Icon } from './Icons.jsx';

/** Нижняя панель (на десктопе — окно по центру) на нативном <dialog>: фокус и Esc работают сами. */
export default function Sheet({ open, onClose, title, children }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="sheet-head">
        <h2 id={titleId}>{title}</h2>
        <button className="btn btn--cream btn--icon btn--small" onClick={onClose} aria-label="Закрыть">
          <Icon name="close" size={20} />
        </button>
      </div>
      <div className="sheet-body">{open ? children : null}</div>
    </dialog>
  );
}
