import MatchCard from '../components/MatchCard';
import { useFavorites } from '../context/FavoritesContext';
import { useMatches } from '../context/MatchesContext';
import { useLanguage } from '../context/LanguageContext';
import { requestNotificationPermission } from '../hooks/useFavoriteAlerts';

export default function Favorites() {
  const { favorites } = useFavorites();
  const { matches } = useMatches();
  const { t } = useLanguage();
  const favMatches = matches.filter((m) => favorites.includes(m.id));
  const notifSupported = 'Notification' in window;
  const notifGranted = notifSupported && Notification.permission === 'granted';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">{t('favorites_title')}</h1>
        {notifSupported && !notifGranted && favorites.length > 0 && (
          <button
            onClick={requestNotificationPermission}
            className="text-xs bg-[#00c853] text-black font-medium px-3 py-1.5 rounded-full"
          >
            {t('favorites_enable_notif')}
          </button>
        )}
      </div>
      {favMatches.length === 0 ? (
        <p className="text-gray-400 text-sm">
          {favorites.length === 0 ? t('favorites_empty_none') : t('favorites_empty_no_matches')}
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
