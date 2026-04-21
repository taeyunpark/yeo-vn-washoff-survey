# YEO Vietnam Wash-off Pack — AI Adaptive Survey

> 베트남 현지 직원 대상 신제품 워시오프팩 수용성 평가를 위한 **AI 대화형 설문 시스템**

[![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-black)]()
[![Backend](https://img.shields.io/badge/backend-GCP%20Cloud%20Functions-blue)]()
[![AI](https://img.shields.io/badge/AI-Claude%20Sonnet%204.6-orange)]()

---

## 📌 Overview

단순 설문이 아닌 **Claude API 기반 Adaptive Interview** 시스템입니다. 응답자의 답변 맥락에 따라 AI가 실시간으로 꼬리 질문을 생성하여, 정형 설문으로는 포착 불가능한 **제형에 대한 무의식적 선호, 브랜드 Halo 심리, 이탈 사유** 등 심층 인사이트를 추출합니다.

### Key Features

- 🧠 **AI 꼬리 질문 자동 생성** — Claude가 응답을 분석하여 심화 질문 동적 생성
- 🌐 **3개 언어 자동 감지** — 한국어 / English / Tiếng Việt
- 🎯 **4-Track Segmentation** — 사용 이력에 따라 인터뷰 경로 자동 분기
- 🔬 **제형 3층 프로빙** — 감각 언어화 → 강제 비교 → 무의식 단서 채집
- 📊 **JSON 자동 구조화** — 대화 내용을 표준 스키마로 자동 추출
- 📧 **실시간 알림** — 응답 완료 시 Slack 알림 + Google Sheets 자동 저장

---

## 🏗️ Architecture

```
[Tester Browser]
      ↓ (HTTPS)
[GitHub Pages] — index.html + chat.js
      ↓ (fetch)
[GCP Cloud Function] — survey-proxy (Python)
      ├─ Secret Manager → Claude API Key
      ├─ Claude API (Sonnet 4.6) → 대화 생성
      ├─ Apps Script Webhook → Google Sheets 저장
      └─ Slack Webhook → 실시간 알림
```

---

## 📁 Project Structure

```
yeo-vn-washoff-survey/
├── index.html                    # 챗봇 UI 진입점
├── README.md
├── .gitignore
│
├── assets/
│   ├── css/
│   │   └── chat.css              # 미니멀 프리미엄 스타일
│   └── js/
│       ├── chat.js               # 대화 로직 + API 호출
│       ├── config.js             # Endpoint 설정
│       └── i18n.js               # 다국어 리소스
│
├── cloud-function/
│   ├── main.py                   # Claude API 프록시
│   ├── requirements.txt
│   ├── deploy.sh                 # 배포 스크립트
│   └── .env.yaml.example         # 환경변수 템플릿
│
└── docs/
    ├── DEPLOY.md                 # 배포 가이드 (step-by-step)
    └── SYSTEM_PROMPT.md          # Claude System Prompt 전문
```

---

## 🚀 Quick Start

배포는 약 **4~5시간** 소요됩니다. 상세 가이드는 [`docs/DEPLOY.md`](docs/DEPLOY.md) 참조.

### Prerequisites

- GitHub 계정
- GCP 프로젝트 + `gcloud` CLI
- Anthropic API Key ([console.anthropic.com](https://console.anthropic.com))
- Google Sheets (응답 저장용)
- Slack Workspace (알림용, 선택)

### Deployment Steps

```bash
# 1. Repository 클론
git clone https://github.com/[username]/yeo-vn-washoff-survey.git
cd yeo-vn-washoff-survey

# 2. Cloud Function 배포
cd cloud-function
cp .env.yaml.example .env.yaml
# .env.yaml 파일을 실제 값으로 편집

chmod +x deploy.sh
./deploy.sh

# 3. Cloud Function URL을 config.js에 반영
# assets/js/config.js의 ENDPOINT 값 교체

# 4. GitHub Pages 활성화
# Settings → Pages → Source: main branch

# 5. 접속
# https://[username].github.io/yeo-vn-washoff-survey/
```

---

## 💰 Operating Cost

| 항목 | 비용 (20명 테스터 기준) |
|---|---|
| GitHub Pages | 무료 |
| GCP Cloud Function | ~무료 (월 2백만 요청 무료 한도) |
| Secret Manager | ~무료 |
| Claude API (Sonnet 4.6) | 약 $6~10 |
| **Total** | **약 1.5만원 이내** |

---

## 🎯 Interview Design

### Stage Overview

| Stage | Content | Duration |
|---|---|---|
| **0. Profile** | 나이/성별/지역/피부타입/환경 | 2분 |
| **1. Pre-Screening** | 카테고리 경험 + Track 분기 | 2분 |
| **2. Deep Interview** | Q1~Q7 (Anchor + AI Probes) | 6분 |
| **3. Closing** | 마무리 인사 | 10초 |

### 4-Track Segmentation

| Track | 대상 | 핵심 데이터 |
|---|---|---|
| **Track 1 — Heavy User** | 정기 사용자 | 경쟁 제품 + 충성 조건 |
| **Track 2 — Light User** | 간헐 사용자 | 사용 빈도 저해 요인 |
| **Track 3 — Churned User** ⭐ | 과거 사용자 | **이탈 사유 = 제품 개선 포인트** |
| **Track 4 — Non-User** | 미경험자 | **진입 장벽 = 마케팅 포인트** |

### Q5. 제형 무의식 3층 프로빙 (핵심)

소비자가 "왜 좋은지 모르지만 좋다"고 답하는 구간을 파고드는 기법.

1. **Layer 1 — 감각 언어화**: "음식/물건/색깔에 비유한다면?"
2. **Layer 2 — 강제 비교**: "바셀린 vs 물 vs 요거트 중 어느 쪽?"
3. **Layer 3 — 무의식 단서**: "딱 하나만 바꾼다면? 왜?"

---

## 📊 Data Schema

수집된 데이터는 다음 구조로 Google Sheets에 저장됩니다.

```json
{
  "tester_id": "VN-T-XXXX",
  "track": "Track_1_Heavy",
  "profile": { ... },
  "pre_screening": { "current_product": { ... } },
  "brand_psychology": { "brand_loyalty_type": "Brand-Halo_Loyalist" },
  "product_evaluation": { "texture_persona": "Type_B_Transformation" },
  "commercial_signal": { "nps_score": 8, "acceptable_price_vnd": 280000 },
  "open_end_feedback": { ... }
}
```

전체 스키마는 [`docs/SYSTEM_PROMPT.md`](docs/SYSTEM_PROMPT.md) 참조.

---

## 🔒 Security

- ✅ Claude API Key는 **GCP Secret Manager**에 저장, 클라이언트 노출 없음
- ✅ Cloud Function이 프록시 역할 → API Key 유출 차단
- ✅ CORS 설정으로 허용된 Origin만 요청 가능
- ✅ 응답자 실명/연락처 등 PII 수집 금지 (System Prompt 제약)

---

## 📈 Analysis Workflow

응답 수집 완료 후:

1. Google Sheets에서 전체 응답 확인
2. Claude API 재호출로 **집계 분석 리포트** 생성
3. Korea 품평단 vs. Vietnam 응답 **Gap 분석**
4. Go / Modify / Hold 의사결정

---

## 📞 Contact

YEO / 312 & Company  
Project Lead: 박태윤

---

## 📄 License

Internal use only — YEO / 312 & Company
