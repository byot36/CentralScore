import { Link } from 'react-router-dom';
import type { Match } from '../types';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';

function TeamCrest({ logo, name }: { logo: string; name: string }) {
  const isImageUrl = logo.startsWith('http');
  if (isImageUrl) {
    return <img src={logo} alt={name} className="w-7 h-7 object-contain shrink-0 drop-shadow-sm" />;
  }
  return <span className="text-2xl shrink-0">{logo}</span>;
}

function formatDateTime(match: Match, locale: string) {
  const kickoff = new Date(`${match.date}T${match.time}:00`);
  const today = new Date();
  const isToday = kickoff.toDateString() === today.toDateString();
  const time = kickoff.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  const date = kickoff.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return `${date}, ${time}`;
}

export default function MatchCard({ match }: { match: Match }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t, locale } = useLanguage();
  const finished = match.status === 'finished';
  const live = match.status === 'live';
  const homeWon = finished && match.homeScore > match.awayScore;
  const awayWon = finished && match.awayScore > match.homeScore;
  const fav = isFavorite(match.id);

  return (
    <Link
      to={`/match/${match.id}`}
      className={`group block rounded-xl px-4 py-3.5 border relative overflow-hidden transition-all duration-200 ${
        finished
          ? 'bg-[#0d1420] border-white/5 hover:border-white/15 hover:-translate-y-0.5'
          : 'bg-[#111827] border-white/10 hover:border-[#00c853]/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#00c853]/5'
      }`}
    >
      {live && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#00c853] via-[#00e676] to-[#00c853] animate-pulse" />}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite(match.id);
        }}
        className={`absolute top-3.5 right-3.5 text-base leading-none transition-transform hover:scale-125 ${fav ? 'text-yellow-400' : 'text-gray-600'}`}
        aria-label={`Favorite ${match.homeTeam.name} - ${match.awayTeam.name}`}
      >
        ★
      </button>
      <div className="flex items-center justify-between text-xs mb-3 pr-5">
        <span>
          {live ? (
            <span className="text-[#00c853] font-semibold flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00c853] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00c853]" />
              </span>
              {t('match_live')} · {match.minute}'
            </span>
          ) : finished ? (
            <span className="bg-white/10 text-gray-400 px-2 py-0.5 rounded-full font-medium">{t('match_final')}</span>
          ) : (
            <span className="text-gray-400">{formatDateTime(match, locale)}</span>
          )}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 pr-5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <TeamCrest logo={match.homeTeam.logo} name={match.homeTeam.name} />
          <span className={`font-medium truncate ${finished && !homeWon ? 'text-gray-500' : ''}`}>{match.homeTeam.name}</span>
        </div>
        <span className={`font-bold text-xl tabular-nums shrink-0 ${finished && !homeWon ? 'text-gray-500' : ''}`}>
          {match.status === 'scheduled' ? '-' : match.homeScore}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-2.5 pr-5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <TeamCrest logo={match.awayTeam.logo} name={match.awayTeam.name} />
          <span className={`font-medium truncate ${finished && !awayWon ? 'text-gray-500' : ''}`}>{match.awayTeam.name}</span>
        </div>
        <span className={`font-bold text-xl tabular-nums shrink-0 ${finished && !awayWon ? 'text-gray-500' : ''}`}>
          {match.status === 'scheduled' ? '-' : match.awayScore}
        </span>
      </div>
    </Link>
  );
}
