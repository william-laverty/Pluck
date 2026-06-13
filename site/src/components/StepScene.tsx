/**
 * Static "how it works" mockups — one per step. Each re-creates the *real*
 * Pluck overlay (the dark glass pills from src/content/styles.js, mirrored in
 * globals.css as .pg-*) sitting on an abstract page fragment, so the card shows
 * the product rather than a stock illustration. Purely presentational: no
 * hooks, no handlers, so it stays a server component.
 */

type Step = "point" | "click" | "paste";

function WinBar({ url = "solstice.app" }: { url?: string }) {
  return (
    <div className="step-win-bar">
      <i />
      <i />
      <i />
      <span className="step-win-url">{url}</span>
    </div>
  );
}

/** The dark mono tag pill that floats above a highlighted element. */
function TagLabel({
  tag,
  suffix,
  dims,
  className = "",
}: {
  tag: string;
  suffix: string;
  dims: string;
  className?: string;
}) {
  return (
    <span className={`pg-label is-on step-label ${className}`}>
      <span className="t">{tag}</span>
      <span>{suffix}</span>
      <span className="d">
        {"  "}
        {dims}
      </span>
    </span>
  );
}

function Cursor() {
  return (
    <svg className="step-cursor" width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M2 1.4l10.8 5.1-4.5 1.2-1.2 4.5z"
        fill="#fff"
        stroke="#18181b"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 1 — Point: hover lights up an element with its tag pill + cursor. */
function ScenePoint() {
  return (
    <div className="step-scene">
      <div className="step-win">
        <WinBar />
        <div className="step-win-body">
          <div className="step-skel">
            <span className="step-bar" style={{ width: "68%" }} />
            <span className="step-bar step-bar--soft" style={{ width: "46%" }} />
          </div>
          <div className="step-row">
            <span className="step-target">
              Get started
              <TagLabel tag="button" suffix=".btn-primary" dims="128×38" />
              <Cursor />
            </span>
            <span className="step-ghost">Live demo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 2 — Click: the dark refine toolbar; ↑/↓ walk to the parent container. */
function SceneClick() {
  return (
    <div className="step-scene">
      <div className="step-toolbar">
        <span className="step-kbd">↑</span>
        <span className="step-kbd">↓</span>
        <span>refine</span>
        <span className="step-dot">·</span>
        <span>click to copy</span>
        <span className="step-dot">·</span>
        <span className="step-esc">esc</span>
        <span>cancel</span>
      </div>
      <div className="step-win">
        <WinBar />
        <div className="step-win-body">
          <div className="step-card-target">
            <TagLabel tag="div" suffix=".feature-card" dims="248×60" className="step-label--tl" />
            <div className="step-skel">
              <span className="step-bar" style={{ width: "54%" }} />
              <span className="step-bar step-bar--soft" style={{ width: "78%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 3 — Paste: pick a format, the verified selector lands on the clipboard. */
function ScenePaste() {
  return (
    <div className="step-scene">
      <div className="step-win">
        <WinBar />
        <div className="step-win-body">
          <div className="step-seg" role="group" aria-label="Copy format">
            <span className="step-seg-item">Selector</span>
            <span className="step-seg-item is-active">+ Context</span>
            <span className="step-seg-item">Full</span>
          </div>
          <div className="step-skel step-skel--paste">
            <span className="step-bar" style={{ width: "54%" }} />
            <span className="step-bar step-bar--soft" style={{ width: "36%" }} />
          </div>
        </div>
      </div>
      <div className="pg-toast is-on step-toast" role="status">
        <span className="pg-check">
          <svg viewBox="0 0 12 12" width="11" height="11" fill="none" aria-hidden>
            <path
              d="M2.5 6.2l2.2 2.3 4.8-5"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="pg-sel">button.btn-primary</span>
      </div>
    </div>
  );
}

export function StepScene({ step }: { step: Step }) {
  if (step === "point") return <ScenePoint />;
  if (step === "click") return <SceneClick />;
  return <ScenePaste />;
}
