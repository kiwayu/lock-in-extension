chrome.runtime.onInstalled.addListener(() => {
chrome.storage.local.set({ session: null });
});


// Listen for tab updates and enforce lock
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
if(changeInfo.status !== 'loading') return;
const data = await chrome.storage.local.get(['session']);
const s = data.session;
if(!s || !s.active) return;


const url = new URL(tab.url);
if(s.bans.some(b => url.hostname.includes(b))){
// Violation: break lock-in
await chrome.storage.local.set({ session: { ...s, active: false } });
try { await chrome.alarms.clear('lockin_end'); } catch(e) {}
try {
chrome.notifications.create('lockin_failed', {
type: 'basic',
iconUrl: 'icon128.png',
title: 'Lock-In Broken',
message: 'You opened a banned site. Session ended.'
});
} catch(e) {}
chrome.scripting.executeScript({
target: {tabId},
func: () => {
location.replace(chrome.runtime.getURL('mission.html') + '?from=' + encodeURIComponent(location.href));
}
});
}
});


// Timer end handling
chrome.alarms.onAlarm.addListener(async (alarm) => {
if (alarm.name !== 'lockin_end') return;
const data = await chrome.storage.local.get(['session']);
const s = data.session;
if (!s) return;
await chrome.storage.local.set({ session: { ...s, active: false } });
try {
chrome.notifications.create('lockin_done', {
type: 'basic',
iconUrl: 'icon128.png',
title: 'Lock-In Complete',
message: 'Great job! Your focus timer has ended.'
});
} catch(e) {}
});