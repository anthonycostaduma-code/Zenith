import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (p: P) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

/** Monogramme Zenith : un sommet qui perce un cercle de concentration. */
export function ZenithMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id="zgrad" x1="0" y1="48" x2="48" y2="0">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" stroke="url(#zgrad)" strokeWidth="2" opacity="0.55" />
      <circle cx="24" cy="16" r="4.4" fill="var(--accent)" />
      <path
        d="M8 35c4.4-1 7.2-4.2 9.6-8.4C19.6 23 21.4 21 24 21s4.4 2 6.4 5.6C32.8 30.8 35.6 34 40 35"
        stroke="url(#zgrad)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path d="M13 40h22" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export const IconHome = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 18c3.5-1.2 5.2-4 7-7 1.3-2.1 2.6-2.1 3.9 0 1.8 3 3.6 5.8 7.1 7" />
    <circle cx="12" cy="5.5" r="2.2" />
    <path d="M4.5 21h15" />
  </svg>
);

export const IconTasks = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7.5 5.8 9.3 9.2 5.8" />
    <path d="M4 17.2 5.8 19l3.4-3.5" />
    <path d="M12.5 7.5H21" />
    <path d="M12.5 17H21" />
  </svg>
);

export const IconHabits = (p: P) => (
  <svg {...base(p)}>
    <path d="M18.8 8.2A7.8 7.8 0 0 0 5.1 7" />
    <path d="M5.1 7V3.8M5.1 7h3.2" />
    <path d="M5.2 15.8A7.8 7.8 0 0 0 18.9 17" />
    <path d="M18.9 17v3.2M18.9 17h-3.2" />
    <path d="m8.8 12 2.1 2.1 4.5-4.6" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="9.2" opacity="0.22" />
  </svg>
);

export const IconStudies = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 8.5 12 4.5l9 4-9 4-9-4Z" />
    <path d="M6.5 10.5V16c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-5.5" />
    <path d="M21 8.5v5.2" />
  </svg>
);

export const IconFocus = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3.5V6M12 18v2.5M3.5 12H6M18 12h2.5" />
  </svg>
);

export const IconAverage = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 19V9" />
    <path d="M10 19V5" />
    <path d="M16 19v-6" />
    <path d="M21 19H3" />
  </svg>
);

export const IconTracking = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 13h3.5l2-5 3 10 2.5-7 1.8 4H21" />
    <circle cx="12" cy="12" r="9.5" opacity="0.35" />
  </svg>
);

export const IconCloud = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 18h10a3.5 3.5 0 0 0 .3-7A5.2 5.2 0 0 0 7.4 10 3.9 3.9 0 0 0 7 18Z" />
    <path d="m10 14 2-2 2 2" />
    <path d="M12 12v5" />
  </svg>
);

export const IconPalette = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.4-1.1-1.8-1.1-2.9 0-.8.7-1.4 1.6-1.4H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7Z" />
    <circle cx="8" cy="11" r="1" fill="currentColor" />
    <circle cx="12" cy="8" r="1" fill="currentColor" />
    <circle cx="16" cy="10.5" r="1" fill="currentColor" />
  </svg>
);

export const IconCollapse = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 7l-5 5 5 5" />
    <path d="M19 5v14" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16" />
    <path d="M9.5 7V5.5h5V7" />
    <path d="M6.5 7l.8 12.2h9.4L17.5 7" />
  </svg>
);

export const IconChevron = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const IconPlay = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" />
  </svg>
);

export const IconPause = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 5v14M15 5v14" strokeWidth={2.4} />
  </svg>
);

export const IconReset = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" />
    <path d="M4 4v4h4" />
  </svg>
);

export const IconSkip = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6v12l9-6-9-6Z" fill="currentColor" />
    <path d="M18 5v14" strokeWidth={2} />
  </svg>
);

export const IconFlame = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3s5 4.2 5 8.6A5 5 0 0 1 7 12c0-1.6.7-2.7 1.7-3.8C9.9 6.9 12 6 12 3Z" />
  </svg>
);

export const IconPencil = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20h4l10-10-4-4L4 16v4Z" />
    <path d="m14.5 5.5 4 4" />
  </svg>
);

export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="11" height="11" rx="3" />
    <path d="M15 6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15" />
  </svg>
);

export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IconCamera = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8.5h3l1.5-2h7L17 8.5h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13.5" r="3.2" />
  </svg>
);

export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v10" />
    <path d="m8 11 4 4 4-4" />
    <path d="M5 19h14" />
  </svg>
);
