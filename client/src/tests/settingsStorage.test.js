import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import App from '../App.vue'

const blockedStorage = () => {
	throw new DOMException('The operation is insecure.', 'SecurityError')
}

/* Mimics a component instance, with only what the storage code touches. */
const createContext = () => ({
	darkMode: false,
	dividendMode: 'percent',
	loadData: vi.fn(),
})

describe('Settings in localStorage', () => {
	let warn

	beforeEach(() => {
		warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
		localStorage.clear()
	})

	it('warns and keeps the defaults when both settings fail to load', async () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blockedStorage)
		const context = createContext()

		await App.mounted.call(context)

		expect(context.darkMode).toBe(false)
		expect(context.dividendMode).toBe('percent')
		expect(context.loadData).toHaveBeenCalled()
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('dark mode'),
			expect.any(DOMException),
		)
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('dividend display mode'),
			expect.any(DOMException),
		)
	})

	it('still loads the dividend display mode when reading dark mode fails', async () => {
		localStorage.setItem('dividendMode', 'value')
		const getItem = Storage.prototype.getItem
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (key) {
			if (key === 'darkMode') {
				blockedStorage()
			}
			return getItem.call(this, key)
		})
		const context = createContext()

		await App.mounted.call(context)

		expect(context.darkMode).toBe(false)
		expect(context.dividendMode).toBe('value')
		expect(warn).toHaveBeenCalledTimes(1)
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('dark mode'),
			expect.any(DOMException),
		)
	})

	it('warns when saving dark mode fails', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blockedStorage)
		const context = { ...createContext(), darkMode: true }

		App.methods.onToggleDarkMode.call(context)

		expect(context.darkMode).toBe(true)
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('dark mode'),
			expect.any(DOMException),
		)
	})

	it('warns when saving the dividend display mode fails, but still switches mode', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blockedStorage)
		const context = createContext()

		App.computed.dividendDisplayMode.set.call(context, 'value')

		expect(context.dividendMode).toBe('value')
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('dividend display mode'),
			expect.any(DOMException),
		)
	})
})
