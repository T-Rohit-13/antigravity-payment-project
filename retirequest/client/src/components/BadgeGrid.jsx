export default function BadgeGrid({ badges = [] }) {
  const rarityColors = {
    common: 'from-gray-400 to-gray-500',
    rare: 'from-accent-purple to-blue-400',
    gold: 'from-accent-amber to-yellow-300'
  };

  const rarityGlow = {
    common: '',
    rare: 'shadow-purple-500/20',
    gold: 'shadow-amber-500/20'
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {badges.map((badge, index) => (
        <div
          key={badge.id || index}
          className={`${badge.earned ? 'badge-earned' : 'badge-locked'} 
            flex flex-col items-center text-center p-3 transition-all duration-500 animate-fade-in
            ${badge.earned ? `shadow-lg ${rarityGlow[badge.rarity] || ''}` : ''}
          `}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <span className={`text-2xl mb-1 ${badge.earned ? '' : 'grayscale opacity-30'}`}>
            {badge.icon}
          </span>
          <span className={`text-[10px] font-semibold leading-tight ${
            badge.earned ? 'text-white' : 'text-gray-600'
          }`}>
            {badge.name}
          </span>
          {badge.earned ? (
            <span className={`text-[9px] mt-1 font-medium bg-gradient-to-r ${
              rarityColors[badge.rarity] || rarityColors.common
            } bg-clip-text text-transparent uppercase tracking-wider`}>
              {badge.rarity}
            </span>
          ) : (
            <span className="text-[9px] mt-1 text-gray-600 leading-tight">
              {badge.description}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
