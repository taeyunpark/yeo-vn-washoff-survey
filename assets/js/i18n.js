/**
 * i18n.js — Multilingual Support
 * Languages: Korean (ko), English (en), Vietnamese (vi)
 */

const I18N = {
  ko: {
    // Welcome Screen
    welcome_title_line1: "워시오프팩",
    welcome_title_line2: "시험자 인터뷰",
    welcome_description: "안녕하세요! 새로 출시하는 워시오프팩에 대한 솔직한 의견을 나눠주세요.<br>약 10분 정도의 대화형 인터뷰입니다.",
    info_duration: "소요 시간: 약 10분",
    info_privacy: "응답은 익명으로 처리됩니다",
    info_language: "한국어 / English / Tiếng Việt",
    start_button: "인터뷰 시작하기",

    // Chat
    header_sub: "YEO 리서치",
    input_placeholder: "답변을 입력하세요...",

    // Initial Message
    greeting: "안녕하세요! 저는 YEO의 리서치 담당 Elin입니다. 🌿\n\n오늘 새로 출시하는 워시오프팩에 대해 10분 정도 편하게 이야기 나눠주실 수 있을까요?\n\n정답은 없고, 느낀 그대로 말씀해 주시면 됩니다. 준비되셨으면 편하게 '네' 또는 '안녕하세요'라고 답해주세요!",

    // Completion
    completion_title: "소중한 피드백 감사합니다!",
    completion_message: "주신 의견은 베트남 시장에 맞는 더 나은 제품을<br>만드는 데 소중하게 쓰일 거예요.",
    completion_tagline: "Beauty, Refined.",

    // Errors
    error_network: "연결에 문제가 있어요. 잠시 후 다시 시도해 주세요.",
    error_server: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
  },

  en: {
    welcome_title_line1: "Wash-off Pack",
    welcome_title_line2: "Tester Interview",
    welcome_description: "Welcome! Share your honest thoughts about our new Wash-off Pack.<br>A 10-minute conversational interview.",
    info_duration: "Duration: about 10 minutes",
    info_privacy: "Your responses are anonymous",
    info_language: "한국어 / English / Tiếng Việt",
    start_button: "Start Interview",

    header_sub: "YEO Research",
    input_placeholder: "Type your answer...",

    greeting: "Hello! I'm Elin, a researcher from YEO. 🌿\n\nCould we chat for about 10 minutes about our new Wash-off Pack that's launching soon?\n\nThere are no right or wrong answers — just share your honest impressions. When you're ready, just say 'Hi' or 'Yes'!",

    completion_title: "Thank you for your valuable feedback!",
    completion_message: "Your insights will help us create<br>a better product for the Vietnamese market.",
    completion_tagline: "Beauty, Refined.",

    error_network: "Connection issue. Please try again in a moment.",
    error_server: "A temporary error occurred. Please try again."
  },

  vi: {
    welcome_title_line1: "Mặt Nạ Rửa Trôi",
    welcome_title_line2: "Phỏng Vấn Người Dùng Thử",
    welcome_description: "Xin chào! Hãy chia sẻ cảm nhận chân thật của bạn về sản phẩm mặt nạ rửa trôi mới.<br>Cuộc phỏng vấn dạng trò chuyện khoảng 10 phút.",
    info_duration: "Thời gian: khoảng 10 phút",
    info_privacy: "Câu trả lời được ẩn danh",
    info_language: "한국어 / English / Tiếng Việt",
    start_button: "Bắt đầu phỏng vấn",

    header_sub: "YEO Research",
    input_placeholder: "Nhập câu trả lời của bạn...",

    greeting: "Xin chào! Tôi là Elin, nghiên cứu viên của YEO. 🌿\n\nBạn có thể dành khoảng 10 phút để trò chuyện cùng tôi về sản phẩm mặt nạ rửa trôi sắp ra mắt không?\n\nKhông có câu trả lời đúng sai — chỉ cần chia sẻ cảm nhận thật của bạn. Khi bạn đã sẵn sàng, chỉ cần nói 'Chào' hoặc 'Vâng' nhé!",

    completion_title: "Cảm ơn phản hồi quý giá của bạn!",
    completion_message: "Ý kiến của bạn sẽ giúp chúng tôi tạo ra<br>sản phẩm tốt hơn cho thị trường Việt Nam.",
    completion_tagline: "Beauty, Refined.",

    error_network: "Lỗi kết nối. Vui lòng thử lại sau.",
    error_server: "Đã xảy ra lỗi tạm thời. Vui lòng thử lại."
  }
};

/**
 * 현재 언어 상태
 */
let currentLang = 'ko';

/**
 * 언어 전환
 */
function setLanguage(lang) {
  if (!I18N[lang]) return;
  currentLang = lang;

  // 모든 data-i18n 요소 업데이트
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (I18N[lang][key]) {
      el.innerHTML = I18N[lang][key];
    }
  });

  // placeholder 업데이트
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (I18N[lang][key]) {
      el.setAttribute('placeholder', I18N[lang][key]);
    }
  });

  // html lang 속성
  document.documentElement.setAttribute('lang', lang);

  // 언어 버튼 active 상태
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

/**
 * 현재 언어 문자열 가져오기
 */
function t(key) {
  return I18N[currentLang]?.[key] || I18N['ko'][key] || key;
}

/**
 * 브라우저 언어 자동 감지 (옵션)
 */
function detectBrowserLanguage() {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('vi')) return 'vi';
  if (browserLang.startsWith('en')) return 'en';
  return 'ko';
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  // 언어 버튼 이벤트
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  // 초기 언어 설정 (기본: 한국어, 필요 시 브라우저 언어 감지로 변경)
  setLanguage('ko');
});
