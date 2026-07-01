// This script is injected into the LeetCode page's main world to intercept fetch and XHR requests.

// --- FETCH INTERCEPTOR ---
const originalFetch = window.fetch;

window.fetch = async function (...args) {
  const [resource, config] = args;
  const url = typeof resource === 'string' ? resource : resource?.url;

  // Intercept Submission POST (call #1)
  if (url && url.includes('/submit/') && config && config.method === 'POST') {
    try {
      const body = JSON.parse(config.body);
      
      window.postMessage({
        type: 'PIVOT_SUBMISSION_STARTED',
        payload: {
          url,
          lang: body.lang,
          question_id: body.question_id,
          typed_code: body.typed_code
        }
      }, '*');
    } catch (e) {
      console.error('Pivot: Error parsing fetch submission body', e);
    }
  }

  const response = await originalFetch.apply(this, args);

  // Intercept Submission Check GET (call #2)
  if (typeof url === 'string' && url.includes('/check/')) {
    // Clone so we don't consume the body LeetCode needs
    const clone = response.clone();
    
    clone.json().then(data => {
      if (data.state === 'SUCCESS') {
        window.postMessage({
          type: 'PIVOT_SUBMISSION_RESULT',
          payload: {
            url,
            status_msg: data.status_msg,
            state: data.state,
            question_id: data.question_id,
            status_code: data.status_code,
            total_correct: data.total_correct,
            total_testcases: data.total_testcases,
            compare_result: data.compare_result,
            compile_error: data.compile_error,
            full_error_message: data.full_error_message,
            std_output: data.std_output,
            expected_output: data.expected_output,
            code_output: data.code_output,
            last_testcase: data.last_testcase
          }
        }, '*');
      }
    }).catch(e => {
      // Ignore JSON parse errors for non-JSON responses
    });
  }

  return response;
};

// --- XHR INTERCEPTOR ---
const originalXHR = window.XMLHttpRequest;

function newXHR() {
  const xhr = new originalXHR();
  let method, url;

  const originalOpen = xhr.open;
  xhr.open = function(m, u, ...rest) {
    method = m;
    url = u;
    return originalOpen.apply(xhr, [m, u, ...rest]);
  };

  const originalSend = xhr.send;
  xhr.send = function(body) {
    // Intercept Submission POST
    if (url && url.includes('/submit/') && method === 'POST') {
      try {
        const parsedBody = JSON.parse(body);
        window.postMessage({
          type: 'PIVOT_SUBMISSION_STARTED',
          payload: {
            url,
            lang: parsedBody.lang,
            question_id: parsedBody.question_id,
            typed_code: parsedBody.typed_code
          }
        }, '*');
      } catch (e) {
        console.error('Pivot: Error parsing XHR submission body', e);
      }
    }

    xhr.addEventListener('load', function() {
      // Intercept Submission Check GET
      if (url && url.includes('/check/')) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.state === 'SUCCESS') {
            window.postMessage({
              type: 'PIVOT_SUBMISSION_RESULT',
              payload: {
                url,
                status_msg: data.status_msg,
                state: data.state,
                question_id: data.question_id,
                status_code: data.status_code,
                total_correct: data.total_correct,
                total_testcases: data.total_testcases,
                compare_result: data.compare_result,
                compile_error: data.compile_error,
                full_error_message: data.full_error_message,
                std_output: data.std_output,
                expected_output: data.expected_output,
                code_output: data.code_output,
                last_testcase: data.last_testcase
              }
            }, '*');
          }
        } catch (e) {
          // Ignore JSON parse error
        }
      }
    });

    return originalSend.apply(xhr, arguments);
  };

  return xhr;
}

window.XMLHttpRequest = newXHR;

console.log('Pivot: Network interceptors attached successfully.');
