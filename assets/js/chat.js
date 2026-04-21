/**
 * YEO × GOOKIN VN Wash-off Survey — chat.js v2.0
 */

(function () {
  'use strict';

  const ENDPOINT = window.CONFIG?.ENDPOINT || 'https://survey-proxy-eh3r7dgeaq-du.a.run.app';
  const messages = [];
  let currentLang = detectLanguage();
  let sessionId = generateSessionId();
  let isCompleted = false;

  const chatWindow = document.getElementById('chat-window');
  const inputField = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const headerTitle = document.getElementById('header-title');
  const headerSubtitle = document.getElementById('header-subtitle');
  const langBadge = document.getElementById('lang-badge');
  const preLaunchBadge = document.getElementById('pre-launch-notice');

  function init() {
    const i18n = getI18n(currentLang);
    if (headerTitle) headerTitle.textContent = i18n.header_title;
    if (headerSubtitle) headerSubtitle.textContent = i18n.header_subtitle;
    if (langBadge) langBadge.textContent = i18n.language_badge;
    if (preLaunchBadge) preLaunchBadge.textContent = i18n.pre_launch_notice;
    if (inputField) inputField.placeholder = i18n.placeholder;
    if (sendBtn) sendBtn.textContent = i18n.send_button;
    renderGreeting();
    bindEvents();
  }

  function generateSessionId() {
    const ts = new Date().toISOString().replace(/[-:.TZ]/g, '').substring(0, 14);
    const rand = Math.random().toString(36).substring(2, 8);
    return `sess_${ts}_${rand}`;
  }

  function renderGreeting() {
    const i18n = getI18n(currentLang);
    appendMessage('assistant', i18n.greeting, true);
  }

  function bindEvents() {
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (inputField) {
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }
  }

  async function sendMessage() {
    if (isCompleted) return;
    const text = inputField.value.trim();
    if (!text) return;

    appendMessage('user', text);
    messages.push({ role: 'user', content: text });
    inputField.value = '';
    sendBtn.disabled = true;

    if (messages.filter(m => m.role === 'user').length === 1) {
      if (/[가-힣]/.test(text)) currentLang = 'ko';
      else if (/[ăâêôơưđà-ỹ]/i.test(text)) currentLang = 'vi';
    }

    showTyping();

    try {
      const resp = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          messages: messages
        })
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      hideTyping();

      let msg = data.message || '';
      msg = msg.replace(/<FINAL_JSON>[\s\S]*?<\/FINAL_JSON>/gi, '').trim();

      appendMessage('assistant', msg);
      messages.push({ role: 'assistant', content: msg });

      if (data.completed) {
        isCompleted = true;
        showCompletionBadge();
      }
    } catch (err) {
      hideTyping();
      appendMessage('assistant', `⚠️ 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요. (${err.message})`, false, true);
    } finally {
      sendBtn.disabled = false;
      if (inputField) inputField.focus();
    }
  }

  function appendMessage(role, content, isHTML = false, isError = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message message--${role}` + (isError ? ' message--error' : '');

    if (role === 'assistant') {
      const i18n = getI18n(currentLang);
      const avatar = document.createElement('div');
      avatar.className = 'message__avatar';
      avatar.textContent = i18n.avatar_letter;
      msgDiv.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = 'message__bubble';
    if (isHTML) {
      bubble.innerHTML = content;
    } else {
      bubble.textContent = content;
    }
    msgDiv.appendChild(bubble);

    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function showTyping() {
    const i18n = getI18n(currentLang);
    const typing = document.createElement('div');
    typing.id = 'typing-indicator';
    typing.className = 'message message--assistant message--typing';
    typing.innerHTML = `
      <div class="message__avatar">${i18n.avatar_letter}</div>
      <div class="message__bubble"><em>${i18n.typing}</em></div>
    `;
    chatWindow.appendChild(typing);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById('typing-indicator');
    if (t) t.remove();
  }

  function showCompletionBadge() {
    const badge = document.createElement('div');
    badge.className = 'completion-badge';
    badge.innerHTML = '✅ 인터뷰가 완료되었습니다. 소중한 의견 감사합니다!';
    chatWindow.appendChild(badge);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    if (inputField) inputField.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
