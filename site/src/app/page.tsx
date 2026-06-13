import Link from "next/link";
import { Header } from "@/components/Header";
import { LiveDemo } from "@/components/LiveDemo";
import { FormatTabs } from "@/components/FormatTabs";
import { PluckMark } from "@/components/Logo";
import { FAQ, GITHUB_URL, faqSchema, softwareApplicationSchema } from "@/lib/seo";

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

/** A labelled beat inside the consolidated "How it works" section — a numbered
 *  mono eyebrow + an h3 title, so the section reads as one story in three parts. */
function Beat({
  n,
  kicker,
  title,
  sub,
}: {
  n: string;
  kicker: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-2xl border-t border-black/[0.07] pt-14 text-center">
      <p className="mb-3 font-mono text-[12px] tracking-[0.14em] uppercase">
        <span className="text-accent-soft">{n}</span>
        <span className="text-ink-dim"> · {kicker}</span>
      </p>
      <h3 className="text-[clamp(22px,2.8vw,32px)] leading-[1.15] font-semibold">{title}</h3>
      {sub && <p className="mt-3 text-[15.5px] text-ink-soft">{sub}</p>}
    </div>
  );
}

const STEPS = [
  {
    n: "1",
    title: "Hit the hotkey",
    body: (
      <>
        <kbd className="key">⌘⇧E</kbd> on Mac, <kbd className="key">Ctrl⇧E</kbd> elsewhere — or
        record any combo you like. It fires on the first press, on any site.
      </>
    ),
  },
  {
    n: "2",
    title: "Click the element",
    body: (
      <>
        The element under your cursor lights up with its{" "}
        <code className="font-mono text-[13px] text-accent-soft">tag.class#id</code> and size.{" "}
        <kbd className="key">↑</kbd> grabs the parent, <kbd className="key">↓</kbd> the child. The
        click never reaches the page.
      </>
    ),
  },
  {
    n: "3",
    title: "Paste to your agent",
    body: (
      <>
        A verified-unique selector — plus the element&apos;s text and markup — is on your clipboard.
        Your agent knows exactly what you mean.
      </>
    ),
  },
];

const ENGINE = [
  {
    title: "Verified-unique, always",
    body: (
      <>
        A selector ships only if <code className="font-mono text-[13px]">querySelectorAll</code>{" "}
        matches exactly one node. Ancestors and{" "}
        <code className="font-mono text-[13px]">:nth-of-type()</code> are added only when they
        actually disambiguate. If uniqueness can&apos;t be reached, Pluck tells you.
      </>
    ),
    code: (
      <span className="text-[#4f46e5]">document.querySelectorAll(sel).length === 1 ✓</span>
    ),
  },
  {
    title: "Junk classes filtered out",
    body: (
      <>
        Machine-generated noise from CSS Modules, styled-components, Emotion and friends is dropped,
        so selectors stay readable and stable across builds. Real names survive.
      </>
    ),
    code: (
      <>
        <span className="text-[#dc2626] line-through">.css-1a2b3c</span>{" "}
        <span className="text-[#dc2626] line-through">.sc-bdVaJa</span>{" "}
        <span className="text-[#dc2626] line-through">.jsx-81747</span>
        {"\n"}
        <span className="text-[#15803d]">.btn-primary .editorContent ✓</span>
      </>
    ),
  },
  {
    title: "Refine without re-aiming",
    body: (
      <>
        Wanted the card, not the paragraph inside it? <kbd className="key">↑</kbd> walks up to the
        parent, <kbd className="key">↓</kbd> back down — grab the right container without
        pixel-perfect mousing.
      </>
    ),
    code: (
      <span className="text-zinc-600">
        p.card-sub <span className="text-accent-soft">→ ↑ →</span> div.card{" "}
        <span className="text-accent-soft">→ ↑ →</span> section.features
      </span>
    ),
  },
  {
    title: "Correct in the weird cases",
    body: (
      <>
        SVG tag casing is preserved (a lowercased{" "}
        <code className="font-mono text-[13px]">linearGradient</code> matches nothing), and every
        identifier is CSS-escaped — emoji classes, leading digits, all of it.
      </>
    ),
    code: <span className="text-[#4f46e5]">svg &gt; defs &gt; linearGradient#grad-a ✓</span>,
  },
];

export default function Home() {
  return (
    <>
      <Schema />
      <Header />
      <main id="top">
        {/* ── Hero: framed rounded card floating on a soft canvas ─────────── */}
        <section className="hero-canvas px-3 pt-[78px] pb-3 sm:px-4 sm:pb-4">
          <div className="hero-card mx-auto max-w-6xl px-5 pt-16 pb-12 sm:px-10 sm:pt-24 sm:pb-16">
            <div className="mx-auto max-w-4xl text-center">
              <p
                className="chip reveal mx-auto mb-7"
                style={{ "--reveal-delay": "0s" } as React.CSSProperties}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Free &amp; open source · Chrome · Edge · Brave · Arc
              </p>
              <h1
                className="reveal mx-auto max-w-3xl text-[clamp(36px,5vw,62px)] leading-[1.06] font-semibold"
                style={{ "--reveal-delay": "0.06s" } as React.CSSProperties}
              >
                Stop describing elements to your AI&nbsp;agent.{" "}
                <span className="bg-gradient-to-r from-[#6366f1] via-[#4f46e5] to-[#4338ca] bg-clip-text text-transparent">
                  Point at them.
                </span>
              </h1>
              <p
                className="reveal mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft"
                style={{ "--reveal-delay": "0.12s" } as React.CSSProperties}
              >
                Pluck is a browser extension for the AI-assisted dev loop: hit a hotkey, click any
                element, and an agent-ready CSS selector lands on your clipboard. Paste it to Claude
                Code, Cursor, Copilot — anything that reads text.
              </p>
              <div
                className="reveal mt-9 flex flex-wrap items-center justify-center gap-3.5"
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

            <div
              className="reveal mx-auto mt-14 max-w-3xl"
              style={{ "--reveal-delay": "0.3s" } as React.CSSProperties}
            >
              <LiveDemo />
            </div>
          </div>
        </section>

        {/* ── How it works (consolidated: gesture → clipboard → engine) ───── */}
        <section id="how" className="scroll-mt-24 px-5 pt-24 pb-20">
          <div className="mx-auto max-w-5xl">
            <SectionHeading
              kicker="How it works"
              title="One gesture, not five steps"
              sub="The old loop: DevTools → Inspect → read the class soup → copy → describe it anyway. Pluck collapses it into point, click, paste — and earns every selector it hands your agent."
            />

            {/* Beat 1 — the gesture */}
            <Beat n="01" kicker="The gesture" title="Point and click, nothing else" />
            <div className="grid gap-5 sm:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="card reveal-scroll p-7">
                  <span className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/12 font-mono text-[14px] font-semibold text-accent-soft">
                    {s.n}
                  </span>
                  <h4 className="mb-2.5 text-[17px] font-semibold">{s.title}</h4>
                  <p className="text-[14.5px] leading-relaxed text-ink-soft">{s.body}</p>
                </div>
              ))}
            </div>

            {/* Beat 2 — what gets copied */}
            <div className="mt-8">
              <Beat
                n="02"
                kicker="What lands on your clipboard"
                title="Choose how much context travels"
                sub="Three formats, switchable in the popup. The default gives an agent everything it needs to find the element in source — and nothing it doesn't."
              />
              <FormatTabs />
            </div>

            {/* Beat 3 — the engine */}
            <div className="mt-8">
              <Beat
                n="03"
                kicker="Selectors that earn the paste"
                title="Verified, not guessed"
                sub="Most pickers guess. Pluck checks every candidate against the live DOM before it's offered."
              />
              <div className="grid gap-5 sm:grid-cols-2">
                {ENGINE.map((e) => (
                  <div key={e.title} className="card reveal-scroll p-7">
                    <h4 className="mb-2.5 text-[17px] font-semibold">{e.title}</h4>
                    <p className="mb-4 text-[14.5px] leading-relaxed text-ink-soft">{e.body}</p>
                    <pre className="overflow-x-auto rounded-lg border border-black/[0.07] bg-zinc-50 p-3.5 font-mono text-[12.5px] leading-relaxed">
                      {e.code}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Reliability ──────────────────────────────────────────────── */}
        <section className="px-5 py-20">
          <div className="mx-auto max-w-5xl">
            <div
              className="card overflow-hidden p-10 sm:p-14"
              style={{ background: "rgba(99,102,241,0.05)", borderColor: "rgba(99,102,241,0.18)" }}
            >
              <div className="mx-auto max-w-2xl text-center">
                <p className="mb-3 text-[12.5px] font-semibold tracking-[0.14em] text-accent-soft uppercase">
                  Engineered for the first press
                </p>
                <h2 className="text-[clamp(24px,3vw,36px)] leading-[1.2] font-semibold">
                  The shortcut that always fires
                </h2>
                <p className="mt-5 text-[15.5px] leading-relaxed text-ink-soft">
                  Most extensions route hotkeys through the browser&apos;s command API — which means
                  waking a service worker, racing injection, and silently failing in some browsers.
                  Pluck&apos;s listener is <em>already on the page</em>, declared in the manifest. No
                  wake-up, no race. And because every inspect-mode event is captured before the page
                  sees it, you can pluck a link or submit button without triggering it.
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
                  {["Chrome", "Edge", "Brave", "Arc"].map((b) => (
                    <span key={b} className="chip">
                      {b} ✓
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Privacy ──────────────────────────────────────────────────── */}
        <section id="privacy" className="glow-soft scroll-mt-24 px-5 py-24">
          <div className="mx-auto max-w-5xl">
            <SectionHeading
              kicker="Privacy"
              title="Nothing leaves your machine"
              sub="Not a promise — an architecture. Pluck has no server to send anything to."
            />
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                {
                  title: "Zero network",
                  body: "No requests, no analytics, no telemetry, no error reporting, no accounts. The permission gate in CI fails the build if anything new sneaks in.",
                },
                {
                  title: "Reads only on invoke",
                  body: "Pluck touches the DOM at the moment you activate it and click — never in the background, never on page load.",
                },
                {
                  title: "Local storage only",
                  body: "Your format preference, custom shortcut and last 10 captures live in chrome.storage.local — on your device, deleted on uninstall.",
                },
              ].map((c) => (
                <div key={c.title} className="card reveal-scroll p-7">
                  <h3 className="mb-2.5 text-[16.5px] font-semibold">{c.title}</h3>
                  <p className="text-[14.5px] leading-relaxed text-ink-soft">{c.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-[14px] text-ink-soft">
              Read the full{" "}
              <Link
                href="/privacy"
                className="text-accent-soft underline decoration-accent/40 underline-offset-4 hover:text-ink"
              >
                privacy policy
              </Link>{" "}
              — it&apos;s genuinely short.
            </p>
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

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-black/[0.08] px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <a
            href={`${GITHUB_URL}/stargazers`}
            target="_blank"
            rel="noopener noreferrer"
            className="group mx-auto mb-9 flex w-fit items-center gap-2.5 rounded-full border border-black/10 bg-white px-5 py-2.5 text-[14px] text-ink-soft shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-accent/40 hover:bg-[rgba(99,102,241,0.05)] hover:text-ink"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
              aria-hidden
              className="text-accent-soft transition-transform duration-300 group-hover:scale-110"
            >
              <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            If Pluck saved you a DevTools trip,&nbsp;
            <span className="font-semibold text-ink">star it on GitHub</span>
          </a>
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <PluckMark size={22} radius={6} />
              <span className="text-[14px] font-semibold">Pluck</span>
              <span className="text-[13px] text-ink-dim">© 2026 William Laverty · MIT</span>
            </div>
            <nav
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-soft"
              aria-label="Footer"
            >
              <a className="transition-colors hover:text-ink" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a
                className="transition-colors hover:text-ink"
                href={`${GITHUB_URL}/blob/main/CHANGELOG.md`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Changelog
              </a>
              <Link className="transition-colors hover:text-ink" href="/support">
                Support
              </Link>
              <Link className="transition-colors hover:text-ink" href="/privacy">
                Privacy
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
