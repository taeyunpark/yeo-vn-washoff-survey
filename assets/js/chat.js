/**
 * YEO × GOOKIN VN Wash-off Survey — chat.js v2.2
 * 3-Screen 구조 + 중복 바인딩 방지
 */

if (window.__YEO_CHAT_LOADED__) {
  console.warn('chat.js already loaded, skipping re-init');
} else {
  window.__YEO_CHAT_LOADED__ = true;

  (function () {
    'use strict';

    const ENDPOINT = (window.CONFIG && window.CONFIG.ENDPOINT)
                     || 'https://survey-proxy-eh3r7dgeaq-du.a.run.app';
    const messages = [];
    let currentLang = 'ko';
    const sessionId = generateSessionId();
    const testerId = generateTesterId();
    let isCompleted = false;
    let isSending = false;
    let initDone = false;

    let welcomeScreen, chatScreen, completionScreen;
    let chatMessages, typingIndicator, inputField, sendBtn;
    let startBtn, testerIdDisplay, langBtns;

    function init() {
      if (initDone) {
        console.warn('init already done');
        return;
      }
      initDone = true;

      welcomeScreen = document.getElementById('welcome-screen');
      chatScreen = document.getElementById('chat-screen');
      completionScreen = document.getElementById('completion-screen');
      chatMessages = document.getElementById('chat-messages');
      typingIndicator = document.getElementById('typing-indicator');
      inputField = document.getElementById('user-input');
      sendBtn = document.getElementById('send-btn');
      startBtn = document.getElementById('start-btn');
      testerIdDisplay = document.getElementById('tester-id-display');
      langBtns = document.querySelectorAll('.lang-btn');

      if (typeof detectLanguage === 'function') {
        currentLang = detectLanguage();
      }
      updateLangUI(currentLang);
      applyI18nToWelcome();
      bindEvents();
    }

    function generateSessionId() {
      const ts = new Date().toISOString().replace(/[-:.TZ]/g, '').substring(0, 14);
      const rand = Math.random().toString(36).substring(2, 8);
      return 'sess_' + ts + '_' + rand;
    }

    function generateTesterId() {
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      return 'VN-T-' + rand;
    }

    function bindEvents() {
      langBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          currentLang = btn.getAttribute('data-lang');
          updateLangUI(currentLang);
          applyI18nToWelcome();
        });
      });

      if (startBtn) {
        startBtn.addEventListener('click', startInterview);
      }

      if (sendBtn) {
        sendBtn.addEventListener('click', handleSend);
      }

      if (inputField) {
        inputField.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            handleSend();
          }
        });
        inputField.addEventListener('input', function () {
          inputField.style.height = 'auto';
          inputField.style.height = Math.min(inputField.scrollHeight, 120) + 'px';
        });
      }
    }

    function updateLangUI(lang) {
      langBtns.forEach(function (b) {
        if (b.getAttribute('data-lang') === lang) b.classList.add('active');
        else b.classList.remove('active');
      });
    }

    function applyI18nToWelcome() {
      const titleMap = {
        ko: { line1: 'GOOKIN 워시오프팩', line2: '개발 인터뷰' },
        en: { line1: 'GOOKIN Wash-off Pack', line2: 'Development Interview' },
        vi: { line1: 'Mat na rua troi GOOKIN', line2: 'Phong van phat trien' }
      };
      const descMap = {
        ko: '⚠️ <strong>출시 전 개발 단계 샘플</strong>에 대한 의견을 듣고자 해요.<br>여러분의 의견이 실제 최종 제품에 반영됩니다.<br>약 10분 정도의 대화형 인터뷰입니다.',
        en: '⚠️ This is a <strong>pre-launch development sample</strong>.<br>Your feedback will directly shape the final product.<br>About 10-minute conversational interview.',
        vi: '⚠️ Day la <strong>mau phat trien truoc khi ra mat</strong>.<br>Phan hoi cua ban se anh huong den san pham cuoi cung.<br>Phong van hoi thoai khoang 10 phut.'
      };
      const startBtnMap = {
        ko: '인터뷰 시작하기',
        en: 'Start Interview',
        vi: 'Bat dau phong van'
      };
      const infoMap = {
        ko: { duration: '소요 시간: 약 10분', privacy: '응답은 익명으로 처리됩니다', language: '한국어 / English / Tieng Viet' },
        en: { duration: 'Duration: about 10 min', privacy: 'Responses are anonymous', language: '한국어 / English / Tieng Viet' },
        vi: { duration: 'Thoi luong: khoang 10 phut', privacy: 'Cau tra loi an danh', language: '한국어 / English / Tieng Viet' }
      };
      const placeholderMap = {
        ko: '답변을 입력하세요...',
        en: 'Type your message...',
        vi: 'Nhap cau tra loi...'
      };

      const t1 = document.querySelector('[data-i18n="welcome_title_line1"]');
      const t2 = document.querySelector('[data-i18n="welcome_title_line2"]');
      if (t1) t1.textContent = titleMap[currentLang].line1;
      if (t2) t2.textContent = titleMap[currentLang].line2;

      const desc = document.querySelector('[data-i18n="welcome_description"]');
      if (desc) desc.innerHTML = descMap[currentLang];

      const sBtn = document.querySelector('[data-i18n="start_button"]');
      if (sBtn) sBtn.textContent = startBtnMap[currentLang];

      const dur = document.querySelector('[data-i18n="info_duration"]');
      if (dur) dur.textContent = infoMap[currentLang].duration;
      const priv = document.querySelector('[data-i18n="info_privacy"]');
      if (priv) priv.textContent = infoMap[currentLang].privacy;
      const langInfo = document.querySelector('[data-i18n="info_language"]');
      if (langInfo) langInfo.textContent = infoMap[currentLang].language;

      if (inputField) inputField.placeholder = placeholderMap[currentLang];
    }

    function startInterview() {
      if (welcomeScreen) welcomeScreen.classList.add('hidden');
      if (chatScreen) chatScreen.classList.remove('hidden');
      if (testerIdDisplay) testerIdDisplay.textContent = testerId;

      const i18n = (typeof getI18n === 'function') ? getI18n(currentLang) : null;
      if (i18n && i18n.greeting) {
        appendMessage('assistant', i18n.greeting, true);
      } else {
        appendMessage('assistant', '안녕하세요! 저는 Elin (김연진)입니다.', true);
      }

      if (inputField) inputField.focus();
    }

    async function handleSend() {
      if (isSending || isCompleted) return;
      const text = inputField.value.trim();
      if (!text) return;

      isSending = true;
      sendBtn.disabled = true;

      inputField.value = '';
      inputField.style.height = 'auto';

      appendMessage('user', text);
      messages.push({ role: 'user', content: text });

      if (messages.filter(function (m) { return m.role === 'user'; }).length === 1) {
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

        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        hideTyping();

        let msg = data.message || '';
        msg = msg.replace(/<FINAL_JSON>[\s\S]*?<\/FINAL_JSON>/gi, '').trim();

        appendMessage('assistant', msg);
        messages.push({ role: 'assistant', content: msg });

        if (data.completed) {
          isCompleted = true;
          setTimeout(showCompletionScreen, 3000);
        }
      } catch (err) {
        hideTyping();
        appendMessage('assistant', '⚠️ 연결 오류: ' + err.message, false, true);
      } finally {
        isSending = false;
        sendBtn.disabled = false;
        if (inputField && !isCompleted) inputField.focus();
      }
    }

    function appendMessage(role, content, isHTML, isError) {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'message message-' + role + (isError ? ' message-error' : '');

      if (role === 'assistant') {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'E';
        msgDiv.appendChild(avatar);
      }

      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      if (isHTML) bubble.innerHTML = content;
      else bubble.textContent = content;
      msgDiv.appendChild(bubble);

      chatMessages.appendChild(msgDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTyping() {
      if (typingIndicator) typingIndicator.classList.remove('hidden');
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTyping() {
      if (typingIndicator) typingIndicator.classList.add('hidden');
    }

    function showCompletionScreen() {
      if (chatScreen) chatScreen.classList.add('hidden');
      if (completionScreen) completionScreen.classList.remove('hidden');
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
      init();
    }
  })();
}
