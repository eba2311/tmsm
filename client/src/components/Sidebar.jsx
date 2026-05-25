import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuthStore';
import {
  LayoutDashboard, Bus, Users, Ticket, MapPin, CalendarClock,
  BarChart3, LogOut, X, Shield, Navigation, Bell,
  Fuel, Wrench, Award, LineChart, Smartphone, Settings, Activity,
  Zap, ShieldAlert, BrainCircuit, History, CreditCard, Boxes, ShieldCheck,
  UserSquare2, FileCheck, Star,
} from 'lucide-react';
import api from '../lib/axios';

const baseLinks = [
  { to: '/dashboard', label: 'Dashboard', labelAm: 'ዋና ገጽ', icon: LayoutDashboard },
  { to: '/vehicles', label: 'Vehicles', labelAm: 'ተሽከርካሪዎች', icon: Bus },
  { to: '/drivers', label: 'Drivers', labelAm: 'ሹፌሮች', icon: Users },
  { to: '/passengers', label: 'Passengers', labelAm: 'ተሳፋሪዎች', icon: UserSquare2 },
  { to: '/driver-compliance', label: 'Compliance', labelAm: 'ተገዢነት', icon: FileCheck },
  { to: '/routes', label: 'Routes', labelAm: 'መስመሮች', icon: MapPin },
  { to: '/schedules', label: 'Schedules', labelAm: 'መርሐ ግብር', icon: CalendarClock },
  { to: '/booking', label: 'Booking', labelAm: 'ቦታ ማስያዣ', icon: Ticket },
  { to: '/tracking', label: 'Live map', labelAm: 'ካርታ', icon: Navigation },
  { to: '/reports', label: 'Reports', labelAm: 'ሪፖርቶች', icon: BarChart3 },
  { to: '/notifications', label: 'Alerts', labelAm: 'ማስታወቂያ', icon: Bell },
  { to: '/analytics', label: 'Performance', labelAm: 'አፈፃፀም', icon: Award },
  { to: '/fuel', label: 'Fuel Management', labelAm: 'ነዳጅ ቁጥጥር', icon: Fuel },
  { to: '/maintenance', label: 'Maintenance', labelAm: 'ጥገና', icon: Wrench },
  { to: '/capacity', label: 'Capacity', labelAm: 'የተሳፋሪ ብዛት', icon: Users },
  { to: '/advanced-reports', label: 'Advanced Reports', labelAm: 'ዝርዝር ሪፖርቶች', icon: LineChart },
  { to: '/report-schedules', label: 'Automated Reports', labelAm: 'አውቶማቲክ ሪፖርት', icon: CalendarClock },
  { to: '/mobile-app', label: 'Mobile App', labelAm: 'ሞባይል መተግበሪያ', icon: Smartphone },
  { to: '/health', label: 'System Health', labelAm: 'የስርዓት ጤና', icon: Activity },
  { to: '/geofencing', label: 'Geofencing', labelAm: 'ጂኦፌንሲንግ', icon: ShieldAlert },
  { to: '/route-optimization', label: 'AI Optimization', labelAm: 'መስመር ማመቻቸት', icon: Zap },
  { to: '/predictive-maintenance', label: 'Predictive', labelAm: 'ትንበያ ጥገና', icon: BrainCircuit },
  { to: '/playback', label: 'Historical Map', labelAm: 'የጉዞ ታሪክ', icon: History },
  { to: '/payroll', label: 'Driver Payroll', labelAm: 'የሹፌር ክፍያ', icon: CreditCard },
  { to: '/inventory', label: 'Inventory', labelAm: 'ንብረት ቁጥጥር', icon: Boxes },
  { to: '/audit-logs', label: 'Security Logs', labelAm: 'የደህንነት መዝገብ', icon: ShieldCheck },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const links = user?.role === 'DRIVER'
    ? [
        { to: '/driver', label: 'My trips', labelAm: 'ጉዞዎች', icon: Bus },
        { to: '/tracking', label: 'Live map', labelAm: 'ካርታ', icon: Navigation },
        { to: '/notifications', label: 'Alerts', labelAm: 'ማስታወቂያ', icon: Bell },
      ]
    : baseLinks;

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    logout();
    navigate('/login');
  };

  return (
    <nav className="h-full bg-sidebar flex flex-col overflow-y-auto">
      {/* Brand header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Dabub Connect" className="w-10 h-10 rounded-xl border border-white/20 shadow-lg" />
          <div>
            <h1 className="text-white font-bold text-base leading-tight">ደቡብ ኮኔክት</h1>
            <p className="text-primary-200 text-[10px] tracking-wider uppercase">Dabub Connect</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User badge */}
      <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-white/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/30 flex items-center justify-center text-gold font-bold text-sm">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{user?.name}</p>
          <p className="text-primary-200 text-[11px] flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {user?.role?.replace('_', ' ')}
          </p>
        </div>
      </div>

      {/* Navigation links */}
      <ul className="flex-1 mt-5 px-3 space-y-1">
        {links.map(({ to, label, labelAm, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span>{label}</span>
              <span className="text-[10px] ml-auto opacity-60 font-amharic hidden xl:inline">{labelAm}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Tagline + Logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-primary-200 text-[11px] text-center mb-3 font-amharic">
          "ወደ አዲስ አቅጣጫ" — Toward a New Direction
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-red-300
                     hover:bg-red-500/10 hover:text-red-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
