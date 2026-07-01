import { generateHint } from './llm.js';
import { saveSubmission } from './storage.js';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PIVOT_SUBMISSION_RESULT') {
    const fullData = message.payload;
    console.log('Pivot Background: Received full submission result event', fullData);
    
    // Save submission to storage asynchronously
    saveSubmission(fullData).catch(err => console.error('Pivot Background: Error saving submission', err));

    // Determine if it passed.
    // For Submits, total_testcases and total_correct are accurate. 
    // For Runs, we must check correct_answer, compare_result, or code_answer.
    let passed = fullData.status_msg === 'Accepted';
    
    if (fullData.isRun) {
      if (typeof fullData.correct_answer === 'boolean') {
        passed = fullData.correct_answer;
      } else if (typeof fullData.compare_result === 'string') {
        passed = [...fullData.compare_result].every((c) => c === '1');
      } else if (fullData.code_answer && fullData.expected_code_answer) {
        passed = JSON.stringify(fullData.code_answer) === JSON.stringify(fullData.expected_code_answer);
      } else {
        passed = false; // If we have absolutely no way to verify run success, err on side of failure to give hint
      }
    } else {
      // Submits
      if (fullData.total_testcases !== undefined && fullData.total_testcases > 0) {
        passed = passed && (fullData.total_correct === fullData.total_testcases);
      }
    }
                   
    const isFailed = !passed;
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
