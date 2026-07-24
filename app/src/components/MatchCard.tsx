import { Link } from 'react-router-dom';
import type { Match } from '../types';
import { useFavorites } from '../context/FavoritesContext';

function TeamCrest({ logo, name }: { logo: string; name: string }) {
  const isImageUrl = logo.startsWith('http');
  if (isImageUrl) {
    return <img src={logo} alt={name} className="w-6 h-6 object-contain shrink-0" />;
  }
  return <span className="text-xl shrink-0">{logo}</span>;
}

function formatDateTime(match: Match) {
  const kickoff = new Date(`${match.date}T${match.time}:00`);
  const today = new Date();
  const isToday = kickoff.toDateString() === today.toDateString();
  const time = kickoff.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  const date = kickoff.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  return `${date}, ${time}`;
}

export default function MatchCard({ match }: { match: Match }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(match.homeTeam.id) || isFavorite(match.awayTeam.id);

  return (
    <Link
      to={`/match/${match.id}`}
      className="block bg-[#111827] border border-white/10 rounded-lg px-4 py-3 hover:border-[#00c853]/50 transition-colors"
    >
      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
        <span>
          {match.status === 'live' ? (
            <span className="text-[#00c853] font-semibold">● Live · {match.minute}'</span>
          ) : match.status === 'finished' ? (
            'Final'
          ) : (
            formatDateTime(match)
          )}
        </span>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(match.homeTeam.id);
          }}
          className={`text-lg leading-none ${fav ? 'text-yellow-400' : 'text-gray-600'}`}
          aria-label="Favorite"
        >
          ★
        </button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <TeamCrest logo={match.homeTeam.logo} name={match.homeTeam.name} />
          <span className="font-medium truncate">{match.homeTeam.name}</span>
        </div>
        <span className="font-bold text-lg tabular-nums shrink-0">
          {match.status === 'scheduled' ? '-' : match.homeScore}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <TeamCrest logo={match.awayTeam.logo} name={match.awayTeam.name} />
          <span className="font-medium truncate">{match.awayTeam.name}</span>
        </div>
        <span className="font-bold text-lg tabular-nums shrink-0">
          {match.status === 'scheduled' ? '-' : match.awayScore}
        </span>
      </div>
    </Link>
  );
}
