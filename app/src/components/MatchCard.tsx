import { Link } from 'react-router-dom';
import type { Match } from '../types';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';

function TeamCrest({ logo, name }: { logo: string; name: string }) {
  const isImageUrl = logo.startsWith('http');
  if (isImageUrl) {
    return <img src={logo} alt={name} className="w-6 h-6 object-contain shrink-0" />;
  }
  return <span className="text-xl shrink-0">{logo}</span>;
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
  const homeWon = finished && match.homeScore > match.awayScore;
  const awayWon = finished && match.awayScore > match.homeScore;
  const fav = isFavorite(match.id);

  return (
    <Link
      to={`/match/${match.id}`}
      className={`block rounded-lg px-4 py-3 border transition-colors relative ${
        finished
          ? 'bg-[#0d1420] border-white/5 hover:border-white/15'
          : 'bg-[#111827] border-white/10 hover:border-[#00c853]/50'
      }`}
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite(match.id);
        }}
        className={`absolute top-3 right-3 text-base leading-none ${fav ? 'text-yellow-400' : 'text-gray-600'}`}
        aria-label={`Favorite ${match.homeTeam.name} - ${match.awayTeam.name}`}
      >
        ★
      </button>
      <div className="flex items-center justify-between text-xs mb-3 pr-5">
        <span>
          {match.status === 'live' ? (
            <span className="text-[#00c853] font-semibold">● {t('match_live')} · {match.minute}'</span>
          ) : finished ? (
            <span className="bg-white/10 text-gray-400 px-2 py-0.5 rounded-full font-medium">{t('match_final')}</span>
          ) : (
            <span className="text-gray-400">{formatDateTime(match, locale)}</span>
          )}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 pr-5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <TeamCrest logo={match.homeTeam.logo} name={match.homeTeam.name} />
          <span className={`font-medium truncate ${finished && !homeWon ? 'text-gray-500' : ''}`}>{match.homeTeam.name}</span>
        </div>
        <span className={`font-bold text-lg tabular-nums shrink-0 ${finished && !homeWon ? 'text-gray-500' : ''}`}>
          {match.status === 'scheduled' ? '-' : match.homeScore}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-2 pr-5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <TeamCrest logo={match.awayTeam.logo} name={match.awayTeam.name} />
          <span className={`font-medium truncate ${finished && !awayWon ? 'text-gray-500' : ''}`}>{match.awayTeam.name}</span>
        </div>
        <span className={`font-bold text-lg tabular-nums shrink-0 ${finished && !awayWon ? 'text-gray-500' : ''}`}>
          {match.status === 'scheduled' ? '-' : match.awayScore}
        </span>
      </div>
    </Link>
  );
}
