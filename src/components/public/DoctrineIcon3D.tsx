interface DoctrineIcon3DProps {
  kind: 'scale' | 'cloud' | 'flame';
  principleId: number;
}

const ICON_SURFACES: Record<DoctrineIcon3DProps['kind'], string> = {
  scale: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-200/80 shadow-amber-900/10 dark:border-amber-300/10 dark:from-amber-950/70 dark:via-orange-950/50 dark:to-amber-900/50',
  cloud: 'border-sky-200/90 bg-gradient-to-br from-sky-100 via-sky-200 to-cyan-300 shadow-sky-500/25 dark:border-sky-200/10 dark:from-sky-900/80 dark:via-sky-800/70 dark:to-cyan-900/70 dark:shadow-sky-950/50',
  flame: 'border-rose-200/80 bg-gradient-to-br from-rose-50 via-red-100 to-orange-200/90 shadow-red-900/10 dark:border-rose-200/10 dark:from-rose-950/70 dark:via-red-950/60 dark:to-orange-900/60',
};

function ScaleArtwork({ principleId }: { principleId: number }) {
  const id = `doctrine-scale-${principleId}`;

  return (
    <svg viewBox="0 0 48 48" className="size-8 drop-shadow-[0_2px_1px_rgba(120,53,15,0.22)]" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-gold`} x1="8" y1="8" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF2B2" />
          <stop offset=".42" stopColor="#F7B93D" />
          <stop offset="1" stopColor="#B85B08" />
        </linearGradient>
        <linearGradient id={`${id}-pan`} x1="10" y1="21" x2="22" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE79A" />
          <stop offset="1" stopColor="#D98512" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="#8B4A0A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" opacity=".18" transform="translate(1.2 1.8)">
        <path d="M24 8v29M12 14h24M24 8h4M17 37h14M20 41h8M12 14 7 28m5-14 5 14m19-14-5 14m5-14 5 14" />
      </g>
      <path d="M24 8v29M12 14h24M24 8h4" stroke={`url(#${id}-gold)`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 28h10c-.3 3.2-2.3 5-5 5s-4.7-1.8-5-5ZM31 28h10c-.3 3.2-2.3 5-5 5s-4.7-1.8-5-5Z" fill={`url(#${id}-pan)`} stroke="#C57412" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M17 37h14M20 41h8" stroke={`url(#${id}-gold)`} strokeWidth="4" strokeLinecap="round" />
      <path d="M9 28c.8-1.8 2-2.3 3-2.3M33 28c.8-1.8 2-2.3 3-2.3" stroke="#FFF4C2" strokeWidth="1.3" strokeLinecap="round" opacity=".9" />
      <circle cx="24" cy="8" r="3" fill="#FFEAA3" stroke="#C57412" strokeWidth="1.3" />
    </svg>
  );
}

function CloudArtwork({ principleId }: { principleId: number }) {
  const id = `doctrine-cloud-${principleId}`;

  return (
    <svg viewBox="0 0 48 48" className="size-[2.1rem] drop-shadow-[0_3px_2px_rgba(8,92,145,0.25)]" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-body`} x1="10" y1="10" x2="34" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset=".54" stopColor="#F8FDFF" />
          <stop offset="1" stopColor="#C8E9F8" />
        </linearGradient>
        <linearGradient id={`${id}-shade`} x1="17" y1="28" x2="31" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9FD7F0" stopOpacity="0" />
          <stop offset="1" stopColor="#72B9DE" stopOpacity=".72" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d="M14.2 35.5a9.1 9.1 0 0 1-.6-18.2A12 12 0 0 1 37 19a8.3 8.3 0 0 1 .8 16.5H14.2Z" />
        </clipPath>
      </defs>
      <ellipse cx="24.5" cy="37.5" rx="14.5" ry="3.2" fill="#167AAF" opacity=".2" />
      <path d="M14.2 35.5a9.1 9.1 0 0 1-.6-18.2A12 12 0 0 1 37 19a8.3 8.3 0 0 1 .8 16.5H14.2Z" fill="#4EA5D0" opacity=".55" transform="translate(0 1.6)" />
      <path d="M14.2 35.5a9.1 9.1 0 0 1-.6-18.2A12 12 0 0 1 37 19a8.3 8.3 0 0 1 .8 16.5H14.2Z" fill={`url(#${id}-body)`} stroke="#FFFFFF" strokeWidth="1.2" />
      <path d="M14.2 35.5a9.1 9.1 0 0 1-.6-18.2A12 12 0 0 1 37 19a8.3 8.3 0 0 1 .8 16.5H14.2Z" fill={`url(#${id}-shade)`} clipPath={`url(#${id}-clip)`} />
      <path d="M13.1 21c.2-1.2 1-2.2 2.2-2.8m6.2-4.9c3.1-1 6.5.3 8.1 2.9" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity=".92" />
      <path d="M9 26.7a5.6 5.6 0 0 0 5.1 5.3" fill="none" stroke="#EAF8FF" strokeWidth="1.4" strokeLinecap="round" opacity=".9" />
    </svg>
  );
}

function FlameArtwork({ principleId }: { principleId: number }) {
  const id = `doctrine-flame-${principleId}`;

  return (
    <svg viewBox="0 0 48 48" className="size-8 drop-shadow-[0_3px_2px_rgba(153,27,27,0.22)]" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-outer`} x1="13" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF1A8" />
          <stop offset=".35" stopColor="#FF9D28" />
          <stop offset=".72" stopColor="#F04438" />
          <stop offset="1" stopColor="#A81736" />
        </linearGradient>
        <linearGradient id={`${id}-inner`} x1="19" y1="23" x2="29" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFBD0" />
          <stop offset=".55" stopColor="#FFD34E" />
          <stop offset="1" stopColor="#FF7A18" />
        </linearGradient>
      </defs>
      <path d="M25.6 5.5c2.5 6.2.7 9.2-.3 12.3 2-1 3.4-3.3 3.9-5.5 5.2 5.1 8.3 10.4 7 16.6C34.8 36 30 41 23.4 41c-7.3 0-12.8-5.3-12.8-12.1 0-5.2 3.1-9.1 7.4-13.4-.3 4.1.7 6.5 2.5 8.5.2-6.8 2.7-12.9 5.1-18.5Z" fill="#9F2334" opacity=".2" transform="translate(1.2 1.5)" />
      <path d="M25.6 5.5c2.5 6.2.7 9.2-.3 12.3 2-1 3.4-3.3 3.9-5.5 5.2 5.1 8.3 10.4 7 16.6C34.8 36 30 41 23.4 41c-7.3 0-12.8-5.3-12.8-12.1 0-5.2 3.1-9.1 7.4-13.4-.3 4.1.7 6.5 2.5 8.5.2-6.8 2.7-12.9 5.1-18.5Z" fill={`url(#${id}-outer)`} stroke="#E95132" strokeWidth=".9" strokeLinejoin="round" />
      <path d="M24 24.8c.9-2.2 1.3-4.1 1.1-5.7 3.4 3.2 5.3 6.2 5.3 9.8 0 4-2.8 6.9-6.8 6.9s-6.6-2.7-6.6-6.4c0-2.3 1-4.2 3.2-6.8.1 2.1.7 3.6 1.7 4.5.4-.9 1-1.6 2.1-2.3Z" fill={`url(#${id}-inner)`} />
      <path d="M17 19.7c.2 2.4 1.1 4 2 5" fill="none" stroke="#FFF6CC" strokeWidth="1.6" strokeLinecap="round" opacity=".9" />
    </svg>
  );
}

export default function DoctrineIcon3D({ kind, principleId }: DoctrineIcon3DProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[1.05rem] border shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_7px_14px_-9px_currentColor] ${ICON_SURFACES[kind]}`}
    >
      <span aria-hidden="true" className="absolute inset-[2px] rounded-[.92rem] border border-white/60 dark:border-white/10" />
      {kind === 'scale' && <ScaleArtwork principleId={principleId} />}
      {kind === 'cloud' && <CloudArtwork principleId={principleId} />}
      {kind === 'flame' && <FlameArtwork principleId={principleId} />}
    </span>
  );
}
