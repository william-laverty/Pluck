"use client";

import { useState } from "react";

const FORMATS = [
  {
    key: "selector",
    name: "Selector",
    hint: "Just the verified-unique selector.",
    output: `button.btn.btn-primary`,
  },
  {
    key: "context",
    name: "+ Context",
    hint: "Selector, text & opening tag — the default. Your agent can grep for it.",
    output: `button.btn.btn-primary  ·  "Get started"
selector: button.btn.btn-primary
<button class="btn btn-primary">Get started</button>`,
  },
  {
    key: "full",
    name: "Full",
    hint: "Adds key computed styles, for “make this match” prompts.",
    output: `button.btn.btn-primary  ·  "Get started"
selector: button.btn.btn-primary
<button class="btn btn-primary">Get started</button>
styles: color:#ffffff; background:#0d9488; font:600 15px/1.6 Inter; padding:13px 22px; border-radius:11px`,
  },
] as const;

export function FormatTabs() {
  const [active, setActive] = useState<(typeof FORMATS)[number]["key"]>("context");
  const current = FORMATS.find((f) => f.key === active)!;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Copy format"
        className="mx-auto mb-5 flex w-fit gap-1 rounded-full border border-black/[0.06] bg-zinc-100 p-1"
      >
        {FORMATS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={active === f.key}
            onClick={() => setActive(f.key)}
            className={`rounded-full px-4 py-1.5 text-[13.5px] font-medium transition-colors duration-200 ${
              active === f.key
                ? "bg-white text-accent-soft shadow-[0_1px_3px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.03)]"
                : "text-ink-soft hover:bg-black/[0.04] hover:text-ink"
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="terminal mx-auto max-w-2xl text-left">
        <div className="terminal-bar">
          <i /><i /><i />
          <span className="ml-2 font-mono text-[11px] text-ink-soft">clipboard</span>
        </div>
        <pre className="min-h-[148px] overflow-x-auto p-5 font-mono text-[13px] leading-[1.75] whitespace-pre-wrap text-zinc-700">
          {current.output}
        </pre>
      </div>
      <p className="mt-4 text-center text-[13.5px] text-ink-soft">{current.hint}</p>
    </div>
  );
}
