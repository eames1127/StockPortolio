# Stock Portfolio Tracker

A privacy-first portfolio dashboard: a Vue 3 + Vite client and an Express API that turns a private `portfolio.json` into sector, growth and dividend charts without ever revealing how much the portfolio is worth.

Before working, read:

- [docs/architecture.md](docs/architecture.md): data flow, endpoints, currency model, privacy boundary and which file owns what
- [docs/styling.md](docs/styling.md): code style, formatting, Vue and CSS conventions, visual language

## Commands

- `npm run install-all`: install server and client dependencies
- `npm run dev`: API on :3001 and client on :3000 (needs `data/portfolio.json`; copy it from `data/portfolio.template.json`)
- `npm test`: server tests (Jest)
- `npm run test:client`: client tests (Vitest)
- `npm run build`: production build of the client

Both test suites must pass. CI runs them and builds the client on every PR and push to `main`. Follow [docs/styling.md](docs/styling.md) for code style.

## Privacy rules

These matter more than anything else in this repo.

- The API never sends total portfolio value, holding values, quantities or cost basis. Only percentages and per-share prices leave the server.
- £ dividend amounts are sent only when `SHOW_DIVIDEND_VALUES=true`. It's off by default.
- `data/portfolio.json` and `.env` are git-ignored and private. Never commit them, print their contents or copy real holdings into tests, fixtures, docs or PRs. Use made-up data like `data/portfolio.template.json`.
- A new field in an API response needs a test showing it doesn't leak values (see `tests/portfolio.test.js`).
- Tests never call Yahoo Finance. Mock `yahoo-finance2`.

## How to work

- For anything bigger than a small fix, outline a short plan and wait for the go-ahead.
- Ask before adding a dependency (in either `package.json`), changing an API response's shape, deleting files or touching CI.
- Keep it simple, and change only what the task needs. Mention other problems at the end instead of fixing them.
- Bug fixes start with a failing test where practical.
- Never skip a test or weaken an assertion to make a check pass.
- Update `README.md` and these docs in the same PR when behaviour, endpoints or conventions change.
- British English in comments, docs and UI text.

## Git

- One branch per change off `main`, merged by PR. Prefixes in use: `feat/`, `fix/`, `bug/`, `ci/`, `documentation/`.
- Small, focused commits with conventional messages, e.g. `fix(api): send dividend yields as percentages`.
- Only commit or push when asked. Never force-push or rewrite shared history.
- Never merge your own PR. The maintainer reviews and merges.
