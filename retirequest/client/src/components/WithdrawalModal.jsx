import { useState } from 'react';

export default function WithdrawalModal({ type, balance, onConfirm, onClose }) {
  const [confirmed, setConfirmed] = useState(false);

  const configs = {
    early: {
      title: '⚠️ Early Withdrawal',
      description: 'This will reset your streak and reduce your XP by 50%. Are you sure?',
      warning: 'Your progress will be significantly impacted.',
      buttonText: 'Withdraw Anyway',
      buttonClass: 'bg-red-500 hover:bg-red-600 text-white',
      icon: '⚠️'
    },
    goal: {
      title: '🏆 Goal Complete Withdrawal',
      description: 'Congratulations! You\'ve reached your savings goal. Claim your full vault balance with bonus XP and coins!',
      warning: null,
      buttonText: 'Claim Withdrawal',
      buttonClass: 'btn-primary',
      icon: '🏆'
    },
    partial: {
      title: '⚖️ Partial Withdrawal',
      description: 'Take 50% of your vault balance. The remaining 50% will keep growing.',
      warning: 'You can only use partial withdrawal once.',
      buttonText: 'Withdraw 50%',
      buttonClass: 'bg-accent-amber hover:bg-amber-600 text-navy-900',
      icon: '⚖️'
    }
  };

  const config = configs[type] || configs.early;

  const formatINR = (num) => {
    return `₹${parseFloat(num).toLocaleString('en-IN')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card p-6 rounded-2xl max-w-sm w-full animate-slide-up border border-white/[0.1]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          ✕
        </button>

        <div className="text-center mb-4">
          <span className="text-4xl block mb-2">{config.icon}</span>
          <h2 className="text-lg font-bold text-white">{config.title}</h2>
        </div>

        <p className="text-sm text-gray-300 text-center mb-4">{config.description}</p>

        <div className="glass-card p-4 rounded-xl mb-4 text-center">
          <p className="text-xs text-gray-400 mb-1">
            {type === 'partial' ? 'Withdrawal Amount (50%)' : 'Withdrawal Amount'}
          </p>
          <p className="text-2xl font-bold text-white">
            {formatINR(type === 'partial' ? balance / 2 : balance)}
          </p>
        </div>

        {config.warning && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            <p className="text-xs text-red-400 text-center">{config.warning}</p>
          </div>
        )}

        {type === 'early' && (
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-transparent text-teal-500 focus:ring-teal-500/50"
            />
            <span className="text-xs text-gray-400">
              I understand this will reset my streak and reduce XP by 50%
            </span>
          </label>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary text-sm py-2.5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={type === 'early' && !confirmed}
            className={`flex-1 font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed ${config.buttonClass}`}
          >
            {config.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
