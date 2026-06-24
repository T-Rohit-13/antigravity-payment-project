export default function HintCard({ hint, onRead }) {
  return (
    <div className="glass-card-hover p-4 rounded-2xl animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-purple/20 text-purple-300 font-medium">
              {hint.category || 'tip'}
            </span>
            {hint.read && (
              <span className="text-xs text-green-400">✓ Read</span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-white mb-1 leading-snug">
            {hint.title}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {hint.preview}
          </p>
        </div>
        {!hint.read && (
          <button
            onClick={() => onRead(hint)}
            className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl bg-accent-amber/20 text-accent-amber text-xs font-semibold hover:bg-accent-amber/30 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Read +{hint.coinsReward || 10} 🪙
          </button>
        )}
      </div>
    </div>
  );
}
