import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1600);
    const doneTimer = setTimeout(onDone, 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f172a] transition-opacity duration-400 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <svg width="180" height="140" viewBox="0 0 180 140" className="mb-4">
        {/* teren */}
        <line x1="0" y1="120" x2="180" y2="120" stroke="#1f2937" strokeWidth="2" />

        {/* jucător */}
        <g className="cs-player">
          <circle cx="60" cy="30" r="10" fill="#f9fafb" />
          <line x1="60" y1="40" x2="60" y2="75" stroke="#00c853" strokeWidth="6" strokeLinecap="round" />
          <line x1="60" y1="48" x2="42" y2="62" stroke="#00c853" strokeWidth="6" strokeLinecap="round" />
          <line x1="60" y1="48" x2="78" y2="60" stroke="#00c853" strokeWidth="6" strokeLinecap="round" />
          {/* picior fix (sprijin) */}
          <line x1="60" y1="75" x2="54" y2="105" stroke="#f9fafb" strokeWidth="6" strokeLinecap="round" />
          {/* picior care lovește */}
          <line x1="60" y1="75" x2="86" y2="90" className="cs-kick-leg" stroke="#f9fafb" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* minge */}
        <circle cx="95" cy="112" r="8" fill="#f9fafb" stroke="#111827" strokeWidth="1.5" className="cs-ball" />
      </svg>

      <div className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-white">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00c853] animate-pulse" />
        Central<span className="text-[#00c853]">Score</span>
      </div>

      <style>{`
        .cs-kick-leg {
          transform-origin: 60px 75px;
          animation: cs-kick 1.1s ease-in-out infinite;
        }
        .cs-ball {
          animation: cs-ball-move 1.1s ease-in-out infinite;
        }
        @keyframes cs-kick {
          0%, 100% { transform: rotate(0deg); }
          45% { transform: rotate(-35deg); }
          55% { transform: rotate(10deg); }
        }
        @keyframes cs-ball-move {
          0%, 40% { transform: translate(0, 0); }
          55% { transform: translate(55px, -18px); }
          75% { transform: translate(75px, 0px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
}
