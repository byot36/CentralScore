import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isLiveApiConfigured } from '../api/client';
import { requestNotificationPermission } from '../hooks/useFavoriteAlerts';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../i18n/translations';
import { competitions } from '../data/mock';

const isNative = Capacitor.isNativePlatform();

export default function Settings() {
  const { t, lang, setLang } = useLanguage();
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

  const statusLabel = {
    granted: t('settings_status_granted'),
    denied: t('settings_status_denied'),
    unsupported: t('settings_status_unavailable'),
    default: t('settings_status_default'),
  }[notifStatus];

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">{t('settings_title')}</h1>

      <section>
        <h2 className="text-sm font-semibold text-gray-300 mb-2">{t('settings_language')}</h2>
        <div className="bg-[#111827] border border-white/10 rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm border transition-colors ${
                  lang === l.code
                    ? 'bg-[#00c853]/10 border-[#00c853] text-white'
                    : 'bg-[#0f172a] border-white/10 text-gray-300 hover:border-[#00c853]/50'
                }`}
              >
                <span className="text-base">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {isNative && (
        <section>
          <h2 className="text-sm font-semibold text-gray-300 mb-2">{t('settings_notifications')}</h2>
          <div className="bg-[#111827] border border-white/10 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm">{t('settings_notif_fav')}</p>
              <p className="text-xs text-gray-500 mt-1">
                {t('settings_status')}: {statusLabel}
              </p>
              <p className="text-xs text-gray-600 mt-1">{t('settings_native_note')}</p>
            </div>
            {notifStatus !== 'granted' && notifStatus !== 'unsupported' && (
              <button
                onClick={handleEnable}
                className="text-xs bg-[#00c853] text-black font-medium px-3 py-1.5 rounded-full shrink-0"
              >
                {t('settings_enable')}
              </button>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-300 mb-2">{t('settings_data_source')}</h2>
        <div className="bg-[#111827] border border-white/10 rounded-lg p-4 text-sm space-y-1">
          <p>
            {t('settings_status_label')}: {isLiveApiConfigured ? (
              <span className="text-[#00c853]">{t('settings_live_connected')}</span>
            ) : (
              <span className="text-amber-400">{t('settings_demo_mode')}</span>
            )}
          </p>
          <p className="text-xs text-gray-500">{t('settings_provider')}: football-data.org</p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-300 mb-2">{t('settings_covered_leagues')}</h2>
        <div className="bg-[#111827] border border-white/10 rounded-lg p-4">
          <ul className="grid grid-cols-2 gap-y-1 text-sm text-gray-300">
            {competitions.filter((c) => c.featured).map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <span>{c.logo}</span> {t(`comp_${c.id}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-300 mb-2">{t('settings_about')}</h2>
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
