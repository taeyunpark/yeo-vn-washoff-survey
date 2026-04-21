/**
 * YEO × GOOKIN VN Wash-off Survey — chat.js v2.2
 * 3-Screen 구조 + 중복 바인딩 방지
 */

// 중복 실행 방지 글로벌 플래그
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
    let isSending = false;              // 🔒 중복 전송 방지 락
    let initDone = false;               // 🔒 init 중복 방지

    // DOM
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
      return `sess_${ts}_${rand}`;
    }

    function generateTesterId() {
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `VN-T-${rand}`;
    }

    function bindEvents() {
      // 언어 버튼
      langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          currentLang = btn.getAttribute('data-lang');
          updateLangUI(currentLang);
          applyI18nToWelcome();
        });
      });

      // 시작 버튼
      if (startBtn) {
        startBtn.addEventListener('click', startInterview);
      }

      // 전송 버튼
      if (sendBtn) {
        sendBtn.addEventListener('click', handleSend);
      }

      // textarea 엔터키 + 자동높이
      if (inputField) {
        inputField.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            handleSend();
          }
        });
        inputField.addEventListener('input', () => {
          inputField.style.height = 'auto';
          inputField.style.height = Math.min(inputField.scrollHeight, 120) + 'px';
        });
      }
    }

    function updateLangUI(lang) {
      langBtns.forEach(b => {
        if (b.getAttribute('data-lang') === lang) b.classList.add('active');
        else b.classList.remove('active');
      });
    }

    function applyI18nToWelcome() {
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
      const placeholderMap = {
        ko: '답변을 입력하세요...',
        en: 'Type your message...',
        vi: 'Nhập câu trả lời...'
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
      if (langInfo) langInfo.textContent = i
