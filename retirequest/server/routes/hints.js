const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const supabase = require('../config/supabase');

// GET /api/hints — all hint cards with user's read status
router.get('/', auth, async (req, res) => {
  try {
    const { data: hints } = await supabase
      .from('hints')
      .select('*')
      .order('category');

    const { data: reads } = await supabase
      .from('hint_reads')
      .select('hint_id')
      .eq('user_id', req.user.id);

    const readIds = new Set((reads || []).map(r => r.hint_id));

    const hintsWithStatus = (hints || []).map(h => ({
      id: h.id,
      title: h.title,
      preview: h.preview,
      content: h.content,
      coinsReward: h.coins_reward,
      category: h.category,
      read: readIds.has(h.id)
    }));

    res.json(hintsWithStatus);
  } catch (err) {
    console.error('GetHints error:', err);
    res.status(500).json({ error: 'Failed to fetch hints' });
  }
});

// POST /api/hints/:id/read — mark hint as read and award coins
router.post('/:id/read', auth, async (req, res) => {
  try {
    const hintId = req.params.id;

    // Check if already read
    const { data: existing } = await supabase
      .from('hint_reads')
      .select('id')
      .eq('hint_id', hintId)
      .eq('user_id', req.user.id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Hint already read' });
    }

    const { data: hint } = await supabase
      .from('hints')
      .select('coins_reward, title')
      .eq('id', hintId)
      .single();

    if (!hint) {
      return res.status(404).json({ error: 'Hint not found' });
    }

    // Record the read
    await supabase
      .from('hint_reads')
      .insert({ hint_id: hintId, user_id: req.user.id });

    // Award coins
    const { data: user } = await supabase
      .from('users')
      .select('coins')
      .eq('id', req.user.id)
      .single();

    await supabase
      .from('users')
      .update({ coins: user.coins + hint.coins_reward })
      .eq('id', req.user.id);

    res.json({
      message: `"${hint.title}" read! +${hint.coins_reward} coins 🪙`,
      coinsEarned: hint.coins_reward
    });
  } catch (err) {
    console.error('ReadHint error:', err);
    res.status(500).json({ error: 'Failed to mark hint as read' });
  }
});

module.exports = router;
