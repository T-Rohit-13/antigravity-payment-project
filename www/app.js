// ========== RETIREQUEST APP ENGINE ==========

// ---- STATE ----
const STATE = {
    onboarded: false,
    goalType: 'age',
    currentAge: 22,
    retireAge: 50,
    targetAmount: 3000000,
    monthlySIP: 2500,
    totalSaved: 0,
    coins: 0,
    xp: 120,
    level: 1,
    streak: 0,
    longestStreak: 0,
    streakMultiplier: 1,
    streakShields: 0,
    roundUpLevel: 10,
    roundUpEnabled: false,
    emergencyUsed: 0,
    hintsRead: [],
    quizCompleted: false,
    quizScore: 0,
    badges: {},
    lastSaveDate: null,
    theme: 'dark'
};

const LEVELS = [
    { level: 1, xpNeeded: 0, title: 'Saver' },
    { level: 2, xpNeeded: 500, title: 'Explorer' },
    { level: 3, xpNeeded: 1200, title: 'Pathfinder' },
    { level: 4, xpNeeded: 2500, title: 'Trailblazer' },
    { level: 5, xpNeeded: 4500, title: 'Guardian' },
    { level: 6, xpNeeded: 7500, title: 'Champion' },
    { level: 7, xpNeeded: 12000, title: 'Legend' },
    { level: 8, xpNeeded: 18000, title: 'Dragon Rider' },
    { level: 9, xpNeeded: 26000, title: 'Titan' },
    { level: 10, xpNeeded: 40000, title: 'Immortal' }
];

const BADGES = [
    { id: 'first-save', name: 'First Save', icon: '💎', condition: 'Make your first save', earned: false },
    { id: '7-day-streak', name: '7-Day Streak', icon: '🔥', condition: '7 consecutive days', earned: false },
    { id: 'dragon-guardian', name: 'Dragon Guardian', icon: '🐉', condition: '30-day streak', earned: false },
    { id: 'cashback-hacker', name: 'Cashback Hacker', icon: '💳', condition: 'Redirect cashback', earned: false },
    { id: 'finance-nerd', name: 'Finance Nerd', icon: '🧠', condition: 'Read all hints', earned: false },
    { id: 'moonshot', name: 'Moonshot', icon: '🚀', condition: 'Save ₹1,00,000', earned: false },
    { id: 'squad-captain', name: 'Squad Captain', icon: '👥', condition: 'Invite 3 friends', earned: false },
    { id: 'future-you', name: 'Future You', icon: '🏆', condition: 'Complete your goal', earned: false },
    { id: 'comeback', name: 'Comeback', icon: '🦅', condition: 'Restart after emergency', earned: false }
];

const HINTS = [
    { id: 1, title: 'Why start saving at 22 vs 32?', body: 'Starting at 22 with ₹2,000/month at 8% gives you ₹48L by 50. Starting at 32 with the same amount gives only ₹18L. Those 10 extra years are worth ₹30L!', coins: 10 },
    { id: 2, title: 'The power of ₹50 a day', body: 'Just ₹50/day = ₹1,500/month. At 8% for 25 years, that\'s ₹14.2L. Your daily chai money can fund your freedom.', coins: 10 },
    { id: 3, title: 'What is a liquid mutual fund?', body: 'A liquid fund invests in short-term debt instruments (T-bills, CDs). It\'s low-risk, SEBI-regulated, and gives ~6-8% returns. Your money stays accessible yet grows.', coins: 10 },
    { id: 4, title: 'UPI round-ups: free money?', body: 'If you spend ₹147, we round up to ₹150 and save ₹3. Sounds tiny, but 10 transactions/day × ₹5 avg = ₹1,500/month saved automatically!', coins: 10 },
    { id: 5, title: 'Why no demat account?', body: 'Demat accounts are for stocks/trading. RetireQuest uses liquid funds & RDs — simpler, safer, and regulated by SEBI/RBI. No market risk, just steady growth.', coins: 10 },
    { id: 6, title: 'Emergency fund vs retirement', body: 'Rule of thumb: keep 3-6 months expenses as emergency fund BEFORE building retirement corpus. RetireQuest allows 2 emergency withdrawals for exactly this reason.', coins: 10 },
    { id: 7, title: 'The 50-30-20 rule', body: '50% needs, 30% wants, 20% savings. Even if you can only do 10%, starting is what matters. Consistency beats perfection.', coins: 10 },
    { id: 8, title: 'Inflation: the silent thief', body: 'At 6% inflation, ₹1L today = ₹55K in 10 years. Your savings must grow faster than inflation. That\'s why 8% returns matter — you\'re beating inflation by 2%.', coins: 10 }
];

const QUIZ_QUESTIONS = [
    { q: 'Starting to save at 22 instead of 32 could give you how much more by age 50?', options: ['₹5L more', '₹15L more', '₹30L more', '₹50L more'], correct: 2 },
    { q: 'What type of fund does RetireQuest use for your savings?', options: ['Equity Mutual Fund', 'Liquid Mutual Fund', 'Index Fund', 'Hedge Fund'], correct: 1 },
    { q: 'How many emergency withdrawals are allowed per lifetime?', options: ['1', '2', '3', 'Unlimited'], correct: 1 }
];

// ---- INIT ----
function init() {
    loadState();
    setupSliders();
    renderHints();
    renderBadges();
    updateCalculator();
    if (STATE.onboarded) {
        showMainApp();
    }
}

function loadState() {
    const saved = localStorage.getItem('retirequest_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(STATE, parsed);
            document.documentElement.setAttribute('data-theme', STATE.theme);
        } catch(e) { /* ignore */ }
    }
}

function saveState() {
    localStorage.setItem('retirequest_state', JSON.stringify(STATE));
}

// ---- THEME ----
function toggleTheme() {
    STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', STATE.theme);
    document.getElementById('theme-icon').textContent = STATE.theme === 'dark' ? '🌙' : '☀️';
    saveState();
}

// ---- NAVIGATION ----
function navigateTo(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`screen-${screen}`).classList.add('active');
    document.getElementById(`nav-${screen}`).classList.add('active');
    window.scrollTo(0, 0);
    if (screen === 'home') updateDashboard();
    if (screen === 'vault') updateVaultScreen();
    if (screen === 'profile') updateProfile();
}

function showMainApp() {
    document.getElementById('screen-onboarding').classList.remove('active');
    document.getElementById('screen-home').classList.add('active');
    document.getElementById('bottom-nav').style.display = 'flex';
    document.getElementById('nav-home').classList.add('active');
    updateDashboard();
}

// ---- ONBOARDING ----
function selectGoalType(type) {
    STATE.goalType = type;
    document.getElementById('goal-age-card').classList.toggle('active', type === 'age');
    document.getElementById('goal-amount-card').classList.toggle('active', type === 'amount');
    document.getElementById('goal-age-section').classList.toggle('hidden', type !== 'age');
    document.getElementById('goal-amount-section').classList.toggle('hidden', type !== 'amount');
    updateCalculator();
}

function setupSliders() {
    const ageSlider = document.getElementById('age-slider');
    const retireSlider = document.getElementById('retire-age-slider');
    const amountSlider = document.getElementById('target-amount-slider');

    ageSlider.addEventListener('input', () => {
        STATE.currentAge = parseInt(ageSlider.value);
        document.getElementById('age-value').textContent = ageSlider.value + ' years';
        updateCalculator();
    });
    retireSlider.addEventListener('input', () => {
        STATE.retireAge = parseInt(retireSlider.value);
        document.getElementById('retire-age-value').textContent = retireSlider.value + ' years';
        updateCalculator();
    });
    amountSlider.addEventListener('input', () => {
        STATE.targetAmount = parseInt(amountSlider.value);
        document.getElementById('target-amount-value').textContent = formatINR(amountSlider.value);
        updateCalculator();
    });
}

function updateCalculator() {
    const r = 0.08 / 12; // monthly rate
    let years, n, sip, corpus;

    if (STATE.goalType === 'age') {
        years = Math.max(1, STATE.retireAge - STATE.currentAge);
        n = years * 12;
        sip = STATE.monthlySIP || 2500;
        corpus = sip * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    } else {
        corpus = STATE.targetAmount;
        years = Math.max(1, STATE.retireAge - STATE.currentAge);
        n = years * 12;
        sip = corpus / ((((Math.pow(1 + r, n) - 1) / r) * (1 + r)));
    }

    STATE.monthlySIP = Math.round(sip);
    document.getElementById('calc-sip').textContent = formatINR(Math.round(sip));
    document.getElementById('calc-years').textContent = years + ' yrs';
    document.getElementById('calc-corpus').textContent = formatCorpus(corpus);
    document.getElementById('journey-end-label').textContent = formatCorpus(corpus) + ' Goal';

    const pct = Math.max(2, Math.min(98, (STATE.totalSaved / corpus) * 100));
    document.getElementById('journey-fill').style.width = pct + '%';
    document.getElementById('journey-marker').style.left = pct + '%';
}

function lockGoal() {
    STATE.onboarded = true;
    saveState();
    // Animate button
    const btn = document.getElementById('lock-goal-btn');
    btn.innerHTML = '<span class="btn-icon">✅</span> Goal Locked!';
    btn.style.background = 'linear-gradient(135deg, #4caf50, #388e3c)';
    setTimeout(() => showMainApp(), 800);
    showToast('🎯', 'Goal locked! Your journey begins now');
}

// ---- DASHBOARD ----
function updateDashboard() {
    const lvl = getCurrentLevel();
    const nextLvl = LEVELS[Math.min(lvl.level, LEVELS.length - 1)];
    const prevXP = LEVELS[lvl.level - 1]?.xpNeeded || 0;
    const nextXP = nextLvl.xpNeeded || STATE.xp;
    const xpInLevel = STATE.xp - prevXP;
    const xpForLevel = nextXP - prevXP || 1;
    const pct = Math.min(100, (xpInLevel / xpForLevel) * 100);

    document.getElementById('player-level').textContent = `Level ${lvl.level} ${lvl.title}`;
    document.getElementById('xp-numbers').textContent = `${STATE.xp} / ${nextXP}`;
    document.getElementById('xp-fill').style.width = pct + '%';
    document.getElementById('xp-next').textContent = `${Math.max(0, nextXP - STATE.xp)} XP to Level ${lvl.level + 1}`;

    // Streak
    updateStreakDisplay();

    // Stats
    document.getElementById('stat-saved').textContent = formatINR(STATE.totalSaved);
    document.getElementById('stat-coins').textContent = STATE.coins;
    document.getElementById('stat-corpus').textContent = formatCorpus(calculateProjectedCorpus());

    // Vault progress
    const target = STATE.goalType === 'amount' ? STATE.targetAmount : calculateProjectedCorpus();
    const vaultPct = Math.min(100, (STATE.totalSaved / Math.max(1, target)) * 100);
    document.getElementById('vault-fill').style.width = vaultPct + '%';
    document.getElementById('vault-current-label').textContent = `${formatINR(STATE.totalSaved)} / ${formatCorpus(target)}`;
}

function updateStreakDisplay() {
    const mult = STATE.streak >= 30 ? 2 : STATE.streak >= 7 ? 1.5 : 1;
    STATE.streakMultiplier = mult;
    document.getElementById('streak-count').textContent = `${STATE.streak}-day streak`;
    document.getElementById('streak-sub').textContent = STATE.streak > 0 ? 'Keep it going!' : 'Save today to start your streak!';
    document.querySelector('.multiplier').textContent = `×${mult}`;
}

// ---- SAVING ----
function showSaveModal() {
    document.getElementById('save-modal').classList.add('active');
}
function closeSaveModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('save-modal').classList.remove('active');
}

function setSaveAmount(amount, el) {
    document.getElementById('save-amount-input').value = amount;
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
}

function setPayMethod(method, el) {
    document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
}

function processSave() {
    const amount = parseInt(document.getElementById('save-amount-input').value) || 0;
    if (amount <= 0) { showToast('⚠️', 'Enter a valid amount'); return; }

    STATE.totalSaved += amount;
    const today = new Date().toDateString();
    if (STATE.lastSaveDate !== today) {
        STATE.streak++;
        if (STATE.streak > STATE.longestStreak) STATE.longestStreak = STATE.streak;
        STATE.lastSaveDate = today;
    }

    // XP & Coins
    const xpGain = Math.round(5 * STATE.streakMultiplier);
    STATE.xp += xpGain;
    STATE.coins += 5;

    // Badge checks
    if (!STATE.badges['first-save']) { STATE.badges['first-save'] = true; showToast('🏅', 'Badge earned: First Save!'); }
    if (STATE.streak >= 7 && !STATE.badges['7-day-streak']) { STATE.badges['7-day-streak'] = true; showToast('🏅', 'Badge earned: 7-Day Streak!'); }
    if (STATE.streak >= 30 && !STATE.badges['dragon-guardian']) { STATE.badges['dragon-guardian'] = true; showToast('🏅', 'Badge earned: Dragon Guardian!'); }
    if (STATE.totalSaved >= 100000 && !STATE.badges['moonshot']) { STATE.badges['moonshot'] = true; showToast('🏅', 'Badge earned: Moonshot!'); }

    checkLevelUp();
    saveState();
    closeSaveModal();

    // Show success
    showSuccessAnimation(amount, xpGain, 5);
    setTimeout(() => { updateDashboard(); updateVaultScreen(); }, 500);
}

function showSuccessAnimation(amount, xp, coins) {
    const overlay = document.getElementById('success-overlay');
    document.getElementById('success-desc').textContent = `₹${amount.toLocaleString('en-IN')} added to your vault`;
    document.getElementById('success-rewards').innerHTML =
        `<span class="reward-tag reward-xp">+${xp} XP</span><span class="reward-tag reward-coins">+${coins} 🪙</span>`;
    overlay.classList.add('active');
    setTimeout(() => overlay.classList.remove('active'), 2000);
}

function checkLevelUp() {
    const newLvl = getCurrentLevel();
    if (newLvl.level > STATE.level) {
        STATE.level = newLvl.level;
        showToast('🎉', `Level Up! You're now Level ${newLvl.level} ${newLvl.title}`);
    }
}

function getCurrentLevel() {
    let current = LEVELS[0];
    for (const lvl of LEVELS) {
        if (STATE.xp >= lvl.xpNeeded) current = lvl;
        else break;
    }
    return current;
}

// ---- VAULT SCREEN ----
function updateVaultScreen() {
    document.getElementById('vault-balance-value').textContent = formatINR(STATE.totalSaved);
    document.getElementById('emergency-used').textContent = `Used: ${STATE.emergencyUsed} / 2`;

    const target = STATE.goalType === 'amount' ? STATE.targetAmount : calculateProjectedCorpus();
    if (STATE.totalSaved >= target && target > 0) {
        document.getElementById('vault-status-icon').textContent = '✅';
        document.getElementById('vault-status-text').textContent = 'Unlock Ready — You\'ve reached your goal!';
        document.getElementById('vault-status-banner').style.borderColor = 'var(--green)';
    } else {
        document.getElementById('vault-status-icon').textContent = '🔒';
        document.getElementById('vault-status-text').textContent = 'Vault Locked — Keep saving to reach your goal!';
    }
}

function switchWithdrawTab(tab, el) {
    document.querySelectorAll('.wtab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.wtab-content').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById(`wtab-${tab}`).classList.add('active');
}

function showVaultRules() {
    document.getElementById('rules-modal').classList.add('active');
}
function closeRulesModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('rules-modal').classList.remove('active');
}

function handleFileUpload(input) {
    if (input.files.length > 0) {
        document.getElementById('uploaded-file-name').textContent = '📄 ' + input.files[0].name;
    }
}

function submitEmergencyClaim() {
    const docType = document.getElementById('emergency-doc-type').value;
    const file = document.getElementById('emergency-file').files[0];
    if (!docType) { showToast('⚠️', 'Select a document type'); return; }
    if (!file) { showToast('⚠️', 'Upload a document'); return; }
    if (STATE.emergencyUsed >= 2) { showToast('❌', 'Emergency withdrawal limit reached (2/2)'); return; }

    STATE.emergencyUsed++;
    document.getElementById('emergency-tracker').style.display = 'flex';

    // Simulate AI screening
    simulateTrackerProgress();
    showToast('📋', 'Emergency claim submitted');
    saveState();
}

function simulateTrackerProgress() {
    const steps = ['track-submitted', 'track-screening', 'track-approved', 'track-transfer', 'track-done'];
    let i = 0;
    const interval = setInterval(() => {
        if (i < steps.length) {
            document.getElementById(steps[i]).classList.add('active');
            i++;
        } else {
            clearInterval(interval);
            showToast('✅', 'Emergency withdrawal approved & transferred');
        }
    }, 1500);
}

function confirmEarlyWithdrawal() {
    const partial = document.getElementById('partial-toggle').checked;
    if (partial) {
        const halfAmount = Math.floor(STATE.totalSaved / 2);
        STATE.totalSaved -= halfAmount;
        showToast('💰', `₹${halfAmount.toLocaleString('en-IN')} withdrawn. Streak continues!`);
    } else {
        STATE.streak = 0;
        STATE.xp = Math.floor(STATE.xp * 0.5);
        STATE.coins = Math.max(0, STATE.coins - 200);
        STATE.totalSaved = 0;
        showToast('⚠️', 'Early withdrawal processed. Streak & XP reset.');
    }
    saveState();
    updateDashboard();
    updateVaultScreen();
}

function togglePartial() { /* UI toggle only */ }

// ---- ROUND-UP ----
function toggleRoundUp() {
    STATE.roundUpEnabled = document.getElementById('roundup-toggle').checked;
    saveState();
}

function setRoundUp(level, el) {
    STATE.roundUpLevel = level;
    document.querySelectorAll('.roundup-opt').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    saveState();
}

// ---- HINTS ----
function renderHints() {
    const feed = document.getElementById('hints-feed');
    feed.innerHTML = HINTS.map(h => {
        const read = STATE.hintsRead.includes(h.id);
        return `<div class="hint-card glass-card ${read ? 'read' : ''}" id="hint-${h.id}">
            <span class="hint-title">${h.title}</span>
            <p class="hint-body">${h.body}</p>
            ${read ? '<span style="font-size:0.75rem;color:var(--green);font-weight:700;">✅ Read — ${h.coins} coins earned</span>' :
            `<button class="hint-earn" onclick="readHint(${h.id}, ${h.coins})">Read & earn ${h.coins} coins 🪙</button>`}
        </div>`;
    }).join('');
}

function readHint(id, coins) {
    if (STATE.hintsRead.includes(id)) return;
    STATE.hintsRead.push(id);
    STATE.coins += coins;
    STATE.xp += 10;
    checkLevelUp();
    saveState();
    renderHints();
    showToast('🪙', `+${coins} coins earned!`);

    if (STATE.hintsRead.length >= HINTS.length && !STATE.badges['finance-nerd']) {
        STATE.badges['finance-nerd'] = true;
        showToast('🏅', 'Badge earned: Finance Nerd!');
        saveState();
    }
}

// ---- QUIZ ----
function startQuiz() {
    document.getElementById('quiz-modal').classList.add('active');
    renderQuiz();
}
function closeQuizModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('quiz-modal').classList.remove('active');
}

function renderQuiz() {
    if (STATE.quizCompleted) {
        document.getElementById('quiz-body').innerHTML = `
            <div class="quiz-result">
                <span class="quiz-score">${STATE.quizScore}/3</span>
                <p class="quiz-result-text">Quiz already completed this week!</p>
            </div>`;
        return;
    }
    let html = '';
    QUIZ_QUESTIONS.forEach((q, i) => {
        html += `<div class="quiz-question" id="quiz-q-${i}">
            <span class="quiz-q-text">Q${i+1}. ${q.q}</span>
            <div class="quiz-options">
                ${q.options.map((opt, j) => `<button class="quiz-option" onclick="answerQuiz(${i}, ${j})">${opt}</button>`).join('')}
            </div>
        </div>`;
    });
    html += `<div id="quiz-result-area"></div>`;
    document.getElementById('quiz-body').innerHTML = html;
}

let quizAnswers = {};
function answerQuiz(qIdx, aIdx) {
    if (quizAnswers[qIdx] !== undefined) return;
    quizAnswers[qIdx] = aIdx;
    const correct = QUIZ_QUESTIONS[qIdx].correct;
    const buttons = document.querySelectorAll(`#quiz-q-${qIdx} .quiz-option`);
    buttons[aIdx].classList.add(aIdx === correct ? 'correct' : 'wrong');
    if (aIdx !== correct) buttons[correct].classList.add('correct');

    if (Object.keys(quizAnswers).length === QUIZ_QUESTIONS.length) {
        const score = Object.entries(quizAnswers).filter(([q, a]) => a === QUIZ_QUESTIONS[q].correct).length;
        STATE.quizScore = score;
        STATE.quizCompleted = true;
        if (score === 3) {
            STATE.coins += 50;
            STATE.xp += 50;
        }
        checkLevelUp();
        saveState();
        setTimeout(() => {
            document.getElementById('quiz-result-area').innerHTML = `
                <div class="quiz-result">
                    <span class="quiz-score">${score}/3</span>
                    <p class="quiz-result-text">${score === 3 ? '🎉 Perfect! +50 coins earned!' : `You got ${score}/3. Keep learning!`}</p>
                </div>`;
        }, 500);
    }
}

// ---- PROFILE ----
function updateProfile() {
    const lvl = getCurrentLevel();
    document.getElementById('profile-name').textContent = STATE.playerName || 'Adventurer';
    document.getElementById('profile-level-badge').textContent = `Lvl ${lvl.level}`;
    document.getElementById('profile-xp').textContent = `${STATE.xp} XP total`;
    document.getElementById('p-stat-saved').textContent = formatINR(STATE.totalSaved);
    document.getElementById('p-stat-streak').textContent = STATE.longestStreak + ' days';
    document.getElementById('p-stat-emergency').textContent = `${STATE.emergencyUsed} / 2`;
    renderBadges();
}

function renderBadges() {
    const grid = document.getElementById('badge-grid');
    grid.innerHTML = BADGES.map(b => {
        const earned = STATE.badges[b.id];
        return `<div class="badge-item ${earned ? 'earned' : 'locked'}">
            <span class="badge-icon">${b.icon}</span>
            <span class="badge-name">${b.name}</span>
            ${!earned ? `<span class="badge-condition">${b.condition}</span>` : ''}
        </div>`;
    }).join('');
}

// ---- COIN SHOP ----
function purchaseItem(itemId) {
    const prices = { 'streak-shield': 100, 'dragon-skin': 300, 'space-frame': 250, 'ninja-outfit': 200 };
    const price = prices[itemId];
    if (STATE.coins < price) { showToast('🪙', `Not enough coins! Need ${price}`); return; }
    STATE.coins -= price;
    if (itemId === 'streak-shield') STATE.streakShields++;
    showToast('✨', `Purchased! ${itemId === 'streak-shield' ? 'Streak Shield activated' : 'Cosmetic unlocked'}`);
    saveState();
    updateDashboard();
}

function inviteSquad() {
    STATE.coins += 200;
    showToast('👥', '+200 coins for referral!');
    saveState();
    updateProfile();
}

// ---- HELPERS ----
function formatINR(num) {
    return '₹' + Number(num).toLocaleString('en-IN');
}

function formatCorpus(num) {
    if (num >= 10000000) return '₹' + (num / 10000000).toFixed(1) + 'Cr';
    if (num >= 100000) return '₹' + (num / 100000).toFixed(1) + 'L';
    return formatINR(Math.round(num));
}

function calculateProjectedCorpus() {
    const r = 0.08 / 12;
    const years = Math.max(1, STATE.retireAge - STATE.currentAge);
    const n = years * 12;
    const sip = STATE.monthlySIP || 2500;
    return sip * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}

function showToast(icon, message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${icon}</span>${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ---- INIT ON LOAD ----
document.addEventListener('DOMContentLoaded', init);
// Hide bottom nav on onboarding
document.getElementById('bottom-nav').style.display = STATE.onboarded ? 'flex' : 'none';
