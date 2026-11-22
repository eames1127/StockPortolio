# Styling

How code here should look and read. Write it so the maintainer can pick it up without a second look. Keep it simple (KISS).

## Moving to the house style

The formatting rules below are the target, and most existing files don't follow them yet. **Don't reformat code as part of an unrelated change.** Files move over gradually:

- **New files** use the house style from the start.
- **Existing files** keep their current indentation and semicolon style until a change dedicated to converting that whole file. Never mix tabs and spaces in one file.
- The non-formatting rules (simplicity, braces, comments, naming) apply to any code you write, in any file.
## How to write code

- Write the simplest code that works. No abstraction, helper or config option until a second real use exists.
- Validate at the edges (`portfolio.json`, query parameters, Yahoo Finance responses), then trust the data inside. Don't guard against things that can't happen.
- No `utils` / `helpers` / `common` dumping grounds. Code lives with the feature that uses it.
- Prefer early returns over nested ifs.
- Small functions with plain, descriptive names. No abbreviations or type prefixes.
- Handle errors explicitly: log them with the route or action name (`console.error('[/api/prices]', error)`) or show them to the user. Never swallow them.
- Change only what the task needs. No drive-by refactors.

## Formatting

- **Tabs** for indentation, one per level, in JS, Vue and CSS.
- Braces on the same line, and **always** used, even for one-line ifs:

  ```js
  if (!base) {
  	return {};
  }
  ```

- Single quotes in JavaScript.
- `const` by default, `let` only when reassigned. Use `??` and `?.` rather than long `&&` chains.
- The server is CommonJS (`require` / `module.exports`). The client is ES modules.
- `server/index.js` is split into sections with banners (`// ─── routes ───`). Keep new code in the right section.

## Comments

Comments explain why, never what. Put a short summary above a function only when its purpose or reason isn't obvious from its name. `formatPrice` needs none, but a pence rule does.

Server JS uses `/** */`:

```js
/**
 * Whether stored prices are in pence. An explicit `currency` wins, because
 * some .L tickers (GBP- or USD-quoted ETFs) aren't priced in pence.
 */
const storedInPence = stock => {
	if (stock.currency) {
		return stock.currency === 'GBp';
	}
	return stock.symbol.toLowerCase().endsWith('.l');
};
```

Client JS and Vue use a `/* */` line:

```js
/* Rounds away float noise, e.g. 12.30000001 -> "12.3". */
const trimPrice = price => parseFloat(price.toFixed(4)).toString()
```

## Vue components

- Order: `<template>`, `<script>`, `<style scoped>`.
- Use the **Options API** (`export default { components, props, data, computed, methods }`) to match the existing components. Don't migrate to `<script setup>` as a side job.
- Props use object syntax with `type` and `default` (or `required`). In templates, write them in kebab-case (`:dark-mode="darkMode"`).
- Two-way bindings use `v-model:<name>` with an `update:<name>` emit (see `DividendSummary`'s `mode`).
- Label template sections with comments: `<!-- ── ROW 2: Growth chart ── -->`.
- Lists use a stable `:key` (the symbol), not the index.
- Dark mode is a `darkMode` prop passed down from `App.vue`. Charts re-render on theme change with `:key="darkMode ? 'dark' : 'light'"`.
- Components display data. Calculations belong on the server, or in a plain `.js` file under `client/src/` when they must run in the browser.

## CSS

- Plain CSS in `<style scoped>`, **one declaration per line**:

  ```css
  .stat-chip {
  	display: flex;
  	flex-direction: column;
  	gap: 0.3rem;
  	padding: 1rem 1.25rem;
  	background: var(--bg-card);
  	border: 1px solid var(--border);
  	border-radius: 10px;
  }
  ```

- Use the design tokens instead of hard-coded colours. They're defined on `.app` (light) and `.app.dark` in `App.vue`:

  | Token | Use |
  |-------|-----|
  | `--bg`, `--bg-card`, `--bg-card-alt`, `--bg-stat` | Page, card and inset backgrounds |
  | `--text`, `--text-muted` | Body and secondary text |
  | `--border`, `--shadow`, `--shadow-hover` | Card edges and elevation |
  | `--accent`, `--accent-dim` | Green highlight and its tint |
  | `--positive`, `--negative` | Gains and losses |
  | `--topbar-bg`, `--topbar-text` | Header |

  Components read them with a fallback, `var(--text, #0b1220)`, so they still render outside `App.vue` (e.g. in tests).
- A new colour that themes must switch goes in as a token in both theme blocks, not as a one-off value.
- Class names are kebab-case, with `--` for variants (`card--growth`) and plain state classes (`.positive`, `.loading`, `.active`).
- Mobile first: base styles for small screens, then `@media (min-width: …)` at the existing breakpoints of 700px, 768px and 1024px. Use `max-width` queries only for small-screen tweaks, as the header does.

## Visual language

- **Cards:** `--bg-card`, 1px `--border`, 12px radius, `--shadow`, with a heading in `.card-head`. Stat chips lift slightly on hover.
- **Labels:** small, uppercase, letter-spaced, `--text-muted`. Values are large and bold.
- **Accent:** green `#22c55e`. Gains use `--positive`, losses `--negative`, with ▲ / ▼ beside changes.
- **Yield bands:** green at 5% and above, amber (`#d97706`) from 2% to 5%, grey below 2%. Yield on cost shows ↑ / ↓ against current yield.
- **Estimates:** figures that rely on FX conversion carry a `≈` marker that reveals the explanation.
- **Font:** `'DM Sans', 'Segoe UI', sans-serif`.

## Charts

- Series colours come from `CHART_COLORS` in `client/src/constants.js`. Shared options come from `client/src/config/chartConfig.js`.
- Text and grid colours follow `darkMode`: text `#e5e7eb` (dark) / `#0b1220` (light), grid lines 10% white / 10% black.
- Charts set `maintainAspectRatio: false` and get their height from the container's CSS.

## Text and accessibility

- British English in code comments, docs and UI text (colour, prioritise, centre).
- UI copy is short and plain. Use `–` for a missing value and `£` (not "GBP") for amounts.
- Never word the UI in a way that implies the portfolio's total value.
- Toggles and icon buttons get `aria-label` (and `aria-pressed` / `aria-expanded` where they change state). External links use `target="_blank" rel="noopener"`.
