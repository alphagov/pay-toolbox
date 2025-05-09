type Toggle = 'ON' | 'OFF'

interface SettingToggle {
	enabled: boolean
}

interface FrontendConfigData {
	'apple-pay': SettingToggle
	'google-pay': SettingToggle
}

class FrontendConfig {
	applePay: Toggle
	googlePay: Toggle
	constructor(config: FrontendConfigData) {
		this.applePay = config["apple-pay"].enabled ? 'ON' : 'OFF'
		this.googlePay = config["google-pay"].enabled ? 'ON' : 'OFF'
	}
}

export { FrontendConfig }
