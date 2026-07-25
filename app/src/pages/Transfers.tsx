import { useEffect, useState } from 'react';
import { fetchRecentTransfers, fetchPlayerStats, type TransferEntry, type PlayerStats } from '../api/apifootball';
import { isLiveApiConfigured } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

function TeamLogo({ logo, name }: { logo: string; name: string }) {
  if (logo?.startsWith('http')) {
    return <img src={logo} alt={name} className="w-8 h-8 object-contain shrink-0" />;
  }
  return <span className="w-8 h-8 flex items-center justify-center text-xl shrink-0">⚽</span>;
}

function PlayerStatsModal({ playerId, onClose }: { playerId: number; onClose: () => void }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState<PlayerStats | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStats(undefined);
    setError(null);
    fetchPlayerStats(playerId)
      .then(setStats)
      .catch(() => setError(t('player_stats_error')));
  }, [playerId]);

  const rows: [string, string | number | null][] = stats
    ? [
        [t('player_stats_team'), stats.team],
        [t('player_stats_position'), stats.position],
        [t('player_stats_age'), stats.age],
        [t('player_stats_nationality'), stats.nationality],
        [t('player_stats_appearances'), stats.appearances],
        [t('player_stats_goals'), stats.goals],
        [t('player_stats_assists'), stats.assists],
        [t('player_stats_yellow'), stats.yellowCards],
        [t('player_stats_red'), stats.redCards],
        [t('player_stats_rating'), stats.rating],
      ]
    : [];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="bg-[#111827] border border-white/10 rounded-2xl p-5 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t('player_stats_title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        {stats === undefined && !error && (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-6 bg-white/10 rounded" />)}
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {stats === null && !error && <p className="text-sm text-gray-400">{t('player_stats_error')}</p>}

        {stats && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              {stats.photo && <img src={stats.photo} alt={stats.name} className="w-14 h-14 rounded-full object-cover border border-white/10" />}
              <div className="font-semibold">{stats.name}</div>
            </div>
            <div className="space-y-1.5 text-sm">
              {rows.map(([label, value]) => (
                value !== null && value !== undefined && value !== '' ? (
                  <div key={label} className="flex items-center justify-between border-b border-white/5 py-1.5">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ) : null
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose} className="w-full bg-[#00c853] text-black font-medium py-2.5 rounded-lg mt-4">
          {t('player_stats_close')}
        </button>
      </div>
    </div>
  );
}

export default function Transfers() {
  const { t, locale } = useLanguage();
  const [entries, setEntries] = useState<TransferEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);

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
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="text-xs text-gray-500">
                {new Date(e.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
              </div>
              <button
                onClick={() => setSelectedPlayer(e.playerId)}
                className="text-xs font-medium text-[#00c853] border border-[#00c853]/40 rounded-full px-2.5 py-1 hover:bg-[#00c853]/10 active:scale-95 transition-all"
              >
                {t('transfers_info')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedPlayer !== null && (
        <PlayerStatsModal playerId={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  );
}
