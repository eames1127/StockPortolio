const js = require('@eslint/js');
const vue = require('eslint-plugin-vue');
const prettier = require('eslint-config-prettier');
const globals = require('globals');

/**
 * ESLint catches bugs and the non-formatting rules in docs/styling.md.
 * Layout (tabs, quotes, semicolons) is Prettier's job, so eslint-config-prettier
 * comes after the rule sets to switch off any rule that would fight it.
 */
module.exports = [
	{
		// .claude/ holds agent worktrees: other branches' checkouts, not this one's code.
		ignores: ['**/node_modules/', 'client/dist/', 'coverage/', '.claude/'],
	},
	js.configs.recommended,
	...vue.configs['flat/recommended'],
	{
		rules: {
			'prefer-const': 'error',
			'no-var': 'error',
		},
	},
	{
		files: ['server/**/*.js', 'data/**/*.js', 'tests/**/*.js', '*.config.js'],
		languageOptions: {
			sourceType: 'commonjs',
			globals: globals.node,
		},
	},
	{
		files: ['tests/**/*.js'],
		languageOptions: {
			globals: globals.jest,
		},
	},
	{
		files: ['client/**/*.{js,vue}'],
		languageOptions: {
			sourceType: 'module',
			globals: globals.browser,
		},
		rules: {
			'vue/component-api-style': ['error', ['options']],
		},
	},
	{
		files: ['client/vite.config.js', 'client/vitest.config.js'],
		languageOptions: {
			globals: globals.node,
		},
	},
	prettier,
	{
		// eslint-config-prettier turns this off, but styling.md asks for braces on every block.
		rules: {
			curly: ['error', 'all'],
		},
	},
];
