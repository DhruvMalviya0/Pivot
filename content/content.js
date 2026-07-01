// Inject the interceptor script into the main world
function injectScript(file_path, node) {
  const th = document.getElementsByTagName(node)[0];
  const s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.setAttribute('src', file_path);
  th.appendChild(s);
}

injectScript(chrome.runtime.getURL('content/inject.js'), 'body');

// Extract basic problem info from the page
function getProblemMetadata() {
  // LeetCode URL pattern: https://leetcode.com/problems/problem-slug/...
  const match = window.location.pathname.match(/\/problems\/([^/]+)/);
  const slug = match ? match[1] : 'unknown-problem';
  
  // Try to get title from DOM (can be brittle, but good enough for MVP)
  const titleElement = document.querySelector('div[data-cy="question-title"]');
  const title = titleElement ? titleElement.textContent : slug;

  return { slug, title };
}

// Stash the latest code/lang (since question_id is often missing from the result payload)
let latestSubmission = {};

// Listen for messages from the injected script
window.addEventListener('message', function(event) {
  // Only accept messages from the same frame
  if (event.source !== window) return;

  if (event.data && event.data.type === 'PIVOT_SUBMISSION_STARTED') {
    const meta = getProblemMetadata();
    const payload = event.data.payload;
    console.log(`Pivot Content Script: ${payload.isRun ? 'Run' : 'Submission'} Started`, payload);
    
    // Stash it
    latestSubmission = {
      lang: payload.lang,
      code: payload.typed_code,
      isRun: payload.isRun,
      problem: meta
    };
  }

  if (event.data && event.data.type === 'PIVOT_SUBMISSION_RESULT') {
    const payload = event.data.payload;
    
    // Merge with latest stashed code (question_id is often undefined in Run checks)
    const stashed = latestSubmission || {};
    
    const fullData = {
      ...payload,
      lang: stashed.lang,
      code: stashed.code,
      isRun: stashed.isRun || payload.isRun || false,
      problem: stashed.problem || getProblemMetadata()
    };
    
    console.log(`Pivot Content Script: ${fullData.isRun ? 'Run' : 'Submission'} Result`, fullData);
    
    // Forward the merged object to background script
    chrome.runtime.sendMessage({
      type: 'PIVOT_SUBMISSION_RESULT',
      payload: fullData
    });
    
    // Cleanup
    latestSubmission = {};
  }
});

// Listen for messages from the background script (AI Hint)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PIVOT_HINT_LOADING') {
    renderHintUI('Analyzing your code...', true);
  }
  
  if (message.type === 'PIVOT_HINT_READY') {
    renderHintUI(message.payload, false);
  }

  if (message.type === 'PIVOT_HINT_ERROR') {
    renderHintUI(`Error: ${message.payload}`, false);
  }
});

// Simple UI rendering function
function renderHintUI(text, isLoading) {
  let container = document.getElementById('pivot-hint-container');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'pivot-hint-container';
    container.className = 'pivot-hint-container';
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'pivot-close-btn';
    closeBtn.innerText = '×';
    closeBtn.onclick = () => container.remove();
    
    const header = document.createElement('div');
    header.className = 'pivot-hint-header';
    header.innerText = 'Pivot AI Coach';
    header.appendChild(closeBtn);
    
    const content = document.createElement('div');
    content.id = 'pivot-hint-content';
    content.className = 'pivot-hint-content';
    
    container.appendChild(header);
    container.appendChild(content);
    document.body.appendChild(container);
  }

  const contentEl = document.getElementById('pivot-hint-content');
  
  if (isLoading) {
    contentEl.innerHTML = `<div class="pivot-spinner"></div><p>${text}</p>`;
  } else {
    // Simple markdown parsing for the MVP (handling code blocks and newlines)
    const formattedText = text
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\n/g, '<br>');
    contentEl.innerHTML = `<p>${formattedText}</p>`;
  }
}
