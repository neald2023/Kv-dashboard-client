/* Plain inputs that never lose focus and don’t bubble to the backdrop */
function Inp({ className = "", value, onChange, ...rest }) {
  return (
    <input
      {...rest}
      className={`w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
      value={value ?? ""}
      // use onInput for reliable character-by-character updates
      onInput={(e) => onChange?.(e)}
      autoComplete="off"
      // stop any pointer/keyboard event from reaching the backdrop
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    />
  );
}

function Sel({ className = "", value, onChange, children, ...rest }) {
  return (
    <select
      {...rest}
      className={`w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
      value={value ?? ""}
      onInput={(e) => onChange?.(e)}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {children}
    </select>
  );
}

/* Modal: never auto-close on backdrop; only via X/Cancel. Blocks event bubbling. */
function Modal({ open = false, onClose, title, width = 760, children, footer }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center select-none"
      role="dialog"
      aria-modal="true"
      // don’t auto-close on backdrop click anymore
      onMouseDown={(e) => { /* noop */ }}
      onKeyDown={(e) => { if (e.key === "Escape") onClose?.(); }}
    >
      <div
        className="rounded bg-slate-900 border border-slate-700 shadow-xl w-full"
        style={{ maxWidth: width, width: "95vw" }}
        // block *all* pointer events from leaving the panel
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onPointerDownCapture={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              type="button"
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
        {footer && (
          <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
