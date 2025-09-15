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
chrome.scripting.executeScript({
target: {tabId},
func: () => {
location.replace(chrome.runtime.getURL('mission.html') + '?from=' + encodeURIComponent(location.href));
}
});
}
});