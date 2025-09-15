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


        for (const banned of (s.bans || [])) {
            if (hostMatches(host, banned)) {
                const missionUrl = chrome.runtime.getURL('mission.html') + '?from=' + encodeURIComponent(href);
                location.replace(missionUrl);
                return;
            }
        }
    } catch (e) {
        console.error('content.js error', e);
    }
})();