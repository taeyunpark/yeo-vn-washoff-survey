/**
 * YEO × GOOKIN VN Wash-off Survey — i18n v2.0
 */

const I18N = {
  ko: {
    language_code: 'ko',
    header_title: 'GOOKIN × YEO Research',
    header_subtitle: '구킨 워시오프팩 개발 인터뷰',
    researcher_name: 'Elin (김연진)',
    researcher_role: 'YEO 리서치 담당',
    avatar_letter: 'E',
    placeholder: '메시지를 입력하세요...',
    send_button: '보내기',
    typing: 'Elin이 입력 중...',
    language_badge: '🇰🇷 한국어',
    pre_launch_notice: '⚠️ 개발 중인 제품 샘플에 대한 의견 인터뷰입니다',
    greeting:
      '안녕하세요! 저는 YEO의 리서치 담당 <strong>Elin (한국 이름: 김연진)</strong>입니다. 🌿<br><br>' +
      '오늘은 저희가 개발 중인 K-뷰티 브랜드 <strong>구킨(GOOKIN)의 워시오프팩</strong>에 대한 의견을 듣고자 해요.<br><br>' +
      '⚠️ <em>이 제품은 아직 <strong>출시 전 개발 단계 샘플</strong>이라, 여러분의 의견이 실제 최종 제품에 반영됩니다.</em><br><br>' +
      '실물 샘플을 써보셨든, 아직 안 써보셨든 상관없어요. 편하게 10분만 이야기 나눠주실 수 있을까요?<br><br>' +
      '준비되셨으면 "네" 또는 "안녕하세요"라고 답해주세요!'
  },

  en: {
    language_code: 'en',
    header_title: 'GOOKIN × YEO Research',
    header_subtitle: 'GOOKIN Wash-off Pack Development Interview',
    researcher_name: 'Elin (Yeon-jin Kim)',
    researcher_role: 'Researcher, YEO',
    avatar_letter: 'E',
    placeholder: 'Type your message...',
    send_button: 'Send',
    typing: 'Elin is typing...',
    language_badge: '🇬🇧 English',
    pre_launch_notice: '⚠️ Pre-launch product feedback interview',
    greeting:
      'Hello! I\'m <strong>Elin (Korean name: Yeon-jin Kim)</strong>, a researcher at YEO. 🌿<br><br>' +
      'Today I\'d love to hear your thoughts on <strong>GOOKIN\'s Wash-off Pack</strong> — a new K-Beauty product we\'re currently developing.<br><br>' +
      '⚠️ <em>This is a <strong>pre-launch development sample</strong>, so your feedback will directly shape the final product.</em><br><br>' +
      'Whether you\'ve tried the physical sample or not, please feel free to share your honest thoughts. Can we chat for about 10 minutes?<br><br>' +
      'When you\'re ready, just reply "Hi" or "Yes"!'
  },

  vi: {
    language_code: 'vi',
    header_title: 'GOOKIN × YEO Research',
    header_subtitle: 'Phỏng vấn phát triển Mặt nạ rửa trôi GOOKIN',
    researcher_name: 'Elin (Kim Yeon-jin)',
    researcher_role: 'Nghiên cứu viên, YEO',
    avatar_letter: 'E',
    placeholder: 'Nhập tin nhắn...',
    send_button: 'Gửi',
    typing: 'Elin đang nhập...',
    language_badge: '🇻🇳 Tiếng Việt',
    pre_launch_notice: '⚠️ Phỏng vấn phản hồi sản phẩm trước khi ra mắt',
    greeting:
      'Xin chào! Tôi là <strong>Elin (tên tiếng Hàn: Kim Yeon-jin)</strong>, nghiên cứu viên tại YEO. 🌿<br><br>' +
      'Hôm nay, tôi muốn lắng nghe ý kiến của bạn về <strong>Mặt nạ rửa trôi GOOKIN</strong> — sản phẩm K-Beauty mới chúng tôi đang phát triển.<br><br>' +
      '⚠️ <em>Đây là <strong>mẫu phát triển trước khi ra mắt</strong>, nên phản hồi của bạn sẽ ảnh hưởng trực tiếp đến sản phẩm cuối cùng.</em><br><br>' +
      'Dù bạn đã thử mẫu thật hay chưa, hãy thoải mái chia sẻ. Chúng ta có thể trò chuyện khoảng 10 phút không?<br><br>' +
      'Khi sẵn sàng, hãy trả lời "Xin chào" hoặc "Vâng"!'
  }
};

function detectLanguage() {
  const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  if (browserLang.startsWith('ko')) return 'ko';
  if (browserLang.startsWith('vi')) return 'vi';
  return 'en';
}

function getI18n(lang) {
  return I18N[lang] || I18N.en;
}

if (typeof window !== 'undefined') {
  window.I18N = I18N;
  window.detectLanguage = detectLanguage;
  window.getI18n = getI18n;
}
