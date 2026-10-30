import type { Tool } from "@/lib/tools";

type ToolIconName = Tool["icon"];

export default function ToolIcon({ icon, className = "h-6 w-6" }: {
  icon: ToolIconName;
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  return (
    <svg {...common}>
      {icon === "website" && (
        <>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 17v4M7 8h10M7 11h6" />
        </>
      )}
      {icon === "chat" && (
        <>
          <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6a7.5 7.5 0 1 1 17-3.5Z" />
          <path d="M8 11h.01M12 11h.01M16 11h.01" />
        </>
      )}
      {icon === "product" && (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5M8 8h5M8 11h5M8 14h3" />
        </>
      )}
      {icon === "law" && (
        <>
          <path d="M12 4v16M7 20h10M5 7h14M7 7l-4 8h8L7 7ZM17 7l-4 8h8l-4-8Z" />
        </>
      )}
      {icon === "science" && (
        <>
          <path d="M9 3h6M10 3v6l-5.5 9.2A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.8L14 9V3" />
          <path d="M8 15h8M10 12h4" />
        </>
      )}
      {icon === "medical" && (
        <>
          <path d="M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.5-8 11-8 11Z" />
          <path d="M12 9v6M9 12h6" />
        </>
      )}
      {icon === "business" && (
        <>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
        </>
      )}
      {icon === "language" && (
        <>
          <path d="M4 5h11a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-4l-4 3v-3H4a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z" />
          <path d="M8 9v4M6.5 11h3M12 9l2 4M13 11h2M17 18h3a3 3 0 0 0 3-3v-2" />
        </>
      )}
    </svg>
  );
}
