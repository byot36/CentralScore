import { useEffect } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { useNotifications } from '../context/NotificationsContext';
import { useLanguage } from '../context/LanguageContext';

const isNative = Capacitor.isNativePlatform();

function openUrl(url: string) {
  if (isNative) {
    Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export default function Notifications() {
  const { notifications, markAllRead, clearAll } = useNotifications();
  const { t, locale } = useLanguage();

  useEffect(() => {
    markAllRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">{t('notif_title')}</h1>
        {notifications.length > 0 && (
          <button onClick={clearAll} className="text-xs text-gray-400 hover:text-white">
            {t('notif_clear')}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-400 text-sm">{t('notif_empty')}</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              onClick={n.url ? () => openUrl(n.url!) : undefined}
              className={`bg-[#111827] border border-white/10 rounded-lg p-3 ${n.url ? 'cursor-pointer hover:border-[#00c853]/50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">⚽</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-gray-300">{n.body}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(n.createdAt).toLocaleString(locale)}
                  </p>
                  {n.url && <p className="text-xs text-[#00c853] mt-1">{t('notif_update_hint')}</p>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
