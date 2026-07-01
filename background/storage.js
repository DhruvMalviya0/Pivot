export async function saveSubmission(submissionData) {
  const result = await chrome.storage.local.get(['submissions', 'streak']);
  const submissions = result.submissions || [];
  
  const newSubmission = {
    id: Date.now(),
    date: new Date().toISOString(),
    problem: submissionData.problem,
    status: submissionData.status_msg,
    isFailed: submissionData.status_msg !== 'Accepted'
  };
  
  submissions.unshift(newSubmission);
  
  // Keep only the last 100 submissions for MVP to prevent storage limit issues
  if (submissions.length > 100) {
    submissions.pop();
  }
  
  // Update streak logic (simplified for MVP: 1 if solved today, 0 if not. Proper streak requires date math)
  const today = new Date().toDateString();
  let currentStreak = result.streak || { count: 0, lastSolvedDate: null };
  
  if (!newSubmission.isFailed) {
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
