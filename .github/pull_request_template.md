## What changed

## Why

## How it was checked

- [ ] `npm test` and `npm run test:client` pass
- [ ] `npm run lint` passes

## Privacy

- [ ] No real holdings, values or `.env` contents in code, tests, fixtures, screenshots or this description
- [ ] Any new field in an API response has a test showing it doesn't leak values (see `tests/portfolio.test.js`)
- [ ] Nothing new leaves the server except percentages and per-share prices (£ dividends only behind `SHOW_DIVIDEND_VALUES`)

## Docs

- [ ] `README.md` and `docs/` are updated if behaviour, endpoints or conventions changed
