# Sahayak — Voice-First Benefits Assistant for Gig Workers

**Sahayak** (सहायक, "helper") is a web app that helps delivery riders, drivers,
street vendors, artisans and daily-wage workers find the government benefit they
qualify for. It **speaks and understands Hindi, Tamil, Telugu, Marathi, Bengali
and Indian English**, asks a few short questions, and recommends the single best
scheme — then shows every other scheme the worker is eligible for.

It is a plain HTML/CSS/JavaScript web app: **no framework, no bundler, no runtime
dependencies, no API keys.** Open it and it runs; host it and it deploys.

> Voice-first, but not voice-only — every question can be answered by tapping the
> mic or by typing, and quick-reply buttons appear under each question so the
> flow always completes, even in a noisy room or a browser without speech.

---

## What it does

1. You pick your language and it greets you: *"Namaste! I can help you find
   government benefits. What kind of daily work do you do?"*
2. It asks **one question at a time** — your kind of work, your monthly income,
   then your age.
3. It matches you to the **single best scheme** from a database of **12 real
   central-government schemes**, explains the benefit in simple words, and links
   you to the official portal to apply.
4. It also lists **other schemes you may qualify for**, and asks if you want an
   SMS link to apply.

You can answer by **voice** (tap the mic) or by **typing**. Answers work as digits
or words: `10000`, `10k`, `ten thousand`, `das hazaar`, `पंद्रह हज़ार`,
`பத்து ஆயிரம்`, `పది వేల`, `দশ হাজার`. It switches language the moment you do.

---

## The schemes (12)

| # | Scheme | Who it's for | Main benefit |
|---|---|---|---|
| 1 | **e-Shram Card** | Unorganised workers aged 16–59 | Free ₹2 lakh accident cover (year 1) and a gateway to other schemes |
| 2 | **PM-SYM** (Shram Yogi Maandhan) | Age 18–40, income up to ₹15,000 | Assured pension of ₹3,000/month after 60; govt matches your contribution 1:1 |
| 3 | **Ayushman Bharat (PM-JAY)** | Low-income / vulnerable families | ₹5 lakh free hospital cover per family per year |
| 4 | **Atal Pension Yojana** | Age 18–40, with a bank account | Guaranteed pension of ₹1,000–₹5,000/month after 60 |
| 5 | **PM Suraksha Bima Yojana** | Age 18–70, with a bank account | ₹2 lakh accident cover for ₹20 a year |
| 6 | **PM Jeevan Jyoti Bima Yojana** | Age 18–50, with a bank account | ₹2 lakh life cover for ₹436 a year |
| 7 | **PM Jan Dhan Yojana** | Any adult without a bank account | Zero-balance account + RuPay card with ₹2 lakh accident cover |
| 8 | **PM SVANidhi** | Street vendors | Collateral-free loans of ₹15,000 → ₹25,000 → ₹50,000 at 7% interest subsidy |
| 9 | **PM Vishwakarma** | Artisans in 18 traditional trades | ₹15,000 tool grant, ₹500/day training stipend, loans up to ₹3 lakh at 5% |
| 10 | **Pradhan Mantri Mudra Yojana** | Anyone growing a small business | Collateral-free loans up to ₹20 lakh (Shishu / Kishore / Tarun / Tarun Plus) |
| 11 | **PM Kaushal Vikas Yojana (Skill India)** | Age 15–59 | Free skill training, certification, and a stipend |
| 12 | **Gig & Platform Worker Social Security** | Gig and platform workers | Legal recognition and benefits under the Code on Social Security, 2020 |

### How the single "best match" is chosen

The rule lives in one small function, `matchBest()` in `js/schemes.js`:

```
1. artisan                        -> PM Vishwakarma
2. street vendor                  -> PM SVANidhi
3. income <= 15,000 and age 18-40 -> PM-SYM
4. income <= 20,000               -> Ayushman Bharat
5. age 18-40                      -> Atal Pension Yojana
6. otherwise                      -> e-Shram (the base card)
```

This is a policy choice, not a technical one — reorder the lines to change the
recommendation. The full eligibility list (all schemes a worker qualifies for) is
computed separately by `eligible()`, so the "other schemes" section is independent
of the ranking.

---

## Project structure

```
sahayak-web-app/
├── index.html                 # the page: overlay + chat shell
├── css/styles.css             # all styling (mobile-first)
├── js/
│   ├── languages.js           # every spoken string + per-language scheme benefits
│   ├── schemes.js             # the 12 schemes + eligibility + best-match engine
│   ├── parser.js              # income / age / yes-no / work-type / language parsing
│   ├── speech.js              # voice out (TTS) + voice in (speech recognition)
│   └── app.js                 # UI + conversation state machine
├── server.js                  # tiny static server (localhost = mic works)
├── tests/
│   ├── test.js                # automated tests (npm test)
│   └── browser-test.html      # the same checks, in the browser
├── .github/                   # CI workflow + issue/PR templates
├── package.json
├── LICENSE  CONTRIBUTING.md  CODE_OF_CONDUCT.md  .gitignore
└── README.md
```

Scripts load in dependency order in `index.html` (languages → schemes → parser →
speech → app). `languages.js`, `schemes.js` and `parser.js` also run under Node,
which is what lets the tests run without a browser.

---

## Run it

**Quickest (no install):** open `index.html` in Chrome or Edge. Typing and the
spoken replies work immediately; the microphone may be blocked on a `file://` page.

**With voice (recommended):**
```bash
cd sahayak-web-app
npm start          # or: node server.js
# open http://localhost:8080
```
`localhost` counts as a secure page, so the microphone works. No packages are
installed — `npm start` just runs `node server.js`.

---

## Test it

**1. Logic tests (fast, no browser)**
```bash
npm test           # or: node tests/test.js
```
Runs 233 checks over the matching engine, eligibility, work-type detection,
income/age/yes-no parsing across all six scripts, language switching, and data
integrity. Expected: `233 passed, 0 failed`.

**2. In-browser tests**
Open `http://localhost:8080/tests/browser-test.html` (or the file directly).
Expected: `passed, 0 failed`.

**3. Manual conversation test**

| You say / type | Expected |
|---|---|
| *(pick a language)* | Greets you and asks about your work |
| `I ride a delivery bike` | Asks your monthly income |
| `10,000` | Asks your age |
| `28` | Recommends **PM-SYM**, lists other eligible schemes, asks about an SMS link |
| `yes` | "Done! I have sent the SMS link." |

Other paths to prove the logic:
- street vendor → **PM SVANidhi**; artisan/carpenter → **PM Vishwakarma**
- income 20,000, age 30 → **Ayushman Bharat**
- income 45,000, age 55 → **e-Shram**

Also try answering in words (`das hazaar`, `पंद्रह हज़ार`) and switching language
mid-conversation (the dropdown, or say/type "Tamil", "Hindi", "English").

---

## Deploy

Upload the folder to any static host — nothing to configure:

- **GitHub Pages** — push the repo, then Settings → Pages → Source: `main`, `/root`.
- **Netlify / Vercel / Cloudflare Pages** — drag the folder in; you get HTTPS, so voice works.
- **Any web server** — serve the folder, or run `node server.js` behind a proxy.

## Push this to GitHub

```bash
cd sahayak-web-app
git init
git add .
git commit -m "Sahayak: voice-first benefits assistant for gig workers"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/sahayak.git
git push -u origin main
```

Then enable **Settings → Pages** for a live link, and CI (`.github/workflows/ci.yml`)
will run the tests automatically on every push.

---

## Sources

Scheme facts were checked against official Government of India sources:

- e-Shram — eshram.gov.in (Social Security & Welfare Schemes, FAQs) · PIB
- PM-SYM — labour.gov.in and maandhan.in · PIB releases (2025)
- Ayushman Bharat PM-JAY — nha.gov.in/PM-JAY · PIB (2025)
- Atal Pension Yojana — pfrda.org.in · PIB (2025)
- PM Suraksha Bima Yojana — financialservices.gov.in/pmsby
- PM Jeevan Jyoti Bima Yojana — financialservices.gov.in/pmjjby
- PM Jan Dhan Yojana — pmjdy.gov.in/scheme · financialservices.gov.in
- PM SVANidhi — pmsvanidhi.mohua.gov.in (Scheme Guidelines) · Cabinet 2025
- PM Vishwakarma — pmvishwakarma.gov.in · dcmsme.gov.in · PIB (2025)
- Pradhan Mantri Mudra Yojana — financialservices.gov.in · PIB (2025)
- PMKVY 4.0 — msde.gov.in · PIB
- Gig & platform workers — Code on Social Security, 2020 · labour.gov.in · PIB (2025)

Benefits and eligibility rules change; always confirm on the official portal
before acting. This tool is a helper, not an official source.

---

## Extending it

- **Real SMS.** On "yes", POST the phone number to a small backend that calls an
  SMS gateway (Exotel, Gupshup, Twilio, or a DLT-registered sender). Today the SMS
  is simulated so the app needs no backend.
- **LLM-powered replies.** Keep the scheme database as the source of truth and let
  an LLM phrase the reply (see `sahayak-system-prompt.md`).
- **Phone / IVR.** The same flow and strings can sit behind a voice IVR for workers
  without smartphones.

## Privacy

This demo stores nothing — the conversation lives only in the browser tab and is
gone on refresh. If you add SMS or analytics, tell users plainly what you send.

## License

MIT — see [LICENSE](LICENSE).
