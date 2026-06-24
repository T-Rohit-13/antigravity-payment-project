const supabase = require('../config/supabase');

// POST /api/emergency/submit
exports.submitClaim = async (req, res) => {
  try {
    const { reason, documentType, amount } = req.body;

    // Check if user has emergency withdrawals left
    const { data: user } = await supabase
      .from('users')
      .select('emergency_withdrawals_used')
      .eq('id', req.user.id)
      .single();

    if (user.emergency_withdrawals_used >= 2) {
      return res.status(400).json({ error: 'Maximum emergency withdrawals (2) already used' });
    }

    // Check for existing pending claim
    const { data: existingClaim } = await supabase
      .from('emergency_claims')
      .select('id')
      .eq('user_id', req.user.id)
      .in('status', ['submitted', 'ai_screening', 'human_review'])
      .single();

    if (existingClaim) {
      return res.status(400).json({ error: 'You already have a pending emergency claim' });
    }

    const documentPath = req.file ? req.file.filename : null;

    const { data: claim, error } = await supabase
      .from('emergency_claims')
      .insert({
        user_id: req.user.id,
        reason,
        document_path: documentPath,
        document_type: documentType,
        amount: parseFloat(amount),
        status: 'submitted'
      })
      .select()
      .single();

    if (error) throw error;

    // Update vault to emergency mode
    await supabase
      .from('vaults')
      .update({ status: 'emergency_mode' })
      .eq('user_id', req.user.id);

    // Simulate AI screening (auto-advance after creation)
    setTimeout(async () => {
      try {
        await supabase
          .from('emergency_claims')
          .update({ status: 'ai_screening' })
          .eq('id', claim.id);
      } catch (e) {
        console.error('AI screening update failed:', e);
      }
    }, 5000);

    res.status(201).json({
      message: 'Emergency claim submitted. Review process started.',
      claim: {
        id: claim.id,
        reason: claim.reason,
        amount: parseFloat(claim.amount),
        status: claim.status,
        submittedAt: claim.submitted_at
      }
    });
  } catch (err) {
    console.error('SubmitClaim error:', err);
    res.status(500).json({ error: 'Failed to submit emergency claim' });
  }
};

// GET /api/emergency/status
exports.getClaimStatus = async (req, res) => {
  try {
    const { data: claims } = await supabase
      .from('emergency_claims')
      .select('*')
      .eq('user_id', req.user.id)
      .order('submitted_at', { ascending: false })
      .limit(1);

    if (!claims || claims.length === 0) {
      return res.json({ hasClaim: false });
    }

    const claim = claims[0];
    res.json({
      hasClaim: true,
      claim: {
        id: claim.id,
        reason: claim.reason,
        documentType: claim.document_type,
        status: claim.status,
        amount: parseFloat(claim.amount),
        submittedAt: claim.submitted_at,
        reviewedAt: claim.reviewed_at,
        reviewNote: claim.review_note
      }
    });
  } catch (err) {
    console.error('GetClaimStatus error:', err);
    res.status(500).json({ error: 'Failed to fetch claim status' });
  }
};

// PUT /api/emergency/:id/review — admin review
exports.reviewClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const { data: claim } = await supabase
      .from('emergency_claims')
      .select('*')
      .eq('id', id)
      .single();

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    await supabase
      .from('emergency_claims')
      .update({
        status,
        review_note: reviewNote,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (status === 'approved') {
      // Process the withdrawal
      const { data: vault } = await supabase
        .from('vaults')
        .select('*')
        .eq('user_id', claim.user_id)
        .single();

      const withdrawAmount = Math.min(parseFloat(claim.amount), parseFloat(vault.balance));

      await supabase
        .from('vaults')
        .update({
          balance: parseFloat(vault.balance) - withdrawAmount,
          status: parseFloat(vault.balance) - withdrawAmount > 0 ? 'locked' : 'locked',
          last_updated: new Date().toISOString()
        })
        .eq('id', vault.id);

      await supabase
        .from('users')
        .update({
          emergency_withdrawals_used: claim.user_id
            ? (await supabase.from('users').select('emergency_withdrawals_used').eq('id', claim.user_id).single()).data.emergency_withdrawals_used + 1
            : 1
        })
        .eq('id', claim.user_id);

      await supabase
        .from('transactions')
        .insert({
          user_id: claim.user_id,
          type: 'withdrawal',
          amount: withdrawAmount,
          method: 'netbanking',
          note: `Emergency withdrawal: ${claim.reason}`,
          xp_earned: 0,
          coins_earned: 0
        });
    }

    res.json({
      message: `Claim ${status}`,
      status
    });
  } catch (err) {
    console.error('ReviewClaim error:', err);
    res.status(500).json({ error: 'Failed to review claim' });
  }
};
