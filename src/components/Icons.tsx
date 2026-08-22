import type { ReactNode } from "react";

type Props = { size?: number; className?: string };

function Svg({ size = 22, className, children }: Props & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: Props) => (
  <Svg {...p}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M7 10.5V20h10v-9.5" />
  </Svg>
);

export const IconCards = (p: Props) => (
  <Svg {...p}>
    <rect x="5" y="6" width="11" height="14" rx="2" />
    <path d="M16 8h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9" />
  </Svg>
);

export const IconQuiz = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M9.2 9.4a2.8 2.8 0 1 1 3.6 3.3c-.7.4-1.1.9-1.1 1.7" />
    <path d="M12 17.4h.01" />
  </Svg>
);

export const IconList = (p: Props) => (
  <Svg {...p}>
    <path d="M8 7h11M8 12h11M8 17h11" />
    <path d="M5 7h.01M5 12h.01M5 17h.01" />
  </Svg>
);

export const IconStats = (p: Props) => (
  <Svg {...p}>
    <path d="M5 19V10M12 19V5M19 19v-7" />
  </Svg>
);

export const IconBack = (p: Props) => (
  <Svg {...p} size={p.size ?? 18}>
    <path d="M15 5 8 12l7 7" />
  </Svg>
);

export const IconSpeak = (p: Props) => (
  <Svg {...p}>
    <path d="M4 10v4h3l5 4V6L7 10H4z" />
    <path d="M16 9.2a3.2 3.2 0 0 1 0 5.6" />
  </Svg>
);

export const IconGear = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 4.5v2.2M12 17.3v2.2M4.5 12h2.2M17.3 12h2.2M6.4 6.4l1.6 1.6M16 16l1.6 1.6M17.6 6.4 16 8M8 16l-1.6 1.6" />
  </Svg>
);

export const IconFlame = (p: Props) => (
  <Svg {...p}>
    <path d="M12 20c4 0 6-2.8 6-6.4 0-4-3.4-6.4-3.4-6.4S14 9.8 13.2 12c0 0-1.4-2.2-.4-5.6C8.6 8 6 10.8 6 14.2 6 17.6 8.2 20 12 20z" />
  </Svg>
);

export const IconClose = (p: Props) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
