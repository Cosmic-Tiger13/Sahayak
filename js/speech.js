/* speech.js — thin wrappers over the browser Web Speech APIs.
   Text out: SpeechSynthesis. Voice in: SpeechRecognition (Chrome/Edge).
   Everything degrades gracefully if a browser does not support them. */
window.SahayakSpeech = (function () {
  var voices = [];

  function init() {
    if ('speechSynthesis' in window) {
      var load = function () { voices = window.speechSynthesis.getVoices() || []; };
      window.speechSynthesis.onvoiceschanged = load;
      load();
    }
  }

  function ttsSupported() { return 'speechSynthesis' in window; }
  function sttSupported() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }

  function pickVoice(lang) {
    var base = lang.split('-')[0].toLowerCase();
    for (var i = 0; i < voices.length; i++) {
      var vl = (voices[i].lang || '').replace('_', '-').toLowerCase();
      if (vl === lang.toLowerCase()) return voices[i];
    }
    for (var j = 0; j < voices.length; j++) {
      var v2 = (voices[j].lang || '').replace('_', '-').toLowerCase();
      if (v2.indexOf(base) === 0) return voices[j];
    }
    return null;
  }

  /* speak(text, lang, { onStart, onEnd }) */
  function speak(text, lang, cb) {
    cb = cb || {};
    if (!ttsSupported() || !text) { if (cb.onEnd) cb.onEnd(); return; }
    try { window.speechSynthesis.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    var v = pickVoice(lang); if (v) u.voice = v;
    u.rate = 0.95; u.pitch = 1.0; u.volume = 1.0;
    u.onstart = function () { if (cb.onStart) cb.onStart(); };
    u.onend = function () { if (cb.onEnd) cb.onEnd(); };
    u.onerror = function () { if (cb.onEnd) cb.onEnd(); };
    window.speechSynthesis.speak(u);
  }

  /* createRecognizer({ onResult, onError, onEnd }) -> recognizer or null */
  function createRecognizer(handlers) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    var r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = function (e) { handlers.onResult(e.results[0][0].transcript); };
    r.onerror = function (e) { handlers.onError(e.error); };
    r.onend = function () { handlers.onEnd(); };
    return r;
  }

  return { init: init, speak: speak, ttsSupported: ttsSupported, sttSupported: sttSupported, createRecognizer: createRecognizer };
})();
