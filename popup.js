const banList = document.getElementById('banList');
const pickList = document.getElementById('pickList');
const statusEl = document.getElementById('status');
const themeSelect = document.getElementById('theme');
const modeChips = document.getElementById('modeChips');
const endBtn = document.getElementById('endSession');
let bans = [];
let picks = [];
let mode = 'block';


async function render() {
    banList.innerHTML = bans.map(b => `<li>${b}</li>`).join('');
    pickList.innerHTML = picks.map(p => `<li>${p}</li>`).join('');
    const { session } = await chrome.storage.local.get(['session']);
    if (session && session.active) {
        const minsLeft = Math.max(0, Math.ceil((session.end - Date.now()) / 60000));
        statusEl.textContent = `Active — ${minsLeft} min left`;
        endBtn.style.display = '';
    } else {
        statusEl.textContent = '';
        endBtn.style.display = 'none';
    }
    mode = (session && session.mode) || 'block';
    modeChips.innerHTML = ['Block (ban-list)', 'Allow (pick-only)'].map((label, idx) => {
        const key = idx === 0 ? 'block' : 'allow';
        const active = mode === key ? 'active' : '';
        return `<button class="chip ${active}" data-mode="${key}">${label}</button>`;
    }).join('');
    document.querySelectorAll('#modeChips .chip').forEach(btn => {
        btn.onclick = () => { mode = btn.getAttribute('data-mode'); render(); };
    });
}

(async function initTheme() {
    const { theme } = await chrome.storage.local.get(['theme']);
    themeSelect.value = theme || 'system';
    applyTheme(themeSelect.value);
    themeSelect.onchange = async () => {
        const v = themeSelect.value;
        await chrome.storage.local.set({ theme: v });
        applyTheme(v);
    };
})();

function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
}


document.getElementById('addBan').onclick = () => {
    const val = document.getElementById('banInput').value.trim();
    if (val) { bans.push(val); render(); }
};


document.getElementById('addPick').onclick = () => {
    const val = document.getElementById('pickInput').value.trim();
    if (val) { picks.push(val); render(); }
};


// AI Suggest
async function aiSuggest() {
    const topic = prompt('What are you focusing on?');
    if (!topic) return;


    try {
        const result = await promptSuggestBansPicks(topic);
        bans = result.bans || [];
        picks = result.picks || [];
        render();
    } catch (e) {
        alert('AI unavailable, using demo suggestions.');
        bans = ['youtube.com', 'twitter.com', 'netflix.com'];
        picks = ['wikipedia.org', 'github.com'];
        render();
    }
}


document.getElementById('aiSuggest').onclick = aiSuggest;


document.getElementById('lockIn').onclick = async () => {
    const minutes = parseInt(document.getElementById('minutes').value, 10);
    const end = Date.now() + minutes * 60000;
    const session = { active: true, bans, picks, end, mode, start: Date.now() };
    await chrome.storage.local.set({ session });
    try { await chrome.alarms.clear('lockin_end'); } catch (e) { }
    chrome.alarms.create('lockin_end', { when: end });
    alert('Locked in!');
    // record start analytics
    const { analytics } = await chrome.storage.local.get(['analytics']);
    const a = analytics || {};
    a.sessionsStarted = (a.sessionsStarted || 0) + 1;
    a.lastStartedAt = Date.now();
    await chrome.storage.local.set({ analytics: a });
    render();
};

endBtn.onclick = async () => {
    const { session } = await chrome.storage.local.get(['session']);
    if (session) {
        await chrome.storage.local.set({ session: { ...session, active: false } });
        try { await chrome.alarms.clear('lockin_end'); } catch (e) { }
        alert('Session ended.');
        render();
    }
};


render();