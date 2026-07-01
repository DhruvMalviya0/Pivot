async function getApiKey() {
  const result = await chrome.storage.local.get(['openrouterApiKey']);
  return result.openrouterApiKey;
}

export async function generateHint(problemMeta, submissionData) {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    throw new Error('API Key not set. Please set it in the Pivot popup.');
  }

  let runNote = '';
  if (submissionData.isRun) {
    runNote = '\nNote: The user only clicked "Run", which tests visible sample cases. Warn them that fixing this might not cover hidden edge cases.';
  }

  const prompt = `
You are an expert competitive programming coach. 
The user is working on the LeetCode problem "${problemMeta.title}" (${problemMeta.slug}).
They submitted a solution that failed. 

Here is the status: ${submissionData.status_msg}
Language: ${submissionData.lang}

Here is their code:
\`\`\`${submissionData.lang}
${submissionData.code}
\`\`\`

If there was an error message or failed test case:
Expected Output: ${submissionData.expected_output || 'N/A'}
User Output: ${submissionData.code_output || 'N/A'}
Error Message: ${submissionData.full_error_message || 'N/A'}
${runNote}

Provide EXACTLY ONE hint to help them get un-stuck. 
Do NOT provide the full solution. Do NOT rewrite their code. 
Keep it concise, encouraging, and point them to the logical flaw or edge case they missed.
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/DhruvMalviya0/Pivot', // Required by OpenRouter
        'X-Title': 'Pivot LeetCode Coach', // Optional but recommended
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openrouter/free', // Uses OpenRouter's auto-router for guaranteed free models
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Pivot LLM Error:', error);
    throw error;
  }
}
