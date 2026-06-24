import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', icon: '🏠', label: 'Home' },
  { path: '/vault', icon: '🔒', label: 'Vault' },
  { path: '/quests', icon: '⚔️', label: 'Quests' },
  { path: '/hints', icon: '💡', label: 'Hints' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-navy-800/90 backdrop-blur-xl border-t border-white/[0.08]">
      <div className="max-w-lg mx-auto flex justify-around items-center py-2 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'text-teal-400 bg-teal-500/10 scale-105'
                  : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
