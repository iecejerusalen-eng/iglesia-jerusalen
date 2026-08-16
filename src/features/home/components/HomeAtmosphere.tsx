export const HomeAtmosphere = () => (
  <div aria-hidden="true" className="home-atmosphere pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(190rem,2200px)] overflow-hidden">
    <style>{`
      @keyframes home-atmosphere-drift {
        0%, 100% { transform: translate3d(-2%, -1%, 0) scale(1); }
        50% { transform: translate3d(3%, 2%, 0) scale(1.08); }
      }
      @keyframes home-atmosphere-drift-reverse {
        0%, 100% { transform: translate3d(2%, 1%, 0) scale(1.02); }
        50% { transform: translate3d(-3%, -2%, 0) scale(.94); }
      }
      @keyframes home-atmosphere-sheen {
        0%, 35% { transform: translateX(-120%) rotate(14deg); opacity: 0; }
        55% { opacity: .6; }
        100% { transform: translateX(120%) rotate(14deg); opacity: 0; }
      }
      @keyframes home-atmosphere-signal {
        0%, 100% { transform: scale(.82); opacity: .3; }
        50% { transform: scale(1); opacity: .8; }
      }
      .home-atmosphere-orb-primary {
        animation: home-atmosphere-drift 22s ease-in-out infinite;
      }
      .home-atmosphere-orb-warm {
        animation: home-atmosphere-drift-reverse 26s ease-in-out infinite;
      }
      .home-atmosphere-sheen {
        animation: home-atmosphere-sheen 15s cubic-bezier(.2,.7,.2,1) infinite;
      }
      .home-atmosphere-signal {
        animation: home-atmosphere-signal 5s ease-in-out infinite;
      }
      .home-atmosphere-grid {
        background-image:
          linear-gradient(rgba(30,58,138,.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30,58,138,.045) 1px, transparent 1px);
        background-size: 4rem 4rem;
        mask-image: linear-gradient(to bottom, black 0%, rgba(0,0,0,.72) 35%, transparent 88%);
      }
      .dark .home-atmosphere-grid {
        background-image:
          linear-gradient(rgba(148,163,184,.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,.045) 1px, transparent 1px);
      }
      @media (prefers-reduced-motion: reduce) {
        .home-atmosphere *, .home-atmosphere *::before, .home-atmosphere *::after {
          animation-duration: 1ms !important;
          animation-iteration-count: 1 !important;
        }
      }
    `}</style>

    <div className="home-atmosphere-grid absolute inset-0" />
    <div className="home-atmosphere-orb-primary absolute -left-[18rem] top-[14rem] size-[38rem] rounded-full bg-blue-300/20 blur-[110px] dark:bg-blue-700/15" />
    <div className="home-atmosphere-orb-warm absolute -right-[20rem] top-[32rem] size-[42rem] rounded-full bg-amber-200/20 blur-[130px] dark:bg-amber-500/10" />

    <div className="absolute left-1/2 top-[40rem] h-px w-[min(70rem,90vw)] -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent dark:via-blue-300/15" />
    <div className="absolute left-[9%] top-[39.6rem] size-2 rounded-full bg-blue-500/50 shadow-[0_0_0_7px_rgba(59,130,246,.08)] dark:bg-blue-300/60" />
    <div className="home-atmosphere-signal absolute right-[12%] top-[39.4rem] size-3 rounded-full border border-amber-500/40 bg-amber-400/70 shadow-[0_0_0_8px_rgba(245,158,11,.08)] dark:border-amber-300/40" />

    <div className="home-atmosphere-sheen absolute -left-1/3 top-0 h-full w-1/5 bg-gradient-to-r from-transparent via-white/25 to-transparent blur-2xl dark:via-blue-100/5" />
    <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/60 to-transparent dark:from-slate-950/40" />
  </div>
);
