const supabase = require('../config/supabase');

// GET /api/quests — current week's quests with user progress
exports.getQuests = async (req, res) => {
  try {
    // Calculate current week number (since user registration)
    const { data: user } = await supabase
      .from('users')
      .select('created_at, current_saved, streak_count')
      .eq('id', req.user.id)
      .single();

    const weeksSinceJoined = Math.ceil(
      (Date.now() - new Date(user.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)
    ) || 1;

    // Cycle through weeks 1-3
    const currentWeek = ((weeksSinceJoined - 1) % 3) + 1;

    const { data: quests } = await supabase
      .from('quests')
      .select('*')
      .eq('week_number', currentWeek);

    // Get user's completions
    const { data: completions } = await supabase
      .from('quest_completions')
      .select('quest_id')
      .eq('user_id', req.user.id);

    const completedIds = new Set((completions || []).map(c => c.quest_id));

    // Get this week's stats for progress
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const { data: weekTxns } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', req.user.id)
      .gte('created_at', weekStart.toISOString());

    const { data: weekHintReads } = await supabase
      .from('hint_reads')
      .select('id')
      .eq('user_id', req.user.id)
      .gte('read_at', weekStart.toISOString());

    const weeklyDeposits = (weekTxns || []).filter(t => t.type === 'deposit');
    const weeklySaved = weeklyDeposits.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const weeklyRoundups = (weekTxns || []).filter(t => t.type === 'roundup').length;
    const weeklyCashbacks = (weekTxns || []).filter(t => t.type === 'cashback').length;
    const weeklyHints = (weekHintReads || []).length;

    const questsWithProgress = (quests || []).map(q => {
      let progress = 0;
      switch (q.condition) {
        case 'weekly_save':
          progress = Math.min(weeklySaved, q.condition_value);
          break;
        case 'streak_days':
          progress = Math.min(user.streak_count, q.condition_value);
          break;
        case 'roundup_count':
          progress = Math.min(weeklyRoundups, q.condition_value);
          break;
        case 'hints_read':
          progress = Math.min(weeklyHints, q.condition_value);
          break;
        case 'cashback_count':
          progress = Math.min(weeklyCashbacks, q.condition_value);
          break;
      }

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        xpReward: q.xp_reward,
        coinReward: q.coin_reward,
        condition: q.condition,
        conditionValue: q.condition_value,
        progress,
        completed: completedIds.has(q.id),
        status: completedIds.has(q.id) ? 'completed' : progress >= q.condition_value ? 'claimable' : 'active'
      };
    });

    res.json({
      weekNumber: currentWeek,
      quests: questsWithProgress
    });
  } catch (err) {
    console.error('GetQuests error:', err);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
};

// POST /api/quests/:id/complete
exports.completeQuest = async (req, res) => {
  try {
    const questId = req.params.id;

    // Check if already completed
    const { data: existing } = await supabase
      .from('quest_completions')
      .select('id')
      .eq('quest_id', questId)
      .eq('user_id', req.user.id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Quest already completed' });
    }

    const { data: quest } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .single();

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    // Mark as completed
    await supabase
      .from('quest_completions')
      .insert({ quest_id: questId, user_id: req.user.id });

    // Award rewards
    const { data: user } = await supabase
      .from('users')
      .select('xp, coins, level')
      .eq('id', req.user.id)
      .single();

    const newXp = user.xp + quest.xp_reward;
    let newLevel = user.level;
    while (newXp >= newLevel * 100) newLevel++;

    await supabase
      .from('users')
      .update({
        xp: newXp,
        coins: user.coins + quest.coin_reward,
        level: newLevel
      })
      .eq('id', req.user.id);

    res.json({
      message: `Quest "${quest.title}" completed! 🎉`,
      xpReward: quest.xp_reward,
      coinReward: quest.coin_reward,
      newLevel
    });
  } catch (err) {
    console.error('CompleteQuest error:', err);
    res.status(500).json({ error: 'Failed to complete quest' });
  }
};
