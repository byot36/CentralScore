import { matches } from '../data/mock';
import MatchCard from '../components/MatchCard';
import { useFavorites } from '../context/FavoritesContext';

export default function Favorites() {
  const { favorites } = useFavorites();
  const favMatches = matches.filter(
    (m) => favorites.includes(m.homeTeam.id) || favorites.includes(m.awayTeam.id)
  );

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Echipele mele favorite</h1>
      {favMatches.length === 0 ? (
        <p className="text-gray-400 text-sm">
          Nu ai nicio echipă favorită încă. Apasă ★ pe un meci pentru a adăuga echipa la favorite —
          vei primi notificare când joacă.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {favMatches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
