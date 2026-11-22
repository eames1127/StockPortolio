# Security Policy

This app handles personal financial data, so security and privacy reports are taken seriously.

## Reporting a vulnerability

Please **don't open a public issue**. Report it privately through GitHub instead:

1. Go to the repository's **Security** tab.
2. Choose **Report a vulnerability**.

Include what you found, how to reproduce it and what it affects. Don't include real portfolio data. Use made-up data like `data/portfolio.template.json`.

You should get a reply within a week. Once a fix is released, you'll be credited in the advisory unless you'd rather not be.

## In scope

- Anything that lets the API or the dashboard reveal total portfolio value, holding values, quantities or cost basis
- £ dividend amounts sent while `SHOW_DIVIDEND_VALUES` is off
- Ways to read `data/portfolio.json` or `.env` through the app
- Vulnerabilities in the server, the client or their dependencies

## Supported versions

Only the latest commit on `main` gets fixes.
