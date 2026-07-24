import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isLiveApiConfigured } from '../api/client';
import { requestNotificationPermission } from '../hooks/useFavoriteAlerts';
import { competitions } from '../data/mock';

const isNative = Capacitor.isNativePlatform();

export default function Settings() {
  const [notifStatus, setNotifStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');

  useEffect(() => {
    if (isNative) {
      LocalNotifications.checkPermissions().then((p) => setNotifStatus(p.display as typeof notifStatus));
    } else if ('Notification' in window) {
      setNotifStatus(Notification.permission);
    } else {
      setNotifStatus('unsupported');
    }
  }, []);

  async function handleEnable() {
    await requestNotificationPermission();
    if (isNative) {
      const p = await LocalNotifications.checkPermissions();
      setNotifStatus(p.display as typeof notifStatus);
    } else if ('Notification' in window) {
      setNotifStatus(Notification.permission);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Setări</h1>

      <section>
        <h2 className="text-sm font-semibold text-gray-300 mb-2">Notificări</h2>
        <div className="bg-[#111827] border border-white/10 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm">Notificări pentru echipele favorite</p>
            <p className="text-xs text-gray-500 mt-1">
              Stare: {notifStatus === 'granted' ? 'Activate' : notifStatus === 'denied' ? 'Blocate' : notifStatus === 'unsupported' ? 'Indisponibile' : 'Neactivate'}
            </p>
            {isNative && (
              <p className="text-xs text-gray-600 mt-1">Aplicație Android: funcționează și cu aplicația închisă.</p>
            )}
          </div>
          {notifStatus !== 'granted' && notifStatus !== 'unsupported' && (
            <button
              onClick={handleEnable}
              className="text-xs bg-[#00c853] text-black font-medium px-3 py-1.5 rounded-full shrink-0"
            >
              Activează
            </button>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-300 mb-2">Sursă de date</h2>
        <div className="bg-[#111827] border border-white/10 rounded-lg p-4 text-sm space-y-1">
          <p>
            Status: {isLiveApiConfigured ? (
              <span className="text-[#00c853]">date live conectate</span>
            ) : (
              <span className="text-amber-400">mod demo (date de exemplu)</span>
            )}
          </p>
          <p className="text-xs text-gray-500">Furnizor: football-data.org</p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-300 mb-2">Ligi acoperite</h2>
        <div className="bg-[#111827] border border-white/10 rounded-lg p-4">
          <ul className="grid grid-cols-2 gap-y-1 text-sm text-gray-300">
            {competitions.filter((c) => c.featured).map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <span>{c.logo}</span> {c.name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-300 mb-2">Despre</h2>
        <div className="bg-[#111827] border border-white/10 rounded-lg p-4 text-sm text-gray-400">
          <p>CentralScore</p>
          <p className="text-xs mt-1">
            <a
              href="https://github.com/byot36/CentralScore"
              target="_blank"
              rel="noreferrer"
              className="text-[#00c853] hover:underline"
            >
              github.com/byot36/CentralScore
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
