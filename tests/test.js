/* tests/test.js — automated tests for everything that runs without a browser.
   Run:  npm test   (or: node tests/test.js)
   Covers: scheme matching + eligibility, work-type detection, income/age/yes-no
   parsing across all six scripts, language switching, and data integrity. */
const assert = require('assert');
const Langs = require('../js/languages.js');
const { SCHEMES, byId, eligible, matchBest } = require('../js/schemes.js');
const P = require('../js/parser.js');

let passed = 0, failed = 0;
function eq(name, got, want) {
  try { assert.strictEqual(got, want); passed++; }
  catch (e) { failed++; console.log('FAIL | ' + name + ' => ' + JSON.stringify(got) + '  (want ' + JSON.stringify(want) + ')'); }
}
function ok(name, cond) { eq(name, !!cond, true); }

/* ---- 1. Best-match engine ---- */
eq('10k, age 25 -> PM-SYM', matchBest({ income: 10000, age: 25, workType: 'delivery' }).best, 'pmsym');
eq('10k, age 50 -> Ayushman', matchBest({ income: 10000, age: 50, workType: 'other' }).best, 'ayushman');
eq('20k, age 30 -> Ayushman', matchBest({ income: 20000, age: 30, workType: 'other' }).best, 'ayushman');
eq('40k, age 30 -> Atal Pension', matchBest({ income: 40000, age: 30, workType: 'other' }).best, 'apy');
eq('45k, age 55 -> e-Shram (fallback)', matchBest({ income: 45000, age: 55, workType: 'other' }).best, 'eshram');
eq('street vendor -> PM SVANidhi', matchBest({ income: 12000, age: 30, workType: 'street_vendor' }).best, 'svanidhi');
eq('artisan -> PM Vishwakarma', matchBest({ income: 12000, age: 30, workType: 'artisan' }).best, 'vishwakarma');
eq('15k exactly, age 25 -> PM-SYM', matchBest({ income: 15000, age: 25, workType: 'other' }).best, 'pmsym');

/* ---- 2. Eligibility lists ---- */
ok('25yo 10k eligible for PM-SYM', eligible({ income: 10000, age: 25, workType: 'other' }).includes('pmsym'));
ok('25yo 10k eligible for e-Shram', eligible({ income: 10000, age: 25, workType: 'other' }).includes('eshram'));
ok('50yo NOT eligible for PM-SYM', !eligible({ income: 10000, age: 50, workType: 'other' }).includes('pmsym'));
ok('50yo NOT eligible for APY', !eligible({ income: 10000, age: 50, workType: 'other' }).includes('apy'));
ok('everyone eligible for gig welfare', eligible({ income: 40000, age: 30, workType: 'other' }).includes('gigwelfare'));
ok('40k income NOT eligible for Ayushman', !eligible({ income: 40000, age: 30, workType: 'other' }).includes('ayushman'));
ok('non-vendor NOT eligible for SVANidhi', !eligible({ income: 10000, age: 30, workType: 'delivery' }).includes('svanidhi'));
ok('street vendor eligible for SVANidhi', eligible({ income: 10000, age: 30, workType: 'street_vendor' }).includes('svanidhi'));

/* ---- 3. Work-type detection ---- */
eq('delivery rider', P.detectWorkType('I ride a delivery bike'), 'delivery');
eq('swiggy', P.detectWorkType('I work for Swiggy'), 'delivery');
eq('street vendor', P.detectWorkType('I sell vegetables on the street'), 'street_vendor');
eq('carpenter', P.detectWorkType('I am a carpenter'), 'artisan');
eq('tailor', P.detectWorkType('I am a tailor'), 'artisan');
eq('driver', P.detectWorkType('I drive an auto rickshaw'), 'driver');
eq('Hindi delivery', P.detectWorkType('मैं डिलीवरी करता हूँ'), 'delivery');
eq('Hindi potter', P.detectWorkType('मैं कुम्हार हूँ'), 'artisan');
eq('unknown', P.detectWorkType('I do something'), 'other');

/* ---- 4. Income parsing ---- */
eq('digits 10000', P.toNumber('10000'), 10000);
eq('comma 10,000', P.toNumber('10,000'), 10000);
eq('Rs 12000', P.toNumber('Rs 12000'), 12000);
eq('10k', P.toNumber('10k'), 10000);
eq('ten thousand', P.toNumber('ten thousand'), 10000);
eq('das hazaar', P.toNumber('das hazaar'), 10000);
eq('bare 15 -> 15,000', P.toNumber('15'), 15000);
eq('one lakh', P.toNumber('one lakh'), 100000);
eq('Hindi पंद्रह हज़ार', P.toNumber('पंद्रह हज़ार'), 15000);
eq('Marathi दहा हजार', P.toNumber('दहा हजार'), 10000);
eq('Tamil பத்து ஆயிரம்', P.toNumber('பத்து ஆயிரம்'), 10000);
eq('Telugu పది వేల', P.toNumber('పది వేల'), 10000);
eq('Bengali দশ হাজার', P.toNumber('দশ হাজার'), 10000);
eq('gibberish -> null', P.toNumber('hello there'), null);

/* ---- 5. Age parsing ---- */
eq('age 28', P.parseAge('28'), 28);
eq('age in sentence', P.parseAge('I am 35 years old'), 35);
eq('pachchees', P.parseAge('pachchees'), 25);
eq('Hindi पच्चीस', P.parseAge('पच्चीस'), 25);
eq('no age -> null', P.parseAge('hello'), null);

/* ---- 6. Yes / No ---- */
eq('haan yes', P.isYes('haan'), true);
eq('english yes', P.isYes('yes please'), true);
eq('Tamil ஆம் yes', P.isYes('ஆம்'), true);
eq('Telugu అవును yes', P.isYes('అవును'), true);
eq('nahi no', P.isNo('nahi'), true);
eq('Tamil இல்லை no', P.isNo('இல்லை'), true);
eq('english no', P.isNo('no'), true);

/* ---- 7. Language switch ---- */
eq('switch Hindi by name', P.detectLangSwitch('speak Hindi', 'en-IN'), 'hi-IN');
eq('switch Tamil by script', P.detectLangSwitch('நன்றி', 'en-IN'), 'ta-IN');
eq('Marathi stays Marathi', P.detectLangSwitch('ठीक आहे', 'mr-IN'), 'mr-IN');
eq('no switch', P.detectLangSwitch('delivery rider', 'en-IN'), null);

/* ---- 8. Data integrity ---- */
eq('exactly 12 schemes', SCHEMES.length, 12);
eq('byId works', byId('pmsym').id, 'pmsym');
ok('every scheme has a portal url', SCHEMES.every(s => /^https:\/\//.test(s.portal)));
eq('exactly 6 languages', Object.keys(Langs).length, 6);

const uiKeys = ['label','greeting','askIncome','askAge','reaskIncome','reaskAge','didNotUnderstand',
  'askSms','smsYes','smsNo','yes','no','restartAck','otherTitle','applyLabel','whyGeneric','bestLabel'];
Object.keys(Langs).forEach(function (code) {
  uiKeys.forEach(function (k) {
    ok(code + ' has "' + k + '"', typeof Langs[code][k] === 'string' && Langs[code][k].length > 0);
  });
  SCHEMES.forEach(function (s) {
    const b = Langs[code].schemes && Langs[code].schemes[s.id];
    ok(code + ' benefit for ' + s.id, typeof b === 'string' && b.length > 0);
  });
});

/* ---- summary ---- */
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
