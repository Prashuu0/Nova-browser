export const AUTOFILL_CAPTURE_SCRIPT = `
(function() {
  if (window.__novaCaptureInstalled) return;
  window.__novaCaptureInstalled = true;

  function findUsernameInput(form) {
    return form.querySelector(
      'input[type="email"], input[autocomplete="username"], input[autocomplete="email"], ' +
      'input[name*="user" i], input[name*="login" i], input[name*="email" i], ' +
      'input[id*="user" i], input[id*="login" i], input[id*="email" i], ' +
      'input[type="text"]'
    );
  }

  document.addEventListener('submit', function(e) {
    try {
      const form = e.target;
      if (!form || form.tagName !== 'FORM') return;
      const passwordInput = form.querySelector('input[type="password"]');
      const usernameInput = findUsernameInput(form);
      if (!passwordInput || !usernameInput) return;
      const payload = {
        origin: location.origin,
        url: location.href,
        username: usernameInput.value,
        password: passwordInput.value
      };
      if (payload.username && payload.password) {
        console.log('__NOVA_PW__:' + JSON.stringify(payload));
      }
    } catch (err) {}
  }, true);

  document.addEventListener('focusin', function(e) {
    try {
      const el = e.target;
      if (!el || el.tagName !== 'INPUT') return;
      if (el.type === 'password' || el.type === 'email' || el.type === 'text') {
        console.log('__NOVA_FOCUS__:' + JSON.stringify({ origin: location.origin, type: el.type }));
      }
    } catch (err) {}
  }, true);
})();
true;
`;

export function buildAutofillScript(credentials) {
  if (!credentials || credentials.length === 0) return 'true;';
  const cred = credentials[0];
  const user = JSON.stringify(cred.username);
  const pass = JSON.stringify(cred.password);
  return `
(function() {
  function findUsernameInput(form) {
    return form.querySelector(
      'input[type="email"], input[autocomplete="username"], input[autocomplete="email"], ' +
      'input[name*="user" i], input[name*="login" i], input[name*="email" i], ' +
      'input[id*="user" i], input[id*="login" i], input[id*="email" i], ' +
      'input[type="text"]'
    );
  }
  const forms = document.querySelectorAll('form');
  forms.forEach(function(form) {
    const passwordInput = form.querySelector('input[type="password"]');
    const usernameInput = findUsernameInput(form);
    if (usernameInput && !usernameInput.value) usernameInput.value = ${user};
    if (passwordInput && !passwordInput.value) passwordInput.value = ${pass};
  });
})();
true;
`;
}

export const EXTRACT_ARTICLE_SCRIPT = `
(function() {
  const title = document.title || '';
  const selectors = ['article', 'main', '[role="main"]', '.post-content', '.article-body', '.entry-content', '#content', '.content'];
  let el = null;
  for (const sel of selectors) {
    el = document.querySelector(sel);
    if (el && el.innerText.trim().length > 200) break;
  }
  if (!el) el = document.body;
  const text = el.innerText || '';
  const html = el.innerHTML || '';
  return {
    title,
    text: text.slice(0, 30000),
    html: html.slice(0, 80000),
    url: location.href,
    excerpt: text.slice(0, 300).trim()
  };
})();
`;
