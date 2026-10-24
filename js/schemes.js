/* schemes.js — the government-scheme database and the matching engine.
   12 real central-government schemes relevant to gig and unorganised workers.
   Facts current as of 2025-26 (sources listed in the README).
   Plain script in the browser (window.SahayakSchemes); require()-able in Node. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.SahayakSchemes = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  var SCHEMES = [
    { id:'eshram', name:'e-Shram Card', category:'registration', portal:'https://register.eshram.gov.in',
      forWhom:'Unorganised workers aged 16-59' },
    { id:'pmsym', name:'PM-SYM (Shram Yogi Maandhan)', category:'pension', portal:'https://maandhan.in',
      forWhom:'Age 18-40, monthly income up to Rs.15,000' },
    { id:'ayushman', name:'Ayushman Bharat (PM-JAY)', category:'health', portal:'https://beneficiary.nha.gov.in',
      forWhom:'Low-income and vulnerable families' },
    { id:'apy', name:'Atal Pension Yojana', category:'pension', portal:'https://www.pfrda.org.in/schemes/atal-pension-yojana-apy',
      forWhom:'Age 18-40, with a savings bank account' },
    { id:'pmsby', name:'PM Suraksha Bima Yojana', category:'insurance', portal:'https://jansuraksha.gov.in',
      forWhom:'Age 18-70, with a bank account (Rs.20/year)' },
    { id:'pmjjby', name:'PM Jeevan Jyoti Bima Yojana', category:'insurance', portal:'https://jansuraksha.gov.in',
      forWhom:'Age 18-50, with a bank account (Rs.436/year)' },
    { id:'pmjdy', name:'PM Jan Dhan Yojana', category:'banking', portal:'https://pmjdy.gov.in',
      forWhom:'Any adult without a bank account' },
    { id:'svanidhi', name:'PM SVANidhi', category:'credit', portal:'https://pmsvanidhi.mohua.gov.in',
      forWhom:'Street vendors' },
    { id:'vishwakarma', name:'PM Vishwakarma', category:'credit', portal:'https://pmvishwakarma.gov.in',
      forWhom:'Artisans and craftspeople in 18 traditional trades' },
    { id:'mudra', name:'Pradhan Mantri Mudra Yojana', category:'credit', portal:'https://www.mudra.org.in',
      forWhom:'Anyone starting or growing a small business' },
    { id:'pmkvy', name:'PM Kaushal Vikas Yojana (Skill India)', category:'skilling', portal:'https://www.skillindiadigital.gov.in',
      forWhom:'Age 15-59, seeking skills or certification' },
    { id:'gigwelfare', name:'Gig & Platform Worker Social Security', category:'welfare', portal:'https://eshram.gov.in',
      forWhom:'Gig and platform workers (Code on Social Security, 2020)' }
  ];

  function byId(id) {
    for (var i = 0; i < SCHEMES.length; i++) if (SCHEMES[i].id === id) return SCHEMES[i];
    return null;
  }

  /* Which schemes is this worker eligible for?
     profile = { income: rupees per month, age: years, workType: string } */
  function eligible(profile) {
    var income = profile.income, age = profile.age, work = profile.workType;
    var list = [];
    if (age >= 16 && age <= 59) list.push('eshram');                 // unorganised registry
    if (income <= 15000 && age >= 18 && age <= 40) list.push('pmsym');
    if (income <= 20000) list.push('ayushman');
    if (age >= 18 && age <= 40) list.push('apy');
    if (age >= 18 && age <= 70) list.push('pmsby');
    if (age >= 18 && age <= 50) list.push('pmjjby');
    list.push('pmjdy');                                              // any adult
    if (work === 'street_vendor') list.push('svanidhi');
    if (work === 'artisan') list.push('vishwakarma');
    list.push('mudra');                                             // anyone with a business plan
    if (age >= 15 && age <= 59) list.push('pmkvy');
    list.push('gigwelfare');
    return list;
  }

  /* The single best match. Priority:
     trade-specific credit -> age-gated pension -> health cover -> pension -> base registry.
     The base registry (e-Shram) is the fallback, not the default, so a worker with a
     more valuable benefit available is pointed to that first.
     Reorder the lines below to change which scheme is recommended. */
  function matchBest(profile) {
    var el = eligible(profile);
    var has = function (id) { return el.indexOf(id) !== -1; };
    var best = 'eshram';
    if (profile.workType === 'artisan' && has('vishwakarma')) best = 'vishwakarma';
    else if (profile.workType === 'street_vendor' && has('svanidhi')) best = 'svanidhi';
    else if (has('pmsym')) best = 'pmsym';
    else if (has('ayushman')) best = 'ayushman';
    else if (has('apy')) best = 'apy';
    else if (has('eshram')) best = 'eshram';
    else best = el[0] || 'eshram';
    return { best: best, eligible: el };
  }

  return { SCHEMES: SCHEMES, byId: byId, eligible: eligible, matchBest: matchBest };
});
