export function PluckMark({ size = 28, radius = 8 }: { size?: number; radius?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center text-white"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "linear-gradient(135deg, #6366f1, #4f46e5)",
        boxShadow: "0 4px 16px -4px rgba(99,102,241,0.65), inset 0 1px 0 rgba(255,255,255,0.25)",
      }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="none">
        <path
          d="M5 5h4M5 5v4M19 5h-4M19 5v4M5 19h4M5 19v-4M19 19h-4M19 19v-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    </span>
  );
}
