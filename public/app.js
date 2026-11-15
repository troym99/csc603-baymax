(() => {
  const welcome = document.getElementById('welcome');
  const messages = document.getElementById('messages');
  const chatForm = document.getElementById('chatForm');
  const input = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const charCount = document.getElementById('charCount');
  const chatScroll = document.getElementById('chatScroll');
  const authModal = document.getElementById('authModal');
  const authForm = document.getElementById('authForm');
  const authError = document.getElementById('authError');
  const authSubmit = document.getElementById('authSubmit');
  const username = document.getElementById('username');
  const password = document.getElementById('password');
  const sidebar = document.getElementById('sidebar');
  let mode = 'login';
  let currentUser = null;
  let pendingMessage = '';
  let busy = false;

  async function api(path, options = {}) {
    const response = await fetch(`/api/${path}`, {
      credentials: 'same-origin',
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    if (response.status === 204) return {};
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || 'Something went wrong. Please try again.');
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function setUser(user) {
    currentUser = user || null;
    const signedIn = Boolean(currentUser);
    document.getElementById('accountName').textContent = signedIn ? currentUser.username : 'Welcome';
    document.getElementById('accountSub').textContent = signedIn ? 'Signed in to Baymax' : 'Sign in to get started';
    document.getElementById('avatar').textContent = signedIn ? currentUser.username.slice(0, 1).toUpperCase() : 'B';
    document.getElementById('topSignin').textContent = signedIn ? 'Sign out' : 'Sign in';
  }

  function openAuth(message = '') {
    pendingMessage = message;
    authError.textContent = '';
    authModal.classList.add('open');
    authModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => username.focus(), 100);
  }

  function closeAuth() {
    authModal.classList.remove('open');
    authModal.setAttribute('aria-hidden', 'true');
  }

  function setMode(nextMode) {
    mode = nextMode;
    const signup = mode === 'signup';
    document.getElementById('loginTab').classList.toggle('selected', !signup);
    document.getElementById('signupTab').classList.toggle('selected', signup);
    document.getElementById('authTitle').textContent = signup ? 'Create your account' : 'Welcome to Baymax';
    document.querySelector('.modal-intro').textContent = signup
      ? 'Create an account to start chatting with Baymax.'
      : 'Sign in or create an account to start chatting with Baymax.';
    authSubmit.innerHTML = `${signup ? 'Create account' : 'Sign in'} <span>→</span>`;
    password.autocomplete = signup ? 'new-password' : 'current-password';
    authError.textContent = '';
  }

  function scrollToLatest() {
    requestAnimationFrame(() => { chatScroll.scrollTop = chatScroll.scrollHeight; });
  }

  function addMessage(role, text, loading = false) {
    const row = document.createElement('article');
    row.className = `message-row ${role}`;
    if (role === 'assistant') {
      const avatar = document.createElement('span');
      avatar.className = 'message-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.innerHTML = '<svg viewBox="0 0 40 40"><path d="M20 5.5 32 10v9.4c0 7.6-4.9 12.7-12 15.1-7.1-2.4-12-7.5-12-15.1V10l12-4.5Z"/><path d="M20 13v12M14 19h12"/></svg>';
      row.append(avatar);
    }
    const content = document.createElement('div');
    content.className = 'message-content';
    const name = document.createElement('div');
    name.className = 'message-name';
    name.textContent = role === 'user' ? 'You' : 'Baymax';
    content.append(name);
    if (loading) {
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      bubble.setAttribute('aria-label', 'Baymax is thinking');
      bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
      content.append(bubble);
    } else {
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      bubble.textContent = text;
      content.append(bubble);
      if (role === 'assistant') {
        const status = document.createElement('div');
        status.className = 'message-status';
        status.textContent = 'General health information · Talk with a clinician about personal medical advice';
        content.append(status);
      }
    }
    row.append(content);
    messages.append(row);
    messages.classList.add('has-messages');
    welcome.hidden = true;
    scrollToLatest();
    return row;
  }

  async function sendMessage(message) {
    const text = message.trim();
    if (!text || busy) return;
    if (!currentUser) {
      openAuth(text);
      return;
    }
    busy = true;
    addMessage('user', text);
    input.value = '';
    updateInput();
    sendButton.disabled = true;
    const pending = addMessage('assistant', '', true);
    try {
      const data = await api('inference/generate', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });
      const bubble = pending.querySelector('.message-bubble');
      bubble.textContent = data.message || 'I couldn’t create a response. Please try again.';
      bubble.removeAttribute('aria-label');
      const status = document.createElement('div');
      status.className = 'message-status';
      status.textContent = 'General health information · Talk with a clinician about personal medical advice';
      pending.querySelector('.message-content').append(status);
    } catch (error) {
      if (error.status === 401) {
        pending.remove();
        messages.classList.toggle('has-messages', messages.children.length > 0);
        if (!messages.children.length) welcome.hidden = false;
        openAuth(text);
      } else {
        const bubble = pending.querySelector('.message-bubble');
        bubble.textContent = error.message === 'Baymax is unavailable'
          ? 'I’m having trouble connecting right now. Please try again in a moment.'
          : error.message;
        bubble.removeAttribute('aria-label');
      }
    } finally {
      busy = false;
      sendButton.disabled = false;
      input.focus();
      scrollToLatest();
    }
  }

  function updateInput() {
    charCount.textContent = `${input.value.length} / 2000`;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  }

  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    sendMessage(input.value);
  });
  input.addEventListener('input', updateInput);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      chatForm.requestSubmit();
    }
  });
  document.querySelectorAll('[data-prompt]').forEach((button) => {
    button.addEventListener('click', () => sendMessage(button.dataset.prompt));
  });
  document.getElementById('newChat').addEventListener('click', () => {
    messages.replaceChildren();
    messages.classList.remove('has-messages');
    welcome.hidden = false;
    input.value = '';
    updateInput();
    input.focus();
    sidebar.classList.remove('open');
  });
  document.getElementById('accountButton').addEventListener('click', () => {
    if (currentUser) {
      api('logout', { method: 'POST' }).catch(() => {}).finally(() => setUser(null));
    } else openAuth();
  });
  document.getElementById('topSignin').addEventListener('click', () => {
    if (currentUser) {
      api('logout', { method: 'POST' }).catch(() => {}).finally(() => setUser(null));
    } else openAuth();
  });
  document.getElementById('closeModal').addEventListener('click', closeAuth);
  authModal.addEventListener('click', (event) => { if (event.target === authModal) closeAuth(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeAuth(); });
  document.getElementById('loginTab').addEventListener('click', () => setMode('login'));
  document.getElementById('signupTab').addEventListener('click', () => setMode('signup'));
  document.getElementById('mobileMenu').addEventListener('click', () => sidebar.classList.toggle('open'));
  document.getElementById('chatNav').addEventListener('click', () => sidebar.classList.remove('open'));
  document.getElementById('aboutNav').addEventListener('click', () => {
    sidebar.classList.remove('open');
    document.querySelector('.bottom-disclaimer').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authError.textContent = '';
    authSubmit.disabled = true;
    authSubmit.textContent = mode === 'signup' ? 'Creating account…' : 'Signing in…';
    try {
      const data = await api(mode, {
        method: 'POST',
        body: JSON.stringify({ username: username.value, password: password.value }),
      });
      setUser(data.user);
      closeAuth();
      authForm.reset();
      if (pendingMessage) {
        const text = pendingMessage;
        pendingMessage = '';
        await sendMessage(text);
      }
    } catch (error) {
      authError.textContent = error.message;
    } finally {
      authSubmit.disabled = false;
      authSubmit.innerHTML = `${mode === 'signup' ? 'Create account' : 'Sign in'} <span>→</span>`;
    }
  });

  api('me', { method: 'GET', headers: {} }).then((data) => setUser(data.user)).catch(() => setUser(null));
})();