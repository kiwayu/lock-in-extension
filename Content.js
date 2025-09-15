(async function () {
    try {
        const s = (await chrome.storage.local.get(['session'])).session;
        if (!s || !s.active) return;


        const href = location.href;
        const host = location.hostname;


        if (href.startsWith(chrome.runtime.getURL(''))) return;


        function hostMatches(host, pattern) {
            return host.includes(pattern);
        }


        const bannedHit = (s.bans || []).some(b => hostMatches(host, b));
        const inGrace = s.pomodoro && s.start ? (Date.now() - s.start) < 5*60000 : false;
        const violation = !inGrace && bannedHit;
        if (violation) {
            const missionUrl = chrome.runtime.getURL('mission.html') + '?from=' + encodeURIComponent(href);
            location.replace(missionUrl);
            return;
        }
    } catch (e) {
        console.error('content.js error', e);
    }
})();