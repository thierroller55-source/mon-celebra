import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationService } from '../../services/notification.service.js';
import { getErrorMessage } from '../../services/api.js';

export default function NotificationBell() {
  const navigate = useNavigate();
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
    <div className="relative">
      <button
        type="button"
        className="relative flex items-center gap-2 rounded-lg border border-celebra-dark/10 px-2.5 py-1.5 text-sm"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell size={16} />
        <span className="text-xs text-celebra-dark/60">Notifications</span>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-h-96 overflow-auto rounded-xl border border-celebra-dark/10 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-celebra-dark/5 px-3 py-2">
            <p className="text-sm font-medium">Notifications</p>
            {count > 0 && (
              <button
                type="button"
                className="text-xs text-celebra-gold"
                onClick={handleMarkAll}
              >
                Tout marquer lu
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-celebra-dark/50">
              Aucune notification
            </p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n._id} className="border-b border-celebra-dark/5">
                  <button
                    type="button"
                    onClick={() => handleOpenItem(n)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-celebra-gold/5 ${
                      n.read ? 'opacity-60' : ''
                    }`}
                  >
                    <p className="font-medium">{n.title}</p>
                    {n.message && (
                      <p className="text-xs text-celebra-dark/60">{n.message}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
