/**
 * YEO × GOOKIN VN Wash-off Survey — i18n v2.4
 */

const I18N = {
  ko: {
    language_code: 'ko',
    header_title: 'GOOKIN × YEO Research',
    header_subtitle: '구킨 워시오프팩 개발 인터뷰',
    researcher_name: 'Elin (김연진)',
    researcher_role: '구킨(GOOKIN) 브랜드 매니저',
    avatar_letter: 'E',
    placeholder: '답변을 입력하세요...',
    send_button: '보내기',
    typing: 'Elin이 입력 중...',
    language_badge: '🇰🇷 한국어',
    pre_launch_notice: '⚠️ 신제품 개발 방향 시장 조사 인터뷰',
    summary_loading: '고생 많으셨어요! 😊 지금 소중한 의견을 정리하고 있어요. 잠시만 기다려 주세요 ✨',
    summary_ready: '요약본이 준비되었습니다. 여기까지가 오늘 인터뷰의 마무리입니다. 감사합니다 🙏',

    greeting:
      '안녕하세요! 저는 YEO의 <strong>구킨(GOOKIN) 브랜드 매니저 Elin (한국 이름: 김연진)</strong>입니다. 🌿<br><br>' +
      '구킨은 이미 베트남에서 <strong>마스크팩을 판매 중</strong>이고, 이번에 <strong>새로운 워시오프팩</strong>을 개발하고 있어요.<br><br>' +
      '오늘은 여러분의 <strong>피부 상태와 워시오프팩에 대한 생각</strong>을 듣고, 제품 개발에 반영하려고 해요.<br><br>' +
      '⚠️ <em>워시오프팩을 <strong>써보셨든, 안 써보셨든</strong> 모두 환영합니다. 샘플 후기가 아닌, 여러분의 솔직한 의견이 중요해요.</em><br><br>' +
      '약 10분 편하게 이야기 나눠주실 수 있을까요?<br><br>' +
      '준비되셨으면 "네"라고 답해주세요!'
  },

  en: {
    language_code: 'en',
    header_title: 'GOOKIN × YEO Research',
    header_subtitle: 'GOOKIN Wash-off Pack Development Interview',
    researcher_name: 'Elin (Yeon-jin Kim)',
    researcher_role: 'GOOKIN Brand Manager, YEO',
    avatar_letter: 'E',
    placeholder: 'Type your message...',
    send_button: 'Send',
    typing: 'Elin is typing...',
    language_badge: '🇬🇧 English',
    pre_launch_notice: '⚠️ Market research for new product development',
    summary_loading: 'Great job! 😊 I\'m organizing your valuable insights now. Please wait a moment ✨',
    summary_ready: 'Your summary is ready. That\'s the end of our interview today. Thank you 🙏',

    greeting:
      'Hello! I\'m <strong>Elin (Korean name: Yeon-jin Kim)</strong>, the <strong>GOOKIN Brand Manager at YEO</strong>. 🌿<br><br>' +
      'GOOKIN already sells <strong>mask packs in Vietnam</strong>, and we\'re now developing a <strong>new wash-off pack</strong>.<br><br>' +
      'Today, I\'d like to hear about <strong>your skin condition and thoughts on wash-off packs</strong> to help shape the product development.<br><br>' +
      '⚠️ <em>Whether or not you\'ve tried wash-off packs before, everyone is welcome. This is NOT a sample review — we value your honest opinions.</em><br><br>' +
      'Can we chat for about 10 minutes?<br><br>' +
      'When ready, please reply "Yes"!'
  },

  vi: {
    language_code: 'vi',
    header_title: 'GOOKIN × YEO Research',
    header_subtitle: 'Phỏng vấn phát triển Mặt nạ rửa trôi GOOKIN',
    researcher_name: 'Elin (Kim Yeon-jin)',
    researcher_role: 'Quản lý thương hiệu GOOKIN, YEO',
    avatar_letter: 'E',
    placeholder: 'Nhập câu trả lời...',
    send_button: 'Gửi',
    typing: 'Elin đang nhập...',
    language_badge: '🇻🇳 Tiếng Việt',
    pre_launch_notice: '⚠️ Nghiên cứu thị trường phát triển sản phẩm mới',
    summary_loading: 'Bạn đã làm rất tốt! 😊 Tôi đang tổng hợp những ý kiến quý giá của bạn. Vui lòng đợi một chút ✨',
    summary_ready: 'Bản tóm tắt đã sẵn sàng. Đây là kết thúc buổi phỏng vấn hôm nay. Cảm ơn bạn 🙏',

    greeting:
      'Xin chào! Tôi là <strong>Elin (tên tiếng Hàn: Kim Yeon-jin)</strong>, <strong>Quản lý thương hiệu GOOKIN tại YEO</strong>. 🌿<br><br>' +
      'GOOKIN hiện đang bán <strong>mặt nạ giấy tại Việt Nam</strong>, và hiện đang phát triển <strong>mặt nạ rửa trôi mới</strong>.<br><br>' +
      'Hôm nay, tôi muốn nghe về <strong>tình trạng da và suy nghĩ của bạn về mặt nạ rửa trôi</strong> để phản ánh vào việc phát triển sản phẩm.<br><br>' +
      '⚠️ <em>Dù bạn đã từng dùng mặt nạ rửa trôi hay chưa, tất cả đều được hoan nghênh. Đây KHÔNG phải là đánh giá mẫu — ý kiến thật của bạn mới quan trọng.</em><br><br>' +
      'Chúng ta có thể trò chuyện khoảng 10 phút không?<br><br>' +
      'Khi sẵn sàng, hãy trả lời "Vâng"!'
  }
};

// Welcome 안내문 전용 text
const WELCOME_TEXTS = {
  ko: {
    title_line1: '구킨(GOOKIN) 워시오프팩',
    title_line2: '개발 단계 사전 인터뷰',
    description: '⚠️ <strong>출시 전 개발 단계 샘플</strong>에 대한 의견을 듣고자 합니다.<br>여러분의 의견이 실제 최종 제품에 직접 반영됩니다.<br>약 10분 정도의 대화형 인터뷰입니다.',
    notice_title: '📌 인터뷰 참여 안내',
    notice_items: [
      '본 인터뷰는 <strong>약 10분 내외</strong> 소요됩니다.',
      '<strong>끝까지 완료하신 경우에만</strong> 응답 데이터가 최종 리서치 리포트에 반영됩니다.',
      '중간에 종료하시는 경우 일부 응답은 저장되나, 분석에 포함되지 않을 수 있습니다.',
      '여러분의 의견이 GOOKIN의 베트남 시장 진출에 직접 반영되니, 끝까지 함께해주시기를 정중히 부탁드립니다. 🙏',
      '모든 응답은 익명 처리되며, 제품 개발 목적 외에 사용되지 않습니다.'
    ],
    info_duration: '소요 시간: 약 10분',
    info_privacy: '응답은 익명으로 처리됩니다',
    info_language: '한국어 / English / Tiếng Việt',
    start_button: '인터뷰 시작하기',
    placeholder: '답변을 입력하세요...',
    completion_title: '소중한 피드백 감사합니다!',
    completion_tagline: 'K-Beauty, Refined for Vietnam.',
    download_summary: '📥 요약본 저장',
    close_btn: '닫기',
    // Summary Card 텍스트
    summary_title: '📋 오늘 나눠주신 이야기 요약',
    section_profile: '👤 Your Profile',
    section_skin: '🧬 Skin Analysis',
    section_texture: '🎨 Your Ideal Texture',
    section_finish: '✨ Finish Preference',
    section_scrub: '🔍 Scrub Preference',
    section_scent: '💐 Scent Strategy',
    section_priority: '🎯 What You Want Most',
    section_commercial: '💰 Commercial Signal',
    bar_viscosity: '점도',
    bar_spreadability: '발림성',
    bar_adhesion: '밀착도',
    label_rinse: '헹굼',
    label_times: '회',
    label_likes: '선호',
    label_dislikes: '절대 X',
    label_price_expected: '기대 가격',
    label_nps: 'NPS',
    label_repurchase: '재구매',
    thank_you_footer: '🙏 여러분의 의견은 GOOKIN 워시오프팩의 베트남 시장 진출에 직접 반영됩니다.'
  },

  en: {
    title_line1: 'GOOKIN Wash-off Pack',
    title_line2: 'Development Interview',
    description: '⚠️ <strong>Pre-launch development sample</strong> feedback interview.<br>Your opinions will directly shape the final product.<br>About 10-minute conversational interview.',
    notice_title: '📌 Interview Participation Notice',
    notice_items: [
      'This interview takes <strong>approximately 10 minutes</strong>.',
      '<strong>Only if you complete the full interview</strong>, your responses will be included in the final research report.',
      'If you exit midway, partial data may be saved but may not be included in our analysis.',
      'Your insights will directly shape GOOKIN\'s Vietnam market entry. We kindly ask you to complete the interview in full. 🙏',
      'All responses are anonymized and used solely for product development purposes.'
    ],
    info_duration: 'Duration: about 10 min',
    info_privacy: 'Responses are anonymized',
    info_language: '한국어 / English / Tiếng Việt',
    start_button: 'Start Interview',
    placeholder: 'Type your message...',
    completion_title: 'Thank you for your valuable feedback!',
    completion_tagline: 'K-Beauty, Refined for Vietnam.',
    download_summary: '📥 Save Summary',
    close_btn: 'Close',
    summary_title: '📋 Your Interview Summary',
    section_profile: '👤 Your Profile',
    section_skin: '🧬 Skin Analysis',
    section_texture: '🎨 Your Ideal Texture',
    section_finish: '✨ Finish Preference',
    section_scrub: '🔍 Scrub Preference',
    section_scent: '💐 Scent Strategy',
    section_priority: '🎯 What You Want Most',
    section_commercial: '💰 Commercial Signal',
    bar_viscosity: 'Viscosity',
    bar_spreadability: 'Spreadability',
    bar_adhesion: 'Adhesion',
    label_rinse: 'Rinse',
    label_times: 'times',
    label_likes: 'Like',
    label_dislikes: 'Never',
    label_price_expected: 'Expected Price',
    label_nps: 'NPS',
    label_repurchase: 'Repurchase',
    thank_you_footer: '🙏 Your opinions will directly shape GOOKIN\'s entry into the Vietnam market.'
  },

  vi: {
    title_line1: 'Mặt nạ rửa trôi GOOKIN',
    title_line2: 'Phỏng vấn phát triển',
    description: '⚠️ Phỏng vấn phản hồi về <strong>mẫu phát triển trước khi ra mắt</strong>.<br>Ý kiến của bạn sẽ ảnh hưởng trực tiếp đến sản phẩm cuối cùng.<br>Phỏng vấn hội thoại khoảng 10 phút.',
    notice_title: '📌 Thông báo tham gia phỏng vấn',
    notice_items: [
      'Phỏng vấn kéo dài <strong>khoảng 10 phút</strong>.',
      '<strong>Chỉ khi bạn hoàn thành đầy đủ</strong>, phản hồi của bạn mới được đưa vào báo cáo nghiên cứu cuối cùng.',
      'Nếu thoát giữa chừng, một phần dữ liệu có thể được lưu nhưng có thể không được đưa vào phân tích.',
      'Ý kiến của bạn sẽ ảnh hưởng trực tiếp đến việc GOOKIN thâm nhập thị trường Việt Nam. Chúng tôi kính mong bạn hoàn thành đầy đủ. 🙏',
      'Tất cả câu trả lời đều được ẩn danh và chỉ sử dụng cho mục đích phát triển sản phẩm.'
    ],
    info_duration: 'Thời lượng: khoảng 10 phút',
    info_privacy: 'Câu trả lời được ẩn danh',
    info_language: '한국어 / English / Tiếng Việt',
    start_button: 'Bắt đầu phỏng vấn',
    placeholder: 'Nhập câu trả lời...',
    completion_title: 'Cảm ơn phản hồi quý giá của bạn!',
    completion_tagline: 'K-Beauty, Refined for Vietnam.',
    download_summary: '📥 Lưu tóm tắt',
    close_btn: 'Đóng',
    summary_title: '📋 Tóm tắt phỏng vấn',
    section_profile: '👤 Hồ sơ của bạn',
    section_skin: '🧬 Phân tích da',
    section_texture: '🎨 Kết cấu lý tưởng',
    section_finish: '✨ Kết thúc yêu thích',
    section_scrub: '🔍 Tẩy tế bào chết',
    section_scent: '💐 Chiến lược hương',
    section_priority: '🎯 Ưu tiên hàng đầu',
    section_commercial: '💰 Tín hiệu thương mại',
    bar_viscosity: 'Độ đặc',
    bar_spreadability: 'Khả năng tán',
    bar_adhesion: 'Độ bám',
    label_rinse: 'Xả',
    label_times: 'lần',
    label_likes: 'Thích',
    label_dislikes: 'Không bao giờ',
    label_price_expected: 'Giá mong đợi',
    label_nps: 'NPS',
    label_repurchase: 'Mua lại',
    thank_you_footer: '🙏 Ý kiến của bạn sẽ được phản ánh trực tiếp vào việc GOOKIN thâm nhập thị trường Việt Nam.'
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

function getWelcomeTexts(lang) {
  return WELCOME_TEXTS[lang] || WELCOME_TEXTS.en;
}

if (typeof window !== 'undefined') {
  window.I18N = I18N;
  window.WELCOME_TEXTS = WELCOME_TEXTS;
  window.detectLanguage = detectLanguage;
  window.getI18n = getI18n;
  window.getWelcomeTexts = getWelcomeTexts;
}
