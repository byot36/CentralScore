import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1400);
    const doneTimer = setTimeout(onDone, 1800);
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
      <svg width="120" height="120" viewBox="0 0 120 120" className="mb-4">
        <ellipse cx="60" cy="104" rx="26" ry="6" className="cs-shadow" fill="#000" opacity="0.25" />
        <g className="cs-ball">
          <circle cx="60" cy="60" r="20" fill="#f9fafb" stroke="#111827" strokeWidth="1.5" />
          <g stroke="#111827" strokeWidth="1.3" fill="#111827">
            <polygon points="60,47 68,53 65,62 55,62 52,53" fill="#111827" />
            <line x1="60" y1="47" x2="60" y2="40" />
            <line x1="68" y1="53" x2="76" y2="49" />
            <line x1="65" y1="62" x2="70" y2="72" />
            <line x1="55" y1="62" x2="50" y2="72" />
            <line x1="52" y1="53" x2="44" y2="49" />
          </g>
        </g>
      </svg>

      <div className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-white">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00c853] animate-pulse" />
        Central<span className="text-[#00c853]">Score</span>
      </div>

      <style>{`
        .cs-ball {
          transform-box: fill-box;
          transform-origin: center;
          animation: cs-bounce 0.7s cubic-bezier(0.5, 0, 1, 0.5) infinite alternate;
        }
        .cs-shadow {
          animation: cs-shadow 0.7s cubic-bezier(0.5, 0, 1, 0.5) infinite alternate;
        }
        @keyframes cs-bounce {
          0% { transform: translateY(-30px) rotate(0deg); }
          100% { transform: translateY(10px) rotate(90deg); }
        }
        @keyframes cs-shadow {
          0% { transform: scale(0.7); opacity: 0.15; }
          100% { transform: scale(1); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
