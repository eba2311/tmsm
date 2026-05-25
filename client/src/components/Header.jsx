import { useAuthStore } from '../hooks/useAuthStore';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { Menu, Bell, Search, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import Notifications from './Notifications';
import useI18n from '../lib/i18n';

export default function Header({ onMenuClick }) {
  const { user } = useAuthStore();
  const { language, setLanguage, t } = useI18n();
  const [searchOpen, setSearchOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unread, setUnread] = useState(0);

  const { logout } = useAuthStore();
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore server errors
    }
    logout();
    toast.success('Logged out');
    window.location.href = '/login';
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data } = await api.get('/notifications');
        if (!mounted) return;
        setUnread(data.unread || 0);
      } catch (e) {}
    }
    load();

    const onNotif = (e) => setUnread((n) => n + 1);
    window.addEventListener('notification:received', onNotif);
    return () => { mounted = false; window.removeEventListener('notification:received', onNotif); };
  }, []);

  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-6 h-16 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
      {/* Left: hamburger + search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-primary p-1.5 rounded-lg hover:bg-primary/5 transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className={`relative ${searchOpen ? 'w-64' : 'w-40'} transition-all duration-300 hidden sm:block`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
            className="input pl-9 py-2 !rounded-full !bg-gray-50 text-sm"
          />
        </div>
      </div>

      {/* Right: language, notifications, profile */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary px-2 py-1.5 rounded-lg hover:bg-primary/5 transition"
          title={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
        >
          <Globe className="w-4 h-4" />
          <span className="hidden md:inline font-medium">{language === 'en' ? 'EN' : 'አማ'}</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={async () => {
            // mark all read when opening
            try { await api.patch('/notifications/read-all'); setUnread(0); } catch (e) {}
            setShowNotifs((s) => !s);
          }} className="relative p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl transition" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            {unread > 0 && (<span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-etred text-white text-[11px] flex items-center justify-center">{unread}</span>)}
          </button>
          {showNotifs && (
            <div className="absolute right-0 mt-2 z-50">
              <Notifications onClose={() => setShowNotifs(false)} />
            </div>
          )}
        </div>

        {/* Avatar */}
        <div onClick={handleLogout} title="Logout" className="cursor-pointer flex items-center gap-2 ml-1 pl-3 border-l border-gray-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-gold-light flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-sidebar leading-tight">{user?.name}</p>
            <p className="text-[11px] text-gray-400">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
