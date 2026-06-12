import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { PluckMark } from "@/components/Logo";
import { CONTACT_EMAIL, GITHUB_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Pluck's privacy policy: no data collection, no network requests, no analytics. Everything stays on your device.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="glow-soft min-h-screen px-5 pt-36 pb-24">
        <article className="mx-auto max-w-2xl">
          <header className="mb-12">
            <PluckMark size={40} radius={11} />
            <h1 className="mt-6 text-[clamp(30px,4vw,44px)] leading-[1.1] font-semibold">
              Privacy Policy
            </h1>
            <p className="mt-3 text-[14px] text-ink-dim">Effective June 11, 2026</p>
          </header>

          <div className="space-y-10 text-[15.5px] leading-relaxed text-ink-soft [&_h2]:mb-3 [&_h2]:text-[19px] [&_h2]:font-semibold [&_h2]:text-ink [&_strong]:text-ink">
            <p className="text-[17px]">
              Pluck is a browser extension that copies a CSS selector (and optional context) for an
              element you click. This policy explains, completely, what Pluck does with data — which
              is easy, because the answer is: <strong>nothing leaves your machine.</strong>
            </p>

            <section>
              <h2>What Pluck collects</h2>
              <p>
                Nothing. Pluck has <strong>no servers, makes no network requests, and contains no
                analytics, telemetry, error reporting, or tracking of any kind</strong>. There is no
                account, no sign-in, and no identifier.
              </p>
            </section>

            <section>
              <h2>What Pluck stores — locally, on your device</h2>
              <p>
                Pluck uses the browser&apos;s <code className="font-mono text-[14px]">chrome.storage.local</code> API
                (data that stays inside your browser profile) for exactly three things:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5">
                <li>
                  <strong>Your copy-format preference</strong> — selector, context, or full.
                </li>
                <li>
                  <strong>Your custom keyboard shortcut</strong>, if you changed it from the
                  default.
                </li>
                <li>
                  <strong>Your last 10 captures</strong> — the selector, a short text/HTML snippet
                  of the element you clicked, and the page URL it came from — so the popup can show
                  &ldquo;Recent&rdquo; and let you re-copy. Clear it any time with the popup&apos;s{" "}
                  <strong>Clear</strong> button; it&apos;s deleted automatically when you uninstall.
                </li>
              </ul>
              <p className="mt-4">
                This data is never transmitted anywhere. It is readable only by Pluck inside your
                browser.
              </p>
            </section>

            <section>
              <h2>What Pluck reads</h2>
              <p>
                When — and only when — you activate inspect mode (keyboard shortcut or toolbar
                button) and click an element, Pluck reads that element&apos;s tag, attributes,
                classes, a truncated snippet of its text, and (in <em>Full</em> mode) a few of its
                computed styles, in order to build the string it puts on your clipboard. Pluck does
                not read pages in the background, does not scan page content on load, and does not
                observe your browsing.
              </p>
            </section>

            <section>
              <h2>Why Pluck asks for broad host access</h2>
              <p>
                The extension requests <code className="font-mono text-[14px]">host_permissions: &lt;all_urls&gt;</code>{" "}
                so its content script (which contains the keyboard-shortcut listener) can be present
                on every page. That is what makes the hotkey fire reliably on the first press on any
                site. The <code className="font-mono text-[14px]">scripting</code> permission is used only as a
                fallback to inject into tabs that were already open before you installed Pluck. The{" "}
                <code className="font-mono text-[14px]">storage</code> permission stores the three items listed
                above. None of these are used to collect or transmit data.
              </p>
            </section>

            <section>
              <h2>Clipboard</h2>
              <p>
                Pluck <em>writes</em> to your clipboard when you capture an element, and when you
                click an entry in the popup history. It never reads your clipboard.
              </p>
            </section>

            <section>
              <h2>Children&apos;s privacy, data sales, third parties</h2>
              <p>
                Pluck collects no data from anyone, sells no data, and shares no data — there is
                nothing to sell or share.
              </p>
            </section>

            <section>
              <h2>Changes to this policy</h2>
              <p>
                If Pluck&apos;s behavior ever changes in a way that affects this policy, the new
                policy ships with the extension update, with the change noted in the{" "}
                <a
                  className="text-accent-soft underline decoration-accent/40 underline-offset-4 hover:text-ink"
                  href={`${GITHUB_URL}/blob/main/CHANGELOG.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  changelog
                </a>
                . Given the project&apos;s design rule — <em>no network, nothing leaves the
                machine</em> — substantive change is not expected.
              </p>
            </section>

            <section>
              <h2>Contact</h2>
              <p>
                Questions:{" "}
                <a
                  className="text-accent-soft underline decoration-accent/40 underline-offset-4 hover:text-ink"
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>
                , or open an issue on{" "}
                <a
                  className="text-accent-soft underline decoration-accent/40 underline-offset-4 hover:text-ink"
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
                .
              </p>
            </section>
          </div>

          <div className="mt-14 border-t border-white/10 pt-8">
            <Link href="/" className="btn-line">
              ← Back to Pluck
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
