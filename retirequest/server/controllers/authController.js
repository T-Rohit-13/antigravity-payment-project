const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, age, goalType, retirementAge, targetAmount } = req.body;

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        age: age || null,
        goal_type: goalType || null,
        retirement_age: retirementAge || null,
        target_amount: targetAmount || 0
      })
      .select()
      .single();

    if (error) throw error;

    // Create vault for user
    const goalValue = goalType === 'amount' ? targetAmount : null;
    const { error: vaultError } = await supabase
      .from('vaults')
      .insert({
        user_id: user.id,
        goal_type: goalType,
        goal_value: goalValue,
        instrument_type: 'liquid_mf'
      });

    if (vaultError) throw vaultError;

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        level: user.level,
        xp: user.xp,
        coins: user.coins,
        streakCount: user.streak_count,
        currentSaved: user.current_saved
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        level: user.level,
        xp: user.xp,
        coins: user.coins,
        streakCount: user.streak_count,
        currentSaved: user.current_saved,
        goalType: user.goal_type,
        retirementAge: user.retirement_age,
        targetAmount: user.target_amount
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get earned badges
    const { data: earnedBadges } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at, badges(*)')
      .eq('user_id', user.id);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      goalType: user.goal_type,
      retirementAge: user.retirement_age,
      targetAmount: user.target_amount,
      currentSaved: user.current_saved,
      xp: user.xp,
      level: user.level,
      coins: user.coins,
      streakCount: user.streak_count,
      lastSaveDate: user.last_save_date,
      streakShields: user.streak_shields,
      emergencyWithdrawalsUsed: user.emergency_withdrawals_used,
      badges: earnedBadges || [],
      createdAt: user.created_at
    });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
