import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import StreakCard from '../components/StreakCard';
import VaultProgress from '../components/VaultProgress';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [vault, setVault] = useState(null);
  const [projection, setProjection] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  // States for Live Demo Math
  const [saving, setSaving] = useState(false);
  const [merchant, setMerchant] = useState('Swiggy');
  const [demoAmount, setDemoAmount] = useState('247');
  const [demoBreakdown, setDemoBreakdown] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vaultRes, txnRes, projRes] = await Promise.all([
        api.get('/vault'),
        api.get('/transactions'),
        api.get('/vault/projection')
      ]);
      setVault(vaultRes.data);
      setTransactions(txnRes.data.slice(0, 5));
      setProjection(projRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
  };

  const handleDemoPayment = async () => {
    const amount = parseFloat(demoAmount);
    if (!amount || amount <= 0) return;

    setSaving(true);
    setDemoBreakdown(null);
    
    // Fake the calculation
    const merchantCost = amount;
    const roundedTotal = Math.ceil(amount / 10) * 10 === amount ? amount + 10 : Math.ceil(amount / 10) * 10;
    const savedAmount = roundedTotal - merchantCost;

    try {
      // Actually save it to the backend so the DB updates!
      await api.post('/vault/save', { amount: savedAmount, method: 'upi', note: `Round-up from ${merchant}` });
      await refreshUser();
      await fetchData();
      await api.post('/badges/check');
      
      setDemoBreakdown({
        merchant: merchantCost,
        saved: savedAmount
      });
      
      // Auto-hide breakdown after 5 seconds to reset the loop
      setTimeout(() => {
        setDemoBreakdown(null);
      }, 5000);

    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatINR = (num) => {
    if (!num) return '₹0';
    const n = parseFloat(num);
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)} K`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  // Live Notification Auto-Hide
  useEffect(() => {
    if(showNotification) {
      const timer = setTimeout(() => setShowNotification(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  return (
    <div className="page-container relative">
      
      {/* Live Push Notification Simulation */}
      {showNotification && (
        <div className="fixed top-2 left-4 right-4 z-50 glass-card p-4 rounded-xl border-l-4 border-l-teal-500 shadow-2xl animate-slide-down flex items-start gap-3 bg-navy-900/95 backdrop-blur-3xl border border-white/10">
          <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
            <span className="text-xl">🔔</span>
          </div>
          <div>
            <div className="flex justify-between items-center mb-0.5">
              <h4 className="text-[11px] font-bold text-gray-400">RetireQuest • Just now</h4>
              <button onClick={() => setShowNotification(false)} className="text-gray-500 hover:text-white shrink-0">✕</button>
            </div>
            <p className="text-[13px] text-white leading-tight font-medium">Awesome! You saved <span className="text-teal-400 font-bold">₹2,450</span> this month from 42 transactions. Your corpus just grew stronger! 🚀</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Explorer'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5" onClick={() => localStorage.removeItem('rq_token')}>Your UPI Retirement Journey</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="gradient-purple text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            XP: {user?.xp || 0}
          </div>
        </div>
      </div>

      {/* Projected Corpus Hero Banner (Pitch Perfect) */}
      <div className="mb-5 animate-fade-in relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/30 shadow-[0_0_40px_rgba(20,184,166,0.1)]">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/20 rounded-full blur-[50px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent-purple/10 rounded-full blur-[50px] pointer-events-none" />
        
        <p className="text-[10px] text-teal-400 font-bold tracking-widest uppercase mb-1 drop-shadow-md">Projected Corpus</p>
        <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-white pb-1 tracking-tight">
          {projection ? formatINR(projection.projectedCorpus) : '—'}
        </p>
        <p className="text-xs text-gray-400 mt-2 font-medium">At your current pace • 8% p.a. • Compounded</p>
      </div>

      {/* Streak Card */}
      <div className="mb-4 animate-slide-up">
        <StreakCard streakCount={user?.streakCount || 0} lastSaveDate={user?.lastSaveDate} />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5 animate-slide-up animate-delay-100">
        <div className="stat-card py-4 border border-white/5 bg-white/[0.02]">
          <span className="text-xl mb-1">💰</span>
          <span className="text-lg font-bold text-white">{formatINR(user?.currentSaved)}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Total Gathered</span>
        </div>
        <div className="stat-card py-4 border border-white/5 bg-white/[0.02]">
          <span className="text-xl mb-1">🪙</span>
          <span className="text-lg font-bold text-accent-amber">{user?.coins || 0}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Earned Coins</span>
        </div>
      </div>

      {/* Vault Progress */}
      <div className="mb-5 animate-slide-up animate-delay-200">
        <VaultProgress
          current={vault?.balance || 0}
          goal={vault?.goalValue || user?.targetAmount || 100000}
          status={vault?.status || 'locked'}
        />
      </div>

      {/* Live Demo: Transaction Simulator */}
      <div className="glass-card flex flex-col p-5 rounded-3xl mb-5 border-accent-purple/30 bg-gradient-to-br from-accent-purple/10 to-transparent animate-slide-up animate-delay-300 shadow-[0_0_20px_rgba(168,85,247,0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
           <button onClick={() => setShowNotification(true)} className="text-[9px] px-2.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all font-bold uppercase tracking-wider backdrop-blur-md">Mock Notification</button>
        </div>

        <div className="flex items-center gap-3 mb-5 mt-2">
          <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center text-xl">💳</div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">Mock UPI Payment</h3>
            <p className="text-[10px] text-gray-400">Watch micro-investing happen live</p>
          </div>
        </div>
        
        <div className="flex gap-3 mb-4">
          <select value={merchant} onChange={e => setMerchant(e.target.value)} className="input-field flex-[2] bg-navy-900 border-white/10 text-sm py-3 px-4 font-medium appearance-none">
            <option value="Swiggy">🍔 Swiggy</option>
            <option value="Zomato">🍕 Zomato</option>
            <option value="Uber">🚕 Uber</option>
            <option value="Zepto">🛒 Zepto</option>
            <option value="Blinkit">🥦 Blinkit</option>
          </select>
          <div className="relative flex-[1.5]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
            <input type="number" value={demoAmount} onChange={e=>setDemoAmount(e.target.value)} className="input-field w-full pl-7 pr-3 py-3 bg-navy-900 border-white/10 text-sm font-bold" placeholder="Amt" />
          </div>
        </div>

        <button onClick={handleDemoPayment} disabled={saving} className="w-full py-3.5 bg-white text-navy-900 text-sm font-extrabold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,255,255,0.2)]">
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" /> Processing UPI...
            </span>
          ) : `Pay ₹${demoAmount} Securely`}
        </button>

        {demoBreakdown && (
          <div className="mt-5 p-4 rounded-2xl bg-navy-900 border border-white/10 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />
            <div className="flex justify-between items-center mb-2 relative z-10">
              <span className="text-xs text-gray-400 font-medium">Merchant Bill</span>
              <span className="text-sm text-white font-bold">₹{(demoBreakdown.merchant).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-3 relative z-10">
              <span className="text-xs text-teal-400 font-bold flex items-center gap-1">✨ Saved to Vault</span>
              <span className="text-lg text-teal-400 font-extrabold">+₹{demoBreakdown.saved}</span>
            </div>
            
            <div className="pt-3 border-t border-white/5 relative z-10 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-gray-500 font-medium block">Platform Setup Fee</span>
                <span className="text-[9px] text-accent-amber font-semibold tracking-wide">JUDGE DEMO: Revenue Model</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 line-through mr-1">₹0.50</span> 
                <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider bg-green-400/10 px-2 py-0.5 rounded">Free</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="animate-slide-up animate-delay-400 pb-10">
        <h3 className="text-sm font-bold text-white mb-3 pl-1">Recent History</h3>
        {transactions.length > 0 ? (
          <div className="space-y-2.5">
            {transactions.map((txn) => (
              <div key={txn.id} className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    txn.type === 'deposit' ? 'bg-teal-500/10' : 
                    txn.type === 'withdrawal' ? 'bg-red-500/10' : 
                    txn.type === 'roundup' ? 'bg-accent-purple/10' : 'bg-white/10'
                  }`}>
                    {txn.type === 'deposit' ? '💰' : txn.type === 'withdrawal' ? '💸' : txn.type === 'roundup' ? '🔄' : '💳'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{txn.note || txn.type}</p>
                    <p className="text-[10px] font-medium text-gray-500 mt-0.5">
                      {new Date(txn.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-base font-extrabold ${
                    txn.type === 'withdrawal' ? 'text-red-400' : 'text-teal-400'
                  }`}>
                    {txn.type === 'withdrawal' ? '-' : '+'}₹{txn.amount.toLocaleString('en-IN')}
                  </p>
                  {txn.xpEarned > 0 && (
                    <p className="text-[9px] font-bold text-accent-purple mt-0.5">+{txn.xpEarned} XP 🔥</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 rounded-3xl border border-white/5 text-center flex flex-col items-center">
            <span className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl mb-3">🌱</span>
            <p className="text-sm font-bold text-white mb-1">Your vault is empty</p>
            <p className="text-xs text-gray-400">Make your first mock payment above!</p>
          </div>
        )}
      </div>
    </div>
  );
}
