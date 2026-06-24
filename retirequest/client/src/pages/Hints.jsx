import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import HintCard from '../components/HintCard';

export default function Hints() {
  const { refreshUser } = useAuth();
  const [hints, setHints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeHint, setActiveHint] = useState(null);
  const [earnMsg, setEarnMsg] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => { fetchHints(); }, []);

  const fetchHints = async () => {
    try {
      const res = await api.get('/hints');
      setHints(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleRead = async (hint) => {
    setActiveHint(hint);
    if (!hint.read) {
      try {
        const res = await api.post(`/hints/${hint.id}/read`);
        setEarnMsg(res.data.message);
        await refreshUser();
        await fetchHints();
        await api.post('/badges/check');
        setTimeout(() => setEarnMsg(null), 3000);
      } catch (err) { console.error(err); }
    }
  };

  const quizQuestions = [
    { q: 'Starting to save at 22 vs 32 can result in roughly how much more corpus?', options: ['50% more', 'Double', 'Triple', '10× more'], answer: 1 },
    { q: 'What does the 50-30-20 rule allocate to savings?', options: ['10%', '20%', '30%', '50%'], answer: 1 },
    { q: 'What is the lock-in period for ELSS funds?', options: ['1 year', '2 years', '3 years', '5 years'], answer: 2 }
  ];

  const handleQuiz = () => {
    const correct = quizQuestions.filter((q, i) => quizAnswers[i] === q.answer).length;
    if (correct === 3) {
      setQuizResult({ score: 3, msg: '🎉 Perfect! +50 coins awarded!' });
    } else {
      setQuizResult({ score: correct, msg: `${correct}/3 correct. Get all 3 for 50 coins!` });
    }
  };

  const readCount = hints.filter(h => h.read).length;

  if (loading) return <div className="page-container flex items-center justify-center"><div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /></div>;

  return (
    <div className="page-container">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-xl font-bold text-white">💡 Financial Hints</h1>
        <p className="text-xs text-gray-400 mt-1">Learn & earn coins • {readCount}/{hints.length} read</p>
      </div>

      {earnMsg && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4 animate-bounce-in text-center"><p className="text-xs text-green-400 font-medium">{earnMsg}</p></div>}

      {/* Quiz Card */}
      <div className="glass-card p-5 rounded-2xl mb-5 border-accent-purple/20 bg-accent-purple/5 animate-slide-up">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🧠</span>
          <h3 className="text-sm font-semibold text-white">Weekly Quiz</h3>
          <span className="ml-auto text-xs text-accent-amber font-medium">50 🪙</span>
        </div>
        <div className="space-y-4">
          {quizQuestions.map((q, qi) => (
            <div key={qi}>
              <p className="text-xs text-gray-300 mb-2">{qi+1}. {q.q}</p>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <button key={oi} onClick={() => setQuizAnswers(p => ({...p, [qi]: oi}))}
                    className={`text-[11px] py-2 px-3 rounded-lg transition-all ${quizAnswers[qi] === oi ? 'gradient-purple text-white' : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.1]'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleQuiz} disabled={Object.keys(quizAnswers).length < 3}
          className="w-full mt-4 btn-primary text-sm py-2.5 disabled:opacity-40">
          Submit Quiz
        </button>
        {quizResult && <p className={`text-xs mt-2 text-center font-medium ${quizResult.score === 3 ? 'text-green-400' : 'text-accent-amber'}`}>{quizResult.msg}</p>}
      </div>

      {/* Hints Feed */}
      <div className="space-y-3">
        {hints.map((hint, i) => (
          <div key={hint.id} style={{ animationDelay: `${i*80}ms` }}>
            <HintCard hint={hint} onRead={handleRead} />
          </div>
        ))}
      </div>

      {/* Full Hint Modal */}
      {activeHint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveHint(null)} />
          <div className="relative glass-card p-6 rounded-2xl max-w-sm w-full max-h-[80vh] overflow-y-auto animate-slide-up border border-white/[0.1]">
            <button onClick={() => setActiveHint(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-purple/20 text-purple-300 font-medium">{activeHint.category}</span>
            <h2 className="text-lg font-bold text-white mt-3 mb-3">{activeHint.title}</h2>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{activeHint.content}</p>
            {activeHint.read && <p className="text-xs text-green-400 mt-4 text-center">✓ Already read & earned coins</p>}
          </div>
        </div>
      )}
    </div>
  );
}
