// Content script to inject the SOP Assistant sidebar on Google Docs & CommonApp

(function() {
  // Prevent duplicate injections
  if (document.getElementById('sop-assistant-root')) return;

  const root = document.createElement('div');
  root.id = 'sop-assistant-root';
  root.style.position = 'fixed';
  root.style.zIndex = '2147483647'; // Maximum z-index
  root.style.bottom = '20px';
  root.style.right = '20px';
  root.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  document.body.appendChild(root);

  // 1. Create Floating Badge/Button to Toggle Sidebar
  const badge = document.createElement('button');
  badge.id = 'sop-assistant-badge';
  badge.innerHTML = `<img src="${chrome.runtime.getURL('icons/icon128.png')}" style="width: 28px; height: 28px; object-fit: contain; pointer-events: none;" alt="SOPIA" />`;
  badge.style.width = '52px';
  badge.style.height = '52px';
  badge.style.borderRadius = '50%';
  badge.style.background = 'linear-gradient(135deg, #6366f1, #7c3aed)';
  badge.style.border = 'none';
  badge.style.color = '#ffffff';
  badge.style.fontSize = '22px';
  badge.style.cursor = 'pointer';
  badge.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
  badge.style.display = 'flex';
  badge.style.alignItems = 'center';
  badge.style.justifyContent = 'center';
  badge.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  badge.style.outline = 'none';
  root.appendChild(badge);

  // 2. Create the Sidebar Iframe Container
  const iframeContainer = document.createElement('div');
  iframeContainer.id = 'sop-assistant-sidebar-container';
  iframeContainer.style.position = 'fixed';
  iframeContainer.style.top = '0';
  iframeContainer.style.right = '0';
  iframeContainer.style.width = '420px';
  iframeContainer.style.height = '100vh';
  iframeContainer.style.background = '#090a10';
  iframeContainer.style.boxShadow = '-10px 0 35px rgba(0,0,0,0.5)';
  iframeContainer.style.borderLeft = '1px solid rgba(255, 255, 255, 0.08)';
  iframeContainer.style.transform = 'translateX(105%)'; // Hidden initially
  iframeContainer.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
  iframeContainer.style.display = 'flex';
  iframeContainer.style.flexDirection = 'col';
  iframeContainer.style.zIndex = '2147483646';
  document.body.appendChild(iframeContainer);

  // 3. Create the Iframe loading the React Web App
  const iframe = document.createElement('iframe');
  iframe.src = 'http://localhost:5173/?embed=true'; // Pointing to local development website
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.background = 'transparent';
  iframeContainer.appendChild(iframe);

  // Close Button inside Sidebar Container
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.position = 'absolute';
  closeBtn.style.left = '-35px';
  closeBtn.style.top = '15px';
  closeBtn.style.width = '35px';
  closeBtn.style.height = '35px';
  closeBtn.style.background = '#090a10';
  closeBtn.style.border = '1px solid rgba(255, 255, 255, 0.08)';
  closeBtn.style.borderRight = 'none';
  closeBtn.style.borderTopLeftRadius = '8px';
  closeBtn.style.borderBottomLeftRadius = '8px';
  closeBtn.style.color = '#94a3b8';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '14px';
  closeBtn.style.display = 'flex';
  closeBtn.style.alignItems = 'center';
  closeBtn.style.justifyContent = 'center';
  iframeContainer.appendChild(closeBtn);

  // Toggle Functionality
  let isOpen = false;
  const toggleSidebar = () => {
    isOpen = !isOpen;
    if (isOpen) {
      iframeContainer.style.transform = 'translateX(0)';
      badge.style.transform = 'scale(0) rotate(90deg)'; // Hide badge when sidebar open
    } else {
      iframeContainer.style.transform = 'translateX(105%)';
      badge.style.transform = 'scale(1) rotate(0)'; // Show badge
    }
  };

  badge.addEventListener('click', toggleSidebar);
  closeBtn.addEventListener('click', toggleSidebar);

  // Hover animations for badge
  badge.addEventListener('mouseenter', () => {
    badge.style.transform = 'scale(1.1) translateY(-2px)';
    badge.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.5)';
  });
  badge.addEventListener('mouseleave', () => {
    if (!isOpen) {
      badge.style.transform = 'scale(1) translateY(0)';
      badge.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
    }
  });

  // ==========================================
  // Text Extraction & Insertion logic
  // ==========================================
  const extractPageText = () => {
    // 1. First, check if there's any active text selection
    const selection = window.getSelection().toString();
    if (selection) return selection;

    // 2. Google Docs specific selector
    const docParagraphs = document.querySelectorAll('.kix-paragraphrenderer');
    if (docParagraphs.length > 0) {
      return Array.from(docParagraphs).map(p => p.textContent).join('\n');
    }
    
    const docParagraphsAlt = document.querySelectorAll('.kix-paragraph');
    if (docParagraphsAlt.length > 0) {
      return Array.from(docParagraphsAlt).map(p => p.textContent).join('\n');
    }

    // 3. Fallback: Search active element
    const active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || active.isContentEditable || active.tagName === 'INPUT')) {
      return active.value || active.textContent || '';
    }

    // 4. CommonApp or other contenteditables
    const editable = document.querySelector('[contenteditable="true"]');
    if (editable) {
      return editable.innerText || editable.textContent || '';
    }

    const textarea = document.querySelector('textarea');
    if (textarea) return textarea.value;

    return document.body.innerText;
  };

  const insertTextToPage = (text) => {
    const active = document.activeElement;
    
    // If textarea or standard inputs
    if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
      const start = active.selectionStart || 0;
      const end = active.selectionEnd || 0;
      const val = active.value;
      active.value = val.substring(0, start) + text + val.substring(end);
      // Trigger change events
      active.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    // If contenteditable
    if (active && active.isContentEditable) {
      const selection = window.getSelection();
      if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.selectNodeContents(textNode);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        active.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }

    // Otherwise write to clipboard so user can paste manually
    navigator.clipboard.writeText(text).then(() => {
      alert("Active editor not detected. Text copied to clipboard! Paste it using Ctrl+V.");
    });
    return false;
  };

  // 4. Message Receiver from Iframe
  window.addEventListener('message', (event) => {
    // Only accept messages from localhost or our iframe src origin
    if (!event.origin.startsWith('http://localhost:5173')) return;

    const data = event.data;
    if (!data || !data.type) return;

    if (data.type === 'REQUEST_PAGE_TEXT') {
      const extractedText = extractPageText();
      iframe.contentWindow.postMessage({
        type: 'SEND_PAGE_TEXT',
        text: extractedText
      }, event.origin);
    } 
    else if (data.type === 'INSERT_PAGE_TEXT') {
      insertTextToPage(data.text);
    }
  });

})();
