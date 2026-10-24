/* parser.js — understands what a worker says: work type, income, age, yes/no,
   and language switching. Handles digits and words across all six languages.
   Plain script in the browser (window.SahayakParser); require()-able in Node. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.SahayakParser = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  var MULT = { thousand:1000, k:1000, hazaar:1000, hazar:1000, hajaar:1000, hajar:1000,
    'हज़ार':1000, 'हजार':1000, 'सहस्र':1000,
    'ஆயிரம்':1000, 'ஆயிரத்து':1000, 'వేల':1000, 'వేయి':1000, 'হাজার':1000,
    lakh:100000, lac:100000, 'लाख':100000, 'लक्ष':100000, 'லட்சம்':100000, 'లక్ష':100000, 'লক্ষ':100000 };

  var WORDS = {
    one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,
    thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,
    thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,hundred:100,
    ek:1,do:2,don:2,teen:3,char:4,chaar:4,paanch:5,panch:5,paach:5,chhe:6,chah:6,saha:6,
    saat:7,aath:8,nau:9,das:10,dus:10,daha:10,gyarah:11,barah:12,pandrah:15,pandra:15,
    bees:20,vees:20,pachchees:25,pachees:25,pachvis:25,tees:30,chalees:40,chalis:40,
    pachaas:50,pachas:50,pannas:50,saath:60,aainshi:60,sattar:70,assi:80,nabbe:90,navvad:90,
    sau:100,she:100,
    'एक':1,'दो':2,'तीन':3,'चार':4,'पाँच':5,'पांच':5,'छह':6,'सात':7,'आठ':8,'नौ':9,'दस':10,'ग्यारह':11,'बारह':12,
    'तेरह':13,'चौदह':14,'पंद्रह':15,'पन्द्रह':15,'सोलह':16,'सत्रह':17,'अठारह':18,'उन्नीस':19,'बीस':20,'पच्चीस':25,
    'तीस':30,'पैंतीस':35,'चालीस':40,'पचास':50,'साठ':60,'सत्तर':70,'अस्सी':80,'नब्बे':90,'सौ':100,
    'दहा':10,'वीस':20,'पंचवीस':25,'चाळीस':40,'पन्नास':50,'शंभर':100,
    pathu:10,irubadhu:20,muppadhu:30,naarpadhu:40,aimbadhu:50,aruvadhu:60,nooru:100,
    'பத்து':10,'பதினைந்து':15,'இருபது':20,'முப்பது':30,'நாற்பது':40,'ஐம்பது':50,'அறுபது':60,'எழுபது':70,'எண்பது':80,'தொண்ணூறு':90,'நூறு':100,
    padi:10,iravai:20,muppai:30,nalabai:40,yabhai:50,aravai:60,vandala:100,
    'పది':10,'పదిహేను':15,'ఇరవై':20,'ముప్పై':30,'నలభై':40,'యాభై':50,'అరవై':60,'డెబ్బై':70,'ఎనభై':80,'తొంభై':90,'వంద':100,
    dosh:10,bish:20,trish:30,cholish:40,ponchash:50,shat:60,eko:100,
    'দশ':10,'পনেরো':15,'বিশ':20,'ত্রিশ':30,'চল্লিশ':40,'পঞ্চাশ':50,'ষাট':60,'সত্তর':70,'আশি':80,'নব্বই':90,'একশ':100
  };

  var YES_WORDS = ['haan','han','ha','ji','yes','yeah','yep','ya','ok','okay','okey','sure','please',
    'theek','thik','sari','aama','aam','avunu','sare','hou','hyan','bhej','kar do','kardo','send',
    'ஆம்','సరే','అవును','हाँ','हो','হ্যাঁ'];
  var NO_WORDS = ['nahi','nahin','na','no','nope','nako','illa','venda','ledu','vadu','later','not now',
    'baad','bad me','இல்லை','లేదు','नहीं','नाही','না'];

  function clean(token) {
    return String(token).replace(/[^a-z\u0900-\u097f\u0b80-\u0bff\u0c00-\u0c7f\u0980-\u09ff]/g, '');
  }

  function toNumber(raw) {
    if (raw == null) return null;
    var t = String(raw).toLowerCase()
      .replace(/[₹$,\u20b9]/g, ' ')
      .replace(/rs\.?|rupees|rupaye|rupaya|rubai|rubay|रुपये|रुपए|ரூபாய்|రూపాయలు|টাকা/g, ' ');
    var m = t.match(/(\d[\d,\.]*)\s*(thousand|k|lakh|lac|hazaar|hazar|hajaar|hajar|हज़ार|हजार|लाख|लक्ष|ஆயிரம்|லட்சம்|వేల|లక్ష|হাজার|লক্ষ)?/);
    if (m) {
      var base = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(base)) {
        var unit = m[2] || '';
        if (unit && MULT[unit]) return Math.round(base * MULT[unit]);
        if (base < 1000) return Math.round(base * 1000);
        return Math.round(base);
      }
    }
    var tokens = t.split(/\s+/), val = null, mult = null;
    for (var i = 0; i < tokens.length; i++) {
      var c = clean(tokens[i]);
      if (!c) continue;
      if (MULT[c] != null) mult = MULT[c];
      else if (WORDS[c] != null) val = (val || 0) + WORDS[c];
    }
    if (val != null) {
      if (mult) return val * mult;
      if (val < 1000) return val * 1000;
      return val;
    }
    return null;
  }

  function parseAge(raw) {
    if (raw == null) return null;
    var t = String(raw).toLowerCase().replace(/[₹$,\u20b9]/g, ' ');
    var m = t.match(/\b(\d{1,3})\b/);
    if (m) { var a = parseInt(m[1], 10); if (a >= 10 && a <= 90) return a; }
    var tokens = t.split(/\s+/), val = 0, found = false;
    for (var i = 0; i < tokens.length; i++) {
      var c = clean(tokens[i]);
      if (WORDS[c] != null && WORDS[c] < 100) { val += WORDS[c]; found = true; }
    }
    if (found && val >= 10 && val <= 90) return val;
    return null;
  }

  function isYes(t) { var s = ' ' + String(t).toLowerCase() + ' '; return YES_WORDS.some(function (w) { return s.indexOf(w) !== -1; }); }
  function isNo(t) { var s = ' ' + String(t).toLowerCase() + ' '; return NO_WORDS.some(function (w) { return s.indexOf(w) !== -1; }); }

  function detectLangSwitch(text, currentLang) {
    var t = String(text).toLowerCase();
    if (/hindi|हिंदी|हिन्दी/.test(t)) return 'hi-IN';
    if (/tamil|தமிழ்/.test(t)) return 'ta-IN';
    if (/telugu|తెలుగు/.test(t)) return 'te-IN';
    if (/marathi|मराठी/.test(t)) return 'mr-IN';
    if (/bengali|bangla|বাংলা/.test(t)) return 'bn-IN';
    if (/english/.test(t)) return 'en-IN';
    if (/[\u0b80-\u0bff]/.test(text)) return 'ta-IN';
    if (/[\u0c00-\u0c7f]/.test(text)) return 'te-IN';
    if (/[\u0980-\u09ff]/.test(text)) return 'bn-IN';
    if (/[\u0900-\u097f]/.test(text)) return (currentLang === 'mr-IN') ? 'mr-IN' : 'hi-IN';
    return null;
  }

  /* Map a free-text answer about work to a category the matcher can use. */
  function detectWorkType(text) {
    var t = ' ' + String(text).toLowerCase() + ' ';
    function has(arr) { for (var i = 0; i < arr.length; i++) if (t.indexOf(arr[i]) !== -1) return true; return false; }
    if (has(['street vendor','vendor','hawker','thela','cart','stall','street','vending','rehri','रेहड़ी','ठेला','विक्रेता','फेरी','हॉकर','வியாபாரி','వ్యాపారి','হকার','ফেরি']))
      return 'street_vendor';
    if (has(['artisan','craft','carpenter','potter','tailor','barber','blacksmith','weaver','cobbler','dhobi','mason',
             'suthar','lohar','kumhaar','darzi','sunar','naai','raajmistri','बढ़ई','दर्जी','नाई','कुम्हार','लोहार','राजमिस्त्री','सुतार',
             'தையல்','கொல்லர்','కుమ్మరి','వడ్రంగి','সুতার','কামার']))
      return 'artisan';
    if (has(['delivery','rider','swiggy','zomato','blinkit','zepto','courier','bike','scooter','डिलीवरी','बाइक','गाड़ी','டெலிவரி','డెలివరీ','ডেলিভারি']))
      return 'delivery';
    if (has(['driver','auto','taxi','cab','ola','uber','rickshaw','ड्राइवर','चालक','ऑटो','டிரைவர்','డ్రైవర్','ড্রাইভার']))
      return 'driver';
    return 'other';
  }

  return { toNumber: toNumber, parseAge: parseAge, isYes: isYes, isNo: isNo,
           detectLangSwitch: detectLangSwitch, detectWorkType: detectWorkType };
});
