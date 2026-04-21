/**
 * config.js — Endpoint Configuration
 *
 * 배포 시 이 파일의 ENDPOINT를 실제 Cloud Function URL로 교체하세요.
 * 이 파일은 .gitignore에 포함되지 않으므로 API Key 같은 민감 정보는 절대 넣지 마세요.
 */

const CONFIG = {
  // Cloud Function URL (GCP 배포 후 받은 URL로 교체)
  ENDPOINT: 'https://asia-northeast3-my-project-yeo-website-492002.cloudfunctions.net/survey-proxy',

  // 프로젝트 식별자
  PROJECT: 'YEO-VN-WashOff-Survey',

  // 버전
  VERSION: '1.0.0',

  // 디버그 모드 (운영 시 false)
  DEBUG: false,

  // 타이핑 연출 지연 시간 (ms)
  TYPING_DELAY_MIN: 800,
  TYPING_DELAY_MAX: 1500,

  // 요청 타임아웃 (ms)
  REQUEST_TIMEOUT: 30000
};
