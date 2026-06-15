import Link from "next/link";
import { Header } from "@/components/Header";
import { LiveDemo } from "@/components/LiveDemo";
import { StepScene } from "@/components/StepScene";
import { PluckMark } from "@/components/Logo";
import {
  AUTHOR,
  CONTACT_EMAIL,
  FAQ,
  GITHUB_URL,
  faqSchema,
  softwareApplicationSchema,
} from "@/lib/seo";

const GitHubGlyph = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.05.78 2.13v3.16c0 .31.21.66.8.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

function Schema() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema()) }}
      />
    </>
  );
}

function SectionHeading({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-3 text-[12.5px] font-semibold tracking-[0.14em] text-accent-soft uppercase">
        {kicker}
      </p>
      <h2 className="text-[clamp(26px,3.4vw,40px)] leading-[1.15] font-semibold">{title}</h2>
      {sub && <p className="mt-4 text-[16px] text-ink-soft">{sub}</p>}
    </div>
  );
}

const STEPS = [
  {
    scene: "point" as const,
    title: "Point at it",
    body: (
      <>
        Hit <kbd className="key">⌘⇧E</kbd> and hover. The element under your cursor lights up with
        its tag, classes and size — first press, any site.
      </>
    ),
  },
  {
    scene: "click" as const,
    title: "Click to grab",
    body: (
      <>
        One click captures it; the page never sees it. Nudge <kbd className="key">↑</kbd>/
        <kbd className="key">↓</kbd> to the parent or child for the right container.
      </>
    ),
  },
  {
    scene: "paste" as const,
    title: "Paste to your agent",
    body: (
      <>
        A verified-unique selector lands on your clipboard — with the element&apos;s text and markup,
        in whichever format you pick.
      </>
    ),
  },
];

export default function Home() {
  return (
    <>
      <Schema />
      <Header />
      <main id="top">
        {/* ── Hero: rounded card on the plain page (ato-mcp chrome) — copy left, live demo right ── */}
        <section className="p-3">
          <div className="hero-card relative flex min-h-[calc(100svh-24px)] flex-col overflow-hidden">
            <span className="hero-glow" aria-hidden />
            <div className="relative z-10 flex flex-1 items-center px-6 pt-28 pb-12 sm:px-10 lg:px-16">
              <div className="mx-auto grid w-full max-w-6xl items-center gap-y-12 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-16">
                {/* LEFT — copy + CTA */}
                <div className="text-left">
                  <h1
                    className="reveal text-[clamp(32px,3.6vw,52px)] leading-[1.05] font-semibold"
                    style={{ "--reveal-delay": "0.06s" } as React.CSSProperties}
                  >
                    Stop describing elements to your AI&nbsp;agent.{" "}
                    <span className="bg-gradient-to-r from-[#6366f1] via-[#4f46e5] to-[#4338ca] bg-clip-text text-transparent">
                      Point at them.
                    </span>
                  </h1>
                  <p
                    className="reveal mt-6 max-w-md text-[16.5px] leading-relaxed text-ink-soft"
                    style={{ "--reveal-delay": "0.12s" } as React.CSSProperties}
                  >
                    Pluck is a browser extension for the AI-assisted dev loop: hit a hotkey, click any
                    element, and an agent-ready CSS selector lands on your clipboard. Paste it to Claude
                    Code, Cursor, Copilot — anything that reads text.
                  </p>
                  <div
                    className="reveal mt-8 flex flex-wrap items-center gap-3.5"
                    style={{ "--reveal-delay": "0.18s" } as React.CSSProperties}
                  >
                    <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="btn-solid">
                      <GitHubGlyph />
                      Get Pluck — it&apos;s free
                    </a>
                    <a
                      href={`${GITHUB_URL}#install`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-line"
                    >
                      Install guide <span aria-hidden>→</span>
                    </a>
                  </div>
                  <p
                    className="reveal mt-4 text-[12.5px] text-ink-dim"
                    style={{ "--reveal-delay": "0.24s" } as React.CSSProperties}
                  >
                    Chrome Web Store listing coming soon · loads unpacked in 30 seconds today
                  </p>
                </div>

                {/* RIGHT — live playground */}
                <div
                  className="reveal w-full"
                  style={{ "--reveal-delay": "0.3s" } as React.CSSProperties}
                >
                  <LiveDemo />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works (point · click · paste) ─────────────────────────── */}
        <section id="how" className="scroll-mt-24 px-5 pt-24 pb-20">
          <div className="mx-auto max-w-5xl">
            <SectionHeading
              kicker="How it works"
              title="One gesture, not five steps"
              sub="No DevTools, no class-soup. Point, click, and paste — in under three seconds."
            />

            <div className="grid gap-5 sm:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.title} className="card reveal-scroll flex flex-col overflow-hidden">
                  <StepScene step={s.scene} />
                  <div className="p-7">
                    <h3 className="mb-2 text-[18px] font-semibold">{s.title}</h3>
                    <p className="text-[14.5px] leading-relaxed text-ink-soft">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section id="faq" className="scroll-mt-24 px-5 py-24">
          <div className="mx-auto max-w-2xl">
            <SectionHeading kicker="FAQ" title="Questions, answered" />
            <div className="border-t border-black/[0.08]">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="faq">
                  <summary>{q}</summary>
                  <p className="faq-body">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className="glow-hero px-5 pt-24 pb-28">
          <div className="mx-auto max-w-3xl text-center">
            <PluckMark size={52} radius={14} />
            <h2 className="mt-7 text-[clamp(30px,4.4vw,52px)] leading-[1.08] font-semibold">
              Point. Click. Paste.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[16px] text-ink-soft">
              The fastest way to tell your AI agent which element you mean. Free, open source,
              offline by design.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="btn-solid">
                <GitHubGlyph />
                Get Pluck on GitHub
              </a>
              <a
                href={`${GITHUB_URL}/blob/main/CHANGELOG.md`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-line"
              >
                What&apos;s new in v1.2
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer: inset rounded card (superpower section_footer3 layout) ──
          Brand group on the left, link grid on the right, hairline bottom bar —
          floating in the same gutter and radius as the hero card. */}
      <footer className="px-3 pb-3">
        <div className="footer-card overflow-hidden px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-12 lg:flex-row lg:justify-between lg:gap-16">
              {/* Brand group */}
              <div className="max-w-sm">
                <div className="flex items-center gap-2.5">
                  <PluckMark size={26} radius={7} />
                  <span className="text-[17px] font-semibold tracking-[-0.02em]">Pluck</span>
                </div>
                <p className="mt-5 text-[14.5px] leading-relaxed text-ink-soft">
                  <span className="font-medium text-ink">Point, click, paste.</span> An agent-ready
                  CSS selector lands on your clipboard — for whichever AI agent you use. Free, open
                  source, offline by design.
                </p>
                <div className="mt-6">
                  <p className="footer-col-head mb-3">Works with your agent</p>
                  <div className="flex flex-wrap gap-2">
                    {["Claude Code", "Codex", "Cursor"].map((a) => (
                      <span key={a} className="chip">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Link grid */}
              <nav
                className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3 lg:gap-x-16"
                aria-label="Footer"
              >
                <div className="flex flex-col gap-3.5">
                  <p className="footer-col-head">Product</p>
                  <a className="footer-link" href="#how">
                    How it works
                  </a>
                  <Link className="footer-link" href="/privacy">
                    Privacy
                  </Link>
                  <a className="footer-link" href="#faq">
                    FAQ
                  </a>
                </div>
                <div className="flex flex-col gap-3.5">
                  <p className="footer-col-head">Open source</p>
                  <a
                    className="footer-link"
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                  <a
                    className="footer-link"
                    href={`${GITHUB_URL}/blob/main/CHANGELOG.md`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Changelog
                  </a>
                  <a
                    className="footer-link"
                    href={`${GITHUB_URL}#install`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Install guide
                  </a>
                </div>
                <div className="flex flex-col gap-3.5">
                  <p className="footer-col-head">Support</p>
                  <Link className="footer-link" href="/support">
                    Support
                  </Link>
                  <Link className="footer-link" href="/privacy">
                    Privacy policy
                  </Link>
                  <a className="footer-link" href={`mailto:${CONTACT_EMAIL}`}>
                    Contact
                  </a>
                </div>
              </nav>
            </div>

            {/* Bottom bar */}
            <div className="mt-14 flex flex-col gap-4 border-t border-black/[0.08] pt-7 text-[13px] text-ink-dim sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 {AUTHOR} · MIT License</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
                <Link className="footer-link" href="/privacy">
                  Privacy
                </Link>
                <Link className="footer-link" href="/support">
                  Support
                </Link>
                <a
                  className="footer-link"
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
