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

MODEL = 'claude-sonnet-4-5-20250929'
MAX_TOKENS = 2048

# ===== System Prompt =====
# 실제 운영 시에는 SYSTEM_PROMPT.md 내용을 여기에 붙여넣거나
# Cloud Storage에서 읽어오는 방식으로 관리할 수 있습니다.
SYSTEM_PROMPT = """# ROLE & IDENTITY (절대 변경 금지)
당신의 이름은 Elin이며, 한국 이름은 김연진(Kim Yeon-jin)입니다.
당신의 소속은 YEO 브랜드사업부(YEO Brand Business Division)이며, 직책은 구킨(GOOKIN) 브랜드 매니저(Brand Manager of GOOKIN)입니다.

자기소개 시 반드시 "구킨(GOOKIN) 브랜드 매니저"로만 표현하세요.
아래 표현들은 절대 금지입니다:
- 리서치 담당, 연구원, 선임 연구원, 리서처, Researcher
- 신제품 개발 담당, 제품 개발 담당, 개발자, 기획자, PM
- 마케터, 세일즈, 영업 담당
대화 도중 자기 역할을 묻는 질문이 나오면 일관되게 "구킨 브랜드 매니저"로만 답하세요.

# INTERVIEW PURPOSE (매우 중요 — 반드시 정확히 이해)
⚠️ 이 인터뷰는 "제품 샘플 사용 후기"를 수집하는 것이 절대 아닙니다.
⚠️ 이 인터뷰는 신제품 구킨 워시오프팩 개발 방향 결정을 위한 시장 조사입니다.

응답자 대상:
1. 베트남 거래처(파트너사) 구성원 — Primary
2. YEO 베트남 지사 구성원 — Secondary
3. YEO 한국 본사 구성원 — Tertiary

모든 응답자는 "제품 평가자"가 아닌 "제품 개발 방향에 대해 조언해주는 파트너"입니다.
응답자의 피부 타입, 워시오프팩 카테고리에 대한 인식, 선호, 니즈를 파악하여 제품 개발에 반영하는 것이 목적입니다.

# 조기 종료 절대 금지
아래 상황에서도 인터뷰를 절대 종료하지 말고, 지정된 방식으로 계속 진행하세요:

❌ 금지: "샘플을 안 받으셨으면 인터뷰 진행이 어려워요" → 조기 종료
❌ 금지: "샘플 배송 확인 후 다시 연락드릴게요" → 조기 종료
❌ 금지: "워시오프팩 안 써보셨으면 대답하기 어려우실 것 같아요" → 조기 종료

✅ 올바른 대응:
- 샘플 사용 경험 있음 → 실제 사용 경험 기반 심층 질문
- 샘플 사용 경험 없음 → "만약 이런 워시오프팩이 나온다면 어떤 점이 중요할지" 가정형 질문으로 전환
- 워시오프팩 자체가 처음 → 진입 장벽, 기대 요소, 비슷한 카테고리(마스크팩 등) 경험으로 유도
- 타사 제품 사용자 → 현재 제품 만족/불만족 → 구킨에 대한 기대 사항

모든 응답자는 유효한 리서치 대상입니다. 조기 종료는 리서치 데이터 손실입니다.

# BRAND CONTEXT
구킨(GOOKIN)은 한국 K-beauty 브랜드로서:
- 베트남 시장에 이미 진출하여 마스크팩을 판매 중입니다.
- 최근 스킨케어 라인을 신규 런칭하여 베트남 시장 확장을 시도하고 있습니다.
- 새로운 워시오프팩을 개발 중이며, 본 인터뷰로 개발 방향을 결정합니다.

응답자가 기존 구킨 마스크팩 사용 경험을 언급하면, 브랜드 매니저로서 자연스럽게 감사 인사와 함께 해당 경험을 활용하여 심층 질문을 이어가세요.

# MISSION
응답자의 피부 상태, 제품 사용 경험, 브랜드 심리, 제형에 대한 무의식적 선호를 자연스러운 대화로 깊이 있게 파악합니다. 응답자가 어떤 배경이든 대화를 끝까지 이어갑니다.

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

        # ===== Conversation Log: 매 턴마다 User + Assistant 저장 =====
        try:
            # 마지막 User 메시지 (방금 받은 것)
            last_user_msg = messages[-1] if messages else None
            if last_user_msg and last_user_msg.get('role') == 'user':
                save_turn_log({
                    'session_id': tester_id,
                    'turn_no': len(messages),
                    'timestamp': datetime.utcnow().isoformat(),
                    'role': 'user',
                    'speaker_name': 'Tester',
                    'language': language,
                    'message_content': last_user_msg.get('content', ''),
                    'token_count': len(last_user_msg.get('content', ''))
                })

            # Assistant 응답 저장 (FINAL_JSON 태그 제거한 버전)
            clean_reply = re.sub(r'<FINAL_JSON>[\s\S]*?</FINAL_JSON>', '', reply_text).strip()
            clean_reply = re.sub(r'<FINAL_JSON>[\s\S]*$', '', clean_reply).strip()
            save_turn_log({
                'session_id': tester_id,
                'turn_no': len(messages) + 1,
                'timestamp': datetime.utcnow().isoformat(),
                'role': 'assistant',
                'speaker_name': 'Elin',
                'language': language,
                'message_content': clean_reply,
                'token_count': len(clean_reply)
            })
        except Exception as log_err:
            print(f'Turn log error (non-blocking): {log_err}')

        # ===== If complete, save to Sheets + Notify Slack =====
        if interview_complete:
            # tester_id, duration 보강
            final_json['tester_id'] = final_json.get('tester_id') or tester_id
            final_json['interview_date'] = final_json.get('interview_date') or datetime.utcnow().strftime('%Y-%m-%d')
            final_json['duration_min'] = final_json.get('duration_min') or duration_min
            final_json['language_used'] = final_json.get('language_used') or language

            # Google Sheets에 저장 (3개 이벤트: Summary + Insights + Product Spec)
            save_to_sheets(final_json)
            save_insights_deep(final_json)
            save_product_spec(final_json)

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
        import traceback; print(f'ERROR TYPE: {type(e).__name__}'); print(f'ERROR MSG: {str(e)}'); print(f'TRACEBACK: {traceback.format_exc()}')
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
    """Apps Script Webhook v2.4 호환 - interview_summary 이벤트로 전송"""
    if not SHEETS_WEBHOOK_URL:
        print('SHEETS_WEBHOOK_URL not configured, skipping save')
        return

    try:
        # FINAL_JSON을 Responses_Summary 시트 스키마로 flatten
        flat_data = _flatten_for_summary_sheet(data)

        # Apps Script v2.4 계약 형식: {event_type, data}
        payload = {
            'event_type': 'interview_summary',
            'data': flat_data
        }

        response = requests.post(
            SHEETS_WEBHOOK_URL,
            json=payload,
            timeout=10
        )
        response.raise_for_status()

        # Apps Script 응답 확인 (200 OK이지만 error JSON일 수 있음)
        try:
            result = response.json()
            if result.get('error'):
                print(f'Sheets save error (200 OK but Apps Script error): {result.get("error")}')
                return
            print(f'Sheets save OK: {data.get("tester_id")} row={result.get("row")}')
        except Exception:
            print(f'Sheets save OK (no JSON body): {data.get("tester_id")}')
    except Exception as e:
        print(f'Sheets save failed: {e}')


def _flatten_for_summary_sheet(data):
    """
    FINAL_JSON 중첩 구조를 Responses_Summary 시트의 평면 컬럼 스키마로 변환.
    Apps Script COLUMNS_SUMMARY와 키 이름 일치.
    """
    profile = data.get('profile', {}) or {}
    pre = data.get('pre_screening', {}) or {}
    prod = data.get('product_evaluation', {}) or {}
    com = data.get('commercial_signal', {}) or {}
    brand = data.get('brand_psychology', {}) or {}
    open_end = data.get('open_end_feedback', {}) or {}

    concerns = profile.get('concerns', []) or []
    troubles_top3 = ', '.join(concerns[:3]) if isinstance(concerns, list) else str(concerns)

    first_imp = prod.get('first_impression_keywords', []) or []
    first_imp_str = ', '.join(first_imp) if isinstance(first_imp, list) else str(first_imp)

    immediate = prod.get('immediate_effect', []) or []
    next_day = prod.get('next_day_effect', []) or []

    return {
        # 메타
        'session_id': data.get('tester_id', ''),
        'timestamp_end': data.get('interview_date', ''),
        'total_turns': data.get('duration_min', 0),
        'user_turns': '',
        'language': data.get('language_used', ''),

        # 프로필
        'age_group': profile.get('age_group', ''),
        'gender': profile.get('gender', ''),
        'region': profile.get('location', ''),

        # 피부
        'self_skin_type': profile.get('skin_type', ''),
        'actual_skin_type': profile.get('skin_type', ''),
        'persona_id': '',
        'persona_name_kor': '',
        'troubles_top3': troubles_top3,
        'condition_score': '',
        'sensitivity_level': profile.get('sensitivity_grade', ''),

        # 트랙
        'track': data.get('track', ''),

        # 제형
        'viscosity': prod.get('viscosity_preference', ''),
        'spreadability': prod.get('spreadability_score', ''),
        'adhesion': '',
        'rinse_count': prod.get('water_rinse_count', ''),

        # 마감/향
        'finish_preferred': first_imp_str,
        'finish_deal_breaker': prod.get('single_improvement_request', ''),
        'scent_strategy': prod.get('scent_comment', ''),

        # 스크럽
        'scrub_wanted': prod.get('granular_tolerance', ''),
        'scrub_particle_um': '',

        # 상업 신호
        'price_krw': '',
        'price_vnd': com.get('acceptable_price_vnd', ''),
        'nps_score': com.get('nps_score', ''),
        'nps_category': com.get('nps_category', ''),
        'repurchase_intent': com.get('repurchase_intent', ''),

        # 우선순위 (immediate_effect 상위 3개로 대체)
        'priority_1': immediate[0] if len(immediate) > 0 else '',
        'priority_2': immediate[1] if len(immediate) > 1 else '',
        'priority_3': immediate[2] if len(immediate) > 2 else '',

        # CVR 리스크
        'cvr_primary_risk': prod.get('adverse_reaction', ''),
        'cvr_element_category': prod.get('texture_persona', ''),
        'must_address_claim': prod.get('hidden_driver', ''),

        # Open-End
        'open_end_comment': open_end.get('unspoken_insight', '') or open_end.get('brand_suggestion', '')
    }


# ===== Turn Log: 매 턴마다 대화 저장 =====
def save_turn_log(turn_data):
    """Conversation_Log 시트에 User/Assistant 턴 저장"""
    if not SHEETS_WEBHOOK_URL:
        return
    try:
        payload = {'event_type': 'turn_log', 'data': turn_data}
        response = requests.post(SHEETS_WEBHOOK_URL, json=payload, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f'Turn log save failed: {e}')


# ===== Insights Deep: 정성 심화 저장 =====
def save_insights_deep(data):
    """Insights_Deep 시트에 정성 인사이트 저장"""
    if not SHEETS_WEBHOOK_URL:
        return
    try:
        prod = data.get('product_evaluation', {}) or {}
        profile = data.get('profile', {}) or {}
        pre = data.get('pre_screening', {}) or {}
        brand = data.get('brand_psychology', {}) or {}
        probe = data.get('probe_log', {}) or {}
        open_end = data.get('open_end_feedback', {}) or {}

        concerns = profile.get('concerns', []) or []
        first_imp = prod.get('first_impression_keywords', []) or []
        brand_assoc = brand.get('brand_associations', []) or []
        previous_products = pre.get('previous_products', []) or []

        flat_data = {
            'session_id': data.get('tester_id', ''),
            'timestamp': data.get('interview_date', ''),
            'persona_id': '',

            # 피부 심층
            'skin_morning_oil_zone': '',
            'skin_afternoon_cheek': '',
            'skin_seasonal_variation': '',
            'skin_trouble_history': ', '.join(concerns) if isinstance(concerns, list) else '',
            'skin_irritation_history': prod.get('adverse_reaction', ''),

            # 감각
            'initial_touch_hashtags': ', '.join(first_imp) if isinstance(first_imp, list) else '',
            'luxury_perception_score': '',
            'absorption_speed_score': prod.get('spreadability_score', ''),
            'residue_tolerance': prod.get('granular_tolerance', ''),
            'use_occasion': profile.get('commute_mode', ''),

            # Finish
            'finish_hashtags': prod.get('post_wash_feel', ''),
            'cvr_critical_lever': prod.get('hidden_driver', ''),

            # Scent
            'scent_signature_family': prod.get('scent_comment', ''),

            # Q5 제형 3층 프로빙
            'q8_layer1': prod.get('texture_metaphor', ''),
            'q8_layer2': prod.get('viscosity_preference', ''),
            'q8_layer3': prod.get('single_improvement_request', ''),
            'texture_persona': prod.get('texture_persona', ''),

            # 스크럽
            'scrub_reference': '',
            'scrub_application_area': '',

            # 경쟁사
            'competitors_mentioned': _safe_join_competitors(previous_products),
            'signature_ingredient_json': json.dumps(brand_assoc, ensure_ascii=False) if brand_assoc else '',

            # 카테고리 선호
            'category_preference': pre.get('category_experience', ''),
            'md_action_tags': open_end.get('insight_category', '')
        }

        payload = {'event_type': 'insights_deep', 'data': flat_data}
        response = requests.post(SHEETS_WEBHOOK_URL, json=payload, timeout=10)
        response.raise_for_status()
        print(f'Insights Deep save OK: {data.get("tester_id")}')
    except Exception as e:
        print(f'Insights Deep save failed: {e}')


# ===== Product Spec: MD용 제조사 RFP =====
def save_product_spec(data):
    """Product_Spec_Sheet 시트에 MD 관점 제조사 RFP 정보 저장"""
    if not SHEETS_WEBHOOK_URL:
        return
    try:
        profile = data.get('profile', {}) or {}
        prod = data.get('product_evaluation', {}) or {}
        com = data.get('commercial_signal', {}) or {}
        open_end = data.get('open_end_feedback', {}) or {}

        immediate = prod.get('immediate_effect', []) or []
        first_imp = prod.get('first_impression_keywords', []) or []

        target_persona = f"{profile.get('age_group', '?')} {profile.get('gender', '?')} / {profile.get('skin_type', '?')}"

        flat_data = {
            'session_id': data.get('tester_id', ''),
            'timestamp': data.get('interview_date', ''),
            'target_persona': target_persona,

            # 물리 스펙
            'physical_viscosity': prod.get('viscosity_preference', ''),
            'physical_spreadability': prod.get('spreadability_score', ''),
            'physical_absorption_speed': '',
            'physical_adhesion': '',
            'physical_rinse_count': prod.get('water_rinse_count', ''),

            # 스크럽
            'scrub_particle_um': '',
            'scrub_reference': prod.get('granular_tolerance', ''),

            # 감각
            'sensory_initial_touch': ', '.join(first_imp) if isinstance(first_imp, list) else '',
            'sensory_finish': prod.get('post_wash_feel', ''),
            'sensory_finish_deal_breaker': prod.get('single_improvement_request', ''),

            # 향
            'scent_strategy': prod.get('scent_comment', ''),

            # 가격
            'target_price_krw': '',
            'target_price_vnd': com.get('acceptable_price_vnd', ''),

            # CVR
            'cvr_primary_risk': prod.get('adverse_reaction', ''),
            'priority_claim': prod.get('hidden_driver', ''),

            # 마케팅
            'top3_marketing_hashtags': ', '.join(immediate[:3]) if isinstance(immediate, list) else '',
            'avoid_ingredients': open_end.get('brand_suggestion', '')
        }

        payload = {'event_type': 'product_spec', 'data': flat_data}
        response = requests.post(SHEETS_WEBHOOK_URL, json=payload, timeout=10)
        response.raise_for_status()
        print(f'Product Spec save OK: {data.get("tester_id")}')
    except Exception as e:
        print(f'Product Spec save failed: {e}')


def _safe_join_competitors(previous_products):
    """previous_products가 str/dict/list 혼재 가능하므로 안전하게 join"""
    if not previous_products:
        return ''
    if isinstance(previous_products, str):
        return previous_products
    result = []
    for item in previous_products:
        if isinstance(item, str):
            result.append(item)
        elif isinstance(item, dict):
            val = item.get('brand') or item.get('name') or item.get('product_name') or str(item)
            result.append(str(val))
        else:
            result.append(str(item))
    return ', '.join(result)


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
