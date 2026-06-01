// background.js - Extension icon click handler
// Opens app.html in a new tab, or focuses the existing one

chrome.action.onClicked.addListener(async () => {
  const appUrl = chrome.runtime.getURL("app.html");

  try {
    // Check if app.html is already open
    const tabs = await chrome.tabs.query({ url: appUrl });
    if (tabs.length > 0) {
      // Focus the existing tab
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    } else {
      // Open a new tab with app.html
      await chrome.tabs.create({ url: appUrl });
    }
  } catch (err) {
    console.error("Failed to open/focus app tab:", err);
    // Fallback: just open a new tab
    chrome.tabs.create({ url: appUrl });
  }
});
