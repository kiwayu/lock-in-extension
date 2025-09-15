chrome.runtime.onInstalled.addListener(() => {
chrome.storage.local.set({ session: null });
});


// Listen for tab updates and enforce lock
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
if(changeInfo.status !== 'loading') return;
const data = await chrome.storage.local.get(['session','analytics']);
const s = data.session;
if(!s || !s.active) return;

try {
const url = new URL(tab.url);
const host = url.hostname || '';
const isBanned = (s.bans || []).some(b => host.includes(b));
// grace handling for pomodoro: allow banned during first 5 minutes from start
let inGrace = false;
if (s.pomodoro && s.start){
  inGrace = Date.now() - s.start < 5 * 60000;
}
const violation = !inGrace && isBanned;
if(violation){
// Violation: break lock-in
await chrome.storage.local.set({ session: { ...s, active: false } });
try { await chrome.alarms.clear('lockin_end'); } catch(e) {}
// Record analytics: broken session and top violation host
const a = data.analytics || {};
a.sessionsBroken = (a.sessionsBroken || 0) + 1;
a.lastBrokenAt = Date.now();
a.topViolations = a.topViolations || {};
a.topViolations[host] = (a.topViolations[host] || 0) + 1;
// credit minutes spent until break
if (s.start) {
  const mins = Math.max(0, Math.round((Date.now() - s.start)/60000));
  a.totalFocusedMinutes = (a.totalFocusedMinutes || 0) + mins;
  const key = new Date().toISOString().slice(0,10);
  a.daily = a.daily || {};
  a.daily[key] = (a.daily[key] || 0) + mins;
}
// daily session counters
const dayKeyB = new Date().toISOString().slice(0,10);
a.dailySessionsBroken = a.dailySessionsBroken || {};
a.dailySessionsBroken[dayKeyB] = (a.dailySessionsBroken[dayKeyB] || 0) + 1;
await chrome.storage.local.set({ analytics: a });
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
} catch(e) {}
});


// Timer end handling
chrome.alarms.onAlarm.addListener(async (alarm) => {
if (alarm.name !== 'lockin_end') return;
const data = await chrome.storage.local.get(['session','analytics']);
const s = data.session;
if (!s) return;
await chrome.storage.local.set({ session: { ...s, active: false } });
// Record analytics: completed session and minutes
const a = data.analytics || {};
a.sessionsCompleted = (a.sessionsCompleted || 0) + 1;
a.lastCompletedAt = Date.now();
if (s.start && s.end){
  const mins = Math.max(0, Math.round((s.end - s.start)/60000));
  a.totalFocusedMinutes = (a.totalFocusedMinutes || 0) + mins;
  const key = new Date().toISOString().slice(0,10);
  a.daily = a.daily || {};
  a.daily[key] = (a.daily[key] || 0) + mins;
}
// daily session counters
const dayKeyC = new Date().toISOString().slice(0,10);
a.dailySessionsCompleted = a.dailySessionsCompleted || {};
a.dailySessionsCompleted[dayKeyC] = (a.dailySessionsCompleted[dayKeyC] || 0) + 1;
await chrome.storage.local.set({ analytics: a });
try {
chrome.notifications.create('lockin_done', {
type: 'basic',
iconUrl: 'icon128.png',
title: 'Lock-In Complete',
message: 'Great job! Your focus timer has ended.'
});
} catch(e) {}
});