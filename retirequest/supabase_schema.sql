-- ============================================
-- RetireQuest — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  age INTEGER,
  goal_type TEXT CHECK (goal_type IN ('age', 'amount')),
  retirement_age INTEGER,
  target_amount NUMERIC DEFAULT 0,
  current_saved NUMERIC DEFAULT 0,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  coins INTEGER DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  last_save_date TIMESTAMPTZ,
  streak_shields INTEGER DEFAULT 0,
  emergency_withdrawals_used INTEGER DEFAULT 0 CHECK (emergency_withdrawals_used <= 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VAULTS TABLE
-- ============================================
CREATE TABLE vaults (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'unlock_ready', 'emergency_mode', 'goal_complete')),
  instrument_type TEXT DEFAULT 'liquid_mf' CHECK (instrument_type IN ('liquid_mf', 'rd')),
  balance NUMERIC DEFAULT 0,
  goal_type TEXT,
  goal_value NUMERIC,
  goal_reached_at TIMESTAMPTZ,
  partial_withdrawal_used BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('deposit', 'withdrawal', 'roundup', 'cashback')),
  amount NUMERIC NOT NULL,
  method TEXT CHECK (method IN ('upi', 'netbanking', 'cashback_redirect')),
  note TEXT,
  xp_earned INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BADGES TABLE
-- ============================================
CREATE TABLE badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'gold')),
  unlock_condition TEXT
);

-- ============================================
-- USER BADGES (junction table)
-- ============================================
CREATE TABLE user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ============================================
-- QUESTS TABLE
-- ============================================
CREATE TABLE quests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER DEFAULT 0,
  coin_reward INTEGER DEFAULT 0,
  condition TEXT,
  condition_value NUMERIC,
  week_number INTEGER
);

-- ============================================
-- QUEST COMPLETIONS (junction table)
-- ============================================
CREATE TABLE quest_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quest_id, user_id)
);

-- ============================================
-- EMERGENCY CLAIMS TABLE
-- ============================================
CREATE TABLE emergency_claims (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT CHECK (reason IN ('job_loss', 'medical', 'legal', 'other')),
  document_path TEXT,
  document_type TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'ai_screening', 'human_review', 'approved', 'rejected')),
  amount NUMERIC,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT
);

-- ============================================
-- HINTS TABLE
-- ============================================
CREATE TABLE hints (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  preview TEXT,
  content TEXT,
  coins_reward INTEGER DEFAULT 10,
  category TEXT
);

-- ============================================
-- HINT READS (junction table)
-- ============================================
CREATE TABLE hint_reads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hint_id UUID REFERENCES hints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hint_id, user_id)
);

-- ============================================
-- SEED DATA: BADGES
-- ============================================
INSERT INTO badges (name, description, icon, rarity, unlock_condition) VALUES
  ('First Save', 'Made your first deposit into the vault', '💰', 'common', 'first_deposit'),
  ('7-Day Streak', 'Saved for 7 consecutive days', '🔥', 'common', 'streak_7'),
  ('Dragon Guardian', 'Maintained a 30-day saving streak', '🐉', 'rare', 'streak_30'),
  ('Cashback Hacker', 'Redirected 5 cashback rewards to vault', '💸', 'rare', 'cashback_5'),
  ('Finance Nerd', 'Read 10 financial hints', '🧠', 'common', 'hints_10'),
  ('Moonshot', 'Saved ₹1,00,000 total', '🚀', 'gold', 'saved_100000'),
  ('Squad Captain', 'Squad maintained 30-day streak', '👑', 'gold', 'squad_streak_30'),
  ('Future You', 'Completed goal and made full withdrawal', '🏆', 'gold', 'goal_complete'),
  ('Comeback Kid', 'First save after an emergency withdrawal', '💪', 'rare', 'post_emergency_save');

-- ============================================
-- SEED DATA: QUESTS
-- ============================================
INSERT INTO quests (title, description, xp_reward, coin_reward, condition, condition_value, week_number) VALUES
  ('Baby Steps', 'Save ₹500 this week', 50, 20, 'weekly_save', 500, 1),
  ('Consistency Check', 'Save 3 days in a row', 75, 30, 'streak_days', 3, 1),
  ('Round-Up Rookie', 'Make 2 round-up saves', 40, 15, 'roundup_count', 2, 1),
  ('Stepping Up', 'Save ₹1,000 this week', 100, 40, 'weekly_save', 1000, 2),
  ('Knowledge Seeker', 'Read 3 financial hints', 60, 25, 'hints_read', 3, 2),
  ('Streak Builder', 'Maintain a 5-day streak', 80, 35, 'streak_days', 5, 2),
  ('Big Saver', 'Save ₹2,000 this week', 150, 60, 'weekly_save', 2000, 3),
  ('Cashback Champion', 'Redirect 2 cashback rewards', 70, 30, 'cashback_count', 2, 3),
  ('Week Warrior', 'Save every day this week', 200, 80, 'streak_days', 7, 3);

-- ============================================
-- SEED DATA: HINTS
-- ============================================
INSERT INTO hints (title, preview, content, coins_reward, category) VALUES
  ('Why Start Saving at 22 vs 32?', 'Starting just 10 years earlier can double your retirement corpus...', 'The power of compound interest means that starting to save at 22 instead of 32 can result in nearly double the retirement corpus. For example, saving ₹5,000/month from age 22 at 12% annual returns gives you ₹5.9 Cr by age 60. Starting at 32 with the same amount gives only ₹1.6 Cr. That''s the magic of compounding — your money earns money on the money it already earned!', 10, 'basics'),
  ('What is a Liquid Mutual Fund?', 'A safe place for your money that earns more than a savings account...', 'Liquid mutual funds invest in very short-term debt instruments like treasury bills, commercial paper, and certificates of deposit. They typically offer 4-7% annual returns, significantly better than the 2.5-3.5% you get in a savings account. The best part? You can withdraw your money within 24 hours on any business day. They''re perfect for parking your emergency fund or short-term savings goals.', 10, 'investments'),
  ('The 50-30-20 Rule', 'A simple budgeting framework that actually works for your income...', 'The 50-30-20 rule is the simplest budgeting framework: 50% of your income goes to needs (rent, groceries, bills), 30% to wants (entertainment, dining out, shopping), and 20% to savings and investments. For someone earning ₹30,000/month, that''s ₹15,000 for needs, ₹9,000 for wants, and ₹6,000 for savings. Start here and adjust as you grow!', 10, 'basics'),
  ('UPI Round-Ups: Save Without Thinking', 'Every small round-up adds up to big savings over time...', 'Round-up saving means rounding up each UPI transaction to the nearest ₹10 or ₹100 and saving the difference. Pay ₹247 for groceries? Round up to ₹250 and save ₹3 automatically. It seems tiny, but if you make 5 transactions a day with an average round-up of ₹5, that''s ₹750/month or ₹9,000/year — without even noticing! RetireQuest automates this for you.', 10, 'tips'),
  ('Emergency Fund: Your Financial Airbag', 'Why 3-6 months of expenses is your most important goal...', 'Before investing aggressively, build an emergency fund covering 3-6 months of expenses. This protects you from life''s curveballs — job loss, medical emergencies, or unexpected repairs. Keep it in a liquid mutual fund for easy access and decent returns. For someone spending ₹25,000/month, aim for ₹75,000-₹1,50,000 as your emergency cushion.', 10, 'basics'),
  ('SIP vs Lumpsum: Which is Better?', 'Systematic investing beats timing the market every time...', 'A Systematic Investment Plan (SIP) invests a fixed amount regularly, regardless of market conditions. This gives you rupee cost averaging — you buy more units when prices are low and fewer when high. Studies show SIPs outperform lumpsum investing 60% of the time in volatile markets. Plus, it builds discipline. Start with as little as ₹500/month!', 10, 'investments'),
  ('The Latte Factor', 'How small daily expenses compound into huge amounts...', 'Spending ₹200 daily on coffee and snacks seems harmless, but that''s ₹6,000/month or ₹72,000/year. Invested at 12% for 30 years, that becomes ₹2.1 Crore! This doesn''t mean never buy coffee — just be mindful. Even redirecting half of these small expenses to savings can transform your financial future. Track your "latte factor" for a week and you''ll be surprised.', 10, 'tips'),
  ('What is EPFO and Why It Matters', 'Your employer is already saving for your retirement...', 'The Employee Provident Fund Organisation (EPFO) manages the EPF scheme where 12% of your basic salary is deducted and matched by your employer. It earns ~8.15% interest (tax-free up to ₹2.5L/year). By age 60, an EPF corpus can be substantial. But here''s the catch — many Gen Z workers are in the gig economy and don''t have EPF. That''s where self-directed savings through apps like RetireQuest become crucial.', 10, 'retirement'),
  ('Tax Benefits of Saving Early', 'Section 80C can save you up to ₹46,800 in taxes...', 'Under Section 80C of the Income Tax Act, you can claim deductions up to ₹1,50,000 per year on investments in ELSS mutual funds, PPF, EPF, and more. If you''re in the 30% tax bracket, that''s a tax saving of ₹46,800! ELSS funds have a 3-year lock-in and historically deliver 12-15% returns. Start early and let tax savings fund part of your retirement.', 10, 'retirement'),
  ('Power of Increasing SIP by 10% Yearly', 'Step-up SIPs can 3x your corpus compared to flat SIPs...', 'A step-up SIP increases your investment amount by a fixed percentage each year. Starting with ₹5,000/month and increasing by just 10% annually, you''d invest ₹10.3L over 10 years at 12% returns, creating a corpus of ₹18.5L. A flat ₹5,000 SIP would give only ₹11.6L. Over 30 years, the difference is staggering — step-up SIPs can give you 2-3x the corpus!', 10, 'investments');
