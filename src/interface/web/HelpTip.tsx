import { useId, useState } from "react";

export function HelpTip({ label, text }: { label: string; text: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className={`help-tip${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="help-tip-btn"
        aria-label={`O que é: ${label}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      <span id={id} role="tooltip" className="help-tip-bubble">
        {text}
      </span>
    </span>
  );
}
