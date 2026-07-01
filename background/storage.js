export async function saveSubmission(submissionData) {
  const result = await chrome.storage.local.get(['submissions', 'streak']);
  const submissions = result.submissions || [];
  
  // Determine if it passed. 
  let passed = submissionData.status_msg === 'Accepted';
  
  if (submissionData.isRun) {
    if (typeof submissionData.correct_answer === 'boolean') {
      passed = submissionData.correct_answer;
    } else if (typeof submissionData.compare_result === 'string') {
      passed = [...submissionData.compare_result].every((c) => c === '1');
    } else if (submissionData.code_answer && submissionData.expected_code_answer) {
      passed = JSON.stringify(submissionData.code_answer) === JSON.stringify(submissionData.expected_code_answer);
    } else {
      passed = false;
    }
  } else {
    // Submits
    if (submissionData.total_testcases !== undefined && submissionData.total_testcases > 0) {
      passed = passed && (submissionData.total_correct === submissionData.total_testcases);
    }
  }
  
  const newSubmission = {
    id: Date.now(),
    date: new Date().toISOString(),
    problem: submissionData.problem,
    status: passed ? 'Accepted' : (submissionData.status_msg === 'Accepted' ? 'Wrong Answer' : submissionData.status_msg),
    isFailed: !passed,
    isRun: submissionData.isRun
  };
  
  submissions.unshift(newSubmission);
  
  // Keep only the last 100 submissions for MVP to prevent storage limit issues
  if (submissions.length > 100) {
    submissions.pop();
  }
  
  // Update streak logic (simplified for MVP: 1 if solved today, 0 if not. Proper streak requires date math)
  const today = new Date().toDateString();
  let currentStreak = result.streak || { count: 0, lastSolvedDate: null };
  
  if (!newSubmission.isFailed && !newSubmission.isRun) {
    if (currentStreak.lastSolvedDate !== today) {
      // Check if last solved was yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (currentStreak.lastSolvedDate === yesterday.toDateString()) {
        currentStreak.count += 1;
      } else {
        currentStreak.count = 1;
      }
      currentStreak.lastSolvedDate = today;
    }
  }

  await chrome.storage.local.set({ 
    submissions: submissions,
    streak: currentStreak
  });
  
  return newSubmission;
}

export async function getHistory() {
  const result = await chrome.storage.local.get(['submissions', 'streak']);
  return {
    submissions: result.submissions || [],
    streak: result.streak || { count: 0, lastSolvedDate: null }
  };
}
