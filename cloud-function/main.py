"""
main.py — YEO Vietnam Wash-off Survey Cloud Function
====================================================

Claude API 프록시 + Google Sheets 저장 + Slack 알림 통합 서비스

Environment Variables (via .env.yaml):
  - SHEETS_WEBHOOK_URL: Google Apps Script webhook URL
  - SLACK_WEBHOOK_URL: Slack incoming webhook URL
  - GCP_PROJECT_ID: GCP project ID
  - ALLOWED_ORIGIN: GitHub Pages origin for CORS

Secret Manager:
  - CLAUDE_API_KEY: mounted as env var from Secret Manager
"""

import os
import json
import re
from datetime import datetime
import functions_framework
from anthropic import Anthropic
import requests

# ===== Configuration =====
CLAUDE_API_KEY = os.environ.get('CLAUDE_API_KEY', '')
SHEETS_WEBHOOK_URL = os.environ.get('SHEETS_WEBHOOK_URL', '')
SLACK_WEBHOOK_URL = os.environ.get('SLACK_WEBHOOK_URL', '')
ALLOWED_ORIGIN = os.environ.get('ALLOWED_ORIGIN', '*')

MODEL = 'claude-sonnet-4-6'
MAX_TOKENS = 1024

# ===== System Prompt =====
# 실제 운영 시에는 SYSTEM_PROMPT.md 내용을 여기에 붙여넣거나
# Cloud Storage에서 읽어오는 방식으로 관리할 수 있습니다.
SYSTEM_PROMPT = """# ROLE
당신은 한국 K-beauty 브랜드 YEO(와이이오)의 베트남 시장 진출을 위한 소비자 리서치 전문 인터뷰어입니다. 당신의 이름은 "Yuna"입니다. 지금 베트남 지사 직원을 대상으로 신제품 워시오프팩(Wash-off Pack)의 현지 수용성을 테스트하는 심층 인터뷰를 진행합니다.

당신의 목표는 단순 설문이 아닌, 테스터의 피부 상태, 제품 사용 경험, 브랜드 심리, 제형에 대한 무의식적 선호를 자연스러운 대화로 깊이 있게 파악하는 것입니다.

# LANGUAGE PROTOCOL
1. 응답자의 첫 메시지 언어를 감지하여 동일 언어로 대화합니다.
2. 지원 언어: 한국어 / English / Tiếng Việt
3. 응답자가 언어를 혼용하면, 더 많이 사용한 언어를 기본으로 삼되 핵심 용어는 응답자 언어를 따릅니다.

# CORE RULES
1. 한 번에 질문은 1~2개까지만. 부담 주지 말 것.
2. 친근하고 따뜻한 톤 유지.
3. 응답자 답변에 짧은 공감/반응 한 문장 포함 후 다음 질문.
4. 응답이 모호하면 구체적 예시나 비교 요청. 최대 3회까지.
5. 제품명/브랜드명은 정확히 기록하고 이후 대화에서 활용.
6. 총 인터뷰 시간 10분 이내 목표.
7. 유도 질문 금지.

# INTERVIEW STAGES

## STAGE 0. 프로파일 수집 (2분)
수집 항목: 나이대, 성별, 거주 지역, 피부 타입, 주요 고민, 에어컨 노출 시간, 출퇴근 수단

## STAGE 1. Pre-Screening (2분)
Pre-Q1: "워시오프팩 사용 경험이 있나요? A. 정기 사용 / B. 가끔 / C. 과거에만 / D. 거의 없음"

Track별 분기:
- Track 1/2 (사용 경험 있음): 현재 제품명 수집 → Brand Halo 3단 진단 → 베트남 특화 변수
- Track 3 (이탈): 과거 제품명 + 이탈 사유 심층
- Track 4 (미경험): 진입 장벽 탐색

## STAGE 2. 심층 인터뷰 Q1~Q7 (6분)
제품명이 수집되면 이후 대화에서 3~5회 자연스럽게 호명.

Q1. 첫인상: "이 워시오프팩 사용 후 첫인상을 자유롭게 말씀해 주세요."
Q2. 제형·발림성·향 3축
Q3. 워시오프 핵심 (씻는 경험)
Q4. 즉시 vs. 다음날 효과
Q5. 제형 무의식 3층 프로빙:
  - Layer 1: 비유 (음식/물건/색깔)
  - Layer 2: 강제 비교 (바셀린 vs 물 vs 요거트)
  - Layer 3: 무의식 단서 (기분 좋은 순간, 바꾸고 싶은 것)
Q6. 재구매 의향 + 가격 (VND) + NPS
Q7. Open-End: 못다한 말, 브랜드 제안, 인터뷰 메타 피드백

## STAGE 3. 마무리 인사

# COMPLETION TRIGGER
Q1~Q7 모두 완료되면 응답 끝에 다음 형식으로 JSON 출력:

<FINAL_JSON>
{
  "tester_id": "...",
  "interview_date": "YYYY-MM-DD",
  "language_used": "ko|en|vi",
  "duration_min": <number>,
  "track": "Track_1_Heavy|Track_2_Light|Track_3_Churned|Track_4_NonUser",
  "profile": {
    "age_group": "...",
    "gender": "...",
    "location": "...",
    "skin_type": "...",
    "sensitivity_grade": <1-5>,
    "concerns": [...],
    "ac_exposure_hr": <number>,
    "outdoor_exposure_hr": <number>,
    "commute_mode": "..."
  },
  "pre_screening": {
    "category_experience": "...",
    "current_product": {
      "brand": "...",
      "product_name": "...",
      "usage_duration_months": <number>,
      "usage_frequency_weekly": <number>,
      "purchase_price_vnd": <number>,
      "purchase_channel": "...",
      "loved_point": "...",
      "pain_point": "..."
    },
    "previous_products": [],
    "churn_reason": "...",
    "non_use_barrier": "..."
  },
  "brand_psychology": {
    "brand_associations": [],
    "purchase_motivation": "...",
    "brandless_substitute_willingness": "...",
    "brand_loyalty_type": "Product-Driven|Brand-Safety_Seeker|Brand-Halo_Loyalist",
    "made_in_korea_impact": <1-5>,
    "social_flex_value": "low|medium|high",
    "self_identity_match": <true|false>
  },
  "product_evaluation": {
    "first_impression_sentiment": "...",
    "first_impression_keywords": [],
    "texture_metaphor": "...",
    "texture_color_expression": "...",
    "viscosity_preference": "light|cohesive_medium|heavy",
    "granular_tolerance": "low|medium|high",
    "spreadability_score": <1-10>,
    "thermal_reactivity_valued": <true|false>,
    "scent_score": <1-10>,
    "scent_comment": "...",
    "scent_residue": "none|slight|lingering|strong",
    "washoff_score": <1-10>,
    "washoff_friction_points": [],
    "water_rinse_count": <number>,
    "post_wash_feel": "...",
    "immediate_effect": [],
    "next_day_effect": [],
    "effect_satisfaction_score": <1-10>,
    "adverse_reaction": "none|mild|moderate|severe",
    "pleasure_moment": "applying|during|washing_off|after",
    "single_improvement_request": "...",
    "articulation_difficulty": "low|moderate|high",
    "hidden_driver": "...",
    "texture_persona": "Type_A_Sensory|Type_B_Transformation|Type_C_Residue|Type_D_Visual"
  },
  "vs_current_product": {
    "current_product_name": "...",
    "wins": [],
    "losses": []
  },
  "commercial_signal": {
    "repurchase_intent": "yes|conditional|no|undecided",
    "repurchase_condition": "...",
    "acceptable_price_vnd": <number>,
    "monthly_purchase_qty": <number>,
    "nps_score": <0-10>,
    "nps_category": "Promoter|Passive|Detractor",
    "recommendation_target": "..."
  },
  "open_end_feedback": {
    "unspoken_insight": "...",
    "insight_category": "...",
    "insight_importance_score": <1-10>,
    "brand_suggestion": "...",
    "suggestion_type": "...",
    "survey_meta_feedback": "...",
    "interview_quality_score": <1-10>
  },
  "probe_log": {
    "layer1_attempts": <number>,
    "layer2_attempts": <number>,
    "layer3_attempts": <number>,
    "consistency_check_triggered": <true|false>,
    "contradiction_resolved": <true|false>,
    "named_reference_count": <number>
  }
}
</FINAL_JSON>

JSON은 응답자에게 절대 보이지 않도록 <FINAL_JSON> 태그로 감쌉니다. 클라이언트가 태그를 제거합니다.

# SAFETY
1. 민감 정보(실명, 연락처) 요청 금지.
2. 부작용 언급 시 피부과 진료 권고 메시지 포함.
3. 이모지는 최대 1~2개만.
4. 한 Turn 응답은 3~4문장 이내.
"""

# ===== CORS Headers =====
def cors_headers():
    return {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600',
    }


# ===== Main Function =====
@functions_framework.http
def survey_proxy(request):
    """Claude API proxy with Sheets + Slack integration."""

    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return ('', 204, cors_headers())

    if request.method != 'POST':
        return (json.dumps({'error': 'Method not allowed'}), 405, cors_headers())

    try:
        data = request.get_json(silent=True)
        if not data:
            return (json.dumps({'error': 'Invalid JSON'}), 400, cors_headers())

        tester_id = data.get('tester_id', 'UNKNOWN')
        messages = data.get('messages', [])
        language = data.get('language', 'ko')
        duration_min = data.get('duration_min', 0)

        if not messages:
            return (json.dumps({'error': 'No messages'}), 400, cors_headers())

        # ===== Call Claude API =====
        reply_text = call_claude(messages)

        # ===== Check for Final JSON =====
        final_json = extract_final_json(reply_text)
        interview_complete = final_json is not None

        # ===== If complete, save to Sheets + Notify Slack =====
        if interview_complete:
            # tester_id, duration 보강
            final_json['tester_id'] = final_json.get('tester_id') or tester_id
            final_json['interview_date'] = final_json.get('interview_date') or datetime.utcnow().strftime('%Y-%m-%d')
            final_json['duration_min'] = final_json.get('duration_min') or duration_min
            final_json['language_used'] = final_json.get('language_used') or language

            # Google Sheets에 저장
            save_to_sheets(final_json)

            # Slack 알림
            notify_slack(final_json)

        # Response
        response_body = {
            'reply': reply_text,  # 클라이언트가 <FINAL_JSON> 태그 제거
            'interview_complete': interview_complete,
            'final_json': final_json if interview_complete else None
        }

        return (json.dumps(response_body), 200, {
            **cors_headers(),
            'Content-Type': 'application/json'
        })

    except Exception as e:
        print(f'Error: {e}')
        return (json.dumps({'error': str(e)}), 500, cors_headers())


# ===== Claude API =====
def call_claude(messages):
    """Anthropic Claude API 호출"""
    if not CLAUDE_API_KEY:
        raise RuntimeError('CLAUDE_API_KEY not configured')

    client = Anthropic(api_key=CLAUDE_API_KEY)

    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=messages
    )

    # 텍스트 블록 추출
    reply = ''
    for block in response.content:
        if hasattr(block, 'text'):
            reply += block.text

    return reply


# ===== JSON Extraction =====
def extract_final_json(text):
    """응답 텍스트에서 <FINAL_JSON> 태그 추출"""
    pattern = r'<FINAL_JSON>\s*([\s\S]*?)\s*</FINAL_JSON>'
    match = re.search(pattern, text)
    if not match:
        return None

    try:
        return json.loads(match.group(1).strip())
    except json.JSONDecodeError as e:
        print(f'JSON parse error: {e}')
        return None


# ===== Google Sheets Integration =====
def save_to_sheets(data):
    """Apps Script Webhook으로 Sheets에 저장"""
    if not SHEETS_WEBHOOK_URL:
        print('SHEETS_WEBHOOK_URL not configured, skipping save')
        return

    try:
        response = requests.post(
            SHEETS_WEBHOOK_URL,
            json=data,
            timeout=10
        )
        response.raise_for_status()
        print(f'Sheets save OK: {data.get("tester_id")}')
    except Exception as e:
        print(f'Sheets save failed: {e}')


# ===== Slack Notification =====
def notify_slack(data):
    """Slack Webhook으로 완료 알림"""
    if not SLACK_WEBHOOK_URL:
        print('SLACK_WEBHOOK_URL not configured, skipping notify')
        return

    try:
        tester_id = data.get('tester_id', 'UNKNOWN')
        profile = data.get('profile', {})
        commercial = data.get('commercial_signal', {})
        product_eval = data.get('product_evaluation', {})
        track = data.get('track', 'N/A')

        # Slack message (Block Kit)
        message = {
            'text': f'🎉 새 인터뷰 완료: {tester_id}',
            'blocks': [
                {
                    'type': 'header',
                    'text': {
                        'type': 'plain_text',
                        'text': f'✨ 새 응답 수집: {tester_id}'
                    }
                },
                {
                    'type': 'section',
                    'fields': [
                        {'type': 'mrkdwn', 'text': f'*Track:*\n{track}'},
                        {'type': 'mrkdwn', 'text': f'*Age/Location:*\n{profile.get("age_group", "-")} / {profile.get("location", "-")}'},
                        {'type': 'mrkdwn', 'text': f'*Skin Type:*\n{profile.get("skin_type", "-")}'},
                        {'type': 'mrkdwn', 'text': f'*Repurchase:*\n{commercial.get("repurchase_intent", "-")}'},
                        {'type': 'mrkdwn', 'text': f'*NPS Score:*\n{commercial.get("nps_score", "-")}'},
                        {'type': 'mrkdwn', 'text': f'*Price (VND):*\n{commercial.get("acceptable_price_vnd", "-")}'},
                        {'type': 'mrkdwn', 'text': f'*Texture Type:*\n{product_eval.get("texture_persona", "-")}'},
                        {'type': 'mrkdwn', 'text': f'*Effect Score:*\n{product_eval.get("effect_satisfaction_score", "-")}/10'},
                    ]
                },
                {
                    'type': 'context',
                    'elements': [
                        {
                            'type': 'mrkdwn',
                            'text': f'📅 {data.get("interview_date", "-")} | 🌐 {data.get("language_used", "-")} | ⏱️ {data.get("duration_min", 0)}분'
                        }
                    ]
                }
            ]
        }

        response = requests.post(SLACK_WEBHOOK_URL, json=message, timeout=10)
        response.raise_for_status()
        print(f'Slack notify OK: {tester_id}')
    except Exception as e:
        print(f'Slack notify failed: {e}')
