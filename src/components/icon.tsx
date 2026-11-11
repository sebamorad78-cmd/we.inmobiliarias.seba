import type { SVGProps } from "react";

/** Set de íconos propio, trazo 1.5, grilla 24. */
const paths = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>,
  heart: <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" />,
  arrowRight: <path d="M4 12h15M13 6l6 6-6 6" />,
  arrowLeft: <path d="M20 12H5M11 6l-6 6 6 6" />,
  arrowUpRight: <path d="M7 17L17 7M9 7h8v8" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronLeft: <path d="M15 5l-7 7 7 7" />,
  chevronRight: <path d="M9 5l7 7-7 7" />,
  area: <><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></>,
  bed: <><path d="M3 18v-6.5A1.5 1.5 0 0 1 4.5 10h15a1.5 1.5 0 0 1 1.5 1.5V18M3 15h18M3 18v1.5M21 18v1.5" /><path d="M6 10V7.5A1.5 1.5 0 0 1 7.5 6h3A1.5 1.5 0 0 1 12 7.5V10" /></>,
  bath: <><path d="M4 12h16v2.5a4.5 4.5 0 0 1-4.5 4.5h-7A4.5 4.5 0 0 1 4 14.5V12zM7 19l-1 1.5M17 19l1 1.5" /><path d="M6 12V6a2 2 0 0 1 3.8-.9" /></>,
  car: <><path d="M5 16V12l1.6-4.2A2 2 0 0 1 8.5 6.5h7a2 2 0 0 1 1.9 1.3L19 12v4M5 16h14M5 16v2M19 16v2M4 12h16" /><circle cx="8" cy="13.8" r=".6" /><circle cx="16" cy="13.8" r=".6" /></>,
  rooms: <><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M12 4v9M12 16v4M4 12h5" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14.5" rx="1.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>,
  pin: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>,
  phone: <path d="M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7L16 13l4 1.5v3A2 2 0 0 1 18 19.5 15.5 15.5 0 0 1 4.5 6 2 2 0 0 1 6.5 4z" />,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="1.5" /><path d="M4 7l8 6 8-6" /></>,
  whatsapp: <><path d="M4.5 19.5l1.2-3.8A8 8 0 1 1 8.6 18.5z" /><path d="M9.2 8.6c.2-.4.5-.4.8-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.6l-.5.6c-.1.2-.1.4 0 .6a5.8 5.8 0 0 0 2.5 2.4c.2.1.4.1.6 0l.6-.6c.2-.2.4-.2.6-.1l1.6.7c.2.1.4.3.4.5v.5c0 .3-.1.6-.4.8-.5.4-1.2.7-2 .6a7.6 7.6 0 0 1-5.8-5.8c-.1-.8.2-1.5.6-2z" /></>,
  share: <><circle cx="17.5" cy="5.5" r="2.2" /><circle cx="6.5" cy="12" r="2.2" /><circle cx="17.5" cy="18.5" r="2.2" /><path d="M8.5 11l7-4.2M8.5 13l7 4.2" /></>,
  compare: <><rect x="3.5" y="5" width="7" height="14" rx="1" /><rect x="13.5" y="5" width="7" height="14" rx="1" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>,
  map: <><path d="M9 4.5L3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z" /><path d="M9 4.5v13M15 6.5v13" /></>,
  photos: <><rect x="3.5" y="5" width="17" height="14" rx="1.5" /><circle cx="9" cy="10" r="1.7" /><path d="M20.5 16l-5-5-8 8" /></>,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  calc: <><rect x="5" y="3.5" width="14" height="17" rx="1.5" /><path d="M8 7.5h8M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01" /></>,
  print: <><path d="M7 8V4h10v4M7 17H5a1.5 1.5 0 0 1-1.5-1.5V10A1.5 1.5 0 0 1 5 8.5h14a1.5 1.5 0 0 1 1.5 1.5v5.5A1.5 1.5 0 0 1 19 17h-2" /><rect x="7" y="14" width="10" height="6" /></>,
  play: <path d="M8 5.5v13l10.5-6.5z" />,
  cube: <><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" /></>,
  instagram: <><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="16.8" cy="7.2" r=".6" /></>,
  linkedin: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 10.5V16M8 7.8v.01M11.5 16v-5.5M11.5 13c0-1.4 1-2.5 2.3-2.5S16 11.4 16 13v3" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="M11 12l8-8M16 7l2 2M14 9l1.5 1.5" /></>,
  chart: <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" />,
  shield: <path d="M12 3.5l7 3v5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5v-5z" />,
  doc: <><path d="M6.5 3.5h7l4 4v13h-11z" /><path d="M13.5 3.5v4h4M9 12h6M9 15.5h6" /></>,
  users: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 6M17.5 14.2a5 5 0 0 1 3 5.3" /></>,
  inbox: <><path d="M3.5 13.5l2.5-8h12l2.5 8V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" /><path d="M3.5 13.5h5l1 2.5h5l1-2.5h5" /></>,
  home: <><path d="M4 11l8-6.5 8 6.5" /><path d="M6 9.5V20h12V9.5" /></>,
  logout: <><path d="M14 4.5H6.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H14" /><path d="M10 12h10M16.5 8.5L20 12l-3.5 3.5" /></>,
  edit: <path d="M5 19h3.5L19 8.5 15.5 5 5 15.5zM13.5 7l3.5 3.5" />,
  trash: <><path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  upload: <><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5" /><path d="M4.5 15v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V15" /></>,
  star: <path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z" />,
  today: <><rect x="4" y="5.5" width="16" height="14.5" rx="1.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /><path d="M9.5 15l1.8 1.8L15 13" /></>,
  kanban: <><rect x="3.5" y="4.5" width="5" height="15" rx="1" /><rect x="10" y="4.5" width="5" height="10" rx="1" /><rect x="16.5" y="4.5" width="4" height="6.5" rx="1" /></>,
  contact: <><rect x="3.5" y="4.5" width="17" height="15" rx="1.5" /><circle cx="9.5" cy="11" r="2.3" /><path d="M6 16.5a3.6 3.6 0 0 1 7 0M15 9.5h3M15 12.5h3" /></>,
  building: <><path d="M5 20.5V5.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15M15 9.5h3a1 1 0 0 1 1 1v10M3.5 20.5h17" /><path d="M8 8h1.5M11 8h1.5M8 11.5h1.5M11 11.5h1.5M8 15h1.5M11 15h1.5" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  bell: <><path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  note: <><path d="M5 4.5h14v11l-4 4H5z" /><path d="M15 19.5v-4h4M8.5 9h7M8.5 12.5h5" /></>,
  external: <><path d="M14 4.5h5.5V10M19.5 4.5L11 13" /><path d="M17 14v4.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1H10" /></>,
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
