/**
 * YEO × GOOKIN VN Wash-off Survey — chat.js v2.1
 * 3-Screen (Welcome / Chat / Completion) 구조 호환
 */

(function () {
  'use strict';

  // ─── Config ───
  const ENDPOINT = (window.CONFIG && window.CONFIG.ENDPOINT) 
                   || 'https://survey-proxy-eh3r7dgeaq-du.a.run.app';
  const messages = [];
  let currentLang = 'ko';
  let sessionId = generateSessionId();
  let testerId = generateTesterId();
  let isCompleted = false;

  // ─── DOM ───
  const welcomeScreen = document.getElementById('welcome-screen');
  const chatScreen = document.getElementById('chat-screen');
  const completionScreen = document.getElementById('completion-screen');
  const chatMessages = document.getElementById('chat-messages');
  const typingIndicator = document.getElementById('typing-indicator');
  const inputField = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const startBtn = document.getElementById('start-btn');
  const testerIdDisplay = document.getElementById('tester-id-display');
  const langBtns = document.querySelectorAll('.lang-btn');

  // ─── Init ───
  function init() {
    // 브라우저 언어 자동 감지
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
    return `sess_${ts}_${rand}`;
  }

  function generateTesterId() {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VN-T-${rand}`;
  }

  // ─── Event Bindings ───
  function bindEvents() {
    // 언어 선택 버튼
    langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        currentLang = lang;
        updateLangUI(lang);
        applyI18nToWelcome();
      });
    });

    // 인터뷰 시작 버튼
    if (startBtn) {
      startBtn.addEventListener('click', startInterview);
    }

    // 메시지 전송
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (inputField) {
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      // textarea 자동 높이 조절
      inputField.addEventListener('input', () => {
        inputField.style.height = 'auto';
        inputField.style.height = Math.min(inputField.scrollHeight, 120) + 'px';
      });
    }
  }

  // ─── Language UI Update ───
  function updateLangUI(lang) {
    langBtns.forEach(b => {
      if (b.getAttribute('data-lang') === lang) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  function applyI18nToWelcome() {
    const i18n = (typeof getI18n === 'function') ? getI18n(currentLang) : null;
    if (!i18n) return;

    // Welcome Screen 텍스트 교체
    const titleMap = {
      ko: { line1: 'GOOKIN 워시오프팩', line2: '개발 인터뷰' },
      en: { line1: 'GOOKIN Wash-off Pack', line2: 'Development Interview' },
      vi: { line1: 'Mặt nạ rửa trôi GOOKIN', line2: 'Phỏng vấn phát triển' }
    };
    const descMap = {
      ko: '⚠️ <strong>출시 전 개발 단계 샘플</strong>에 대한 의견을 듣고자 해요.<br>여러분의 의견이 실제 최종 제품에 반영됩니다.<br>약 10분 정도의 대화형 인터뷰입니다.',
      en: '⚠️ This is a <strong>pre-launch development sample</strong>.<br>Your feedback will directly shape the final product.<br>About 10-minute conversational interview.',
      vi: '⚠️ Đây là <strong>mẫu phát triển trước khi ra mắt</strong>.<br>Phản hồi của bạn sẽ ảnh hưởng đến sản phẩm cuối cùng.<br>Phỏng vấn hội thoại khoảng 10 phút.'
    };
    const startBtnMap = {
      ko: '인터뷰 시작하기',
      en: 'Start Interview',
      vi: 'Bắt đầu phỏng vấn'
    };
    const infoMap = {
      ko: { duration: '소요 시간: 약 10분', privacy: '응답은 익명으로 처리됩니다', language: '한국어 / English / Tiếng Việt' },
      en: { duration: 'Duration: about 10 min', privacy: 'Responses are anonymous', language: '한국어 / English / Tiếng Việt' },
      vi: { duration: 'Thời lượng: khoảng 10 phút', privacy: 'Câu trả lời ẩn danh', language: '한국어 / English / Tiếng Việt' }
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

    // Input placeholder
    const placeholderMap = {
      ko: '답변을 입력하세요...',
      en: 'Type your message...',
      vi: 'Nhập câu trả lời...'
    };
    if (inputField) inputField.placeholder = placeholderMap[currentLang];
  }

  // ─── Start Interview ───
  function startInterview() {
    // 화면 전환: Welcome → Chat
    if (welcomeScreen) welcomeScreen.classList.add('hidden');
    if (chatScreen) chatScreen.classList.remove('hidden');
    if (testerIdDisplay) testerIdDisplay.textContent = testerId;

    // Elin의 첫 인사말 렌더링
    const i18n = (typeof getI18n === 'function') ? getI18n(currentLang) : null;
    if (i18n && i18n.greeting) {
      appendMessage('assistant', i18n.greeting, true);
    } else {
      appendMessage('assistant', '안녕하세요! 저는 Elin (김연진)입니다.', true);
    }

    if (inputField) inputField.focus();
  }

  // ─── Send Message ───
  async function sendMessage() {
    if (isCompleted) return;
    const text = inputField.value.trim();
    if (!text) return;

    appendMessage('user', text);
    messages.push({ role: 'user', content: text });
    inputField.value = '';
    inputField.style.height = 'auto';
    sendBtn.disabled = true;

    // 첫 사용자 메시지에서 언어 재감지
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

      // FINAL_JSON 2차 Safety Net
      let msg = data.message || '';
      msg = msg.replace(/<FINAL_JSON>[\s\S]*?<\/FINAL_JSON>/gi, '').trim();

      appendMessage('assistant', msg);
      messages.push({ role: 'assistant', content: msg });

      if (data.completed) {
        isCompleted = true;
        // 3초 후 완료 화면으로 전환
        setTimeout(showCompletionScreen, 3000);
      }
    } catch (err) {
      hideTyping();
      appendMessage('assistant', `⚠️ 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요. (${err.message})`, false, true);
    } finally {
      sendBtn.disabled = false;
      if (inputField && !isCompleted) inputField.focus();
    }
  }

  // ─── Message Rendering ───
  function appendMessage(role, content, isHTML, isError) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message message-${role}` + (isError ? ' message-error' : '');

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

  // ─── Entry ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
