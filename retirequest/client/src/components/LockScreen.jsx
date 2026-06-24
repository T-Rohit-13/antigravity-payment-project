import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LockScreen() {
  const { user, unlockApp, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      handleUnlock();
    }
  }, [pin]);

  const handleUnlock = async () => {
    setLoading(true);
    setError('');
    const success = await unlockApp(pin);
    if (!success) {
      setError('Incorrect Validation PIN');
      setPin('');
      // vibrate if device supports
      if (navigator.vibrate) navigator.vibrate(200);
    }
    setLoading(false);
  };

  const handleKeyClick = (num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-between py-12 px-6 animate-fade-in relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-sm mx-auto flex flex-col items-center pt-8 z-10">
        <div className="w-16 h-16 rounded-full gradient-teal flex items-center justify-center text-3xl font-bold text-navy-900 mb-4 shadow-[0_0_30px_rgba(20,184,166,0.5)]">
          {user?.name?.[0]?.toUpperCase() || 'R'}
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Welcome back, {user?.name?.split(' ')[0]}</h2>
        <p className="text-sm text-gray-400 mb-10">Enter 4-digit RetireQuest PIN</p>

        {/* PIN Dots */}
        <div className="flex gap-4 mb-4">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                pin.length > i 
                  ? 'bg-teal-400 scale-125 shadow-[0_0_10px_rgba(45,212,191,0.5)]' 
                  : 'bg-white/10'
              } ${error ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : ''}`}
            />
          ))}
        </div>
        
        <div className="h-6">
          {error && <p className="text-xs text-red-400 animate-bounce">{error}</p>}
          {loading && <p className="text-xs text-teal-400 animate-pulse">Verifying...</p>}
        </div>
      </div>

      {/* Numpad */}
      <div className="w-full max-w-xs mx-auto grid grid-cols-3 gap-x-4 gap-y-6 z-10">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleKeyClick(num)}
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-light text-white hover:bg-white/10 active:bg-white/20 transition-colors mx-auto"
          >
            {num}
          </button>
        ))}
        <div /> {/* Empty space */}
        <button
          onClick={() => handleKeyClick(0)}
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-light text-white hover:bg-white/10 active:bg-white/20 transition-colors mx-auto"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors mx-auto"
        >
          ⌫
        </button>
      </div>
      
      <button onClick={logout} className="mt-8 text-xs text-gray-500 hover:text-gray-300 transition-colors z-10 p-2">
        Logout / Switch Account
      </button>
    </div>
  );
}
