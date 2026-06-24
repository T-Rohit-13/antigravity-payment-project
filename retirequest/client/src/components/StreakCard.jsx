export default function StreakCard({ streakCount = 0, lastSaveDate }) {
  const getMultiplier = () => {
    if (streakCount >= 30) return { value: '2×', label: 'Dragon Mode', color: 'text-accent-amber' };
    if (streakCount >= 7) return { value: '1.5×', label: 'Fire Mode', color: 'text-orange-400' };
    return { value: '1×', label: 'Normal', color: 'text-gray-400' };
  };

  const multiplier = getMultiplier();
  const isActive = streakCount > 0;

  return (
    <div className={`glass-card p-4 rounded-2xl transition-all duration-500 ${
      isActive ? 'border-orange-500/30 bg-orange-500/5' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`text-3xl ${isActive ? 'animate-float' : 'opacity-40'}`}>
            🔥
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{streakCount}</span>
              <span className="text-sm text-gray-400">day streak</span>
            </div>
            {lastSaveDate && (
              <p className="text-xs text-gray-500">
                Last save: {new Date(lastSaveDate).toLocaleDateString('en-IN', { 
                  day: 'numeric', month: 'short' 
                })}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold ${multiplier.color}`}>
            {multiplier.value}
          </span>
          <p className="text-xs text-gray-500">{multiplier.label}</p>
        </div>
      </div>
      
      {/* Streak milestones */}
      <div className="mt-3 flex gap-1">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < Math.min(streakCount, 7)
                ? 'bg-gradient-to-r from-orange-500 to-amber-400'
                : 'bg-white/[0.08]'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-600">Day 1</span>
        <span className="text-[10px] text-gray-600">7 (1.5× unlock)</span>
      </div>
    </div>
  );
}
