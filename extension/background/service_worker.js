// SOP Writing Assistant - Background Service Worker (MV3)

chrome.runtime.onInstalled.addListener(() => {
  console.log("SOP Writing Assistant Extension successfully installed.");
});

// Optional: Listen for commands or messages from the popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "open_dashboard") {
    chrome.tabs.create({ url: "http://localhost:5173/" });
    sendResponse({ success: true });
  }
  return true;
});
