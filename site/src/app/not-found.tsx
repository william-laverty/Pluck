import Link from "next/link";
import { PluckMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="glow-hero flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <PluckMark size={48} radius={13} />
      <h1 className="mt-7 text-[clamp(28px,4vw,44px)] font-semibold">
        No element matches that selector.
      </h1>
      <p className="mt-4 max-w-sm font-mono text-[14px] text-ink-soft">
        document.querySelectorAll(&quot;this-page&quot;).length === 0
      </p>
      <Link href="/" className="btn-solid mt-9">
        Back to Pluck
      </Link>
    </main>
  );
}
