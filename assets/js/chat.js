/**
 * YEO × GOOKIN VN Wash-off Survey — chat.js v2.4
 * v2.3 + Summary Card UI + PDF Download + 안내문
 */

if (window.__YEO_CHAT_LOADED__) {
  console.warn('chat.js already loaded, skipping re-init');
} else {
  window.__YEO_CHAT_LOADED__ = true;

  (function () {
    'use strict';

    const ENDPOINT = (window.CONFIG && window.CONFIG.ENDPOINT)
                     || 'https://survey-proxy-eh3r7dgeaq-du.a.run.app';
    const messages = [];
    let currentLang = 'ko';
    const sessionId = generateSessionId();
    const testerId = generateTesterId();
    let isCompleted = false;
    let isSending = false;
    let initDone = false;
    let isComposing = false;
    let lastSummaryCard = null;

    let welcomeScreen, chatScreen, completionScreen;
    let chatMessages, typingIndicator, inputField, sendBtn;
    let startBtn, testerIdDisplay, langBtns;
    let summaryCardContainer, downloadBtn, closeBtn;

    function init() {
      if (initDone) return;
      initDone = true;

      welcomeScreen = document.getElementById('welcome-screen');
      chatScreen = document.getElementById('chat-screen');
      completionScreen = document.getElementById('completion-screen');
      chatMessages = document.getElementById('chat-messages');
      typingIndicator = document.getElementById('typing-indicator');
      inputField = document.getElementById('user-input');
      sendBtn = document.getElementById('send-btn');
      startBtn = document.getElementById('start-btn');
      testerIdDisplay = document.getElementById('tester-id-display');
      langBtns = document.querySelectorAll('.lang-btn');
      summaryCardContainer = document.getElementById('summary-card-container');
      downloadBtn = document.getElementById('download-summary-btn');
      closeBtn = document.getElementById('close-btn');

      if (typeof detectLanguage === 'function') {
        currentLang = detectLanguage();
      }
      updateLangUI(currentLang);
      applyI18nToWelcome();
      bindEvents();
    }

    function generateSessionId() {
      const ts = new Date().toISOString().replace(/[-:.TZ]/g, '').substring(0, 14);
      const rand = Math.random().toString(36).substring(2, 8);
      return 'sess_' + ts + '_' + rand;
    }

    function generateTesterId() {
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      return 'VN-T-' + rand;
    }

    function bindEvents() {
      langBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          currentLang = btn.getAttribute('data-lang');
          updateLangUI(currentLang);
          applyI18nToWelcome();
        });
      });

      if (startBtn) startBtn.addEventListener('click', startInterview);
      if (sendBtn) sendBtn.addEventListener('click', handleSend);

      if (inputField) {
        inputField.addEventListener('compositionstart', function () { isComposing = true; });
        inputField.addEventListener('compositionend', function () { isComposing = false; });

        inputField.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !e.shiftKey && !isComposing && !e.isComposing && e.keyCode !== 229) {
            e.preventDefault();
            handleSend();
          }
        });

        inputField.addEventListener('input', function () {
          inputField.style.height = 'auto';
          inputField.style.height = Math.min(inputField.scrollHeight, 120) + 'px';
        });
      }

      if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadSummary);
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          window.close();
          // close 실패 시 blank 페이지로
          setTimeout(function () {
            document.body.innerHTML = '<div style="padding: 40px; text-align: center;"><h2>👋</h2><p>이 탭은 이제 닫으셔도 됩니다.</p></div>';
          }, 300);
        });
      }
    }

    function updateLangUI(lang) {
      langBtns.forEach(function (b) {
        if (b.getAttribute('data-lang') === lang) b.classList.add('active');
        else b.classList.remove('active');
      });
    }

    function applyI18nToWelcome() {
      const wt = (typeof getWelcomeTexts === 'function') ? getWelcomeTexts(currentLang) : null;
      if (!wt) return;

      const t1 = document.querySelector('[data-i18n="welcome_title_line1"]');
      const t2 = document.querySelector('[data-i18n="welcome_title_line2"]');
      if (t1) t1.textContent = wt.title_line1;
      if (t2) t2.textContent = wt.title_line2;

      const desc = document.querySelector('[data-i18n="welcome_description"]');
      if (desc) desc.innerHTML = wt.description;

      // Notice Box
      const noticeTitle = document.querySelector('[data-i18n="notice_title"]');
      if (noticeTitle) noticeTitle.textContent = wt.notice_title;
      const noticeItems = ['notice_duration', 'notice_completion', 'notice_partial', 'notice_value', 'notice_privacy'];
      noticeItems.forEach(function (key, idx) {
        const el = document.querySelector('[data-i18n="' + key + '"]');
        if (el && wt.notice_items[idx]) {
          el.innerHTML = wt.notice_items[idx];
        }
      });

      const sBtn = document.querySelector('[data-i18n="start_button"]');
      if (sBtn) sBtn.textContent = wt.start_button;

      const dur = document.querySelector('[data-i18n="info_duration"]');
      if (dur) dur.textContent = wt.info_duration;
      const priv = document.querySelector('[data-i18n="info_privacy"]');
      if (priv) priv.textContent = wt.info_privacy;
      const langInfo = document.querySelector('[data-i18n="info_language"]');
      if (langInfo) langInfo.textContent = wt.info_language;

      if (inputField) inputField.placeholder = wt.placeholder;

      // Completion Screen i18n
      const ct = document.querySelector('[data-i18n="completion_title"]');
      if (ct) ct.textContent = wt.completion_title;
      const ctt = document.querySelector('[data-i18n="completion_tagline"]');
      if (ctt) ctt.textContent = wt.completion_tagline;
      if (downloadBtn) downloadBtn.textContent = wt.download_summary;
      if (closeBtn) closeBtn.textContent = wt.close_btn;
    }

    function startInterview() {
      if (welcomeScreen) welcomeScreen.classList.add('hidden');
      if (chatScreen) chatScreen.classList.remove('hidden');
      if (testerIdDisplay) testerIdDisplay.textContent = testerId;

      const i18n = (typeof getI18n === 'function') ? getI18n(currentLang) : null;
      if (i18n && i18n.greeting) {
        appendMessage('assistant', i18n.greeting, true);
      } else {
        appendMessage('assistant', '안녕하세요! 저는 Elin (김연진)입니다.', true);
      }

      if (inputField) inputField.focus();
    }

    async function handleSend() {
      if (isSending || isCompleted) return;
      if (isComposing) return;

      const text = inputField.value.trim();
      if (!text) return;

      isSending = true;
      sendBtn.disabled = true;

      setTimeout(function () {
        inputField.value = '';
        inputField.style.height = 'auto';
      }, 50);

      appendMessage('user', text);
      messages.push({ role: 'user', content: text });

      if (messages.filter(function (m) { return m.role === 'user'; }).length === 1) {
        if (/[가-힣]/.test(text)) currentLang = 'ko';
        else if (/[ăâêôơưđà-ỹ]/i.test(text)) currentLang = 'vi';
      }

      showTyping();

      try {
        const resp = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, messages: messages })
        });

        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        hideTyping();

        let msg = data.message || '';
        msg = msg.replace(/<FINAL_JSON>[\s\S]*?<\/FINAL_JSON>/gi, '').trim();

        appendMessage('assistant', msg);
        messages.push({ role: 'assistant', content: msg });

        if (data.completed) {
          isCompleted = true;
          lastSummaryCard = data.summary_card || null;
          setTimeout(showCompletionScreen, 2500);
        }
      } catch (err) {
        hideTyping();
        appendMessage('assistant', '⚠️ 연결 오류: ' + err.message, false, true);
      } finally {
        isSending = false;
        sendBtn.disabled = false;
        if (inputField && !isCompleted) inputField.focus();
      }
    }

    function appendMessage(role, content, isHTML, isError) {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'message message-' + role + (isError ? ' message-error' : '');

      if (role === 'assistant') {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'E';
        msgDiv.appendChild(avatar);
      }

      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      if (isHTML) bubble.innerHTML = content;
      else bubble.textContent = content;
      msgDiv.appendChild(bubble);

      chatMessages.appendChild(msgDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTyping() {
      if (typingIndicator) typingIndicator.classList.remove('hidden');
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTyping() {
      if (typingIndicator) typingIndicator.classList.add('hidden');
    }

    function showCompletionScreen() {
      if (chatScreen) chatScreen.classList.add('hidden');
      if (completionScreen) completionScreen.classList.remove('hidden');
      renderSummaryCard();
    }

    // ─── Summary Card Rendering ───
    function renderSummaryCard() {
      if (!summaryCardContainer || !lastSummaryCard) return;

      const wt = getWelcomeTexts(currentLang);
      const sc = lastSummaryCard;
      const tex = sc.texture_spec || {};
      const finish = sc.finish_summary || {};
      const scrub = sc.scrub_summary || {};
      const commercial = sc.commercial_summary || {};

      let html = '<div class="summary-card">';
      html += '<h3>' + wt.summary_title + '</h3>';

      // Profile
      if (sc.profile_line) {
        html += '<div class="section">';
        html += '<div class="section-title">' + wt.section_profile + '</div>';
        html += '<div class="section-content">' + sc.profile_line + '</div>';
        html += '</div>';
      }

      // Skin Analysis
      if (sc.persona || sc.skin_insight) {
        html += '<div class="section">';
        html += '<div class="section-title">' + wt.section_skin + '</div>';
        if (sc.skin_insight) {
          html += '<div class="skin-insight">💡 ' + sc.skin_insight + '</div>';
        }
        if (sc.troubles && sc.troubles.length) {
          html += '<div class="tag-row">';
          sc.troubles.forEach(function (t) {
            html += '<span class="tag">' + t + '</span>';
          });
          html += '</div>';
        }
        if (sc.condition_score) {
          html += '<div class="section-content" style="margin-top:8px;">Condition: ' + sc.condition_score + '/10</div>';
        }
        html += '</div>';
      }

      // Ideal Texture
      if (tex.viscosity || tex.spreadability) {
        html += '<div class="section">';
        html += '<div class="section-title">' + wt.section_texture + '</div>';
        html += makeBar(wt.bar_viscosity, tex.viscosity);
        html += makeBar(wt.bar_spreadability, tex.spreadability);
        html += makeBar(wt.bar_adhesion, tex.adhesion);
        if (tex.rinse) {
          html += '<div class="section-content" style="margin-top:8px;">' +
                  wt.label_rinse + ': ' + tex.rinse + wt.label_times + '</div>';
        }
        html += '</div>';
      }

      // Finish Preference
      if (finish.preferred || finish.deal_breaker) {
        html += '<div class="section">';
        html += '<div class="section-title">' + wt.section_finish + '</div>';
        if (finish.preferred && finish.preferred.length) {
          html += '<div class="section-content">' + wt.label_likes + ':</div>';
          html += '<div class="tag-row">';
          finish.preferred.forEach(function (t) {
            html += '<span class="tag">#' + t + '</span>';
          });
          html += '</div>';
        }
        if (finish.deal_breaker) {
          html += '<div class="section-content" style="margin-top:8px;">' + wt.label_dislikes + ':</div>';
          html += '<div class="tag-row"><span class="tag deal-breaker">' + finish.deal_breaker + '</span></div>';
        }
        html += '</div>';
      }

      // Scrub
      if (scrub.wanted) {
        html += '<div class="section">';
        html += '<div class="section-title">' + wt.section_scrub + '</div>';
        html += '<div class="section-content">';
        if (scrub.reference) html += scrub.reference;
        if (scrub.particle_um) html += ' (~' + scrub.particle_um + 'μm)';
        html += '</div>';
        html += '</div>';
      }

      // Scent
      if (sc.scent_summary) {
        html += '<div class="section">';
        html += '<div class="section-title">' + wt.section_scent + '</div>';
        html += '<div class="section-content">' + translateScent(sc.scent_summary, currentLang) + '</div>';
        html += '</div>';
      }

      // Top Priorities
      if (sc.top3_priorities && sc.top3_priorities.length) {
        html += '<div class="section">';
        html += '<div class="section-title">' + wt.section_priority + '</div>';
        html += '<ul class="priority-list">';
        sc.top3_priorities.forEach(function (p, idx) {
          html += '<li data-rank="' + (idx + 1) + '위">' + translatePriority(p, currentLang) + '</li>';
        });
        html += '</ul>';
        html += '</div>';
      }

      // Commercial
      if (commercial.price_krw || commercial.nps) {
        html += '<div class="section">';
        html += '<div class="section-title">' + wt.section_commercial + '</div>';
        html += '<div class="section-content">';
        if (commercial.price_krw) {
          html += wt.label_price_expected + ': ' + commercial.price_krw.toLocaleString() + ' KRW';
          if (commercial.price_vnd) {
            html += ' (≈ ' + commercial.price_vnd.toLocaleString() + ' VND)';
          }
          html += '<br>';
        }
        if (commercial.nps !== undefined) {
          html += wt.label_nps + ': ' + commercial.nps + '/10<br>';
        }
        if (commercial.repurchase) {
          html += wt.label_repurchase + ': ' + commercial.repurchase;
        }
        html += '</div>';
        html += '</div>';
      }

      html += '<div class="section" style="background: #E8F5E9; margin-top: 16px;">';
      html += '<div class="section-content" style="text-align: center; color: #2E7D32;">';
      html += wt.thank_you_footer;
      html += '</div></div>';

      html += '</div>';

      summaryCardContainer.innerHTML = html;
    }

    function makeBar(label, value) {
      const v = parseInt(value) || 0;
      const pct = Math.min(100, v * 10);
      return '<div class="bar-row">' +
             '<div class="bar-label">' + label + '</div>' +
             '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
             '<div class="bar-value">' + v + '/10</div>' +
             '</div>';
    }

    function translateScent(strategy, lang) {
      const map = {
        ko: { unscented: '무향 (원료취 없음)', subtle: '은은한 향', signature: '시그니처 향', functional: '기능성 향' },
        en: { unscented: 'Unscented', subtle: 'Subtle scent', signature: 'Signature scent', functional: 'Functional scent' },
        vi: { unscented: 'Không hương', subtle: 'Hương nhẹ', signature: 'Hương đặc trưng', functional: 'Hương chức năng' }
      };
      return (map[lang] && map[lang][strategy]) || strategy;
    }

    function translatePriority(p, lang) {
      const map = {
        ko: {
          pore_cleansing: '🎯 모공 속 노폐물 제거',
          low_irritant: '🛡️ 저자극 성분',
          immediate_tone_up: '✨ 즉시 톤업 효과',
          sensory_pleasure: '🌸 감각적 만족감',
          long_term_effect: '🌿 장기 사용 개선'
        }
      };
      return (map[lang] && map[lang][p]) || p;
    }

    function downloadSummary() {
      if (!lastSummaryCard) return;
      const wt = getWelcomeTexts(currentLang);
      const sc = lastSummaryCard;
      const tex = sc.texture_spec || {};
      const finish = sc.finish_summary || {};
      const commercial = sc.commercial_summary || {};

      let text = '━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      text += 'GOOKIN × YEO Research - Interview Summary\n';
      text += 'Session: ' + (testerId) + '\n';
      text += 'Date: ' + new Date().toISOString().substring(0, 16) + '\n';
      text += '━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

      text += '[PROFILE]\n' + (sc.profile_line || '-') + '\n\n';

      if (sc.persona) {
        text += '[SKIN ANALYSIS]\nPersona: ' + sc.persona + '\n';
        if (sc.skin_insight) text += 'Insight: ' + sc.skin_insight + '\n';
        if (sc.troubles) text += 'Top Concerns: ' + sc.troubles.join(', ') + '\n';
        if (sc.condition_score) text += 'Condition: ' + sc.condition_score + '/10\n';
        text += '\n';
      }

      text += '[IDEAL TEXTURE]\n';
      text += '- Viscosity: ' + (tex.viscosity || '-') + '/10\n';
      text += '- Spreadability: ' + (tex.spreadability || '-') + '/10\n';
      text += '- Adhesion: ' + (tex.adhesion || '-') + '/10\n';
      text += '- Rinse: ' + (tex.rinse || '-') + ' times\n\n';

      if (finish.preferred) {
        text += '[FINISH]\nLike: ' + finish.preferred.join(', ') + '\n';
        if (finish.deal_breaker) text += 'Never: ' + finish.deal_breaker + '\n';
        text += '\n';
      }

      if (sc.scent_summary) text += '[SCENT]\n' + sc.scent_summary + '\n\n';

      if (sc.top3_priorities && sc.top3_priorities.length) {
        text += '[TOP PRIORITIES]\n';
        sc.top3_priorities.forEach(function (p, i) {
          text += (i + 1) + '. ' + p + '\n';
        });
        text += '\n';
      }

      if (commercial.price_krw) {
        text += '[COMMERCIAL]\n';
        text += 'Expected Price: ' + commercial.price_krw.toLocaleString() + ' KRW\n';
        if (commercial.nps !== undefined) text += 'NPS: ' + commercial.nps + '/10\n';
        if (commercial.repurchase) text += 'Repurchase: ' + commercial.repurchase + '\n';
      }

      text += '\n━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      text += 'Thank you for participating in GOOKIN research.\n';

      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'GOOKIN_Interview_Summary_' + testerId + '.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
      init();
    }
  })();
}
