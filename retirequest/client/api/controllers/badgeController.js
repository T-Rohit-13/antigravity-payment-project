const supabase = require('../config/supabase');

// GET /api/badges — all badges with user's earned status
exports.getAllBadges = async (req, res) => {
  try {
    const { data: allBadges } = await supabase
      .from('badges')
      .select('*')
      .order('rarity');

    const { data: earnedBadges } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', req.user.id);

    const earnedIds = new Set((earnedBadges || []).map(b => b.badge_id));
    const earnedMap = {};
    (earnedBadges || []).forEach(b => { earnedMap[b.badge_id] = b.earned_at; });

    const badges = (allBadges || []).map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      rarity: b.rarity,
      unlockCondition: b.unlock_condition,
      earned: earnedIds.has(b.id),
      earnedAt: earnedMap[b.id] || null
    }));

    res.json(badges);
  } catch (err) {
    console.error('GetAllBadges error:', err);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
};

// GET /api/badges/earned
exports.getEarnedBadges = async (req, res) => {
  try {
    const { data: earned } = await supabase
      .from('user_badges')
      .select('earned_at, badges(*)')
      .eq('user_id', req.user.id);

    res.json((earned || []).map(e => ({
      ...e.badges,
      earnedAt: e.earned_at
    })));
  } catch (err) {
    console.error('GetEarnedBadges error:', err);
    res.status(500).json({ error: 'Failed to fetch earned badges' });
  }
};

// POST /api/badges/check — evaluate and award new badges
exports.checkBadges = async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    const { data: allBadges } = await supabase
      .from('badges')
      .select('*');

    const { data: earnedBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', req.user.id);

    const earnedIds = new Set((earnedBadges || []).map(b => b.badge_id));

    // Get additional stats
    const { data: txns } = await supabase
      .from('transactions')
      .select('type')
      .eq('user_id', req.user.id);

    const { data: hintReads } = await supabase
      .from('hint_reads')
      .select('id')
      .eq('user_id', req.user.id);

    const depositCount = (txns || []).filter(t => t.type === 'deposit').length;
    const cashbackCount = (txns || []).filter(t => t.type === 'cashback').length;
    const hintsReadCount = (hintReads || []).length;

    const { data: vault } = await supabase
      .from('vaults')
      .select('status')
      .eq('user_id', req.user.id)
      .single();

    const newlyEarned = [];

    for (const badge of (allBadges || [])) {
      if (earnedIds.has(badge.id)) continue;

      let earned = false;
      switch (badge.unlock_condition) {
        case 'first_deposit':
          earned = depositCount >= 1;
          break;
        case 'streak_7':
          earned = user.streak_count >= 7;
          break;
        case 'streak_30':
          earned = user.streak_count >= 30;
          break;
        case 'cashback_5':
          earned = cashbackCount >= 5;
          break;
        case 'hints_10':
          earned = hintsReadCount >= 10;
          break;
        case 'saved_100000':
          earned = parseFloat(user.current_saved) >= 100000;
          break;
        case 'goal_complete':
          earned = vault && vault.status === 'goal_complete';
          break;
        case 'post_emergency_save':
          earned = user.emergency_withdrawals_used > 0 && depositCount > 0;
          break;
      }

      if (earned) {
        await supabase
          .from('user_badges')
          .insert({ user_id: req.user.id, badge_id: badge.id });
        newlyEarned.push(badge);
      }
    }

    res.json({
      newlyEarned,
      message: newlyEarned.length > 0
        ? `🎉 You earned ${newlyEarned.length} new badge(s)!`
        : 'No new badges earned yet. Keep going!'
    });
  } catch (err) {
    console.error('CheckBadges error:', err);
    res.status(500).json({ error: 'Failed to check badges' });
  }
};
