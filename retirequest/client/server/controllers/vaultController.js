const supabase = require('../config/supabase');

// Calculate streak multiplier
const getStreakMultiplier = (streakCount) => {
  if (streakCount >= 30) return 2;
  if (streakCount >= 7) return 1.5;
  return 1;
};

// Calculate XP for level
const xpForLevel = (level) => level * 100;

// GET /api/vault
exports.getVault = async (req, res) => {
  try {
    const { data: vault, error } = await supabase
      .from('vaults')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error || !vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }

    res.json({
      id: vault.id,
      status: vault.status,
      instrumentType: vault.instrument_type,
      balance: parseFloat(vault.balance),
      goalType: vault.goal_type,
      goalValue: parseFloat(vault.goal_value || 0),
      goalReachedAt: vault.goal_reached_at,
      partialWithdrawalUsed: vault.partial_withdrawal_used,
      lastUpdated: vault.last_updated
    });
  } catch (err) {
    console.error('GetVault error:', err);
    res.status(500).json({ error: 'Failed to fetch vault' });
  }
};

// POST /api/vault/save
exports.saveToVault = async (req, res) => {
  try {
    const { amount, method = 'upi' } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    // Get vault
    const { data: vault } = await supabase
      .from('vaults')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (!user || !vault) {
      return res.status(404).json({ error: 'User or vault not found' });
    }

    // Calculate streak
    const now = new Date();
    const lastSave = user.last_save_date ? new Date(user.last_save_date) : null;
    let newStreak = user.streak_count;
    
    if (lastSave) {
      const diffHours = (now - lastSave) / (1000 * 60 * 60);
      if (diffHours <= 48) {
        // Check if it's a new day
        const lastDay = lastSave.toDateString();
        const today = now.toDateString();
        if (lastDay !== today) {
          newStreak += 1;
        }
      } else {
        // Streak broken (unless shield)
        if (user.streak_shields > 0) {
          // Use a shield
          await supabase
            .from('users')
            .update({ streak_shields: user.streak_shields - 1 })
            .eq('id', user.id);
        } else {
          newStreak = 1;
        }
      }
    } else {
      newStreak = 1;
    }

    const multiplier = getStreakMultiplier(newStreak);
    const baseXp = Math.floor(amount / 100) * 10;
    const xpEarned = Math.floor(baseXp * multiplier);
    const coinsEarned = Math.floor(amount / 50) * 5;

    // Update user
    const newXp = user.xp + xpEarned;
    let newLevel = user.level;
    while (newXp >= xpForLevel(newLevel)) {
      newLevel++;
    }

    const newSaved = parseFloat(user.current_saved) + parseFloat(amount);

    await supabase
      .from('users')
      .update({
        current_saved: newSaved,
        xp: newXp,
        level: newLevel,
        coins: user.coins + coinsEarned,
        streak_count: newStreak,
        last_save_date: now.toISOString()
      })
      .eq('id', user.id);

    // Update vault
    const newBalance = parseFloat(vault.balance) + parseFloat(amount);
    const vaultUpdate = {
      balance: newBalance,
      last_updated: now.toISOString()
    };

    // Check if goal reached
    if (vault.goal_value && newBalance >= parseFloat(vault.goal_value)) {
      vaultUpdate.status = 'unlock_ready';
      vaultUpdate.goal_reached_at = now.toISOString();
    }

    await supabase
      .from('vaults')
      .update(vaultUpdate)
      .eq('id', vault.id);

    // Create transaction
    const { data: txn } = await supabase
      .from('transactions')
      .insert({
        user_id: req.user.id,
        type: 'deposit',
        amount: parseFloat(amount),
        method,
        note: `Saved ₹${amount}`,
        xp_earned: xpEarned,
        coins_earned: coinsEarned
      })
      .select()
      .single();

    res.json({
      message: 'Saved successfully! 🎉',
      transaction: txn,
      xpEarned,
      coinsEarned,
      newStreak,
      multiplier,
      newBalance,
      newLevel
    });
  } catch (err) {
    console.error('SaveToVault error:', err);
    res.status(500).json({ error: 'Failed to save' });
  }
};

// POST /api/vault/withdraw (early — with penalty)
exports.earlyWithdraw = async (req, res) => {
  try {
    const { data: vault } = await supabase
      .from('vaults')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (!vault || parseFloat(vault.balance) <= 0) {
      return res.status(400).json({ error: 'No funds to withdraw' });
    }

    const withdrawAmount = parseFloat(vault.balance);
    const xpPenalty = Math.floor(user.xp * 0.5);

    // Reset vault
    await supabase
      .from('vaults')
      .update({ balance: 0, status: 'locked', last_updated: new Date().toISOString() })
      .eq('id', vault.id);

    // Penalize user
    await supabase
      .from('users')
      .update({
        current_saved: 0,
        xp: user.xp - xpPenalty,
        streak_count: 0,
        last_save_date: null
      })
      .eq('id', user.id);

    // Log transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: req.user.id,
        type: 'withdrawal',
        amount: withdrawAmount,
        method: 'netbanking',
        note: 'Early withdrawal — XP penalty applied',
        xp_earned: -xpPenalty,
        coins_earned: 0
      });

    res.json({
      message: 'Withdrawal processed. Streak reset and XP reduced by 50%.',
      withdrawn: withdrawAmount,
      xpPenalty
    });
  } catch (err) {
    console.error('EarlyWithdraw error:', err);
    res.status(500).json({ error: 'Withdrawal failed' });
  }
};

// POST /api/vault/withdraw/goal
exports.goalWithdraw = async (req, res) => {
  try {
    const { data: vault } = await supabase
      .from('vaults')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (!vault || vault.status !== 'unlock_ready') {
      return res.status(400).json({ error: 'Goal not yet reached or vault not ready' });
    }

    const withdrawAmount = parseFloat(vault.balance);

    await supabase
      .from('vaults')
      .update({ balance: 0, status: 'goal_complete', last_updated: new Date().toISOString() })
      .eq('id', vault.id);

    // Award XP bonus for goal completion
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    await supabase
      .from('users')
      .update({ xp: user.xp + 500, coins: user.coins + 200 })
      .eq('id', user.id);

    await supabase
      .from('transactions')
      .insert({
        user_id: req.user.id,
        type: 'withdrawal',
        amount: withdrawAmount,
        method: 'netbanking',
        note: 'Goal-complete withdrawal 🏆',
        xp_earned: 500,
        coins_earned: 200
      });

    res.json({
      message: 'Congratulations! Goal completed! 🏆',
      withdrawn: withdrawAmount,
      xpBonus: 500,
      coinsBonus: 200
    });
  } catch (err) {
    console.error('GoalWithdraw error:', err);
    res.status(500).json({ error: 'Withdrawal failed' });
  }
};

// POST /api/vault/withdraw/partial
exports.partialWithdraw = async (req, res) => {
  try {
    const { data: vault } = await supabase
      .from('vaults')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (!vault || parseFloat(vault.balance) <= 0) {
      return res.status(400).json({ error: 'No funds to withdraw' });
    }

    if (vault.partial_withdrawal_used) {
      return res.status(400).json({ error: 'Partial withdrawal already used' });
    }

    const halfBalance = parseFloat(vault.balance) / 2;

    await supabase
      .from('vaults')
      .update({
        balance: halfBalance,
        partial_withdrawal_used: true,
        last_updated: new Date().toISOString()
      })
      .eq('id', vault.id);

    await supabase
      .from('transactions')
      .insert({
        user_id: req.user.id,
        type: 'withdrawal',
        amount: halfBalance,
        method: 'netbanking',
        note: 'Partial withdrawal (50%)',
        xp_earned: 0,
        coins_earned: 0
      });

    res.json({
      message: 'Partial withdrawal processed. 50% remains growing in your vault.',
      withdrawn: halfBalance,
      remaining: halfBalance
    });
  } catch (err) {
    console.error('PartialWithdraw error:', err);
    res.status(500).json({ error: 'Withdrawal failed' });
  }
};

// GET /api/vault/projection
exports.getProjection = async (req, res) => {
  try {
    const { data: vault } = await supabase
      .from('vaults')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('age, retirement_age')
      .eq('id', req.user.id)
      .single();

    if (!vault || !user) {
      return res.status(404).json({ error: 'Data not found' });
    }

    const currentBalance = parseFloat(vault.balance) || 0;
    const monthlyRate = 0.08 / 12;
    const yearsToRetirement = (user.retirement_age || 60) - (user.age || 22);
    const months = yearsToRetirement * 12;

    // Monthly savings estimate (average of last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentTxns } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', req.user.id)
      .eq('type', 'deposit')
      .gte('created_at', thirtyDaysAgo);

    const totalRecent = (recentTxns || []).reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const monthlySavings = totalRecent || 2000; // Default ₹2000/month

    // FV = PV(1+r)^n + PMT × [((1+r)^n - 1) / r] × (1+r)
    const fvLumpSum = currentBalance * Math.pow(1 + monthlyRate, months);
    const fvSIP = monthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const projectedCorpus = Math.round(fvLumpSum + fvSIP);

    res.json({
      currentBalance,
      monthlySavings: Math.round(monthlySavings),
      yearsToRetirement,
      annualReturn: '8%',
      projectedCorpus,
      projectedCorpusFormatted: formatINR(projectedCorpus)
    });
  } catch (err) {
    console.error('Projection error:', err);
    res.status(500).json({ error: 'Failed to calculate projection' });
  }
};

function formatINR(num) {
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)} K`;
  return `₹${num}`;
}
