document.getElementById('open-site').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:5173/' });
});

document.getElementById('inject-sidebar').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  // Verify match pattern
  if (!tab.url || (!tab.url.includes('docs.google.com') && !tab.url.includes('commonapp.org'))) {
    alert("Please navigate to Google Docs (docs.google.com) or CommonApp (commonapp.org) to use the sidebar editor.");
    return;
  }

  // Programmatically trigger sidebar toggle in content script
  try {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const container = document.getElementById('sop-assistant-sidebar-container');
        const badge = document.getElementById('sop-assistant-badge');
        if (container) {
          const isHidden = container.style.transform.includes('105%');
          if (isHidden) {
            container.style.transform = 'translateX(0)';
            if (badge) badge.style.transform = 'scale(0) rotate(90deg)';
          } else {
            container.style.transform = 'translateX(105%)';
            if (badge) badge.style.transform = 'scale(1) rotate(0)';
          }
        } else {
          // If content script isn't loaded yet, request to reload page
          alert("Initializing SOP Assistant. If the floating badge doesn't appear, please reload the page.");
        }
      }
    });
    // Close popup
    window.close();
  } catch (error) {
    console.error("Script injection failed:", error);
  }
});
