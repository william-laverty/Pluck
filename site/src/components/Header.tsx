"use client";

import { useEffect, useState } from "react";
import { GITHUB_URL } from "@/lib/seo";
import { PluckMark } from "./Logo";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="nav-shell">
      <nav className={`nav-pill ${scrolled ? "is-scrolled" : ""}`} aria-label="Main">
        <a href="#top" className="flex items-center gap-2.5 pr-2" aria-label="Pluck — home">
          <PluckMark size={26} radius={7} />
          <span className="text-[15px] font-semibold tracking-[-0.02em]">Pluck</span>
        </a>
        <div className="hidden flex-1 items-center justify-center gap-1 sm:flex">
          <a className="nav-link" href="#how">How it works</a>
          <a className="nav-link" href="#formats">Formats</a>
          <a className="nav-link" href="#engine">Engine</a>
          <a className="nav-link" href="#privacy">Privacy</a>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
          <a
            className="nav-link hidden md:block"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-solid !px-4 !py-2 !text-[13px]"
          >
            Get Pluck
          </a>
        </div>
      </nav>
    </header>
  );
}
