import { useEffect } from 'react';
import { useNotifications } from '../context/NotificationsContext';

export default function Notifications() {
  const { notifications, markAllRead, clearAll } = useNotifications();

  useEffect(() => {
    markAllRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Notificări</h1>
        {notifications.length > 0 && (
          <button onClick={clearAll} className="text-xs text-gray-400 hover:text-white">
            Șterge tot
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-400 text-sm">Nu ai notificări încă.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id} className="bg-[#111827] border border-white/10 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">⚽</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-gray-300">{n.body}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(n.createdAt).toLocaleString('ro-RO')}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
