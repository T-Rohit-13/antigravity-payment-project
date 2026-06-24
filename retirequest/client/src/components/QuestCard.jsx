export default function QuestCard({ quest, onClaim }) {
  const percentage = quest.conditionValue > 0
    ? Math.min((quest.progress / quest.conditionValue) * 100, 100)
    : 0;

  const statusConfig = {
    active: { badge: '⚡', badgeColor: 'bg-blue-500/20 text-blue-400', barColor: 'from-blue-500 to-cyan-400' },
    claimable: { badge: '🎉', badgeColor: 'bg-green-500/20 text-green-400', barColor: 'from-green-500 to-emerald-400' },
    completed: { badge: '✅', badgeColor: 'bg-teal-500/20 text-teal-400', barColor: 'from-teal-500 to-teal-400' },
    locked: { badge: '🔒', badgeColor: 'bg-gray-500/20 text-gray-500', barColor: 'from-gray-500 to-gray-400' }
  };

  const config = statusConfig[quest.status] || statusConfig.active;

  return (
    <div className={`glass-card p-4 rounded-2xl transition-all duration-500 ${
      quest.status === 'claimable' ? 'border-green-500/30 animate-glow' : ''
    } ${quest.status === 'completed' ? 'opacity-75' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badgeColor}`}>
              {config.badge} {quest.status}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white">{quest.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{quest.description}</p>
        </div>
        <div className="text-right shrink-0 ml-3">
          <div className="text-xs text-accent-purple font-semibold">+{quest.xpReward} XP</div>
          <div className="text-xs text-accent-amber font-semibold">+{quest.coinReward} 🪙</div>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-3">
        <div className="flex justify-between mb-1">
          <span className="text-[11px] text-gray-400">
            {quest.progress || 0} / {quest.conditionValue}
          </span>
          <span className="text-[11px] text-gray-500">{percentage.toFixed(0)}%</span>
        </div>
        <div className="progress-bar-bg h-2">
          <div
            className={`progress-bar-fill bg-gradient-to-r ${config.barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {quest.status === 'claimable' && (
        <button
          onClick={() => onClaim(quest)}
          className="w-full mt-3 btn-primary text-sm py-2.5"
        >
          🎁 Claim Reward
        </button>
      )}
    </div>
  );
}
