// ============================================
// STATE & RENDERING
// ============================================
const INITIAL_OAKS = 1540;
const state = {
    oaks: INITIAL_OAKS,
    highestOaks: INITIAL_OAKS
};

// Transaction history
const transactions = [
    { name: '10 Day Login Streak', delta: 5, date: '25/02/2026' },
    { name: 'Daily Login', delta: 1, date: '25/02/2026' },
    { name: 'Card transaction', delta: 1, date: '25/02/2026' },
    { name: 'Recurring P3P payment', delta: 50, date: '25/02/2026' },
    { name: 'Car Loan payment on time', delta: 10, date: '24/02/2026' },
];

function addTransaction(name, delta) {
    const now = new Date();
    const date = now.getDate().toString().padStart(2, '0') + '/' +
        (now.getMonth() + 1).toString().padStart(2, '0') + '/' +
        now.getFullYear();
    transactions.unshift({ name, delta, date });
    renderTransactions();
}

function formatDelta(delta) {
    return delta >= 0 ? `+ ${delta} OaKs` : `\u2212 ${Math.abs(delta)} OaKs`;
}

function renderTransactionRow(tx) {
    const sign = tx.delta >= 0 ? 'positive' : 'negative';
    return `<div class="transaction-row">
        <div>
            <div class="transaction-name">${tx.name}</div>
            <div class="transaction-date">${tx.date}</div>
        </div>
        <span class="transaction-points ${sign}">${formatDelta(tx.delta)}</span>
    </div>`;
}

function renderTransactions() {
    const recentEl = document.getElementById('recent-transactions');
    const allEl = document.getElementById('all-transactions');
    if (recentEl) {
        recentEl.innerHTML = transactions.slice(0, 5).map(renderTransactionRow).join('');
    }
    if (allEl) {
        allEl.innerHTML = transactions.map(renderTransactionRow).join('');
    }
}

// Thresholds: Base 0–999, Bronze 1000–1999, Silver 2000–3999, Gold 4000+
function getLevel(oaks) {
    if (oaks >= 4000) return 'Gold';
    if (oaks >= 2000) return 'Silver';
    if (oaks >= 1000) return 'Bronze';
    return 'Base';
}

// Map OaKs to 0-100% progress across all level segments (each segment = 25%)
function getProgress(oaks) {
    if (oaks >= 4000) return Math.min(75 + ((oaks - 4000) / 4000) * 25, 100);
    if (oaks >= 2000) return 50 + ((oaks - 2000) / 2000) * 25;
    if (oaks >= 1000) return 25 + ((oaks - 1000) / 1000) * 25;
    return (oaks / 1000) * 25;
}

function formatOaks(n) {
    // Format with space as thousands separator: 1540 -> "1 540"
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// V1 leaderboard-driven rank text (Jack=4900, Jill=4600)
function getV1RankText(oaks) {
    if (oaks > 4900) return "Congrats! You're now 1st in your age group!";
    if (oaks > 4600) return "Congrats! You're now 2nd in your age group!";
    return 'You are 101st in your age group';
}

// V2 percentile-themed phrases, bucketed so the message changes as the balance grows
const V2_RANK_BUCKETS = [
    { min: 8000, text: "\u{1F389} Phenomenal! You're top 1% in your age group." },
    { min: 6000, text: "\u{1F389} Incredible! You're top 3% in your age group." },
    { min: 4000, text: "\u{1F389} Outstanding! You're top 5% in your age group." },
    { min: 3000, text: "\u{1F389} Fantastic! You're top 10% in your age group." },
    { min: 2000, text: "\u{1F389} Great! You're top 15% in your age group." },
    { min: 1500, text: "\u{1F389} Nice! You're top 25% in your age group." },
    { min: 1000, text: "\u{1F389} Solid! You're top 35% in your age group." },
    { min: 500,  text: "\u{1F389} Nice! You're top 50% in your age group." },
    { min: 200,  text: "\u{1F389} Welcome! Keep earning to climb your age group." },
    { min: 0,    text: "\u{1F389} Welcome! Start earning to climb your age group." },
];

function getV2RankText(oaks) {
    for (const b of V2_RANK_BUCKETS) {
        if (oaks >= b.min) return b.text;
    }
    return V2_RANK_BUCKETS[V2_RANK_BUCKETS.length - 1].text;
}

function render() {
    const oaks = state.oaks;
    const level = getLevel(state.highestOaks);
    const progress = getProgress(state.highestOaks);

    // Overview badge (plain number)
    document.querySelectorAll('.oaks-count').forEach(el => {
        el.textContent = oaks;
    });

    // Loyalty & Rewards points display (formatted)
    document.querySelectorAll('.points-number').forEach(el => {
        el.textContent = `${formatOaks(oaks)} OaKs`;
    });

    // Level name next to "Your level:"
    document.querySelectorAll('.level-name').forEach(el => {
        el.textContent = level;
    });

    // Level bar fills
    const goldFill = document.querySelector('.level-fill-gold');
    const silverFill = document.querySelector('.level-fill-silver');
    const bronzeFill = document.querySelector('.level-fill-bronze');
    const baseFill = document.querySelector('.level-fill-base');
    if (goldFill) goldFill.style.width = progress + '%';
    if (silverFill) silverFill.style.width = Math.min(progress, 75) + '%';
    if (bronzeFill) bronzeFill.style.width = Math.min(progress, 50) + '%';
    if (baseFill) baseFill.style.width = Math.min(progress, 25) + '%';

    // Level labels - mark active
    document.querySelectorAll('.level-bar-labels span').forEach(span => {
        span.classList.toggle('active', span.textContent === level);
    });

    // Leaderboard dynamic updates
    const JACK_OAKS = 4900;
    const JILL_OAKS = 4600;
    const jackRow = document.getElementById('leader-jack');
    const jillRow = document.getElementById('leader-jill');
    const jackRank = document.getElementById('jack-rank');
    const jillRank = document.getElementById('jill-rank');
    const yourRank = document.getElementById('your-rank');
    const rankText = document.getElementById('rank-text');
    const youPoints = document.querySelector('.leaderboard-row.you .leader-points');
    if (youPoints) youPoints.textContent = `${oaks} OaKs`;

    const isV2 = document.body.classList.contains('v2-mode');

    // Leaderboard rows (V1 only, hidden in V2 by CSS)
    if (oaks > JACK_OAKS) {
        if (jackRow) jackRow.style.display = 'none';
        if (jillRow) jillRow.style.display = 'none';
        if (yourRank) yourRank.textContent = '1';
    } else if (oaks > JILL_OAKS) {
        if (jackRow) jackRow.style.display = '';
        if (jillRow) jillRow.style.display = 'none';
        if (jackRank) jackRank.textContent = '1';
        if (yourRank) yourRank.textContent = '2';
    } else {
        if (jackRow) jackRow.style.display = '';
        if (jillRow) jillRow.style.display = '';
        if (jackRank) jackRank.textContent = '1';
        if (jillRank) jillRank.textContent = '2';
        if (yourRank) yourRank.textContent = '101';
    }

    // Rank text: V2 cycles percentile-based phrases that react to OaKs balance
    if (rankText) {
        rankText.textContent = isV2 ? getV2RankText(oaks) : getV1RankText(oaks);
    }

    // Debug panel display
    // Update both desktop and mobile helper panels
    document.querySelectorAll('#debug-oaks, #debug-oaks-mobile').forEach(el => el.textContent = oaks);
    document.querySelectorAll('#debug-level, #debug-level-mobile').forEach(el => el.textContent = level);

    renderThresholdRewards(level);
}

const LEVEL_RANK = { Base: 0, Bronze: 1, Silver: 2, Gold: 3 };

const SF_LOCK = '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.25a4.75 4.75 0 0 0-4.75 4.75v3H6.5A2.5 2.5 0 0 0 4 12.5v7A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5v-7a2.5 2.5 0 0 0-2.5-2.5h-.75V7A4.75 4.75 0 0 0 12 2.25zm-3.25 4.75a3.25 3.25 0 0 1 6.5 0v3h-6.5V7z"/></svg>';
const SF_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"/></svg>';

function renderThresholdRewards(currentLevel) {
    document.querySelectorAll('.threshold-card').forEach(card => {
        if (card.classList.contains('applied')) return; // applied is sticky
        const required = card.dataset.threshold;
        const status = card.querySelector('.threshold-status');
        if (!status) return;
        const unlocked = LEVEL_RANK[currentLevel] >= LEVEL_RANK[required];
        card.classList.toggle('available', unlocked);
        card.classList.toggle('locked', !unlocked);
        status.innerHTML = unlocked
            ? '<span>Apply</span>'
            : SF_LOCK + '<span>Reach ' + required + '</span>';
    });
}

function applyThresholdReward(card, e) {
    e.stopPropagation();
    if (!card.classList.contains('available')) return;
    card.classList.remove('available');
    card.classList.add('applied');
    const status = card.querySelector('.threshold-status');
    if (status) status.innerHTML = SF_CHECK + '<span>Applied</span>';
    const titleEl = card.querySelector('.care-title');
    const title = titleEl ? titleEl.textContent.trim() : 'Threshold reward';
    showNotification(0, 'Application sent: ' + title);
}

function updateOaks(delta, reason, opts) {
    const prevLevel = getLevel(state.highestOaks);
    state.oaks = Math.max(0, state.oaks + delta);
    if (state.oaks > state.highestOaks) {
        state.highestOaks = state.oaks;
    }
    const newLevel = getLevel(state.highestOaks);
    render();
    if (reason) {
        addTransaction(reason, delta);
        showNotification(delta, reason);
    }
    if (opts && opts.suppressLevelUp) return;
    // Check for level up
    const levels = ['Base', 'Bronze', 'Silver', 'Gold'];
    if (levels.indexOf(newLevel) > levels.indexOf(prevLevel)) {
        setTimeout(() => showLevelUp(newLevel), 500);
    }
}

function resetOaks() {
    state.oaks = INITIAL_OAKS;
    state.highestOaks = INITIAL_OAKS;
    render();
    showNotification(0, 'Balance reset to ' + INITIAL_OAKS);
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================
let notificationTimeout = null;

function showNotification(delta, reason) {
    const phoneFrame = document.querySelector('.phone-frame');
    if (!phoneFrame) return;

    // Remove existing notification
    const existing = phoneFrame.querySelector('.push-notification');
    if (existing) existing.remove();
    if (notificationTimeout) clearTimeout(notificationTimeout);

    const notif = document.createElement('div');
    notif.className = 'push-notification';

    let title, body;
    if (delta < 0) {
        title = `\u2212${Math.abs(delta)} OaKs redeemed`;
        body = reason;
    } else if (delta > 0) {
        title = `+${delta} OaKs received`;
        body = reason;
    } else {
        title = 'OaKs updated';
        body = reason;
    }

    notif.innerHTML = `
        <img class="push-notif-icon" src="assets/swedAppLogo.png" alt="">
        <div class="push-notif-content">
            <div class="push-notif-app">Swedbank</div>
            <div class="push-notif-title">${title}</div>
            <div class="push-notif-body">${body}</div>
        </div>
        <div class="push-notif-time">now</div>
    `;

    phoneFrame.appendChild(notif);

    // Animate in
    requestAnimationFrame(() => {
        notif.classList.add('visible');
    });

    // Auto-dismiss after 3s
    notificationTimeout = setTimeout(() => {
        notif.classList.remove('visible');
        setTimeout(() => notif.remove(), 400);
    }, 3000);

    // Tap to dismiss
    notif.addEventListener('click', () => {
        notif.classList.remove('visible');
        setTimeout(() => notif.remove(), 400);
    });
}

// ============================================
// LEVEL UP CELEBRATION
// ============================================
function showLevelUp(level) {
    const phoneFrame = document.querySelector('.phone-frame');
    if (!phoneFrame) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'levelup-overlay';

    const levelColors = {
        'Bronze': '#AC7E5F',
        'Silver': '#A0A0A0',
        'Gold': '#E8C840'
    };
    const color = levelColors[level] || '#FB4F00';

    overlay.innerHTML = `
        <div class="levelup-content">
            <div class="levelup-badge" style="background: ${color};">${level}</div>
            <h2 class="levelup-title">Level Up!</h2>
            <p class="levelup-text">Congratulations! You've reached <strong>${level}</strong> status</p>
        </div>
    `;

    phoneFrame.appendChild(overlay);
    spawnConfetti(phoneFrame);

    requestAnimationFrame(() => {
        overlay.classList.add('visible');
    });

    // Dismiss on tap or after 4s
    const dismiss = () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 400);
    };
    overlay.addEventListener('click', dismiss);
    setTimeout(dismiss, 4000);
}

function spawnConfetti(container) {
    const colors = ['#FB4F00', '#FBC82C', '#4CAF50', '#E8C840', '#AC7E5F', '#267885', '#F44336', '#9C27B0'];
    const confettiCount = 60;
    const wrapper = document.createElement('div');
    wrapper.className = 'confetti-wrapper';
    container.appendChild(wrapper);

    for (let i = 0; i < confettiCount; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const duration = 1.5 + Math.random() * 1.5;
        const size = 4 + Math.random() * 6;
        const rotation = Math.random() * 360;
        const drift = -30 + Math.random() * 60;

        piece.style.cssText = `
            left: ${left}%;
            width: ${size}px;
            height: ${size * (0.4 + Math.random() * 0.6)}px;
            background: ${color};
            animation-delay: ${delay}s;
            animation-duration: ${duration}s;
            --drift: ${drift}px;
            transform: rotate(${rotation}deg);
        `;
        wrapper.appendChild(piece);
    }

    setTimeout(() => wrapper.remove(), 4000);
}

// ============================================
// SCREEN NAVIGATION
// ============================================
let currentScreen = 'screen-intro';
let introReturnScreen = null; // Where to go when dismissing intro popup
let offerReturnScreen = null; // Where to go when dismissing offer popup
const screensWithoutTabs = ['screen-intro', 'screen-info', 'screen-offer', 'screen-discounts', 'screen-partner-offers', 'screen-care', 'screen-experience', 'screen-status', 'screen-plan-details', 'screen-relationship'];
const screensWithoutFab = ['screen-intro', 'screen-info'];

function navigateTo(screenId, showTooltip) {
    if (screenId === currentScreen && !showTooltip) return;

    // Remember where we came from when opening the offer screen
    if (screenId === 'screen-offer') {
        offerReturnScreen = currentScreen;
    }

    // Cycle the relationship persona on entry (first entry keeps index 0)
    if (screenId === 'screen-relationship') {
        onEnterRelationship();
    }

    const current = document.getElementById(currentScreen);
    const next = document.getElementById(screenId);
    const tabBar = document.getElementById('tab-bar');

    if (!next) return;

    // Hide tab bar on certain screens
    if (screensWithoutTabs.includes(screenId)) {
        tabBar.classList.add('hidden');
    } else {
        tabBar.classList.remove('hidden');
    }

    // Hide FAB on intro/info screens
    const fab = document.getElementById('mobile-helper-fab');
    if (fab) {
        if (screensWithoutFab.includes(screenId)) {
            fab.style.display = 'none';
        } else {
            fab.style.display = '';
        }
    }

    // Animate out current
    current.classList.add('slide-out');

    setTimeout(() => {
        current.classList.remove('active', 'slide-out');
        current.style.display = 'none';

        // Reset scroll position only if not returning to a screen
        if (!showTooltip) {
            next.scrollTop = 0;
        }

        // Show new screen
        next.style.display = next.id === 'screen-intro' ? 'flex' : 'block';
        next.classList.add('active', 'slide-in');

        setTimeout(() => {
            next.classList.remove('slide-in');
        }, 300);

        currentScreen = screenId;
        updateTabBar(screenId);
        updatePathHelperButtons();

        // Show tooltip overlay if requested
        if (showTooltip) {
            setTimeout(() => {
                const overlay = document.getElementById('tooltip-overlay');
                const badge = document.querySelector('#screen-overview .oaks-badge');
                if (overlay) overlay.classList.add('visible');
                if (badge) badge.classList.add('above-overlay');
            }, 400);
        }
    }, 200);
}

// Show intro screen as a popup, remembering where to return
function showIntroPopup() {
    introReturnScreen = currentScreen;
    navigateTo('screen-intro');
}

// Dismiss intro - either first-time flow or returning from popup
function dismissIntro() {
    if (introReturnScreen) {
        // Returning from popup - go back to where we came from
        const returnTo = introReturnScreen;
        introReturnScreen = null;
        navigateTo(returnTo);
    } else {
        // First-time flow - go to overview with tooltip
        navigateTo('screen-overview', true);
    }
}

// Dismiss info page - go back to intro
function dismissInfo() {
    navigateTo('screen-intro');
}

// Dismiss offer page - go back to where we came from
function dismissOffer() {
    const returnTo = offerReturnScreen || 'screen-loyalty1';
    offerReturnScreen = null;
    navigateTo(returnTo);
}

function toggleLevelTooltip(e) {
    e.stopPropagation();
    const tip = document.getElementById('level-tooltip');
    if (!tip) return;
    tip.classList.toggle('visible');
    // Dismiss on next tap anywhere
    if (tip.classList.contains('visible')) {
        const dismiss = (ev) => {
            tip.classList.remove('visible');
            document.removeEventListener('click', dismiss, true);
        };
        setTimeout(() => document.addEventListener('click', dismiss, true), 10);
    }
}

function dismissTooltip() {
    const overlay = document.getElementById('tooltip-overlay');
    const badge = document.querySelector('#screen-overview .oaks-badge');
    if (overlay) overlay.classList.remove('visible');
    if (badge) badge.classList.remove('above-overlay');
}

function updateTabBar(screenId) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    if (screenId === 'screen-overview') {
        tabs[0].classList.add('active');
    }
}

// Toggle handler for reward toggles
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('toggle')) {
        e.target.classList.toggle('active');
    }
});

// ============================================
// RANDOM SURPRISE
// ============================================
const SF_CAKE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21V11a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10"/><path d="M3 21h18"/><path d="M4 14h16"/><path d="M12 4v3"/><path d="M8 4v3"/><path d="M16 4v3"/></svg>';
const SF_STAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 8.5 22 9.3 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9.3 9 8.5 12 2"/></svg>';
const SF_MEDAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="6"/><path d="M9 9 6 2h12l-3 7"/><path d="M12 12v6"/><path d="M9 15h6"/></svg>';

const SURPRISES = [
    { icon: SF_CAKE,  title: 'Happy birthday!',         body: 'A little gift from us',       delta: 1000, color: '#FB7538', reason: 'Birthday bonus' },
    { icon: SF_STAR,  title: '1 year with Swedbank!',   body: 'Thanks for sticking with us', delta: 200,  color: '#4CAF50', reason: '1 year anniversary' },
    { icon: SF_MEDAL, title: '3 years with Swedbank!',  body: 'Three years and counting',    delta: 500,  color: '#AC7E5F', reason: '3 year anniversary' },
    { icon: SF_MEDAL, title: '5 years with Swedbank!',  body: 'Half a decade together',      delta: 1000, color: '#A0A0A0', reason: '5 year anniversary' },
    { icon: SF_MEDAL, title: '10 years with Swedbank!', body: 'A decade of loyalty',         delta: 2000, color: '#E8C840', reason: '10 year anniversary' },
];

function triggerRandomSurprise() {
    const s = SURPRISES[Math.floor(Math.random() * SURPRISES.length)];
    const prevLevel = getLevel(state.highestOaks);
    updateOaks(s.delta, s.reason, { suppressLevelUp: true });
    const newLevel = getLevel(state.highestOaks);
    const levels = ['Base', 'Bronze', 'Silver', 'Gold'];
    const leveledUp = levels.indexOf(newLevel) > levels.indexOf(prevLevel);
    showSurprise(s, leveledUp ? () => showLevelUp(newLevel) : null);
}

function showSurprise(s, onDismiss) {
    const phoneFrame = document.querySelector('.phone-frame');
    if (!phoneFrame) return;

    const overlay = document.createElement('div');
    overlay.className = 'levelup-overlay';
    overlay.innerHTML = `
        <div class="levelup-content">
            <div class="levelup-badge surprise-badge" style="background: ${s.color};">${s.icon}</div>
            <h2 class="levelup-title">${s.title}</h2>
            <p class="levelup-text">${s.body}. <strong>+${s.delta} OaKs</strong></p>
        </div>
    `;
    phoneFrame.appendChild(overlay);
    spawnConfetti(phoneFrame);

    requestAnimationFrame(() => overlay.classList.add('visible'));

    let dismissed = false;
    const dismiss = () => {
        if (dismissed) return;
        dismissed = true;
        overlay.classList.remove('visible');
        setTimeout(() => {
            overlay.remove();
            if (onDismiss) setTimeout(onDismiss, 200);
        }, 400);
    };
    overlay.addEventListener('click', dismiss);
    setTimeout(dismiss, 4000);
}

// ============================================
// RELATIONSHIP SCREEN — persona cycling
// ============================================
const SVG_ICONS = {
    trophy:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9h12v2a6 6 0 0 1-12 0V9z"/><path d="M6 9V5h12v4"/><path d="M6 7H3a2 2 0 0 0 2 2h1"/><path d="M18 7h3a2 2 0 0 1-2 2h-1"/><path d="M10 17h4l-1 4h-2l-1-4z"/></svg>',
    cake:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21V11a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10"/><path d="M3 21h18"/><path d="M4 14h16"/><path d="M12 4v3"/><path d="M8 4v3"/><path d="M16 4v3"/></svg>',
    phone:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><line x1="3" y1="13" x2="21" y2="13"/></svg>',
    chartUp:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/></svg>',
    repeat:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    banknote:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01"/><path d="M18 12h.01"/></svg>',
    gift:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>',
    card:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/></svg>',
    doc:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></svg>',
    check:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    house:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z"/></svg>',
};

const RELATIONSHIP_PERSONAS = [
    // Persona 1: established mid-tier customer (~5 years)
    {
        title: "Your year with Swedbank",
        subtitle: "Thank you for being with us since April 2021",
        upcomingMilestone: "Your 5-year anniversary is 38 days away.",
        linkLabel: "Our relationship in last 12 months",
        tiles: [
            { span: 5, tone: 'tone-butter', icon: 'trophy',    label: '5th anniversary with us',    value: '+1000 OaKs' },
            { span: 7, tone: 'tone-peach',  icon: 'cake',      label: 'Your birthday on May 5',     value: '+1000 OaKs' },
            { span: 7, tone: 'tone-mint',   icon: 'phone',     label: 'Used the Swedbank app 123 days', value: '+123 OaKs' },
            { span: 5, tone: 'tone-lilac',  icon: 'chartUp',   label: 'Invested in funds',          value: '+200 OaKs' },
            { span: 4, tone: 'tone-sky',    icon: 'briefcase', label: 'Opened investment account',  value: '+100 OaKs' },
            { span: 4, tone: 'tone-rose',   icon: 'chartUp',   label: 'Invested in stocks',         value: '+200 OaKs' },
            { span: 4, tone: 'tone-mint',   icon: 'banknote',  label: '500 EUR in savings',         value: '+10 OaKs' },
        ],
        summary: [
            "What a great journey we've had together this year.",
            "You've grown your savings, started investing, and built habits that pay off. Every step adds up to a stronger financial future.",
            "Thank you for choosing Swedbank. Here's to many more years ahead!",
        ],
    },
    // Persona 2: brand new customer (weeks/months in)
    {
        title: "Your first months with Swedbank",
        subtitle: "Thank you for being with us since January 2026",
        upcomingMilestone: "Your first 100 days with us coming up next week.",
        linkLabel: "Our relationship so far",
        tiles: [
            { span: 5, tone: 'tone-mint',   icon: 'gift',     label: 'Welcome to Swedbank',     value: '+50 OaKs' },
            { span: 7, tone: 'tone-butter', icon: 'banknote', label: 'Received your 4th salary', value: '+40 OaKs' },
            { span: 7, tone: 'tone-sky',    icon: 'phone',    label: 'Used the app 28 days',     value: '+28 OaKs' },
            { span: 5, tone: 'tone-peach',  icon: 'card',     label: 'Activated debit card',     value: '+30 OaKs' },
            { span: 4, tone: 'tone-lilac',  icon: 'doc',      label: 'Enabled 2nd e-invoice',    value: '+20 OaKs' },
            { span: 4, tone: 'tone-rose',   icon: 'check',    label: 'First card transaction',   value: '+10 OaKs' },
            { span: 4, tone: 'tone-mint',   icon: 'trophy',   label: 'Set first savings goal',   value: '+15 OaKs' },
        ],
        summary: [
            "Welcome to Swedbank! You're just getting started, and we love seeing it.",
            "Card activated, salary coming in, first goal set. Small steps, but they all count.",
            "We're here whenever you're ready for the next one.",
        ],
    },
    // Persona 3: long-term established customer (20+ years)
    {
        title: "Two decades with Swedbank",
        subtitle: "Thank you for being with us since June 2004",
        upcomingMilestone: "Your 23rd year with Swedbank begins this June.",
        linkLabel: "Our relationship in last 12 months",
        tiles: [
            { span: 5, tone: 'tone-butter', icon: 'trophy',   label: '22nd anniversary with us',  value: '+2000 OaKs' },
            { span: 7, tone: 'tone-peach',  icon: 'cake',     label: 'Your birthday on May 5',    value: '+1000 OaKs' },
            { span: 7, tone: 'tone-mint',   icon: 'house',    label: '2nd mortgage approved',     value: '+500 OaKs' },
            { span: 5, tone: 'tone-sky',    icon: 'card',     label: 'Premium card active',       value: '+200 OaKs' },
            { span: 4, tone: 'tone-lilac',  icon: 'phone',    label: 'Used the app 287 days',     value: '+287 OaKs' },
            { span: 4, tone: 'tone-rose',   icon: 'banknote', label: '50,000 EUR in savings',     value: '+200 OaKs' },
            { span: 4, tone: 'tone-mint',   icon: 'repeat',   label: '24 regular investments',    value: '+480 OaKs' },
        ],
        summary: [
            "Two decades together. That's a real partnership.",
            "This year you signed your second mortgage, kept growing your savings, and stayed active in the app. Steady and strong.",
            "Thank you for trusting us with the long road. Here's to the next chapter.",
        ],
    },
];

let relationshipPersonaIndex = 0;
let relationshipPersonaShown = false;

function renderRelationship() {
    const p = RELATIONSHIP_PERSONAS[relationshipPersonaIndex];
    if (!p) return;
    const titleEl    = document.getElementById('relationship-title');
    const subtitleEl = document.getElementById('relationship-subtitle');
    const gridEl     = document.getElementById('relationship-grid');
    const summaryEl  = document.getElementById('relationship-summary');
    const upcomingEl = document.getElementById('upcoming-milestone');
    const linkLabelEl = document.getElementById('relationship-link-label');
    if (titleEl)     titleEl.textContent     = p.title;
    if (subtitleEl)  subtitleEl.textContent  = p.subtitle;
    if (upcomingEl)  upcomingEl.textContent  = p.upcomingMilestone;
    if (linkLabelEl) linkLabelEl.textContent = p.linkLabel;
    if (gridEl) {
        gridEl.innerHTML = p.tiles.map(t => `
            <div class="relationship-tile tile-${t.span} ${t.tone}">
                <div class="tile-icon">${SVG_ICONS[t.icon] || ''}</div>
                <div class="tile-label">${t.label}</div>
                <div class="tile-value">${t.value}</div>
            </div>`).join('');
    }
    if (summaryEl) {
        summaryEl.innerHTML = p.summary.map(s => `<p>${s}</p>`).join('');
    }
}

// Called when navigating INTO screen-relationship. Renders the current persona
// without advancing — the persona only changes via the OaK Helper
// "Cycle the year (persona)" button.
function onEnterRelationship() {
    renderRelationship();
}

// Called from OaK Helper "Cycle the year" button. Always advances.
function cycleRelationshipPersona() {
    relationshipPersonaIndex = (relationshipPersonaIndex + 1) % RELATIONSHIP_PERSONAS.length;
    relationshipPersonaShown = true;
    renderRelationship();
}

// ============================================
// V1 / V2 VERSION TOGGLE
// ============================================
function setVersion(v) {
    const isV2 = v === 'v2';
    document.body.classList.toggle('v2-mode', isV2);
    document.querySelectorAll('.version-seg').forEach(b => {
        b.classList.toggle('active', b.dataset.version === v);
    });
    render();
}

// Activate VIP (independent toggle, costs 1000 OaKs)
// Parse OaKs cost from a text string like "100 OaKs" or "1000 OaKs"
function parseCost(text) {
    const n = parseInt(text);
    return isNaN(n) ? 0 : n;
}

// Show insufficient balance feedback
function showInsufficientFeedback(element) {
    element.classList.add('insufficient');
    setTimeout(() => element.classList.remove('insufficient'), 600);
}

// Activate VIP (independent toggle, costs 4000 OaKs)
function activateVip(card, e) {
    e.stopPropagation();
    const toggle = card.querySelector('.toggle');
    const wasActive = card.classList.contains('active-plan');

    if (wasActive) {
        card.classList.remove('active-plan');
        if (toggle) toggle.classList.remove('active');
    } else {
        if (state.oaks < 4000) {
            showInsufficientFeedback(card);
            return;
        }
        card.classList.add('active-plan');
        if (toggle) toggle.classList.add('active');
        updateOaks(-4000, 'VIP customer for a week');
    }
}

// ============================================
// DONATION PANEL
// ============================================
let donationAmount = 0;

function openDonation() {
    const panel = document.getElementById('donate-panel');
    if (!panel) return;
    donationAmount = 0;
    renderDonation();
    panel.classList.toggle('visible');
}

function adjustDonation(delta) {
    donationAmount = Math.max(0, Math.min(donationAmount + delta, state.oaks));
    renderDonation();
}

function setDonationAll() {
    donationAmount = state.oaks;
    renderDonation();
}

function renderDonation() {
    const amountEl = document.getElementById('donate-amount');
    const availEl = document.getElementById('donate-available');
    const btn = document.querySelector('.donate-confirm-btn');
    if (amountEl) amountEl.textContent = donationAmount;
    if (availEl) availEl.textContent = state.oaks;
    if (btn) btn.disabled = donationAmount <= 0;
}

function confirmDonation() {
    if (donationAmount <= 0 || donationAmount > state.oaks) return;
    const donated = donationAmount;
    updateOaks(-donationAmount, 'Charity donation');
    donationAmount = 0;

    // Show thank you state
    const panel = document.getElementById('donate-panel');
    if (panel) {
        panel.classList.add('donate-success');
        panel.innerHTML = `
            <div class="donate-success-content">
                <div class="donate-success-check">&#10003;</div>
                <h3>Thank you!</h3>
                <p>${donated} OaKs donated to charity</p>
            </div>
        `;
        setTimeout(() => {
            panel.classList.remove('visible', 'donate-success');
            // Restore panel content
            panel.innerHTML = `
                <div class="donate-amount-row">
                    <button class="donate-circle-btn" onclick="adjustDonation(-10)">
                        <svg width="18" height="18" viewBox="0 0 18 18"><line x1="4" y1="9" x2="14" y2="9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
                    </button>
                    <div class="donate-amount" id="donate-amount">0</div>
                    <button class="donate-circle-btn" onclick="adjustDonation(10)">
                        <svg width="18" height="18" viewBox="0 0 18 18"><line x1="4" y1="9" x2="14" y2="9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="9" y1="4" x2="9" y2="14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
                    </button>
                </div>
                <p class="donate-available">Available: <span id="donate-available">${state.oaks}</span> OaKs</p>
                <div class="donate-quick-btns">
                    <button onclick="adjustDonation(10)">+10</button>
                    <button onclick="adjustDonation(50)">+50</button>
                    <button onclick="adjustDonation(100)">+100</button>
                    <button onclick="adjustDonation(500)">+500</button>
                    <button onclick="setDonationAll()">All</button>
                </div>
                <button class="donate-confirm-btn" onclick="confirmDonation()" disabled>Donate OaKs</button>
            `;
        }, 2500);
    }
}

// ============================================
// MYSTERY BOX
// ============================================
function openMysteryBox() {
    const boxes = document.querySelectorAll('.mystery-box-card');
    if (boxes.length === 0) return;
    if (Array.from(boxes).some(b => b.classList.contains('mystery-used'))) return;

    const reward = 5;

    updateOaks(reward, 'Mystery box reward');

    // Confetti
    const phoneFrame = document.querySelector('.phone-frame');
    if (phoneFrame) spawnConfetti(phoneFrame);

    // Show overlay
    const overlay = document.createElement('div');
    overlay.className = 'levelup-overlay';
    overlay.innerHTML = `
        <div class="levelup-content">
            <div class="levelup-badge" style="background: #9C27B0;">&#127873;</div>
            <h2 class="levelup-title">Mystery Box!</h2>
            <p class="levelup-text">This time you earned: <strong>${reward} OaKs</strong></p>
            <p class="mystery-next">Next reward available tomorrow</p>
        </div>
    `;
    phoneFrame.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    const dismiss = () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 400);
    };
    overlay.addEventListener('click', dismiss);
    setTimeout(dismiss, 4000);

    // Disable all mystery box instances (V1 + V2 stay in sync across toggle)
    boxes.forEach(b => b.classList.add('mystery-used'));
}

// Redeem a discount card
function redeemDiscount(card, e) {
    if (card.classList.contains('redeemed')) return;
    e.stopPropagation();

    const costEl = card.querySelector('.discount-cost');
    const cost = costEl ? parseCost(costEl.textContent) : 0;
    const labelEl = card.querySelector('.discount-merchant, .achievement-title, .care-title');
    const label = labelEl ? labelEl.textContent.trim() : 'Reward';

    if (state.oaks < cost) {
        showInsufficientFeedback(card);
        return;
    }

    updateOaks(-cost, label);

    const badge = card.querySelector('.discount-badge');
    if (badge) badge.textContent = 'Redeemed';

    card.classList.add('redeemed');
}

// Activate a plan (only one at a time, triggered by toggle only)
function activatePlan(card, e) {
    e.stopPropagation();
    if (card.classList.contains('disabled-plan')) return;

    const allCards = document.querySelectorAll('.plan-card:not(.vip-card)');
    const wasActive = card.classList.contains('active-plan');
    const costEl = card.querySelector('.plan-cost');
    const cost = costEl ? parseCost(costEl.textContent) : 0;

    // Deactivate all plans
    allCards.forEach(c => {
        c.classList.remove('active-plan', 'disabled-plan');
        c.removeAttribute('style');
        const toggle = c.querySelector('.toggle');
        if (toggle) toggle.classList.remove('active');
    });

    if (!wasActive) {
        if (state.oaks < cost) {
            showInsufficientFeedback(card);
            return;
        }

        // Activate the clicked one, disable the rest
        card.classList.add('active-plan');
        const toggle = card.querySelector('.toggle');
        if (toggle) toggle.classList.add('active');
        const planNameEl = card.querySelector('.plan-name');
        const planName = planNameEl ? planNameEl.textContent : 'Service plan';
        updateOaks(-cost, planName);

        allCards.forEach(c => {
            if (c !== card) c.classList.add('disabled-plan');
        });
    }
}

// Path items (Insurance/Investment) open the offer placeholder
document.addEventListener('click', (e) => {
    const pathItem = e.target.closest('.path-item');
    if (pathItem) {
        navigateTo('screen-offer');
    }
});

// ============================================
// iOS SIMULATOR INTERACTION
// ============================================
function initSimulatorInteraction() {
    const phoneFrame = document.querySelector('.phone-frame');
    if (!phoneFrame) return;

    // Create touch cursor
    const touchCursor = document.createElement('div');
    touchCursor.className = 'touch-cursor';
    phoneFrame.appendChild(touchCursor);

    // Follow mouse position inside phone-frame
    phoneFrame.addEventListener('mousemove', (e) => {
        const rect = phoneFrame.getBoundingClientRect();
        touchCursor.style.left = (e.clientX - rect.left) + 'px';
        touchCursor.style.top = (e.clientY - rect.top) + 'px';
        touchCursor.classList.add('visible');
    });

    phoneFrame.addEventListener('mouseleave', () => {
        touchCursor.classList.remove('visible');
    });

    // Find the nearest ancestor scrollable in a given axis
    function findScrollTargetInAxis(element, axis) {
        while (element && element !== phoneFrame && element !== document.body) {
            const style = getComputedStyle(element);
            if (axis === 'x') {
                const overflow = style.overflowX;
                if ((overflow === 'auto' || overflow === 'scroll') &&
                    element.scrollWidth > element.clientWidth) {
                    return element;
                }
            } else {
                const overflow = style.overflowY;
                if ((overflow === 'auto' || overflow === 'scroll') &&
                    element.scrollHeight > element.clientHeight) {
                    return element;
                }
            }
            element = element.parentElement;
        }
        return null;
    }

    // Drag-to-scroll state
    let dragStart = null;
    let startElement = null;
    let scrollTarget = null;
    let dragAxis = null;
    let isDragging = false;
    const DRAG_THRESHOLD = 4;

    phoneFrame.addEventListener('mousedown', (e) => {
        touchCursor.classList.add('pressed');
        startElement = e.target;
        dragStart = {
            x: e.clientX,
            y: e.clientY,
            scrollLeft: 0,
            scrollTop: 0
        };
        scrollTarget = null;
        dragAxis = null;
        isDragging = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragStart) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        // Determine drag axis once we exceed the threshold
        if (!isDragging && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
            isDragging = true;
            dragAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
            scrollTarget = findScrollTargetInAxis(startElement, dragAxis);
            if (scrollTarget) {
                dragStart.scrollLeft = scrollTarget.scrollLeft;
                dragStart.scrollTop = scrollTarget.scrollTop;
            }
        }

        if (isDragging && scrollTarget) {
            if (dragAxis === 'x') {
                scrollTarget.scrollLeft = dragStart.scrollLeft - dx;
            } else {
                scrollTarget.scrollTop = dragStart.scrollTop - dy;
            }
            e.preventDefault();
        }
    });

    document.addEventListener('mouseup', () => {
        touchCursor.classList.remove('pressed');
        if (isDragging) {
            // Suppress the click that would fire after dragging
            const suppressClick = (clickEvent) => {
                clickEvent.stopPropagation();
                clickEvent.preventDefault();
                document.removeEventListener('click', suppressClick, true);
            };
            document.addEventListener('click', suppressClick, true);
        }
        dragStart = null;
        scrollTarget = null;
        startElement = null;
        dragAxis = null;
        isDragging = false;
    });

    // Prevent text selection during drag
    phoneFrame.addEventListener('selectstart', (e) => {
        if (dragStart) e.preventDefault();
    });
}

// Initialize
// Live clock
function toggleMobileHelper() {
    const overlay = document.getElementById('mobile-helper-overlay');
    const fab = document.getElementById('mobile-helper-fab');
    if (!overlay) return;
    const isVisible = overlay.classList.contains('visible');
    overlay.classList.toggle('visible');
    if (fab) fab.classList.toggle('hidden', !isVisible);
}

function updateClock() {
    const el = document.getElementById('status-time');
    if (el) {
        const now = new Date();
        el.textContent = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    }
}

// Path helper: enable/disable OaK Helper buttons based on current screen
const PATH_SCREENS = ['screen-insurance', 'screen-investment'];

function updatePathHelperButtons() {
    const onPath = PATH_SCREENS.includes(currentScreen);
    const completes = document.querySelectorAll('#debug-complete-path, #debug-complete-path-mobile');
    const uncompletes = document.querySelectorAll('#debug-uncomplete-path, #debug-uncomplete-path-mobile');

    if (!onPath) {
        completes.forEach(b => b.disabled = true);
        uncompletes.forEach(b => b.disabled = true);
        return;
    }

    const screen = document.getElementById(currentScreen);
    const hasIncomplete = screen.querySelectorAll('.path-item:not(.completed)').length > 0;
    const hasCompleted = screen.querySelectorAll('.path-item.completed').length > 0;
    completes.forEach(b => b.disabled = !hasIncomplete);
    uncompletes.forEach(b => b.disabled = !hasCompleted);
}

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function parsePathItem(item) {
    const nameEl = item.querySelector('.path-item-name');
    const pointsEl = item.querySelector('.path-item-points');
    const name = nameEl ? nameEl.textContent.trim() : 'Path item';
    const text = pointsEl ? pointsEl.textContent : '';
    const match = text.match(/(\d+)/);
    const pts = match ? parseInt(match[1], 10) : 0;
    const isMonthly = /month/i.test(text);
    return { name, pts, isMonthly };
}

function completeRandomPathItem() {
    if (!PATH_SCREENS.includes(currentScreen)) return;
    const screen = document.getElementById(currentScreen);
    const candidates = Array.from(screen.querySelectorAll('.path-item:not(.completed)'));
    if (candidates.length === 0) return;
    const item = pickRandom(candidates);
    item.classList.add('completed');
    const check = item.querySelector('.path-check');
    if (check) check.classList.add('done');
    const { name, pts } = parsePathItem(item);
    updateOaks(pts, name);
    renderPathProgress(currentScreen);
    updatePathHelperButtons();
}

function uncompleteRandomPathItem() {
    if (!PATH_SCREENS.includes(currentScreen)) return;
    const screen = document.getElementById(currentScreen);
    const candidates = Array.from(screen.querySelectorAll('.path-item.completed'));
    if (candidates.length === 0) return;
    const item = pickRandom(candidates);
    item.classList.remove('completed');
    const check = item.querySelector('.path-check');
    if (check) check.classList.remove('done');
    const { name, pts } = parsePathItem(item);
    updateOaks(-pts, 'Removed: ' + name);
    renderPathProgress(currentScreen);
    updatePathHelperButtons();
}

// Compute path progress (regular vs monthly) from the DOM
function renderPathProgress(screenId) {
    const screen = document.getElementById(screenId);
    if (!screen) return;

    let regTotal = 0, regEarned = 0;
    let monTotal = 0, monEarned = 0;

    screen.querySelectorAll('.path-item').forEach(item => {
        const pointsEl = item.querySelector('.path-item-points');
        if (!pointsEl) return;
        const text = pointsEl.textContent;
        const match = text.match(/(\d+)/);
        if (!match) return;
        const pts = parseInt(match[1], 10);
        const isMonthly = /month/i.test(text);
        const done = item.classList.contains('completed');

        if (isMonthly) {
            monTotal += pts;
            if (done) monEarned += pts;
        } else {
            regTotal += pts;
            if (done) regEarned += pts;
        }
    });

    const setText = (sel, val) => {
        const el = screen.querySelector(sel);
        if (el) el.textContent = val;
    };
    const setWidth = (sel, pct) => {
        const el = screen.querySelector(sel);
        if (el) el.style.width = pct + '%';
    };

    setText('.path-regular-earned', regEarned);
    setText('.path-regular-total', regTotal);
    setText('.path-monthly-earned', monEarned);
    setText('.path-monthly-total', monTotal);
    setWidth('.path-regular-fill', regTotal ? (regEarned / regTotal) * 100 : 0);
    setWidth('.path-monthly-fill', monTotal ? (monEarned / monTotal) * 100 : 0);
}

// Navigate to a path screen and flash a specific item by name. Called from
// achievement-card "Read more" links so the user lands on the relevant row.
function highlightPathItem(screenId, itemName) {
    navigateTo(screenId);
    setTimeout(() => {
        const screen = document.getElementById(screenId);
        if (!screen) return;
        const items = screen.querySelectorAll('.path-item');
        const target = Array.from(items).find(el => {
            const nameEl = el.querySelector('.path-item-name');
            return nameEl && nameEl.textContent.trim() === itemName;
        });
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('path-item-highlight');
        setTimeout(() => target.classList.remove('path-item-highlight'), 3500);
    }, 350);
}

document.addEventListener('DOMContentLoaded', () => {
    const tabBar = document.getElementById('tab-bar');
    tabBar.classList.add('hidden'); // Hide on intro
    render();
    renderTransactions();
    renderPathProgress('screen-insurance');
    renderPathProgress('screen-investment');
    renderRelationship();
    updatePathHelperButtons();
    initSimulatorInteraction();
    updateClock();
    setInterval(updateClock, 10000);
});
