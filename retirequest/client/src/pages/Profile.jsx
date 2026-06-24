import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import BadgeGrid from '../components/BadgeGrid';

export default function Profile() {
  const { user, logout } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBadges(); }, []);

  const fetchBadges = async () => {
    try {
      const res = await api.get('/badges');
      setBadges(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const earnedCount = badges.filter(b => b.earned).length;

  const formatINR = (num) => {
    if (!num) return '₹0';
    const n = parseFloat(num);
    if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n/1000).toFixed(1)}K`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  return (
    <div className="page-container">
      {/* Profile Header */}
      <div className="text-center mb-6 animate-fade-in">
        <div className="relative inline-block mb-3">
          <div className="w-20 h-20 rounded-full gradient-teal flex items-center justify-center text-2xl font-bold text-navy-900">
            {initials}
          </div>
          <div className="absolute -bottom-1 -right-1 gradient-purple text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-navy-900">
            {user?.level || 1}
          </div>
        </div>
        <h1 className="text-xl font-bold text-white">{user?.name}</h1>
        <p className="text-xs text-gray-400">{user?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-6 animate-slide-up">
        <div className="stat-card py-3">
          <span className="text-sm font-bold text-white">{formatINR(user?.currentSaved)}</span>
          <span className="text-[9px] text-gray-400">Total Saved</span>
        </div>
        <div className="stat-card py-3">
          <span className="text-sm font-bold text-orange-400">🔥 {user?.streakCount || 0}</span>
          <span className="text-[9px] text-gray-400">Best Streak</span>
        </div>
        <div className="stat-card py-3">
          <span className="text-sm font-bold text-accent-purple">{user?.xp || 0}</span>
          <span className="text-[9px] text-gray-400">Total XP</span>
        </div>
        <div className="stat-card py-3">
          <span className="text-sm font-bold text-green-400">{2 - (user?.emergencyWithdrawalsUsed || 0)}</span>
          <span className="text-[9px] text-gray-400">Emerg. Left</span>
        </div>
      </div>

      {/* Badges */}
      <div className="mb-6 animate-slide-up animate-delay-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">🏅 Badges</h2>
          <span className="text-xs text-gray-400">{earnedCount}/{badges.length} earned</span>
        </div>
        {loading ? (
          <div className="text-center py-8"><div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto" /></div>
        ) : (
          <BadgeGrid badges={badges} />
        )}
      </div>

      {/* Savings Squad */}
      <div className="mb-6 animate-slide-up animate-delay-200">
        <h2 className="section-title">👥 Savings Squad</h2>
        <div className="glass-card p-4 rounded-2xl">
          <div className="space-y-3">
            {['Priya S.', 'Rahul K.', 'Ananya M.'].map((name, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500/30 to-purple-500/30 flex items-center justify-center text-xs font-bold text-white">
                    {name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <span className="text-sm text-white">{name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm">🔥</span>
                  <span className="text-xs text-orange-400 font-medium">{[12, 8, 21][i]}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 text-center mt-3">Squad feature coming soon</p>
        </div>
      </div>

      {/* Logout */}
      <button onClick={logout} className="w-full btn-secondary text-sm py-3 text-red-400 border-red-500/20 hover:bg-red-500/10 mb-4">
        Sign Out
      </button>
    </div>
  );
}
