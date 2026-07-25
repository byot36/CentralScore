import { useEffect, useState } from 'react';
import { fetchRecentTransfers, type TransferEntry } from '../api/apifootball';
import { isLiveApiConfigured } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

function TeamLogo({ logo, name }: { logo: string; name: string }) {
  if (logo?.startsWith('http')) {
    return <img src={logo} alt={name} className="w-8 h-8 object-contain shrink-0" />;
  }
  return <span className="w-8 h-8 flex items-center justify-center text-xl shrink-0">⚽</span>;
}

export default function Transfers() {
  const { t, locale } = useLanguage();
  const [entries, setEntries] = useState<TransferEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLiveApiConfigured) return;
    fetchRecentTransfers()
      .then(setEntries)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">{t('transfers_title')}</h1>
      <p className="text-sm text-gray-400 mb-5">{t('transfers_subtitle')}</p>

      {!isLiveApiConfigured && <p className="text-sm text-gray-400">{t('standings_unavailable_demo')}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {isLiveApiConfigured && !error && entries === null && (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-white/10 rounded-xl" />)}
        </div>
      )}

      {entries !== null && entries.length === 0 && !error && (
        <p className="text-sm text-gray-400">{t('transfers_none')}</p>
      )}

      <div className="space-y-2">
        {entries?.map((e, i) => (
          <div
            key={e.id}
            className="cs-fade-up flex items-center gap-3 rounded-xl px-4 py-3.5 border border-white/10 bg-[#111827] hover:border-[#00c853]/40 transition-colors"
            style={{ animationDelay: `${Math.min(i, 15) * 30}ms` }}
          >
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate mb-1.5">{e.playerName}</div>
              <div className="flex items-center gap-2 min-w-0">
                <TeamLogo logo={e.teamOut.logo} name={e.teamOut.name} />
                <span className="text-sm text-gray-300 truncate">{e.teamOut.name}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c853" strokeWidth="2.5" className="shrink-0 mx-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
                <TeamLogo logo={e.teamIn.logo} name={e.teamIn.name} />
                <span className="text-sm text-white font-medium truncate">{e.teamIn.name}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 shrink-0 text-right">
              {new Date(e.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
