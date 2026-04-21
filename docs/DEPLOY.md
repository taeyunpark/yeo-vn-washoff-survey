# DEPLOY.md — 배포 가이드 (박태윤님 전용)

> **Step-by-Step 배포 가이드**
> 이 문서를 처음부터 끝까지 순서대로 따라하시면 4~5시간 내 배포 완료됩니다.
> MacBook Terminal 기준으로 작성되었습니다.

---

## ✅ Phase 0. 사전 준비 체크리스트

시작 전 아래 항목을 확인해 주세요.

| 준비물 | 확인 방법 | 완료 |
|---|---|---|
| GitHub 계정 | github.com 로그인 가능 | ⬜ |
| Anthropic API Key | console.anthropic.com에서 발급 | ⬜ |
| GCP 프로젝트 | `my-project-yeo-website-492002` | ✅ 기존 보유 |
| gcloud CLI | `gcloud --version` 실행 | ⬜ |
| Git | `git --version` 실행 | ⬜ |
| Slack Workspace | T0AP36YV5JB | ✅ 기존 보유 |

### Terminal 명령어로 확인

```bash
# MacBook Terminal에서 실행
git --version          # git version 2.x.x 출력되면 OK
gcloud --version       # Google Cloud SDK 출력되면 OK
```

gcloud가 없으면:
```bash
brew install --cask google-cloud-sdk
gcloud init
gcloud auth login
gcloud config set project my-project-yeo-website-492002
```

---

## 🗂️ Phase 1. GitHub Repository 세팅 (약 30분)

### 1-1. GitHub에서 Repository 생성

1. github.com 로그인
2. 우측 상단 `+` → `New repository` 클릭
3. 아래와 같이 설정:

| 항목 | 값 |
|---|---|
| Repository name | `yeo-vn-washoff-survey` |
| Description | `YEO Vietnam Wash-off Pack AI Adaptive Survey` |
| Visibility | **Public** (GitHub Pages 무료 사용) |
| Initialize | 체크 안 함 (로컬에서 업로드) |

4. `Create repository` 클릭
5. 다음 페이지에서 표시되는 Repository URL 복사 (예: `https://github.com/[사용자명]/yeo-vn-washoff-survey.git`)

### 1-2. 로컬 프로젝트 폴더로 이동

제가 전달드린 파일들을 `~/Documents/yeo-vn-washoff-survey/` 폴더에 저장하셨다고 가정합니다.

```bash
cd ~/Documents/yeo-vn-washoff-survey
```

### 1-3. Git 초기화 및 첫 푸시

```bash
# Git 초기화
git init

# .gitignore가 포함되어 있는지 확인
cat .gitignore

# 전체 파일 스테이징
git add .

# 첫 커밋
git commit -m "initial: YEO VN wash-off pack survey setup"

# main 브랜치 설정
git branch -M main

# Remote 연결 ([사용자명] 부분을 본인 GitHub ID로 교체)
git remote add origin https://github.com/[사용자명]/yeo-vn-washoff-survey.git

# 푸시
git push -u origin main
```

> **💡 GitHub 인증 오류 발생 시:**
> Personal Access Token (PAT)을 사용해야 합니다.
> GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
> 권한: `repo` 전체 체크
> 발급된 토큰을 비밀번호 대신 입력

---

## ☁️ Phase 2. GCP Cloud Function 배포 (약 1시간)

이 단계가 가장 중요합니다. **Claude API Key를 안전하게 보관**하면서 GitHub Pages에서 API를 호출할 수 있게 합니다.

### 2-1. Anthropic API Key 발급

1. https://console.anthropic.com 접속
2. 우측 상단 프로필 → `API Keys`
3. `Create Key` → 이름: `yeo-vn-survey` → `Create Key`
4. 발급된 Key를 **반드시 복사** (`sk-ant-api03-...` 형식)
5. ⚠️ **이 Key는 다시 볼 수 없으니 메모장 등에 임시 저장**

### 2-2. GCP Secret Manager에 API Key 저장

```bash
# Secret Manager API 활성화
gcloud services enable secretmanager.googleapis.com

# API Key를 Secret으로 저장
# ↓ 아래에서 'sk-ant-api03-xxxxx' 부분을 실제 Key로 교체
echo -n "sk-ant-api03-xxxxx" | gcloud secrets create claude-api-key \
  --data-file=- \
  --replication-policy="automatic"

# 저장 확인
gcloud secrets list
```

### 2-3. Google Sheets 준비

1. sheets.google.com 접속 → 새 스프레드시트 생성
2. 파일명: `VN_WashOff_Survey_Responses_2026`
3. 첫 행에 헤더 입력:

```
tester_id | interview_date | language | track | age_group | gender | location | skin_type | repurchase_intent | nps_score | acceptable_price_vnd | texture_persona | brand_loyalty_type | full_json_raw
```

4. 파일 URL에서 Sheet ID 복사
   - URL 형식: `https://docs.google.com/spreadsheets/d/[Sheet_ID]/edit`
   - `[Sheet_ID]` 부분만 복사해서 저장

### 2-4. Apps Script Webhook 생성 (Sheets 저장용)

1. 위에서 만든 Google Sheet에서 `확장 프로그램 → Apps Script`
2. 아래 코드 붙여넣기:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.tester_id,
      data.interview_date,
      data.language_used,
      data.track,
      data.profile?.age_group,
      data.profile?.gender,
      data.profile?.location,
      data.profile?.skin_type,
      data.commercial_signal?.repurchase_intent,
      data.commercial_signal?.nps_score,
      data.commercial_signal?.acceptable_price_vnd,
      data.product_evaluation?.texture_persona,
      data.brand_psychology?.brand_loyalty_type,
      JSON.stringify(data)  // 전체 JSON 원본
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ok: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok: false, err: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. 저장 → `배포 → 새 배포`
4. 유형: `웹 앱` / 액세스: `모든 사용자` / 본인 계정으로 실행
5. 배포 후 **웹 앱 URL 복사** (예: `https://script.google.com/macros/s/XXXXX/exec`)

### 2-5. Slack Webhook URL 발급

1. https://api.slack.com/apps → `Create New App` → `From scratch`
2. 이름: `YEO-VN-Survey-Alert`, Workspace: YEO 워크스페이스
3. 좌측 `Incoming Webhooks` → `Activate Incoming Webhooks` ON
4. 하단 `Add New Webhook to Workspace` → 채널 선택 (예: `#yeo-vn-survey-alerts`)
5. 발급된 Webhook URL 복사 (`https://hooks.slack.com/services/XXX/YYY/ZZZ`)

### 2-6. Cloud Function 환경 변수 설정

`cloud-function/.env.yaml` 파일을 생성하거나 배포 시 직접 전달합니다.

⚠️ **이 파일은 `.gitignore`에 이미 포함되어 GitHub에 올라가지 않습니다.**

```bash
cd cloud-function
cat > .env.yaml << 'EOF'
SHEETS_WEBHOOK_URL: "https://script.google.com/macros/s/XXXXX/exec"
SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/XXX/YYY/ZZZ"
GCP_PROJECT_ID: "my-project-yeo-website-492002"
ALLOWED_ORIGIN: "https://[사용자명].github.io"
EOF
```

위 파일에서 URL 3개를 실제 값으로 교체해 주세요.

### 2-7. Cloud Function 배포

```bash
# cloud-function 디렉토리에서 실행
cd ~/Documents/yeo-vn-washoff-survey/cloud-function

# 배포 스크립트 실행
bash deploy.sh
```

또는 수동 배포:

```bash
gcloud functions deploy survey-proxy \
  --gen2 \
  --runtime=python311 \
  --region=asia-northeast3 \
  --source=. \
  --entry-point=survey_proxy \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=60s \
  --env-vars-file=.env.yaml \
  --set-secrets=CLAUDE_API_KEY=claude-api-key:latest
```

배포 완료 후 표시되는 **Function URL** 복사:
```
Function URL: https://asia-northeast3-my-project-yeo-website-492002.cloudfunctions.net/survey-proxy
```

### 2-8. 배포 테스트

```bash
# Cloud Function이 정상 동작하는지 확인
curl -X POST https://asia-northeast3-my-project-yeo-website-492002.cloudfunctions.net/survey-proxy \
  -H "Content-Type: application/json" \
  -d '{"tester_id":"TEST-001","messages":[{"role":"user","content":"안녕하세요"}]}'
```

정상 응답이 오면 성공!

---

## 🌐 Phase 3. HTML 챗봇 배포 (약 30분)

### 3-1. `config.js` 생성 (Cloud Function URL 연결)

```bash
cd ~/Documents/yeo-vn-washoff-survey/assets/js

cat > config.js << 'EOF'
// 아래 URL을 실제 Cloud Function URL로 교체
const CONFIG = {
  ENDPOINT: 'https://asia-northeast3-my-project-yeo-website-492002.cloudfunctions.net/survey-proxy',
  PROJECT: 'YEO-VN-WashOff-Survey',
  VERSION: '1.0.0'
};
EOF
```

### 3-2. 로컬 테스트 (선택)

VS Code의 Live Server 확장 프로그램 사용:
1. VS Code에서 프로젝트 폴더 열기
2. `index.html` 우클릭 → `Open with Live Server`
3. 브라우저에서 챗봇 동작 확인

또는 Python 간이 서버:

```bash
cd ~/Documents/yeo-vn-washoff-survey
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

### 3-3. GitHub Pages 활성화

1. GitHub Repository 페이지 → `Settings`
2. 좌측 메뉴 `Pages`
3. Source: `Deploy from a branch`
4. Branch: `main` / Folder: `/ (root)`
5. `Save`
6. 약 1~2분 후 상단에 URL 표시:
   ```
   Your site is live at https://[사용자명].github.io/yeo-vn-washoff-survey/
   ```

### 3-4. 변경 사항 반영 (수정 후 재배포)

```bash
cd ~/Documents/yeo-vn-washoff-survey
git add .
git commit -m "update: [변경 내용 요약]"
git push
```

GitHub Pages는 푸시 후 **약 1분 내 자동 재배포**됩니다.

---

## 📊 Phase 4. 최종 점검 및 운영 (15분)

### 4-1. End-to-End 테스트 체크리스트

| 항목 | 확인 방법 | OK |
|---|---|---|
| 챗봇 URL 접속 | `https://[사용자명].github.io/yeo-vn-washoff-survey/` | ⬜ |
| 첫 인사 메시지 표시 | 페이지 접속 즉시 Yuna 인사 등장 | ⬜ |
| 한국어 응답 정상 | "안녕하세요" 입력 시 자연스러운 대화 | ⬜ |
| 베트남어 응답 정상 | "Xin chào" 입력 시 베트남어 전환 | ⬜ |
| Google Sheets 저장 | 테스트 인터뷰 완주 시 새 행 추가 | ⬜ |
| Slack 알림 수신 | 인터뷰 완료 시 Slack 메시지 도착 | ⬜ |

### 4-2. 베트남 지사 공유

다음 내용으로 공문 발송:

```
Subject: [YEO HQ] Wash-off Pack Tester Interview Invitation (Deadline: [날짜])

Dear Vietnam Team,

We are conducting a consumer research interview for our upcoming Wash-off Pack launch in Vietnam.

Please participate following the steps below:
1. Use the sample product for 7 days (provided separately)
2. After 7 days, access the interview link below
3. Interview takes approximately 10 minutes
4. Your responses are anonymous and will be used only for product improvement

Interview Link:
https://[사용자명].github.io/yeo-vn-washoff-survey/

Deadline: [YYYY-MM-DD]

Thank you for your valuable feedback.

Best regards,
[박태윤]
YEO / 312 & Company
```

---

## 💰 Phase 5. 운영 비용 모니터링

| 항목 | 예상 비용 (20명 테스터) |
|---|---|
| GitHub Pages | 무료 |
| GCP Cloud Function | ~무료 (월 2백만 요청 무료) |
| Secret Manager | ~무료 (6 시크릿 무료) |
| Claude API (Sonnet 4.6) | 약 $6~10 (1만~1.5만원) |
| **총 합계** | **약 1.5만원 이내** |

Claude API 사용량 모니터링: https://console.anthropic.com/settings/usage

---

## 🚨 문제 해결 (Troubleshooting)

### Q1. Cloud Function이 CORS 에러 발생
→ `.env.yaml`의 `ALLOWED_ORIGIN`을 실제 GitHub Pages URL로 수정 후 재배포

### Q2. API Key 인증 실패
→ Secret Manager 권한 확인:
```bash
gcloud projects add-iam-policy-binding my-project-yeo-website-492002 \
  --member="serviceAccount:[PROJECT_NUMBER]-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Q3. Google Sheets에 저장 안 됨
→ Apps Script 웹 앱 재배포 (코드 수정 시 항상 "새 배포" 필요)

### Q4. Claude 응답이 JSON 그대로 노출됨
→ `chat.js`에서 `<FINAL_JSON>` 태그 파싱 로직 확인

### Q5. GitHub Pages가 업데이트 안 됨
→ Settings → Pages에서 재배포 수동 트리거
→ 브라우저 캐시 삭제 후 새로고침

---

## 📋 다음 단계 제안

배포 완료 후:

1. **테스터 10명 내부 파일럿** (베트남 지사 내 빠른 검증)
2. **피드백 반영 후 System Prompt 개선 v2**
3. **20명 정식 운영**
4. **Claude API로 결과 분석 리포트 자동 생성** (별도 스크립트)

---

## 📞 긴급 지원

배포 중 막히는 부분이 있으면 즉시 문의 주세요.  
모든 파일은 `.gitignore`에 민감 정보가 포함되지 않도록 설계되어 있습니다.
