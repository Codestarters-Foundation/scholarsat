/** Minimal inline icon set (stroke icons, 24px grid). */
type P = { className?: string };
const S = ({ className = "h-5 w-5", children }: P & { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
);
export const IHome = (p: P) => <S {...p}><path d="M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-6v6H5A1.5 1.5 0 0 1 3.5 19z" /></S>;
export const IBook = (p: P) => <S {...p}><path d="M12 6.5C10.5 5 8 4.5 3.5 4.5v14c4.5 0 7 .5 8.5 2 1.5-1.5 4-2 8.5-2v-14c-4.5 0-7 .5-8.5 2z" /><path d="M12 6.5v14" /></S>;
export const IClock = (p: P) => <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></S>;
export const IExam = (p: P) => <S {...p}><rect x="4.5" y="3.5" width="15" height="17" rx="2" /><path d="M8.5 3.5v17M11.5 8h5M11.5 11.5h5" /></S>;
export const IRefresh = (p: P) => <S {...p}><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></S>;
export const ICards = (p: P) => <S {...p}><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4" /></S>;
export const ILink = (p: P) => <S {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></S>;
export const ICompass = (p: P) => <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></S>;
export const IGear = (p: P) => <S {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></S>;
export const IFlag = (p: P) => <S {...p}><path d="M5 21V4h11l-1.5 4L16 12H5" /></S>;
export const IBookmark = (p: P & { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={p.filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round" className={p.className ?? "h-5 w-5"} aria-hidden="true"><path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z" /></svg>
);
export const ICheck = (p: P) => <S {...p}><path d="m5 12 5 5L20 7" /></S>;
export const ICheckCircle = (p: P) => (
  <svg viewBox="0 0 24 24" className={p.className ?? "h-5 w-5"} aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" /><path d="m7.5 12.2 3 3 6-6.2" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const IXCircle = (p: P) => (
  <svg viewBox="0 0 24 24" className={p.className ?? "h-5 w-5"} aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" /><path d="m8.5 8.5 7 7m0-7-7 7" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg>
);
export const IX = (p: P) => <S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>;
export const IArrowR = (p: P) => <S {...p}><path d="M5 12h14M13 6l6 6-6 6" /></S>;
export const IArrowL = (p: P) => <S {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></S>;
export const IChevL = (p: P) => <S {...p}><path d="m15 6-6 6 6 6" /></S>;
export const IChevR = (p: P) => <S {...p}><path d="m9 6 6 6-6 6" /></S>;
export const IChevD = (p: P) => <S {...p}><path d="m6 9 6 6 6-6" /></S>;
export const IFire = (p: P) => <S {...p}><path d="M12 3s5 4.5 5 9.5A5 5 0 0 1 7 12.5C7 10 9 8.5 9 8.5s0 2.5 2 3c0-3 1-8.5 1-8.5z" /></S>;
export const IFireSolid = ({ className = "h-5 w-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M12 2.5s6 5 6 11a6 6 0 0 1-12 0c0-3 2.4-5 2.4-5s.1 3 2.4 3.6C10.8 8.6 12 2.5 12 2.5z" fill="#f59e0b" />
    <path d="M12 12.5s3 2.2 3 4.5a3 3 0 0 1-6 0c0-2 1.6-2.8 1.6-2.8s.4 1.2 1.4 1.4c-.2-1.4 0-3.1 0-3.1z" fill="#fde68a" />
  </svg>
);
export const ITarget = (p: P) => <S {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></S>;
export const ICalc = (p: P) => <S {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></S>;
export const IFormula = (p: P) => <S {...p}><path d="M5 18h3l4-12h4" /><path d="M7 11h6" /><path d="m15 13 4 5m0-5-4 5" /></S>;
export const IMenu = (p: P) => <S {...p}><path d="M4 7h16M4 12h16M4 17h16" /></S>;
export const IChart = (p: P) => <S {...p}><path d="M4 4v16h16" /><path d="m7.5 14.5 3.5-4 3 2.5 4.5-6" /></S>;
export const IList = (p: P) => <S {...p}><path d="M9 6.5h11M9 12h11M9 17.5h11" /><path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" /></S>;
export const IStrike = (p: P) => <S {...p}><path d="M4 12h16" /><path d="M7 6h10M8 18h8" /></S>;
export const ILogout = (p: P) => <S {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 16l-4-4 4-4M6 12h10" /></S>;
export const IPlay = (p: P) => <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="m10.5 9 4 3-4 3z" fill="currentColor" /></S>;
export const ILock = (p: P) => <S {...p}><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></S>;
export const IStar = (p: P) => <S {...p}><path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9l-5.3 2.7 1-5.8-4.2-4.1 5.9-.9z" /></S>;
export const ISparkle = (p: P) => <S {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></S>;
export const IGithub = ({ className = "h-5 w-5" }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z" /></svg>
);
export const IGoogle = ({ className = "h-5 w-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
  </svg>
);
