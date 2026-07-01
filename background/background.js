import { generateHint } from './llm.js';
import { saveSubmission } from './storage.js';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PIVOT_SUBMISSION_RESULT') {
    const fullData = message.payload;
    console.log('Pivot Background: Received full submission result event', fullData);
    
    // Save submission to storage asynchronously
    saveSubmission(fullData).catch(err => console.error('Pivot Background: Error saving submission', err));

    // If it's a failed submission, we trigger the AI logic
    const isFailed = fullData.status_msg && fullData.status_msg !== 'Accepted';
    
    if (isFailed && fullData.code) {
      console.log('Pivot Background: Submission failed. Generating AI hint...');
      
      // Notify content script that we are generating a hint
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { type: 'PIVOT_HINT_LOADING' });
      }

      generateHint(fullData.problem, fullData)
        .then(hint => {
          console.log('Pivot Background: Hint generated', hint);
          if (sender.tab?.id) {
            chrome.tabs.sendMessage(sender.tab.id, { type: 'PIVOT_HINT_READY', payload: hint });
          }
        })
        .catch(err => {
          console.error('Pivot Background: Error generating hint', err);
          if (sender.tab?.id) {
            chrome.tabs.sendMessage(sender.tab.id, { type: 'PIVOT_HINT_ERROR', payload: err.message });
          }
        });
    }
  }
});
