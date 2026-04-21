/**
 * chat.js — YEO VN Wash-off Survey Chatbot
 * 
 * Core logic for conversation management, API calls, and UI updates.
 */

// ===== State =====
let conversationHistory = [];
let testerID = null;
let interviewStarted = false;
let interviewCompleted = false;
let startTime = null;

// ===== DOM Elements =====
const $ = (sel) => document.querySelector(sel);
const welcomeScreen = $('#welcome-screen');
const chatScreen = $('#chat-screen');
const completionScreen = $('#completion-screen');
const chatMessages = $('#chat-messages');
const userInput = $('#user-input');
const sendBtn = $('#send-btn');
const startBtn = $('#start-btn');
const typingIndicator = $('#typing-indicator');
const testerIdDisplay = $('#tester-id-display');

// ===== Utility =====

/**
 * Tester ID 생성 (VN-T-XXXX)
 */
function generateTesterID() {
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `VN-T-${timestamp}`;
}

/**
 * 랜덤 지연 (타이핑 연출용)
 */
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * JSON 태그 제거 (응답자에게 노출 방지)
 */
function cleanMessage(text) {
  // <FINAL_JSON>...</FINAL_JSON> 태그와 내부 내용 제거
  return text.replace(/<FINAL_JSON>[\s\S]*?<\/FINAL_JSON>/g, '').trim();
}

/**
 * Final JSON 추출
 */
function extractFinalJSON(text) {
  const match = text.match(/<FINAL_JSON>([\s\S]*?)<\/FINAL_JSON>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch (e) {
    console.error('JSON parse error:', e);
    return null;
  }
}

// ===== UI Functions =====

/**
 * 메시지 추가 (사용자 or 봇)
 */
function addMessage(text, sender = 'bot') {
  const cleanText = sender === 'bot' ? cleanMessage(text) : text;
  if (!cleanText) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}`;

  if (sender === 'bot') {
    msgDiv.innerHTML = `
      <div class="message-avatar">Y</div>
      <div class="message-bubble">${escapeHtml(cleanText)}</div>
    `;
  } else {
    msgDiv.innerHTML = `
      <div class="message-bubble">${escapeHtml(cleanText)}</div>
    `;
  }

  chatMessages.appendChild(msgDiv);
  scrollToBottom();
}

/**
 * XSS 방지 HTML 이스케이프 (줄바꿈은 유지)
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/\n/g, '<br>');
}

/**
 * 채팅 영역 스크롤
 */
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

/**
 * 타이핑 인디케이터 표시/숨김
 */
function showTyping() {
  typingIndicator.classList.remove('hidden');
  chatScreen.appendChild(typingIndicator);
  scrollToBottom();
}

function hideTyping() {
  typingIndicator.classList.add('hidden');
}

/**
 * 입력 활성화/비활성화
 */
function setInputEnabled(enabled) {
  userInput.disabled = !enabled;
  sendBtn.disabled = !enabled;
  if (enabled) userInput.focus();
}

/**
 * Textarea 자동 리사이즈
 */
function autoResize() {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
}

// ===== Interview Flow =====

/**
 * 인터뷰 시작
 */
function startInterview() {
  testerID = generateTesterID();
  testerIdDisplay.textContent = testerID;
  startTime = Date.now();
  interviewStarted = true;

  welcomeScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');

  // 첫 인사 메시지 (i18n에서)
  setTimeout(() => {
    addMessage(t('greeting'), 'bot');
    setInputEnabled(true);
  }, 400);
}

/**
 * 인터뷰 완료
 */
function completeInterview(finalJSON) {
  interviewCompleted = true;
  setInputEnabled(false);

  // 최종 데이터 전송 (Sheets + Slack은 Cloud Function이 처리)
  if (CONFIG.DEBUG) {
    console.log('Final JSON:', finalJSON);
  }

  // 2초 후 완료 화면 전환
  setTimeout(() => {
    chatScreen.classList.add('hidden');
    completionScreen.classList.remove('hidden');
  }, 2500);
}

/**
 * 사용자 메시지 전송
 */
async function sendUserMessage() {
  const text = userInput.value.trim();
  if (!text || interviewCompleted) return;

  // UI 업데이트
  addMessage(text, 'user');
  userInput.value = '';
  autoResize();
  setInputEnabled(false);

  // 히스토리에 추가
  conversationHistory.push({
    role: 'user',
    content: text
  });

  // 타이핑 표시
  showTyping();

  try {
    // API 호출
    const response = await callClaudeAPI();
    hideTyping();

    // 응답 처리
    const reply = response.reply || '';
    const finalJSON = extractFinalJSON(reply);
    const cleanReply = cleanMessage(reply);

    if (cleanReply) {
      addMessage(cleanReply, 'bot');
    }

    // 히스토리 저장 (원본 그대로 - JSON 태그 포함한 채로 서버 저장용)
    conversationHistory.push({
      role: 'assistant',
      content: reply
    });

    // 인터뷰 완료 감지
    if (finalJSON || response.interview_complete) {
      completeInterview(finalJSON);
    } else {
      setInputEnabled(true);
    }

  } catch (err) {
    hideTyping();
    console.error('Error:', err);

    const errorMsg = err.message === 'timeout' 
      ? t('error_network')
      : t('error_server');

    addMessage(errorMsg, 'bot');
    setInputEnabled(true);
  }
}

/**
 * Cloud Function 호출
 */
async function callClaudeAPI() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

  const duration = Math.floor((Date.now() - startTime) / 60000);

  try {
    const response = await fetch(CONFIG.ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tester_id: testerID,
        messages: conversationHistory,
        language: currentLang,
        duration_min: duration,
        meta: {
          project: CONFIG.PROJECT,
          version: CONFIG.VERSION
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('timeout');
    }
    throw err;
  }
}

// ===== Event Listeners =====

document.addEventListener('DOMContentLoaded', () => {
  // 시작 버튼
  startBtn?.addEventListener('click', startInterview);

  // 전송 버튼
  sendBtn?.addEventListener('click', sendUserMessage);

  // Enter 키 (Shift+Enter는 줄바꿈)
  userInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  });

  // Textarea 자동 리사이즈
  userInput?.addEventListener('input', autoResize);

  // 페이지 나가기 전 경고 (인터뷰 중일 때)
  window.addEventListener('beforeunload', (e) => {
    if (interviewStarted && !interviewCompleted) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // 초기 입력 비활성화
  setInputEnabled(false);
});
