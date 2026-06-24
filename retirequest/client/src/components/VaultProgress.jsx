export default function VaultProgress({ current = 0, goal = 100000, status = 'locked' }) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  const formatINR = (num) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const statusConfig = {
    locked: { icon: '🔒', color: 'from-teal-500 to-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
    unlock_ready: { icon: '✅', color: 'from-green-500 to-emerald-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    emergency_mode: { icon: '🆘', color: 'from-red-500 to-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    goal_complete: { icon: '🏆', color: 'from-amber-500 to-yellow-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
  };

  const config = statusConfig[status] || statusConfig.locked;

  return (
    <div className={`glass-card p-5 rounded-2xl ${config.bg} ${config.border} border`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <h3 className="text-sm font-medium text-gray-300">Vault Progress</h3>
        </div>
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          {status.replace('_', ' ')}
        </span>
      </div>

      <div className="flex items-end justify-between mb-2">
        <span className="text-3xl font-bold text-white">{formatINR(current)}</span>
        <span className="text-sm text-gray-400">of {formatINR(goal)}</span>
      </div>

      <div className="progress-bar-bg">
        <div
          className={`progress-bar-fill bg-gradient-to-r ${config.color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-500">{percentage.toFixed(1)}% complete</span>
        <span className="text-xs text-gray-500">{formatINR(Math.max(goal - current, 0))} to go</span>
      </div>
    </div>
  );
}
