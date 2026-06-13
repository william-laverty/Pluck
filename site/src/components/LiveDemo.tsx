"use client";

/**
 * The hero centerpiece: a working Pluck playground. Hovering elements inside
 * the fake browser window shows the real overlay treatment (indigo box +
 * mono label pill); ↑/↓ refine to parent/child; clicking computes a
 * verified-unique selector with the same engine the extension ships and
 * really writes it to the clipboard.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { buildSelector, isJunkClass } from "@/lib/pluckEngine";

type LabelParts = { tag: string; id: string; classes: string[]; dims: string };
type BoxRect = { top: number; left: number; width: number; height: number };

export function LiveDemo() {
  const stageRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<Element | null>(null);
  const hoveringRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [box, setBox] = useState<BoxRect | null>(null);
  const [label, setLabel] = useState<(LabelParts & { top: number; left: number }) | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const paint = useCallback((el: Element | null) => {
    const stage = stageRef.current;
    const page = pageRef.current;
    if (!el || !stage || !page || !page.contains(el)) return;
    currentRef.current = el;

    const sRect = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const top = r.top - sRect.top;
    const left = r.left - sRect.left;
    setBox({ top, left, width: r.width, height: r.height });

    const classes = Array.from(el.classList).filter((c) => !isJunkClass(c)).slice(0, 4);
    const id = el.id && !/\s/.test(el.id) && !isJunkClass(el.id) ? el.id : "";
    const labelTop = top - 34 < 6 ? top + r.height + 8 : top - 34;
    setLabel({
      tag: el.tagName.toLowerCase(),
      id,
      classes,
      dims: `${Math.round(r.width)}×${Math.round(r.height)}`,
      top: labelTop,
      left: Math.max(6, Math.min(left, sRect.width - 260)),
    });
  }, []);

  const clear = useCallback(() => {
    currentRef.current = null;
    setBox(null);
    setLabel(null);
  }, []);

  const capture = useCallback((el: Element | null) => {
    const page = pageRef.current;
    if (!el || !page || !page.contains(el)) return;
    const built = buildSelector(el, page);
    const text = built.unique || built.headline;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2100);
  }, []);

  // ↑/↓ refine while the pointer is over the playground — same keys as the extension
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!hoveringRef.current || !currentRef.current) return;
      if (e.key === "ArrowUp") {
        const parent = currentRef.current.parentElement;
        if (parent && pageRef.current?.contains(parent) && parent !== pageRef.current) {
          e.preventDefault();
          paint(parent);
        }
      } else if (e.key === "ArrowDown") {
        const child = currentRef.current.firstElementChild;
        if (child) {
          e.preventDefault();
          paint(child);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        capture(currentRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paint, capture]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  return (
    <div className="relative">
      <div
        ref={stageRef}
        className="terminal relative select-none"
        onPointerEnter={() => (hoveringRef.current = true)}
        onPointerLeave={() => {
          hoveringRef.current = false;
          clear();
        }}
      >
        {/* window chrome */}
        <div className="terminal-bar">
          <i style={{ background: "#fda4af" }} />
          <i style={{ background: "#fcd34d" }} />
          <i style={{ background: "#86efac" }} />
          <span className="mx-auto rounded-md bg-black/[0.05] px-6 py-0.5 font-mono text-[11px] text-ink-soft">
            solstice.app
          </span>
          <span className="w-12" />
        </div>

        {/* the page being "plucked" — semantic classes only, so the labels and
            copied selectors read like a real site (one junk class planted to
            show the filter working) */}
        <style>{`
          .pg-page .mini-nav { display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #e2e8f0; padding: 12px 20px; }
          .pg-page .logo { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; letter-spacing: -0.01em; }
          .pg-page .logo-mark { display: inline-block; width: 18px; height: 18px; border-radius: 6px; background: linear-gradient(135deg, #14b8a6, #0d9488); }
          .pg-page .nav-link { font-size: 12.5px; font-weight: 500; color: #64748b; text-decoration: none; }
          .pg-page .spacer { flex: 1; }
          .pg-page .btn { border: 0; border-radius: 8px; padding: 6px 12px; font-size: 12.5px; font-weight: 600; font-family: inherit; }
          .pg-page .btn-ghost { background: #fff; color: #334155; border: 1px solid #cbd5e1; }
          .pg-page .btn-primary { background: #0d9488; color: #fff; }
          .pg-page .mini-hero { display: grid; grid-template-columns: 1.1fr 0.9fr; align-items: center; gap: 28px; padding: 28px; }
          .pg-page .kicker { display: inline-block; margin-bottom: 12px; border: 1px solid #99f6e4; background: #f0fdfa; color: #0d9488; border-radius: 999px; padding: 2px 10px; font-size: 10.5px; font-weight: 600; }
          .pg-page .hero-title { margin: 0; font-size: 26px; line-height: 1.12; font-weight: 750; letter-spacing: -0.03em; color: #0f172a; }
          .pg-page .hero-sub { margin: 10px 0 0; font-size: 13px; line-height: 1.55; color: #64748b; }
          .pg-page .cta { display: flex; gap: 10px; margin-top: 16px; }
          .pg-page .cta .btn { border-radius: 9px; padding: 8px 16px; font-size: 13px; }
          .pg-page .feature-list { display: grid; gap: 10px; }
          .pg-page .feature-card { display: flex; align-items: center; gap: 12px; border: 1px solid #e2e8f0; background: #fff; border-radius: 12px; padding: 12px; }
          .pg-page .feature-card .icon { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: #f0fdfa; color: #0d9488; font-size: 14px; flex: 0 0 auto; }
          .pg-page .card-title { margin: 0; font-size: 12.5px; font-weight: 700; color: #1e293b; }
          .pg-page .card-sub { margin: 1px 0 0; font-size: 11.5px; color: #64748b; }
          @media (max-width: 640px) {
            .pg-page .mini-hero { grid-template-columns: 1fr; }
            .pg-page .feature-list { display: none; }
            .pg-page .mini-nav .nav-link { display: none; }
          }
        `}</style>
        <div
          ref={pageRef}
          className="pg-page"
          onPointerMove={(e) => {
            if (e.pointerType !== "mouse") return;
            const t = e.target as Element;
            if (t !== currentRef.current) paint(t);
          }}
          onPointerDown={(e) => {
            if (e.pointerType === "mouse") return;
            paint(e.target as Element);
          }}
          onClick={(e) => {
            e.preventDefault();
            capture(currentRef.current ?? (e.target as Element));
          }}
        >
          <div className="mini-nav">
            <span className="logo">
              <span className="logo-mark" />
              Solstice
            </span>
            <a className="nav-link" href="#features" onClick={(e) => e.preventDefault()}>Features</a>
            <a className="nav-link" href="#pricing" onClick={(e) => e.preventDefault()}>Pricing</a>
            <a className="nav-link" href="#docs" onClick={(e) => e.preventDefault()}>Docs</a>
            <span className="spacer" />
            <button type="button" className="btn btn-ghost">Sign in</button>
            <a className="btn btn-primary" href="#start" onClick={(e) => e.preventDefault()} style={{ textDecoration: "none" }}>
              Start free
            </a>
          </div>

          <div className="mini-hero">
            <div className="hero-copy">
              <span className="kicker">New · Timeline view</span>
              <h3 className="hero-title css-k29dm4">Ship projects without the project management.</h3>
              <p className="hero-sub">Tasks, docs and timelines in one quiet workspace.</p>
              <div className="cta">
                <button type="button" id="get-started" className="btn btn-primary">Get started</button>
                <button type="button" className="btn btn-ghost">Live demo</button>
              </div>
            </div>
            <div className="feature-list">
              <div className="feature-card">
                <span className="icon">▦</span>
                <div>
                  <p className="card-title">Boards that breathe</p>
                  <p className="card-sub">Kanban without the clutter.</p>
                </div>
              </div>
              <div className="feature-card">
                <span className="icon">✦</span>
                <div>
                  <p className="card-title">Docs, attached</p>
                  <p className="card-sub">Specs live next to tasks.</p>
                </div>
              </div>
              <div className="feature-card">
                <span className="icon">◷</span>
                <div>
                  <p className="card-title">Timelines on autopilot</p>
                  <p className="card-sub">See the slip the day it happens.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pluck overlay re-creation */}
        <div className="pg-hint">
          this demo is live — move, <kbd className="rounded bg-white/20 px-1 font-mono">↑</kbd>
          <kbd className="ml-0.5 rounded bg-white/20 px-1 font-mono">↓</kbd> refine, click to copy
        </div>
        <div
          className={`pg-box ${box ? "is-on" : ""}`}
          style={box ? { top: box.top, left: box.left, width: box.width, height: box.height } : undefined}
        />
        <div
          className={`pg-label ${label ? "is-on" : ""}`}
          style={label ? { top: label.top, left: label.left } : undefined}
        >
          {label && (
            <>
              <span className="t">{label.tag}</span>
              {label.id && <span className="i">#{label.id}</span>}
              <span>{label.classes.map((c) => `.${c}`).join("")}</span>
              <span className="d">{"  "}{label.dims}</span>
            </>
          )}
        </div>
        <div className={`pg-toast ${toast ? "is-on" : ""}`} role="status" aria-live="polite">
          <span className="pg-check">
            <svg viewBox="0 0 12 12" width="11" height="11" fill="none">
              <path d="M2.5 6.2l2.2 2.3 4.8-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="pg-sel">{toast}</span>
        </div>
      </div>

      <p className="mt-4 text-center text-[13px] text-ink-soft">
        It really copies — paste your clipboard after clicking. Selectors are computed live with the
        same verified-uniqueness engine the extension ships.
      </p>
    </div>
  );
}
