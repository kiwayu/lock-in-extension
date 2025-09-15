const banList = document.getElementById('banList');
const pickList = document.getElementById('pickList');
const statusEl = document.getElementById('status');
const endBtn = document.getElementById('endSession');
let bans = [];
let picks = [];


async function render() {
    banList.innerHTML = bans.map(b => `<li>${b}</li>`).join('');
    pickList.innerHTML = picks.map(p => `<li>${p}</li>`).join('');
    const { session } = await chrome.storage.local.get(['session']);
    if (session && session.active) {
        const minsLeft = Math.max(0, Math.ceil((session.end - Date.now())/60000));
        statusEl.textContent = `Active — ${minsLeft} min left`;
        endBtn.style.display = '';
    } else {
        statusEl.textContent = '';
        endBtn.style.display = 'none';
    }
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
    const session = { active: true, bans, picks, end };
    await chrome.storage.local.set({ session });
    try { await chrome.alarms.clear('lockin_end'); } catch(e) {}
    chrome.alarms.create('lockin_end', { when: end });
    alert('Locked in!');
    render();
};

endBtn.onclick = async () => {
    const { session } = await chrome.storage.local.get(['session']);
    if (session) {
        await chrome.storage.local.set({ session: { ...session, active: false } });
        try { await chrome.alarms.clear('lockin_end'); } catch(e) {}
        alert('Session ended.');
        render();
    }
};


render();