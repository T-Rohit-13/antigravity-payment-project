require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const seedData = async () => {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed Badges
    console.log('Seeding Badges...');
    const badges = [
      { name: 'First Save', description: 'Made your first deposit into the vault', icon: '💰', rarity: 'common', unlock_condition: 'first_deposit' },
      { name: '7-Day Streak', description: 'Saved for 7 consecutive days', icon: '🔥', rarity: 'common', unlock_condition: 'streak_7' },
      { name: 'Dragon Guardian', description: 'Maintained a 30-day saving streak', icon: '🐉', rarity: 'rare', unlock_condition: 'streak_30' },
      { name: 'Cashback Hacker', description: 'Redirected 5 cashback rewards to vault', icon: '💸', rarity: 'rare', unlock_condition: 'cashback_5' },
      { name: 'Finance Nerd', description: 'Read 10 financial hints', icon: '🧠', rarity: 'common', unlock_condition: 'hints_10' },
      { name: 'Moonshot', description: 'Saved ₹1,00,000 total', icon: '🚀', rarity: 'gold', unlock_condition: 'saved_100000' },
      { name: 'Squad Captain', description: 'Squad maintained 30-day streak', icon: '👑', rarity: 'gold', unlock_condition: 'squad_streak_30' },
      { name: 'Future You', description: 'Completed goal and made full withdrawal', icon: '🏆', rarity: 'gold', unlock_condition: 'goal_complete' },
      { name: 'Comeback Kid', description: 'First save after an emergency withdrawal', icon: '💪', rarity: 'rare', unlock_condition: 'post_emergency_save' }
    ];

    const { error: badgeError } = await supabase.from('badges').insert(badges);
    if (badgeError) throw badgeError;
    console.log('✅ Badges seeded successfully.');

    // 2. Seed Quests
    console.log('Seeding Quests...');
    const quests = [
      { title: 'Baby Steps', description: 'Save ₹500 this week', xp_reward: 50, coin_reward: 20, condition: 'weekly_save', condition_value: 500, week_number: 1 },
      { title: 'Consistency Check', description: 'Save 3 days in a row', xp_reward: 75, coin_reward: 30, condition: 'streak_days', condition_value: 3, week_number: 1 },
      { title: 'Round-Up Rookie', description: 'Make 2 round-up saves', xp_reward: 40, coin_reward: 15, condition: 'roundup_count', condition_value: 2, week_number: 1 },
      { title: 'Stepping Up', description: 'Save ₹1,000 this week', xp_reward: 100, coin_reward: 40, condition: 'weekly_save', condition_value: 1000, week_number: 2 },
      { title: 'Knowledge Seeker', description: 'Read 3 financial hints', xp_reward: 60, coin_reward: 25, condition: 'hints_read', condition_value: 3, week_number: 2 },
      { title: 'Streak Builder', description: 'Maintain a 5-day streak', xp_reward: 80, coin_reward: 35, condition: 'streak_days', condition_value: 5, week_number: 2 },
      { title: 'Big Saver', description: 'Save ₹2,000 this week', xp_reward: 150, coin_reward: 60, condition: 'weekly_save', condition_value: 2000, week_number: 3 },
      { title: 'Cashback Champion', description: 'Redirect 2 cashback rewards', xp_reward: 70, coin_reward: 30, condition: 'cashback_count', condition_value: 2, week_number: 3 },
      { title: 'Week Warrior', description: 'Save every day this week', xp_reward: 200, coin_reward: 80, condition: 'streak_days', condition_value: 7, week_number: 3 }
    ];

    const { error: questError } = await supabase.from('quests').insert(quests);
    if (questError) throw questError;
    console.log('✅ Quests seeded successfully.');

    // 3. Seed Hints
    console.log('Seeding Hints...');
    const hints = [
      { title: 'Why Start Saving at 22 vs 32?', preview: 'Starting just 10 years earlier can double your retirement corpus...', content: 'The power of compound interest means that starting to save at 22 instead of 32 can result in nearly double the retirement corpus. For example, saving ₹5,000/month from age 22 at 12% annual returns gives you ₹5.9 Cr by age 60. Starting at 32 with the same amount gives only ₹1.6 Cr. That\'s the magic of compounding — your money earns money on the money it already earned!', coins_reward: 10, category: 'basics' },
      { title: 'What is a Liquid Mutual Fund?', preview: 'A safe place for your money that earns more than a savings account...', content: 'Liquid mutual funds invest in very short-term debt instruments like treasury bills, commercial paper, and certificates of deposit. They typically offer 4-7% annual returns, significantly better than the 2.5-3.5% you get in a savings account. The best part? You can withdraw your money within 24 hours on any business day. They\'re perfect for parking your emergency fund or short-term savings goals.', coins_reward: 10, category: 'investments' },
      { title: 'The 50-30-20 Rule', preview: 'A simple budgeting framework that actually works for your income...', content: 'The 50-30-20 rule is the simplest budgeting framework: 50% of your income goes to needs (rent, groceries, bills), 30% to wants (entertainment, dining out, shopping), and 20% to savings and investments. For someone earning ₹30,000/month, that\'s ₹15,000 for needs, ₹9,000 for wants, and ₹6,000 for savings. Start here and adjust as you grow!', coins_reward: 10, category: 'basics' },
      { title: 'UPI Round-Ups: Save Without Thinking', preview: 'Every small round-up adds up to big savings over time...', content: 'Round-up saving means rounding up each UPI transaction to the nearest ₹10 or ₹100 and saving the difference. Pay ₹247 for groceries? Round up to ₹250 and save ₹3 automatically. It seems tiny, but if you make 5 transactions a day with an average round-up of ₹5, that\'s ₹750/month or ₹9,000/year — without even noticing! RetireQuest automates this for you.', coins_reward: 10, category: 'tips' },
      { title: 'Emergency Fund: Your Financial Airbag', preview: 'Why 3-6 months of expenses is your most important goal...', content: 'Before investing aggressively, build an emergency fund covering 3-6 months of expenses. This protects you from life\'s curveballs — job loss, medical emergencies, or unexpected repairs. Keep it in a liquid mutual fund for easy access and decent returns. For someone spending ₹25,000/month, aim for ₹75,000-₹1,50,000 as your emergency cushion.', coins_reward: 10, category: 'basics' },
      { title: 'SIP vs Lumpsum: Which is Better?', preview: 'Systematic investing beats timing the market every time...', content: 'A Systematic Investment Plan (SIP) invests a fixed amount regularly, regardless of market conditions. This gives you rupee cost averaging — you buy more units when prices are low and fewer when high. Studies show SIPs outperform lumpsum investing 60% of the time in volatile markets. Plus, it builds discipline. Start with as little as ₹500/month!', coins_reward: 10, category: 'investments' },
      { title: 'The Latte Factor', preview: 'How small daily expenses compound into huge amounts...', content: 'Spending ₹200 daily on coffee and snacks seems harmless, but that\'s ₹6,000/month or ₹72,000/year. Invested at 12% for 30 years, that becomes ₹2.1 Crore! This doesn\'t mean never buy coffee — just be mindful. Even redirecting half of these small expenses to savings can transform your financial future. Track your "latte factor" for a week and you\'ll be surprised.', coins_reward: 10, category: 'tips' },
      { title: 'What is EPFO and Why It Matters', preview: 'Your employer is already saving for your retirement...', content: 'The Employee Provident Fund Organisation (EPFO) manages the EPF scheme where 12% of your basic salary is deducted and matched by your employer. It earns ~8.15% interest (tax-free up to ₹2.5L/year). By age 60, an EPF corpus can be substantial. But here\'s the catch — many Gen Z workers are in the gig economy and don\'t have EPF. That\'s where self-directed savings through apps like RetireQuest become crucial.', coins_reward: 10, category: 'retirement' },
      { title: 'Tax Benefits of Saving Early', preview: 'Section 80C can save you up to ₹46,800 in taxes...', content: 'Under Section 80C of the Income Tax Act, you can claim deductions up to ₹1,50,000 per year on investments in ELSS mutual funds, PPF, EPF, and more. If you\'re in the 30% tax bracket, that\'s a tax saving of ₹46,800! ELSS funds have a 3-year lock-in and historically deliver 12-15% returns. Start early and let tax savings fund part of your retirement.', coins_reward: 10, category: 'retirement' },
      { title: 'Power of Increasing SIP by 10% Yearly', preview: 'Step-up SIPs can 3x your corpus compared to flat SIPs...', content: 'A step-up SIP increases your investment amount by a fixed percentage each year. Starting with ₹5,000/month and increasing by just 10% annually, you\'d invest ₹10.3L over 10 years at 12% returns, creating a corpus of ₹18.5L. A flat ₹5,000 SIP would give only ₹11.6L. Over 30 years, the difference is staggering — step-up SIPs can give you 2-3x the corpus!', coins_reward: 10, category: 'investments' }
    ];

    const { error: hintError } = await supabase.from('hints').insert(hints);
    if (hintError) throw hintError;
    console.log('✅ Hints seeded successfully.');

    console.log('🎉 Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
};

seedData();
