# Contributing to Sahayak

Thanks for helping improve a tool meant for people who often get left out of
tech. Contributions of all kinds are welcome — code, translations, scheme
corrections, and design.

## Getting started

```bash
git clone https://github.com/YOUR-USERNAME/sahayak.git
cd sahayak
npm start          # http://localhost:8080
npm test           # run the test suite
```

There are no dependencies to install. Node 16+ is enough.

## Project layout

| Path | What lives there |
|---|---|
| `js/languages.js` | Every spoken string + per-language scheme benefits |
| `js/schemes.js` | The scheme database and the matching engine |
| `js/parser.js` | Income / age / yes-no / work-type / language parsing |
| `js/speech.js` | Web Speech wrappers |
| `js/app.js` | UI + conversation state machine |
| `tests/` | Node tests and the in-browser test page |

## Ground rules

- **Keep it dependency-free.** The whole point is that it runs anywhere with no
  build step and no install.
- **Do not invent schemes or figures.** If you add or change a scheme, cite an
  official source (a `.gov.in` page, a PIB release, or a ministry document) in
  the pull request, and update `README.md`'s sources list.
- **Every new string must exist in all six languages.** Add it to each block in
  `js/languages.js`. The test suite fails if a language is missing a key.
- **Keep replies short.** The assistant is voice-first; long paragraphs are hard
  to listen to.
- **Build DOM with `textContent`, not `innerHTML`,** for anything derived from
  user input.

## Adding a scheme

1. Add an entry to `SCHEMES` in `js/schemes.js` (id, name, category, portal, forWhom).
2. Add its eligibility line in `eligible()`.
3. Give it a place in `matchBest()` if it should ever be the top recommendation.
4. Add a benefit sentence for it under `schemes` in every language in `js/languages.js`.
5. Add a test in `tests/test.js`.
6. Update the scheme table and sources in `README.md`.

## Before you open a pull request

- [ ] `npm test` passes (all green).
- [ ] The browser test page shows `0 failed`.
- [ ] New strings are present in all six languages.
- [ ] Any new scheme facts have an official source in the PR description.

By contributing you agree your work is licensed under the project's MIT License.
