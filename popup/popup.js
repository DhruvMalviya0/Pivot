function renderUI(data) {
  // Populate API key if exists
  if (data.openrouterApiKey !== undefined) {
    document.getElementById('api-key').value = data.openrouterApiKey;
  }
  
  // Populate streak
  if (data.streak !== undefined) {
    const streakCount = data.streak?.count || 0;
    document.getElementById('streak-count').innerText = streakCount;
  }
  
  // Populate history
  if (data.submissions !== undefined) {
    const historyList = document.getElementById('history-list');
    const submissions = data.submissions || [];
    
    if (submissions.length === 0) {
      historyList.innerHTML = '<li class="history-item" style="color: #666; justify-content: center;">No submissions yet.</li>';
    } else {
      historyList.innerHTML = '';
      submissions.slice(0, 5).forEach(sub => {
        const li = document.createElement('li');
        li.className = 'history-item';
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'history-problem';
        titleSpan.innerText = sub.problem?.title || 'Unknown Problem';
        
        const statusSpan = document.createElement('span');
        statusSpan.className = `history-status ${sub.isFailed ? 'status-failed' : 'status-accepted'}`;
        statusSpan.innerText = sub.status || (sub.isFailed ? 'Failed' : 'Accepted');
        
        li.appendChild(titleSpan);
        li.appendChild(statusSpan);
        historyList.appendChild(li);
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Load initial data from storage
  const data = await chrome.storage.local.get(['openrouterApiKey', 'submissions', 'streak']);
  renderUI(data);

  // Listen for background updates
  chrome.storage.onChanged.addListener((changes) => {
    const newData = {};
    if (changes.openrouterApiKey) newData.openrouterApiKey = changes.openrouterApiKey.newValue;
    if (changes.submissions) newData.submissions = changes.submissions.newValue;
    if (changes.streak) newData.streak = changes.streak.newValue;
    renderUI(newData);
  });
  
  // Save API Key handler
  document.getElementById('save-key-btn').addEventListener('click', async () => {
    const key = document.getElementById('api-key').value.trim();
    const statusMsg = document.getElementById('save-status');
    
    if (key) {
      await chrome.storage.local.set({ openrouterApiKey: key });
      statusMsg.innerText = 'Key saved successfully!';
      setTimeout(() => statusMsg.innerText = '', 2000);
    } else {
      statusMsg.style.color = '#ff4444';
      statusMsg.innerText = 'Please enter a valid key.';
      setTimeout(() => {
        statusMsg.innerText = '';
        statusMsg.style.color = '#00ff88';
      }, 2000);
    }
  });
});
