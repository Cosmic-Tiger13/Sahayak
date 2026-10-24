/* app.js — the UI and the conversation state machine.
   Depends on globals from languages.js, schemes.js, parser.js, speech.js. */
(function () {
  'use strict';

  var Langs = window.SahayakLangs;
  var Schemes = window.SahayakSchemes;
  var P = window.SahayakParser;
  var S = window.SahayakSpeech;

  // stage: idle -> work -> income -> age -> result -> sms -> done
  var state = { lang: 'en-IN', stage: 'idle', profile: { work: '', workType: 'other', income: null, age: null }, autoListen: true };
  function L() { return Langs[state.lang]; }

  var chat = document.getElementById('chat');
  var overlay = document.getElementById('overlay');
  var appEl = document.getElementById('app');
  var langGrid = document.getElementById('langGrid');
  var langSelect = document.getElementById('langSelect');
  var micBtn = document.getElementById('mic');
  var textInput = document.getElementById('text');
  var sendBtn = document.getElementById('send');
  var statusEl = document.getElementById('status');
  var hSub = document.getElementById('hSub');
  var restartBtn = document.getElementById('restart');
  var progressBar = document.getElementById('progressBar');

  // ---- speech ----
  S.init();
  var speaking = false, isListening = false, recognition = null;
  if (S.sttSupported()) {
    recognition = S.createRecognizer({
      onResult: function (t) { isListening = false; setMic(false); statusEl.textContent = ''; handleInput(t); },
      onError: function (err) {
        isListening = false; setMic(false);
        if (err === 'not-allowed') statusEl.textContent = 'Please allow microphone access.';
        else if (err === 'no-speech') statusEl.textContent = 'I did not hear anything. Tap the mic and try again.';
        else statusEl.textContent = '';
      },
      onEnd: function () { isListening = false; setMic(false); }
    });
  } else {
    statusEl.textContent = 'Voice input is not supported in this browser. Please type your answers.';
  }
  function speak(text, afterListen) {
    S.speak(text, state.lang, {
      onStart: function () { speaking = true; },
      onEnd: function () { speaking = false; if (afterListen && state.autoListen && state.stage !== 'done') listenOnce(); }
    });
  }
  function listenOnce() {
    if (!recognition || speaking) return;
    try { recognition.lang = state.lang; recognition.start(); isListening = true; setMic(true); statusEl.textContent = 'Listening…'; } catch (e) {}
  }
  function stopListening() { if (recognition && isListening) { try { recognition.stop(); } catch (e) {} } isListening = false; setMic(false); }
  function setMic(on) { micBtn.classList.toggle('listening', !!on); }

  // ---- progress ----
  function setProgress(step) { // 0,1,2,3 (0 = start, 3 = result)
    var pct = [0, 25, 55, 100][Math.min(step, 3)] || 0;
    if (progressBar) progressBar.style.width = pct + '%';
  }

  // ---- chat helpers ----
  function addBubble(text, who) {
    var d = document.createElement('div'); d.className = 'bubble ' + who; d.textContent = text;
    chat.appendChild(d); scroll(); return d;
  }
  function scroll() { chat.scrollTop = chat.scrollHeight; }
  function clearChips() { chat.querySelectorAll('.chips').forEach(function (c) { c.remove(); }); }
  function showChips(items) {
    clearChips();
    var w = document.createElement('div'); w.className = 'chips';
    items.forEach(function (it) {
      var b = document.createElement('button'); b.className = 'chip'; b.textContent = it.label;
      b.onclick = function () { clearChips(); handleInput(it.value); };
      w.appendChild(b);
    });
    chat.appendChild(w); scroll();
  }
  function ask(text) { addBubble(text, 'bot'); speak(text, true); }

  /* Rich card for the recommended scheme. Built with DOM nodes (no innerHTML),
     so user-derived text can never be interpreted as markup. */
  function schemeCard(scheme, benefit, opts) {
    opts = opts || {};
    var card = document.createElement('div');
    card.className = 'card' + (opts.best ? ' card-best' : '');

    var head = document.createElement('div'); head.className = 'card-head';
    var title = document.createElement('div'); title.className = 'card-title'; title.textContent = scheme.name;
    head.appendChild(title);
    if (opts.best) {
      var badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = L().bestLabel;
      head.appendChild(badge);
    }
    card.appendChild(head);

    var body = document.createElement('div'); body.className = 'card-benefit'; body.textContent = benefit;
    card.appendChild(body);

    if (opts.best) {
      var why = document.createElement('div'); why.className = 'card-why'; why.textContent = L().whyGeneric;
      card.appendChild(why);
    }

    var foot = document.createElement('div'); foot.className = 'card-foot';
    var a = document.createElement('a');
    a.className = 'apply'; a.href = scheme.portal; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.textContent = L().applyLabel + ' \u2192';
    foot.appendChild(a);
    card.appendChild(foot);

    chat.appendChild(card); scroll();
    return card;
  }

  function othersSection(ids) {
    if (!ids.length) return;
    var sec = document.createElement('div'); sec.className = 'others';
    var h = document.createElement('div'); h.className = 'others-title'; h.textContent = L().otherTitle;
    sec.appendChild(h);
    ids.forEach(function (id) {
      var scheme = Schemes.byId(id); if (!scheme) return;
      var row = document.createElement('div'); row.className = 'other-row';
      var n = document.createElement('div'); n.className = 'other-name'; n.textContent = scheme.name;
      var b = document.createElement('div'); b.className = 'other-benefit'; b.textContent = L().schemes[id] || '';
      var link = document.createElement('a'); link.className = 'other-link'; link.href = scheme.portal;
      link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = L().applyLabel;
      row.appendChild(n); row.appendChild(b); row.appendChild(link);
      sec.appendChild(row);
    });
    chat.appendChild(sec); scroll();
  }

  // ---- language ----
  function currentQuestion() {
    var l = L();
    if (state.stage === 'work') return l.greeting;
    if (state.stage === 'income') return l.askIncome;
    if (state.stage === 'age') return l.askAge;
    if (state.stage === 'sms') return l.askSms;
    return null;
  }
  function setLang(lang, announce) {
    state.lang = lang; langSelect.value = lang; hSub.textContent = Langs[lang].label;
    if (announce) { var q = currentQuestion(); if (q) { addBubble(q, 'bot'); speak(q, true); } }
  }

  // ---- flow ----
  function startConversation() {
    var l = L();
    state.stage = 'work'; state.profile = { work: '', workType: 'other', income: null, age: null };
    setProgress(0);
    addBubble(l.greeting, 'bot'); speak(l.greeting, true);
  }
  function respondWithScheme() {
    var l = L();
    var match = Schemes.matchBest(state.profile);
    var best = Schemes.byId(match.best);
    var benefit = l.schemes[match.best];
    schemeCard(best, benefit, { best: true });
    addBubble(l.askSms, 'bot');
    speak(benefit + ' ' + l.askSms, true);
    var others = match.eligible.filter(function (id) { return id !== match.best; }).slice(0, 6);
    othersSection(others);
    state.stage = 'sms';
    setProgress(3);
    showChips([{ label: l.yes, value: l.yes }, { label: l.no, value: l.no }]);
  }
  function handleInput(raw) {
    var text = (raw || '').trim();
    if (!text) return;
    stopListening();
    addBubble(text, 'user');

    var sw = P.detectLangSwitch(text, state.lang);
    if (sw && sw !== state.lang) { setLang(sw, true); return; }

    var l = L();
    if (state.stage === 'work') {
      state.profile.work = text;
      state.profile.workType = P.detectWorkType(text);
      state.stage = 'income'; setProgress(1);
      ask(l.askIncome);
      showChips([{ label: '₹8,000', value: '8000' }, { label: '₹10,000', value: '10000' }, { label: '₹12,000', value: '12000' }, { label: '₹15,000', value: '15000' }]);
    } else if (state.stage === 'income') {
      var inc = P.toNumber(text);
      if (inc == null) { ask(l.reaskIncome); }
      else { state.profile.income = inc; state.stage = 'age'; setProgress(2); ask(l.askAge);
             showChips([{ label: '22', value: '22' }, { label: '28', value: '28' }, { label: '35', value: '35' }, { label: '45', value: '45' }]); }
    } else if (state.stage === 'age') {
      var age = P.parseAge(text);
      if (age == null) { ask(l.reaskAge); }
      else { state.profile.age = age; respondWithScheme(); }
    } else if (state.stage === 'sms') {
      if (P.isYes(text) && !P.isNo(text)) { addBubble(l.smsYes, 'bot'); speak(l.smsYes, false); state.stage = 'done'; }
      else if (P.isNo(text) && !P.isYes(text)) { addBubble(l.smsNo, 'bot'); speak(l.smsNo, false); state.stage = 'done'; }
      else { ask(l.askSms); showChips([{ label: l.yes, value: l.yes }, { label: l.no, value: l.no }]); }
    } else {
      addBubble(l.smsNo, 'bot'); speak(l.smsNo, false);
    }
  }

  // ---- wiring ----
  function buildOverlay() {
    langGrid.innerHTML = '';
    Object.keys(Langs).forEach(function (code) {
      var b = document.createElement('button');
      b.className = 'lang-btn'; b.textContent = Langs[code].label;
      b.onclick = function () {
        state.lang = code;
        overlay.classList.add('hidden'); appEl.classList.remove('hidden');
        setLang(code, false);
        try { if ('speechSynthesis' in window) window.speechSynthesis.resume(); } catch (e) {}
        startConversation();
        textInput.focus();
      };
      langGrid.appendChild(b);
    });
  }
  function buildSelect() {
    langSelect.innerHTML = '';
    Object.keys(Langs).forEach(function (code) {
      var o = document.createElement('option'); o.value = code; o.textContent = Langs[code].label; langSelect.appendChild(o);
    });
    langSelect.value = state.lang;
    langSelect.onchange = function () { setLang(langSelect.value, true); };
  }

  micBtn.onclick = function () { if (isListening) stopListening(); else listenOnce(); };
  sendBtn.onclick = function () { var v = textInput.value; textInput.value = ''; handleInput(v); };
  textInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var v = textInput.value; textInput.value = ''; handleInput(v); } });
  restartBtn.onclick = function () {
    try { window.speechSynthesis.cancel(); } catch (e) {}
    stopListening();
    chat.innerHTML = '';
    state.stage = 'work'; setProgress(0);
    var l = L();
    addBubble(l.restartAck, 'bot'); addBubble(l.greeting, 'bot');
    speak(l.restartAck + ' ' + l.greeting, true);
  };

  buildOverlay();
  buildSelect();

  window.SahayakApp = { state: state, handleInput: handleInput, matchBest: Schemes.matchBest };
})();
