#!/bin/bash
# =================================================================
# deploy.sh — YEO VN Survey Cloud Function Deployment
# =================================================================
# 사용법:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# 전제 조건:
#   1. gcloud CLI 설치 및 로그인 완료
#   2. .env.yaml 파일이 같은 디렉토리에 존재
#   3. Secret Manager에 'claude-api-key' 시크릿이 생성됨
# =================================================================

set -e

# ===== Configuration =====
PROJECT_ID="my-project-yeo-website-492002"
REGION="asia-northeast3"
FUNCTION_NAME="survey-proxy"
RUNTIME="python311"
ENTRY_POINT="survey_proxy"
MEMORY="512MB"
TIMEOUT="60s"

# ===== Color Output =====
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 YEO VN Survey — Cloud Function Deployment${NC}"
echo -e "${YELLOW}===========================================${NC}\n"

# ===== Checks =====
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Install: brew install --cask google-cloud-sdk${NC}"
    exit 1
fi

if [ ! -f ".env.yaml" ]; then
    echo -e "${RED}❌ .env.yaml not found. Please create it first (see DEPLOY.md)${NC}"
    exit 1
fi

if [ ! -f "main.py" ]; then
    echo -e "${RED}❌ main.py not found. Are you in the cloud-function/ directory?${NC}"
    exit 1
fi

# ===== Set Project =====
echo -e "${YELLOW}📌 Setting project: ${PROJECT_ID}${NC}"
gcloud config set project "$PROJECT_ID"

# ===== Enable Required APIs =====
echo -e "\n${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable \
    cloudfunctions.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    run.googleapis.com

# ===== Check Secret =====
echo -e "\n${YELLOW}🔐 Checking Secret Manager...${NC}"
if ! gcloud secrets describe claude-api-key &> /dev/null; then
    echo -e "${RED}❌ Secret 'claude-api-key' not found.${NC}"
    echo -e "Create it first with:"
    echo -e "  ${GREEN}echo -n 'sk-ant-api03-xxxxx' | gcloud secrets create claude-api-key --data-file=- --replication-policy='automatic'${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Secret 'claude-api-key' found${NC}"

# ===== Deploy Function =====
echo -e "\n${YELLOW}☁️  Deploying Cloud Function...${NC}"
gcloud functions deploy "$FUNCTION_NAME" \
    --gen2 \
    --runtime="$RUNTIME" \
    --region="$REGION" \
    --source=. \
    --entry-point="$ENTRY_POINT" \
    --trigger-http \
    --allow-unauthenticated \
    --memory="$MEMORY" \
    --timeout="$TIMEOUT" \
    --env-vars-file=.env.yaml \
    --set-secrets="CLAUDE_API_KEY=claude-api-key:latest"

# ===== Get Function URL =====
FUNCTION_URL=$(gcloud functions describe "$FUNCTION_NAME" \
    --region="$REGION" \
    --format="value(serviceConfig.uri)")

echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "Function URL: ${GREEN}${FUNCTION_URL}${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "  1. Copy above URL to ${GREEN}assets/js/config.js → ENDPOINT${NC}"
echo -e "  2. Commit & push to GitHub"
echo -e "  3. Test the live URL: https://[사용자명].github.io/yeo-vn-washoff-survey/"
echo -e ""
echo -e "${YELLOW}🧪 Test command:${NC}"
echo -e "curl -X POST ${FUNCTION_URL} \\"
echo -e '  -H "Content-Type: application/json" \'
echo -e '  -d '"'"'{"tester_id":"TEST-001","messages":[{"role":"user","content":"안녕하세요"}]}'"'"
echo -e ""
