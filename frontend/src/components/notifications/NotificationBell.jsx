import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { notificationService } from '../../services/notification.service.js';
import { getErrorMessage } from '../../services/api.js';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      const [c, n] = await Promise.all([
        notificationService.unreadCount(),
        notificationService.list(),
      ]);
      setCount(c);
      setItems(n);
    } catch (err) {
      console.warn(getErrorMessage(err));
    }
  };

  useEffect(() => {
    let active = true;
    load().then(() => {
      if (!active) return;
    });
    return () => {
      active = false;
    };
  }, []);

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllRead();
      setCount(0);
      setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    } catch (err) {
      console.warn(getErrorMessage(err));
    }
  };

  const handleOpenItem = async (item) => {
    if (!item.read) {
      try {
        await notificationService.markRead(item._id);
        setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, read: true } : i)));
        setCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.warn(getErrorMessage(err));
      }
    }
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        className="relative flex items-center gap-2 rounded-lg border border-celebra-dark/10 px-2.5 py-1.5 text-sm"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell size={16} />
        <span className="hidden text-xs text-celebra-dark/60 sm:inline">
          {t('common.notifications')}
        </span>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={t('common.close')}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-3 right-3 top-16 z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-celebra-dark/10 bg-celebra-paper shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)]">
            <div className="flex items-center justify-between border-b border-celebra-dark/10 px-4 py-2">
              <p className="text-sm font-semibold">{t('common.notifications')}</p>
              {count > 0 && (
                <button
                  type="button"
                  className="text-xs font-medium text-celebra-gold hover:underline"
                  onClick={handleMarkAll}
                >
                  {t('common.markAllRead')}
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-celebra-dark/60">
                {t('common.noNotifications')}
              </p>
            ) : (
              <ul className="divide-y divide-celebra-dark/10">
                {items.map((item) => (
                  <li key={item._id}>
                    <button
                      type="button"
                      onClick={() => handleOpenItem(item)}
                      className={`flex w-full items-start gap-2 px-4 py-3 text-left text-sm hover:bg-celebra-dark/5 ${
                        item.read ? 'text-celebra-dark/60' : 'text-celebra-dark'
                      }`}
                    >
                      {!item.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-celebra-gold" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{item.title}</span>
                        {item.message && (
                          <span className="mt-0.5 block break-words text-xs text-celebra-dark/60">
                            {item.message}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
