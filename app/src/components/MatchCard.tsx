import { Link } from 'react-router-dom';
import type { Match } from '../types';
import { useFavorites } from '../context/FavoritesContext';

export default function MatchCard({ match }: { match: Match }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(match.homeTeam.id) || isFavorite(match.awayTeam.id);

  return (
    <Link
      to={`/match/${match.id}`}
      className="block bg-[#111827] border border-white/10 rounded-lg px-4 py-3 hover:border-[#00c853]/50 transition-colors"
    >
      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
        <span>
          {match.status === 'live' ? (
            <span className="text-[#00c853] font-semibold">● Live · {match.minute}'</span>
          ) : match.status === 'finished' ? (
            'Final'
          ) : (
            match.time
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{match.homeTeam.logo}</span>
          <span className="font-medium">{match.homeTeam.name}</span>
        </div>
        <span className="font-bold text-lg tabular-nums">
          {match.status === 'scheduled' ? '-' : match.homeScore}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">{match.awayTeam.logo}</span>
          <span className="font-medium">{match.awayTeam.name}</span>
        </div>
        <span className="font-bold text-lg tabular-nums">
          {match.status === 'scheduled' ? '-' : match.awayScore}
        </span>
      </div>
    </Link>
  );
}
