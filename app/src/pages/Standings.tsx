import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchStandings, type StandingGroup } from '../api/footballdata';
import { isLiveApiConfigured } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function Standings() {
  const { compId } = useParams();
  const { t } = useLanguage();
  const [groups, setGroups] = useState<StandingGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!compId || !isLiveApiConfigured) return;
    setGroups(null);
    setError(null);
    fetchStandings(compId)
      .then(setGroups)
      .catch((err) => setError(err.message));
  }, [compId]);

  return (
    <div>
      <Link to="/" className="text-sm text-gray-400 hover:text-white">{t('match_back')}</Link>
      <h1 className="text-xl font-bold mt-3 mb-4">
        {t('standings_title')} — {compId ? t(`comp_${compId}`) : ''}
      </h1>

      {!isLiveApiConfigured && <p className="text-sm text-gray-400">{t('standings_unavailable_demo')}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {isLiveApiConfigured && !error && groups === null && (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-8 bg-white/10 rounded" />)}
        </div>
      )}
      {groups !== null && groups.length === 0 && !error && (
        <p className="text-sm text-gray-400">{t('standings_none')}</p>
      )}

      {groups?.map((g, i) => (
        <div key={i} className="mb-6">
          {g.group && <h2 className="text-sm font-semibold text-gray-300 mb-2">{g.group}</h2>}
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#111827]">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-gray-400 text-xs bg-white/5">
                  <th className="text-left py-2.5 pl-4 pr-2 w-6">#</th>
                  <th className="text-left py-2.5 pr-2">{t('standings_team')}</th>
                  <th className="text-center py-2.5 px-1">{t('standings_played')}</th>
                  <th className="text-center py-2.5 px-1">{t('standings_won')}</th>
                  <th className="text-center py-2.5 px-1">{t('standings_draw')}</th>
                  <th className="text-center py-2.5 px-1">{t('standings_lost')}</th>
                  <th className="text-center py-2.5 px-1">{t('standings_gd')}</th>
                  <th className="text-center py-2.5 pr-4 pl-1 font-semibold">{t('standings_points')}</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r, idx) => {
                  const isTop = r.position <= 4;
                  const isRelegation = r.position > g.rows.length - 3;
                  return (
                    <tr
                      key={r.team.id}
                      className={`border-t border-white/5 hover:bg-white/5 transition-colors relative ${
                        idx % 2 === 1 ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <td className={`py-2.5 pl-4 pr-2 text-gray-400 relative ${isTop ? 'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-[#00c853]' : isRelegation ? 'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-red-500/60' : ''}`}>
                        {r.position}
                      </td>
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {r.team.logo.startsWith('http') ? (
                            <img src={r.team.logo} alt={r.team.name} className="w-5 h-5 object-contain shrink-0" />
                          ) : (
                            <span className="shrink-0">{r.team.logo}</span>
                          )}
                          <span className="truncate">{r.team.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-2.5 px-1 text-gray-300">{r.playedGames}</td>
                      <td className="text-center py-2.5 px-1 text-gray-300">{r.won}</td>
                      <td className="text-center py-2.5 px-1 text-gray-300">{r.draw}</td>
                      <td className="text-center py-2.5 px-1 text-gray-300">{r.lost}</td>
                      <td className="text-center py-2.5 px-1 text-gray-300">{r.goalDifference}</td>
                      <td className="text-center py-2.5 pr-4 pl-1 font-semibold">{r.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
