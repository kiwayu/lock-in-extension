const SITE_PRESETS = [
    { host: 'youtube.com', label: 'YouTube', icon: 'https://www.google.com/s2/favicons?sz=64&domain=youtube.com' },
    { host: 'twitter.com', label: 'X', icon: 'https://www.google.com/s2/favicons?sz=64&domain=twitter.com' },
    { host: 'instagram.com', label: 'Instagram', icon: 'https://www.google.com/s2/favicons?sz=64&domain=instagram.com' },
    { host: 'reddit.com', label: 'Reddit', icon: 'https://www.google.com/s2/favicons?sz=64&domain=reddit.com' },
    { host: 'netflix.com', label: 'Netflix', icon: 'https://www.google.com/s2/favicons?sz=64&domain=netflix.com' },
    { host: 'tiktok.com', label: 'TikTok', icon: 'https://www.google.com/s2/favicons?sz=64&domain=tiktok.com' },
    { host: 'wikipedia.org', label: 'Wikipedia', icon: 'https://www.google.com/s2/favicons?sz=64&domain=wikipedia.org' },
    { host: 'github.com', label: 'GitHub', icon: 'https://www.google.com/s2/favicons?sz=64&domain=github.com' },
    { host: 'stackexchange.com', label: 'Stack', icon: 'https://www.google.com/s2/favicons?sz=64&domain=stackexchange.com' }
];

const CATEGORY_PRESETS = {
    Study: {
        bans: ['youtube.com', 'tiktok.com', 'instagram.com', 'reddit.com', 'twitter.com'],
        picks: ['wikipedia.org', 'khanacademy.org', 'quizlet.com']
    },
    Work: {
        bans: ['tiktok.com', 'instagram.com', 'netflix.com', 'reddit.com'],
        picks: ['github.com', 'jira.com', 'slack.com']
    },
    "Deep Focus": {
        bans: ['youtube.com', 'twitter.com', 'instagram.com', 'reddit.com', 'tiktok.com', 'netflix.com'],
        picks: ['wikipedia.org']
    }
};

let bans = [];
let picks = [];

const banChips = document.getElementById('banChips');
const pickChips = document.getElementById('pickChips');
const banList = document.getElementById('banList');
const pickList = document.getElementById('pickList');
const minutesEl = document.getElementById('minutes');
const statusEl = document.getElementById('status');
const themeToggle = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');
const pomodoroToggle = document.getElementById('pomodoro');
const modeChips = document.getElementById('modeChips');
const categoryChips = document.getElementById('categoryChips');
let mode = 'block';

function renderLists() {
    banList.innerHTML = bans.map(h => `<li>${h}</li>`).join('');
    pickList.innerHTML = picks.map(h => `<li>${h}</li>`).join('');
}

function initFlipTiles() {
    const map = {
        kpi: document.querySelector('[style*="grid-area:kpi"]'),
        ban: document.querySelector('[style*="grid-area:ban"]'),
        pick: document.querySelector('[style*="grid-area:pick"]'),
        presets: document.querySelector('[style*="grid-area:presets"]')
    };
    document.querySelectorAll('[data-flip]').forEach(btn => {
        btn.onclick = () => {
            const key = btn.getAttribute('data-flip');
            const tile = map[key];
            if (!tile) return;
            tile.classList.toggle('flipped');
        };
    });
    updateSummaries();
}

function updateSummaries() {
    const kpiSum = document.getElementById('kpiSummary');
    const banSum = document.getElementById('banSummary');
    const pickSum = document.getElementById('pickSummary');
    const presetSum = document.getElementById('presetSummary');
    // icon summaries
    const banIcons = document.getElementById('banIcons');
    const pickIcons = document.getElementById('pickIcons');
    const presetIcons = document.getElementById('presetIcons');
    if (banIcons) { banIcons.innerHTML = SITE_PRESETS.slice(0, 8).map(s => `<div class="icon ${bans.includes(s.host) ? 'active' : ''}"><img src="${s.icon}" alt=""/></div>`).join(''); }
    if (pickIcons) { pickIcons.innerHTML = SITE_PRESETS.slice(0, 8).map(s => `<div class="icon ${picks.includes(s.host) ? 'active' : ''}"><img src="${s.icon}" alt=""/></div>`).join(''); }
    if (presetIcons) { presetIcons.innerHTML = Object.keys(CATEGORY_PRESETS).slice(0, 4).map(name => `<div class="icon"><span style="font-size:10px">${name.split(' ')[0]}</span></div>`).join(''); }
    if (kpiSum) kpiSum.innerHTML = `<div>Pomodoro: ${document.getElementById('pomodoro')?.checked ? 'On' : 'Off'}</div>`;
}
function renderChips() {
    function makeChip(preset, group) {
        const isActive = (group === 'ban' ? bans.includes(preset.host) : picks.includes(preset.host));
        return `<button class="chip ${isActive ? 'active' : ''}" data-group="${group}" data-host="${preset.host}"><img src="${preset.icon}" alt=""/>${preset.label}</button>`;
    }
    banChips.innerHTML = SITE_PRESETS.map(p => makeChip(p, 'ban')).join('');
    pickChips.innerHTML = SITE_PRESETS.map(p => makeChip(p, 'pick')).join('');
    modeChips.innerHTML = ['Block (ban-list)', 'Allow (pick-only)'].map((label, idx) => {
        const key = idx === 0 ? 'block' : 'allow';
        const active = mode === key ? 'active' : '';
        return `<button class="chip ${active}" data-mode="${key}">${label}</button>`;
    }).join('');
    categoryChips.innerHTML = Object.keys(CATEGORY_PRESETS).map(name => `<button class="chip" data-category="${name}">${name}</button>`).join('');
}

function attachChipHandlers() {
    document.querySelectorAll('.chip').forEach(btn => {
        btn.onclick = () => {
            const group = btn.getAttribute('data-group');
            const host = btn.getAttribute('data-host');
            const m = btn.getAttribute('data-mode');
            const cat = btn.getAttribute('data-category');
            if (m) {
                mode = m;
            } else if (cat) {
                const preset = CATEGORY_PRESETS[cat];
                if (preset) { bans = [...new Set(preset.bans)]; picks = [...new Set(preset.picks)]; }
                // record category usage
                (async () => {
                    const { analytics } = await chrome.storage.local.get(['analytics']);
                    const a = analytics || {}; a.categoryUsage = a.categoryUsage || {}; a.categoryUsage[cat] = (a.categoryUsage[cat] || 0) + 1; await chrome.storage.local.set({ analytics: a });
                })();
            } else if (group && host) {
                const arr = (group === 'ban') ? bans : picks;
                const i = arr.indexOf(host);
                if (i >= 0) arr.splice(i, 1); else arr.push(host);
            }
            renderChips();
            attachChipHandlers();
            renderLists();
        };
    });
}

async function renderStatus() {
    const { session } = await chrome.storage.local.get(['session']);
    const endBtn = document.getElementById('endSession');
    if (session && session.active) {
        const minsLeft = Math.max(0, Math.ceil((session.end - Date.now()) / 60000));
        statusEl.textContent = `Active — ${minsLeft} min left`;
        endBtn.disabled = false;
        // progress ring update
        const total = Math.max(1, Math.round((session.end - session.start) / 1000));
        const left = Math.max(0, Math.round((session.end - Date.now()) / 1000));
        const pct = Math.max(0, Math.min(100, Math.round(((total - left) / total) * 100)));
        const ring = document.getElementById('ringFg');
        const text = document.getElementById('ringText');
        if (ring && text) {
            ring.style.strokeDasharray = `${pct} 100`;
            text.textContent = `${pct}%`;
        }
    } else {
        statusEl.textContent = '';
        endBtn.disabled = true;
        const ring = document.getElementById('ringFg');
        const text = document.getElementById('ringText');
        if (ring && text) { ring.style.strokeDasharray = `0 100`; text.textContent = `0%`; }
    }
}

async function renderAnalytics() {
    const { analytics } = await chrome.storage.local.get(['analytics']);
    const a = analytics || {};
    const kpis = document.getElementById('kpis');
    const started = a.sessionsStarted || 0;
    const completed = a.sessionsCompleted || 0;
    const broken = a.sessionsBroken || 0;
    const minutes = a.totalFocusedMinutes || 0;
    kpis.innerHTML = `
        <div class="kpi"><div class="label">Started</div><div class="value">${started}</div></div>
        <div class="kpi"><div class="label">Completed</div><div class="value">${completed}</div></div>
        <div class="kpi"><div class="label">Focused min</div><div class="value">${minutes}</div></div>
    `;

    const chart = document.getElementById('chart7');
    const daily = a.daily || {};
    const days = [...Array(7)].map((_, i) => {
        const d = new Date(Date.now() - (6 - i) * 86400000);
        return d.toISOString().slice(0, 10);
    });
    const values = days.map(k => daily[k] || 0);
    const max = Math.max(1, ...values);
    chart.innerHTML = values.map(v => `<div class="bar" style="height:${Math.round((v / max) * 100)}%" title="${v} min"></div>`).join('');

    const viol = document.getElementById('violations');
    const top = Object.entries(a.topViolations || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
    viol.textContent = top.length ? `Top violations: ${top.map(([h, c]) => h + " (" + c + ")").join(', ')}` : 'No violations yet.';
}

function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
}

async function initTheme() {
    const { theme } = await chrome.storage.local.get(['theme']);
    const t = theme || 'dark';
    const isDark = t === 'dark';
    themeToggle.checked = isDark;
    themeLabel.textContent = isDark ? 'Dark' : 'Light';
    applyTheme(isDark ? 'dark' : 'light');
    themeToggle.onchange = async () => {
        const v = themeToggle.checked ? 'dark' : 'light';
        await chrome.storage.local.set({ theme: v });
        themeLabel.textContent = v === 'dark' ? 'Dark' : 'Light';
        applyTheme(v);
    };
}

document.getElementById('addBan').onclick = () => {
    const val = document.getElementById('banInput').value.trim();
    if (val) { bans.push(val); renderLists(); renderChips(); attachChipHandlers(); }
};
document.getElementById('addPick').onclick = () => {
    const val = document.getElementById('pickInput').value.trim();
    if (val) { picks.push(val); renderLists(); renderChips(); attachChipHandlers(); }
};

document.getElementById('aiSuggest').onclick = async () => {
    const topic = prompt('What are you focusing on?');
    if (!topic) return;
    try {
        const result = await promptSuggestBansPicks(topic);
        bans = result.bans || [];
        picks = result.picks || [];
        renderLists(); renderChips(); attachChipHandlers();
    } catch (e) {
        bans = ['youtube.com', 'twitter.com', 'netflix.com'];
        picks = ['wikipedia.org', 'github.com'];
        renderLists(); renderChips(); attachChipHandlers();
    }
};

document.getElementById('lockIn').onclick = async () => {
    const minutes = parseInt(minutesEl.value, 10);
    const end = Date.now() + minutes * 60000;
    const session = { active: true, bans, picks, end, mode, start: Date.now(), pomodoro: pomodoroToggle && pomodoroToggle.checked };
    await chrome.storage.local.set({ session });
    try { await chrome.alarms.clear('lockin_end'); } catch (e) { }
    chrome.alarms.create('lockin_end', { when: end });
    // record start analytics
    const { analytics } = await chrome.storage.local.get(['analytics']);
    const a = analytics || {};
    a.sessionsStarted = (a.sessionsStarted || 0) + 1;
    a.lastStartedAt = Date.now();
    await chrome.storage.local.set({ analytics: a });
    await renderStatus();
};

document.getElementById('endSession').onclick = async () => {
    const { session } = await chrome.storage.local.get(['session']);
    if (session) {
        await chrome.storage.local.set({ session: { ...session, active: false } });
        try { await chrome.alarms.clear('lockin_end'); } catch (e) { }
        await renderStatus();
    }
};

(async function init() {
    await initTheme();
    renderLists();
    renderChips();
    attachChipHandlers();
    // preset minute chips
    document.querySelectorAll('.presets [data-min]').forEach(btn => {
        btn.onclick = () => { minutesEl.value = btn.getAttribute('data-min'); };
    });
    // update summaries when lists change through add buttons as well
    const addBanBtn = document.getElementById('addBan');
    const addPickBtn = document.getElementById('addPick');
    if (addBanBtn) {
        const orig = addBanBtn.onclick;
        addBanBtn.onclick = () => {
            const v = document.getElementById('banInput').value.trim();
            if (v) { bans.push(v); renderLists(); renderChips(); attachChipHandlers(); }
            updateSummaries();
            if (typeof orig === 'function') orig();
        };
    }
    if (addPickBtn) {
        const orig = addPickBtn.onclick;
        addPickBtn.onclick = () => {
            const v = document.getElementById('pickInput').value.trim();
            if (v) { picks.push(v); renderLists(); renderChips(); attachChipHandlers(); }
            updateSummaries();
            if (typeof orig === 'function') orig();
        };
    }
    await renderStatus();
    await renderAnalytics();
    // tick ring while active
    setInterval(renderStatus, 1000);
    initDragAndDrop();
    initFlipTiles();
})();

function initDragAndDrop() {
    const tiles = document.getElementById('tiles');
    const sections = Array.from(tiles.querySelectorAll('.tile'));
    sections.forEach((sec, idx) => {
        sec.setAttribute('draggable', 'true');
        sec.dataset.tileId = sec.getAttribute('style') || ('tile-' + idx);
        sec.addEventListener('dragstart', onDragStart);
        sec.addEventListener('dragover', onDragOver);
        sec.addEventListener('drop', onDrop);
    });

    let dragId = null;
    function onDragStart(e) { dragId = e.currentTarget.dataset.tileId; e.dataTransfer.effectAllowed = 'move'; }
    function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
    async function onDrop(e) {
        e.preventDefault();
        const target = e.currentTarget;
        const targetId = target.dataset.tileId;
        if (!dragId || dragId === targetId) return;
        const nodes = Array.from(tiles.children);
        const a = nodes.find(n => n.dataset.tileId === dragId);
        const b = nodes.find(n => n.dataset.tileId === targetId);
        if (!a || !b) return;
        if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) {
            tiles.insertBefore(b, a);
        } else {
            tiles.insertBefore(a, b);
        }
        // persist order by dataset indices
        const order = Array.from(tiles.querySelectorAll('.tile')).map(n => n.dataset.tileId);
        await chrome.storage.local.set({ tileOrder: order });
    }

    // restore order
    (async function () {
        const { tileOrder } = await chrome.storage.local.get(['tileOrder']);
        if (!tileOrder || !Array.isArray(tileOrder)) return;
        const map = Object.fromEntries(sections.map(s => [s.dataset.tileId, s]));
        tileOrder.forEach(id => { if (map[id]) tiles.appendChild(map[id]); });
    })();
}


