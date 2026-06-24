const supabase = require('../config/supabase');

// GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json(transactions.map(t => ({
      id: t.id,
      type: t.type,
      amount: parseFloat(t.amount),
      method: t.method,
      note: t.note,
      xpEarned: t.xp_earned,
      coinsEarned: t.coins_earned,
      createdAt: t.created_at
    })));
  } catch (err) {
    console.error('GetTransactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// POST /api/transactions/roundup
exports.logRoundup = async (req, res) => {
  try {
    const { originalAmount, roundedAmount } = req.body;
    const roundupAmount = roundedAmount - originalAmount;

    if (roundupAmount <= 0) {
      return res.status(400).json({ error: 'Invalid round-up amount' });
    }

    // Add to vault
    const { data: vault } = await supabase
      .from('vaults')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (vault) {
      await supabase
        .from('vaults')
        .update({
          balance: parseFloat(vault.balance) + roundupAmount,
          last_updated: new Date().toISOString()
        })
        .eq('id', vault.id);
    }

    // Update user savings
    const { data: user } = await supabase
      .from('users')
      .select('current_saved, xp, coins')
      .eq('id', req.user.id)
      .single();

    const xpEarned = 5;
    const coinsEarned = 2;

    await supabase
      .from('users')
      .update({
        current_saved: parseFloat(user.current_saved) + roundupAmount,
        xp: user.xp + xpEarned,
        coins: user.coins + coinsEarned
      })
      .eq('id', req.user.id);

    // Log transaction
    const { data: txn } = await supabase
      .from('transactions')
      .insert({
        user_id: req.user.id,
        type: 'roundup',
        amount: roundupAmount,
        method: 'upi',
        note: `Round-up: ₹${originalAmount} → ₹${roundedAmount}`,
        xp_earned: xpEarned,
        coins_earned: coinsEarned
      })
      .select()
      .single();

    res.json({
      message: `₹${roundupAmount} rounded up and saved!`,
      transaction: txn,
      xpEarned,
      coinsEarned
    });
  } catch (err) {
    console.error('Roundup error:', err);
    res.status(500).json({ error: 'Round-up failed' });
  }
};

// POST /api/transactions/cashback
exports.logCashback = async (req, res) => {
  try {
    const { amount, source } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid cashback amount' });
    }

    // Add to vault
    const { data: vault } = await supabase
      .from('vaults')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (vault) {
      await supabase
        .from('vaults')
        .update({
          balance: parseFloat(vault.balance) + parseFloat(amount),
          last_updated: new Date().toISOString()
        })
        .eq('id', vault.id);
    }

    const { data: user } = await supabase
      .from('users')
      .select('current_saved, xp, coins')
      .eq('id', req.user.id)
      .single();

    const xpEarned = 15;
    const coinsEarned = 10;

    await supabase
      .from('users')
      .update({
        current_saved: parseFloat(user.current_saved) + parseFloat(amount),
        xp: user.xp + xpEarned,
        coins: user.coins + coinsEarned
      })
      .eq('id', req.user.id);

    const { data: txn } = await supabase
      .from('transactions')
      .insert({
        user_id: req.user.id,
        type: 'cashback',
        amount: parseFloat(amount),
        method: 'cashback_redirect',
        note: `Cashback from ${source || 'reward'} redirected to vault`,
        xp_earned: xpEarned,
        coins_earned: coinsEarned
      })
      .select()
      .single();

    res.json({
      message: `₹${amount} cashback redirected to vault!`,
      transaction: txn,
      xpEarned,
      coinsEarned
    });
  } catch (err) {
    console.error('Cashback error:', err);
    res.status(500).json({ error: 'Cashback redirect failed' });
  }
};
