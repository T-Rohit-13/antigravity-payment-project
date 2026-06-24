import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import QuestCard from '../components/QuestCard';

export default function Quests() {
  const { refreshUser } = useAuth();
  const [quests, setQuests] = useState([]);
  const [weekNumber, setWeekNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [claimResult, setClaimResult] = useState(null);

  useEffect(() => { fetchQuests(); }, []);

  const fetchQuests = async () => {
    try {
      const res = await api.get('/quests');
      setQuests(res.data.quests || []);
      setWeekNumber(res.data.weekNumber || 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleClaim = async (quest) => {
    try {
      const res = await api.post(`/quests/${quest.id}/complete`);
      setClaimResult(res.data);
      await refreshUser();
      await fetchQuests();
      await api.post('/badges/check');
      setTimeout(() => setClaimResult(null), 4000);
    } catch (err) { console.error(err); }
  };

  const done = quests.filter(q => q.completed).length;

  if (loading) return <div className="page-container flex items-center justify-center"><div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /></div>;

  return (
    <div className="page-container">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-xl font-bold text-white">⚔️ Weekly Quests</h1>
        <p className="text-xs text-gray-400 mt-1">Week {weekNumber} • Complete quests to earn XP & coins</p>
      </div>
      <div className="glass-card p-4 rounded-2xl mb-5 animate-slide-up">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Quest Chain</span>
          <span className="text-xs font-semibold text-teal-400">{done}/{quests.length}</span>
        </div>
        <div className="progress-bar-bg"><div className="progress-bar-fill gradient-teal" style={{ width: `${quests.length ? (done/quests.length)*100 : 0}%` }} /></div>
        {done === quests.length && quests.length > 0 && <p className="text-xs text-accent-amber font-semibold mt-2 text-center animate-bounce-in">🏆 All quests completed!</p>}
      </div>
      {claimResult && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4 animate-bounce-in text-center"><p className="text-sm font-semibold text-green-400">{claimResult.message}</p><div className="flex justify-center gap-4 mt-1"><span className="text-xs text-accent-purple">+{claimResult.xpReward} XP</span><span className="text-xs text-accent-amber">+{claimResult.coinReward} 🪙</span></div></div>}
      <div className="space-y-3">
        {quests.map((q, i) => <div key={q.id} className="animate-slide-up" style={{ animationDelay: `${i*100}ms` }}><QuestCard quest={q} onClaim={handleClaim} /></div>)}
      </div>
      {!quests.length && <div className="glass-card p-8 rounded-2xl text-center"><span className="text-3xl block mb-2">🗺️</span><p className="text-sm text-gray-400">No quests available. Check back soon!</p></div>}
    </div>
  );
}
