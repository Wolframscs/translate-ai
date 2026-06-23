const { Plugin, PluginSettingTab, Setting, Notice, requestUrl } = require('obsidian');

const DEFAULT_SETTINGS = {
	provider: 'deepseek',
	deepseekKey: '',
	deepseekModel: 'deepseek-chat',
	qwenKey: '',
	qwenModel: 'qwen-plus',
	doubaoKey: '',
	doubaoModel: '',
	geminiKey: '',
	geminiModel: 'gemini-2.5-flash',
	customUrl: '',
	customKey: '',
	customModel: '',
	systemPrompt: '',
	targetLanguage: 'Chinese'
};

class AITranslator {
	constructor(settings) {
		this.settings = settings;
	}

	updateSettings(settings) {
		this.settings = settings;
	}

	async translate(text) {
		let url = '';
		let model = '';
		let apiKey = '';

		switch (this.settings.provider) {
			case 'deepseek':
				url = 'https://api.deepseek.com/chat/completions';
				model = this.settings.deepseekModel || 'deepseek-chat';
				apiKey = this.settings.deepseekKey;
				break;
			case 'qwen':
				url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
				model = this.settings.qwenModel || 'qwen-plus';
				apiKey = this.settings.qwenKey;
				break;
			case 'doubao':
				url = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
				model = this.settings.doubaoModel; // User must enter Endpoint ID
				apiKey = this.settings.doubaoKey;
				break;
			case 'gemini':
				url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
				model = this.settings.geminiModel || 'gemini-2.5-flash';
				apiKey = this.settings.geminiKey;
				break;
			case 'custom':
				url = this.settings.customUrl;
				model = this.settings.customModel;
				apiKey = this.settings.customKey;
				break;
		}

		if (this.settings.provider === 'custom' && !url) {
			throw new Error('Custom API URL not set');
		}

		if (!apiKey && this.settings.provider !== 'custom') {
			throw new Error('API Key not set');
		}

		const systemPrompt = this.settings.systemPrompt ||
			`You are a professional translation assistant. Please directly translate the input text into ${this.settings.targetLanguage || 'Chinese'}. Do not output any explanations, comments, or extra words, only output the translation result.`;

		const requestBody = {
			model: model,
			messages: [
				{
					role: "system",
					content: systemPrompt
				},
				{
					role: "user",
					content: text
				}
			],
			stream: false
		};

		const headers = {
			'Content-Type': 'application/json'
		};
		if (apiKey) {
			headers['Authorization'] = `Bearer ${apiKey}`;
		}

		const requestParam = {
			url: url,
			method: 'POST',
			headers: headers,
			body: JSON.stringify(requestBody)
		};

		try {
			const response = await requestUrl(requestParam);

			if (response.status !== 200) {
				// Try to parse error message from body if possible
				let errorMsg = `API Error: ${response.status}`;
				try {
					if (response.json && response.json.error && response.json.error.message) {
						errorMsg += ` - ${response.json.error.message}`;
					}
				} catch (e) {
					// ignore json parse error
				}
				throw new Error(errorMsg);
			}

			const data = response.json;
			if (!data.choices || data.choices.length === 0) {
				throw new Error('No translation returned from API');
			}
			return data.choices[0].message.content.trim();
		} catch (error) {
			console.error('Translation Error:', error);
			throw error;
		}
	}

	async testConnection(provider, apiKey, model) {
		// Simple test to verify connectivity and key
		const testText = "Hello";
		// Create a temporary settings object for testing
		// To reuse logic without modifying instance state, we manually construct request

		let url = '';
		let targetModel = model;

		switch (provider) {
			case 'deepseek':
				url = 'https://api.deepseek.com/chat/completions';
				targetModel = model || 'deepseek-chat';
				break;
			case 'qwen':
				url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
				targetModel = model || 'qwen-plus';
				break;
			case 'doubao':
				url = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
				// targetModel is already passed in
				break;
			case 'gemini':
				url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
				targetModel = model || 'gemini-2.5-flash';
				break;
			case 'custom':
				url = this.settings.customUrl;
				targetModel = model;
				break;
		}

		if (provider === 'custom' && !url) {
			return { success: false, message: 'Custom API URL not set' };
		}

		const requestBody = {
			model: targetModel,
			messages: [
				{ role: "user", content: "Test" }
			],
			max_tokens: 5
		};

		const headers = {
			'Content-Type': 'application/json'
		};
		if (apiKey) {
			headers['Authorization'] = `Bearer ${apiKey}`;
		}

		const requestParam = {
			url: url,
			method: 'POST',
			headers: headers,
			body: JSON.stringify(requestBody)
		};

		try {
			const response = await requestUrl(requestParam);
			if (response.status === 200) {
				return { success: true, message: "Connection successful!" };
			} else {
				return { success: false, message: `HTTP ${response.status}` };
			}
		} catch (error) {
			return { success: false, message: error.message };
		}
	}
}

class AITranslatorPlugin extends Plugin {
	settings;
	translator;
	statusBarItem;

	async onload() {
		await this.loadSettings();
		this.translator = new AITranslator(this.settings);

		// Status Bar
		this.statusBarItem = this.addStatusBarItem();
		this.statusBarItem.setText('');

		// Add translation command
		this.addCommand({
			id: 'translate-insert-below',
			name: 'Translate Selection (Insert Below)',
			editorCallback: (editor, view) => {
				const selection = editor.getSelection();
				if (selection) {
					this.translateAndInsert(editor, selection);
				} else {
					new Notice('Please select text to translate first');
				}
			}
		});

		// Add Context Menu
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				menu.addItem((item) => {
					item
						.setTitle("Translate Selection")
						.setIcon("languages")
						.onClick(async () => {
							const selection = editor.getSelection();
							if (selection) {
								this.translateAndInsert(editor, selection);
							} else {
								new Notice('Please select text to translate first');
							}
						});
				});
			})
		);

		// Add settings tab
		this.addSettingTab(new AITranslatorSettingTab(this.app, this));
	}

	async translateAndInsert(editor, text) {
		new Notice('Translating...');
		this.statusBarItem.setText('Translating...');

		try {
			const translatedText = await this.translator.translate(text);
			if (translatedText) {
				const replacement = `${text}\n${translatedText}`;
				editor.replaceSelection(replacement);
				new Notice('Translation completed');
			}
		} catch (error) {
			console.error(error);
			new Notice(`Translation failed: ${error.message}`);
		} finally {
			this.statusBarItem.setText('');
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		if (this.translator) {
			this.translator.updateSettings(this.settings);
		}
	}
}

class AITranslatorSettingTab extends PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'AI Translation Settings' });

		new Setting(containerEl)
			.setName('AI Provider')
			.setDesc('Select translation service to use')
			.addDropdown(dropdown => dropdown
				.addOption('deepseek', 'DeepSeek')
				.addOption('qwen', 'Tongyi Qianwen (Qwen)')
				.addOption('doubao', 'Doubao')
				.addOption('gemini', 'Google Gemini')
				.addOption('custom', 'Custom API (自定义 API)')
				.setValue(this.plugin.settings.provider)
				.onChange(async (value) => {
					this.plugin.settings.provider = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		// DeepSeek Settings
		if (this.plugin.settings.provider === 'deepseek') {
			this.addProviderSettings(containerEl, 'DeepSeek', 'deepseek');
		}

		// Qwen Settings
		if (this.plugin.settings.provider === 'qwen') {
			this.addProviderSettings(containerEl, 'Tongyi Qianwen', 'qwen');
		}

		// Doubao Settings
		if (this.plugin.settings.provider === 'doubao') {
			this.addProviderSettings(containerEl, 'Doubao', 'doubao');
		}

		// Gemini Settings
		if (this.plugin.settings.provider === 'gemini') {
			this.addProviderSettings(containerEl, 'Google Gemini', 'gemini');
		}

		// Custom Settings
		if (this.plugin.settings.provider === 'custom') {
			this.addCustomProviderSettings(containerEl);
		}

		containerEl.createEl('h3', { text: 'Prompt Settings' });

		new Setting(containerEl)
			.setName('Target Language')
			.setDesc('Language to translate into (used in default prompt)')
			.addText(text => text
				.setValue(this.plugin.settings.targetLanguage)
				.onChange(async (value) => {
					this.plugin.settings.targetLanguage = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Custom System Prompt')
			.setDesc('Override the default system prompt. Leave empty to use default.')
			.addTextArea(text => text
				.setPlaceholder('You are a professional translation assistant...')
				.setValue(this.plugin.settings.systemPrompt)
				.onChange(async (value) => {
					this.plugin.settings.systemPrompt = value;
					await this.plugin.saveSettings();
				}));
	}

	addProviderSettings(containerEl, name, keyPrefix) {
		new Setting(containerEl)
			.setName(`${name} API Key`)
			.setDesc(`Enter your ${name} API Key`)
			.addText(text => text
				.setPlaceholder('sk-...')
				.setValue(this.plugin.settings[`${keyPrefix}Key`])
				.onChange(async (value) => {
					this.plugin.settings[`${keyPrefix}Key`] = value;
					await this.plugin.saveSettings();
				}))
			.addButton(button => button
				.setButtonText('Test Connection')
				.onClick(async () => {
					button.setButtonText('Testing...');
					const res = await this.plugin.translator.testConnection(
						keyPrefix,
						this.plugin.settings[`${keyPrefix}Key`],
						this.plugin.settings[`${keyPrefix}Model`]
					);
					if (res.success) {
						new Notice(`Success: ${res.message}`);
					} else {
						new Notice(`Failed: ${res.message}`);
					}
					button.setButtonText('Test Connection');
				}));

		if (keyPrefix === 'doubao') {
			new Setting(containerEl)
				.setName(`${name} Model`)
				.setDesc('For Doubao, please enter your Endpoint ID (e.g., ep-202406...)')
				.addText(text => text
					.setPlaceholder('ep-...')
					.setValue(this.plugin.settings[`${keyPrefix}Model`])
					.onChange(async (value) => {
						this.plugin.settings[`${keyPrefix}Model`] = value;
						await this.plugin.saveSettings();
					}));
		} else {
			const presetModels = keyPrefix === 'deepseek'
				? ['deepseek-chat', 'deepseek-reasoner', 'deepseek-v4-flash']
				: keyPrefix === 'gemini'
					? ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
					: [
						'qwen-plus',
						'qwen-max',
						'qwen-turbo',
						'qwen-long',
						'qwen3.7-plus',
						'qwen3.7-max-2026-05-17',
						'qwen3.6-35b-a3b',
						'qwen3.6-flash-2026-04-16',
						'deepseek-v4-flash',
						'glm-5.1'
					];

			const currentModel = (this.plugin.settings[`${keyPrefix}Model`] || '').trim();
			const isCustom = currentModel && !presetModels.includes(currentModel);

			new Setting(containerEl)
				.setName(`${name} Model`)
				.setDesc(`Select ${name} model`)
				.addDropdown(dropdown => {
					if (keyPrefix === 'deepseek') {
						dropdown.addOption('deepseek-chat', 'DeepSeek-V3 (deepseek-chat)');
						dropdown.addOption('deepseek-reasoner', 'DeepSeek-R1 (deepseek-reasoner)');
						dropdown.addOption('deepseek-v4-flash', 'DeepSeek-V4-Flash (deepseek-v4-flash)');
					} else if (keyPrefix === 'gemini') {
						dropdown.addOption('gemini-2.5-flash', 'Gemini 2.5 Flash (gemini-2.5-flash)');
						dropdown.addOption('gemini-2.5-pro', 'Gemini 2.5 Pro (gemini-2.5-pro)');
						dropdown.addOption('gemini-2.0-flash', 'Gemini 2.0 Flash (gemini-2.0-flash)');
						dropdown.addOption('gemini-1.5-flash', 'Gemini 1.5 Flash (gemini-1.5-flash)');
						dropdown.addOption('gemini-1.5-pro', 'Gemini 1.5 Pro (gemini-1.5-pro)');
					} else if (keyPrefix === 'qwen') {
						dropdown.addOption('qwen-plus', 'Qwen-Plus');
						dropdown.addOption('qwen-max', 'Qwen-Max');
						dropdown.addOption('qwen-turbo', 'Qwen-Turbo');
						dropdown.addOption('qwen-long', 'Qwen-Long');
						dropdown.addOption('qwen3.7-plus', 'Qwen-3.7-Plus (qwen3.7-plus)');
						dropdown.addOption('qwen3.7-max-2026-05-17', 'Qwen-3.7-Max (2026-05-17)');
						dropdown.addOption('qwen3.6-35b-a3b', 'Qwen-3.6-35B-A3B');
						dropdown.addOption('qwen3.6-flash-2026-04-16', 'Qwen-3.6-Flash (2026-04-16)');
						dropdown.addOption('deepseek-v4-flash', 'DeepSeek-V4-Flash (deepseek-v4-flash)');
						dropdown.addOption('glm-5.1', 'GLM-5.1 (glm-5.1)');
					}
					dropdown.addOption('custom', 'Custom Model (自定义模型)...');

					dropdown
						.setValue(isCustom ? 'custom' : (currentModel || presetModels[0]))
						.onChange(async (value) => {
							if (value === 'custom') {
								this.plugin.settings[`${keyPrefix}Model`] = '';
							} else {
								this.plugin.settings[`${keyPrefix}Model`] = value;
							}
							await this.plugin.saveSettings();
							this.display();
						});
				});

			if (isCustom || currentModel === '' || !presetModels.includes(currentModel)) {
				new Setting(containerEl)
					.setName(`Custom ${name} Model ID`)
					.setDesc(`Enter the custom model ID for ${name}`)
					.addText(text => text
						.setPlaceholder('e.g. qwen-coder-plus')
						.setValue(currentModel)
						.onChange(async (value) => {
							this.plugin.settings[`${keyPrefix}Model`] = value.trim();
							await this.plugin.saveSettings();
						}));
			}
		}
	}

	addCustomProviderSettings(containerEl) {
		new Setting(containerEl)
			.setName('Custom API URL')
			.setDesc('Enter the complete chat completions API URL')
			.addText(text => text
				.setPlaceholder('https://api.openai.com/v1/chat/completions')
				.setValue(this.plugin.settings.customUrl)
				.onChange(async (value) => {
					this.plugin.settings.customUrl = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Custom API Key')
			.setDesc('Enter your API Key (leave empty if not required)')
			.addText(text => text
				.setPlaceholder('sk-...')
				.setValue(this.plugin.settings.customKey)
				.onChange(async (value) => {
					this.plugin.settings.customKey = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Custom Model ID')
			.setDesc('Enter the model ID')
			.addText(text => text
				.setPlaceholder('e.g. gpt-4o')
				.setValue(this.plugin.settings.customModel)
				.onChange(async (value) => {
					this.plugin.settings.customModel = value.trim();
					await this.plugin.saveSettings();
				}))
			.addButton(button => button
				.setButtonText('Test Connection')
				.onClick(async () => {
					button.setButtonText('Testing...');
					const res = await this.plugin.translator.testConnection(
						'custom',
						this.plugin.settings.customKey,
						this.plugin.settings.customModel
					);
					if (res.success) {
						new Notice(`Success: ${res.message}`);
					} else {
						new Notice(`Failed: ${res.message}`);
					}
					button.setButtonText('Test Connection');
				}));
	}
}

module.exports = AITranslatorPlugin;