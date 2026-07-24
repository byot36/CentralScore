import MatchCard from '../components/MatchCard';
import { useFavorites } from '../context/FavoritesContext';
import { useMatches } from '../context/MatchesContext';
import { requestNotificationPermission } from '../hooks/useFavoriteAlerts';

export default function Favorites() {
  const { favorites } = useFavorites();
  const { matches } = useMatches();
  const favMatches = matches.filter(
    (m) => favorites.includes(m.homeTeam.id) || favorites.includes(m.awayTeam.id)
  );
  const notifSupported = 'Notification' in window;
  const notifGranted = notifSupported && Notification.permission === 'granted';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Echipele mele favorite</h1>
        {notifSupported && !notifGranted && favorites.length > 0 && (
          <button
            onClick={requestNotificationPermission}
            className="text-xs bg-[#00c853] text-black font-medium px-3 py-1.5 rounded-full"
          >
            Activează notificările
          </button>
        )}
      </div>
      {favMatches.length === 0 ? (
        <p className="text-gray-400 text-sm">
          {favorites.length === 0
            ? 'Nu ai nicio echipă favorită încă. Apasă ★ pe un meci pentru a adăuga echipa la favorite — vei primi notificare (cât timp ai aplicația deschisă) când urmează să joace.'
            : 'Echipele tale favorite nu au niciun meci programat momentan.'}
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
