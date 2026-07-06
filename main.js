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
	openaiKey: '',
	openaiModel: 'gpt-4o',
	claudeKey: '',
	claudeModel: 'claude-3-5-sonnet-latest',
	siliconflowKey: '',
	siliconflowModel: 'deepseek-ai/DeepSeek-V3',
	moonshotKey: '',
	moonshotModel: 'moonshot-v1-8k',
	zhipuKey: '',
	zhipuModel: 'glm-4-flash',
	openrouterKey: '',
	openrouterModel: 'meta-llama/llama-3.3-70b-instruct',
	groqKey: '',
	groqModel: 'llama-3.3-70b-versatile',
	customUrl: '',
	customKey: '',
	customModel: '',
	systemPrompt: '',
	targetLanguage: 'Chinese'
};

class Translator {
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
			case 'openai':
				url = 'https://api.openai.com/v1/chat/completions';
				model = this.settings.openaiModel || 'gpt-4o';
				apiKey = this.settings.openaiKey;
				break;
			case 'claude':
				url = 'https://api.anthropic.com/v1/messages';
				model = this.settings.claudeModel || 'claude-3-5-sonnet-latest';
				apiKey = this.settings.claudeKey;
				break;
			case 'siliconflow':
				url = 'https://api.siliconflow.cn/v1/chat/completions';
				model = this.settings.siliconflowModel || 'deepseek-ai/DeepSeek-V3';
				apiKey = this.settings.siliconflowKey;
				break;
			case 'moonshot':
				url = 'https://api.moonshot.cn/v1/chat/completions';
				model = this.settings.moonshotModel || 'moonshot-v1-8k';
				apiKey = this.settings.moonshotKey;
				break;
			case 'zhipu':
				url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
				model = this.settings.zhipuModel || 'glm-4-flash';
				apiKey = this.settings.zhipuKey;
				break;
			case 'openrouter':
				url = 'https://openrouter.ai/api/v1/chat/completions';
				model = this.settings.openrouterModel || 'meta-llama/llama-3.3-70b-instruct';
				apiKey = this.settings.openrouterKey;
				break;
			case 'groq':
				url = 'https://api.groq.com/openai/v1/chat/completions';
				model = this.settings.groqModel || 'llama-3.3-70b-versatile';
				apiKey = this.settings.groqKey;
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

		let requestBody;
		const headers = {
			'Content-Type': 'application/json'
		};

		if (apiKey) {
			if (this.settings.provider === 'claude') {
				headers['x-api-key'] = apiKey;
				headers['anthropic-version'] = '2023-06-01';
			} else {
				headers['Authorization'] = `Bearer ${apiKey}`;
			}
		}

		if (this.settings.provider === 'claude') {
			requestBody = {
				model: model,
				system: systemPrompt,
				messages: [
					{
						role: "user",
						content: text
					}
				],
				max_tokens: 4096
			};
		} else {
			requestBody = {
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
					} else if (response.json && response.json.error && typeof response.json.error === 'string') {
						errorMsg += ` - ${response.json.error}`;
					}
				} catch (e) {
					// ignore json parse error
				}
				throw new Error(errorMsg);
			}

			const data = response.json;
			if (this.settings.provider === 'claude') {
				if (!data.content || data.content.length === 0) {
					throw new Error('No translation returned from API');
				}
				return data.content[0].text.trim();
			} else {
				if (!data.choices || data.choices.length === 0) {
					throw new Error('No translation returned from API');
				}
				return data.choices[0].message.content.trim();
			}
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
			case 'openai':
				url = 'https://api.openai.com/v1/chat/completions';
				targetModel = model || 'gpt-4o';
				break;
			case 'claude':
				url = 'https://api.anthropic.com/v1/messages';
				targetModel = model || 'claude-3-5-sonnet-latest';
				break;
			case 'siliconflow':
				url = 'https://api.siliconflow.cn/v1/chat/completions';
				targetModel = model || 'deepseek-ai/DeepSeek-V3';
				break;
			case 'moonshot':
				url = 'https://api.moonshot.cn/v1/chat/completions';
				targetModel = model || 'moonshot-v1-8k';
				break;
			case 'zhipu':
				url = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
				targetModel = model || 'glm-4-flash';
				break;
			case 'openrouter':
				url = 'https://openrouter.ai/api/v1/chat/completions';
				targetModel = model || 'meta-llama/llama-3.3-70b-instruct';
				break;
			case 'groq':
				url = 'https://api.groq.com/openai/v1/chat/completions';
				targetModel = model || 'llama-3.3-70b-versatile';
				break;
			case 'custom':
				url = this.settings.customUrl;
				targetModel = model;
				break;
		}

		if (provider === 'custom' && !url) {
			return { success: false, message: 'Custom API URL not set' };
		}

		let requestBody;
		if (provider === 'claude') {
			requestBody = {
				model: targetModel,
				messages: [
					{ role: "user", content: "Test" }
				],
				max_tokens: 5
			};
		} else {
			requestBody = {
				model: targetModel,
				messages: [
					{ role: "user", content: "Test" }
				],
				max_tokens: 5
			};
		}

		const headers = {
			'Content-Type': 'application/json'
		};
		if (apiKey) {
			if (provider === 'claude') {
				headers['x-api-key'] = apiKey;
				headers['anthropic-version'] = '2023-06-01';
			} else {
				headers['Authorization'] = `Bearer ${apiKey}`;
			}
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

class TranslatorPlugin extends Plugin {
	settings;
	translator;
	statusBarItem;

	async onload() {
		await this.loadSettings();
		this.translator = new Translator(this.settings);

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
		this.addSettingTab(new TranslatorSettingTab(this.app, this));
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

class TranslatorSettingTab extends PluginSettingTab {
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
				.addOption('openai', 'OpenAI')
				.addOption('claude', 'Anthropic Claude')
				.addOption('siliconflow', 'SiliconFlow (硅基流动)')
				.addOption('moonshot', 'Moonshot AI (Kimi)')
				.addOption('zhipu', 'Zhipu AI (GLM)')
				.addOption('openrouter', 'OpenRouter')
				.addOption('groq', 'Groq')
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

		// OpenAI Settings
		if (this.plugin.settings.provider === 'openai') {
			this.addProviderSettings(containerEl, 'OpenAI', 'openai');
		}

		// Claude Settings
		if (this.plugin.settings.provider === 'claude') {
			this.addProviderSettings(containerEl, 'Anthropic Claude', 'claude');
		}

		// SiliconFlow Settings
		if (this.plugin.settings.provider === 'siliconflow') {
			this.addProviderSettings(containerEl, 'SiliconFlow', 'siliconflow');
		}

		// Moonshot Settings
		if (this.plugin.settings.provider === 'moonshot') {
			this.addProviderSettings(containerEl, 'Moonshot AI (Kimi)', 'moonshot');
		}

		// Zhipu Settings
		if (this.plugin.settings.provider === 'zhipu') {
			this.addProviderSettings(containerEl, 'Zhipu AI (GLM)', 'zhipu');
		}

		// OpenRouter Settings
		if (this.plugin.settings.provider === 'openrouter') {
			this.addProviderSettings(containerEl, 'OpenRouter', 'openrouter');
		}

		// Groq Settings
		if (this.plugin.settings.provider === 'groq') {
			this.addProviderSettings(containerEl, 'Groq', 'groq');
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

		const defaultPrompt = `You are a professional translation assistant. Please directly translate the input text into ${this.plugin.settings.targetLanguage || 'Chinese'}. Do not output any explanations, comments, or extra words, only output the translation result.`;

		new Setting(containerEl)
			.setName('Custom System Prompt')
			.setDesc('Override the default system prompt. Leave empty to use default.')
			.addTextArea(text => text
				.setPlaceholder(defaultPrompt)
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
			let presetModels = [];
			switch (keyPrefix) {
				case 'deepseek':
					presetModels = ['deepseek-chat', 'deepseek-reasoner', 'deepseek-v4-flash'];
					break;
				case 'gemini':
					presetModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
					break;
				case 'openai':
					presetModels = ['gpt-4o', 'gpt-4o-mini', 'o1-mini', 'o3-mini', 'gpt-4-turbo'];
					break;
				case 'claude':
					presetModels = ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'];
					break;
				case 'siliconflow':
					presetModels = [
						'deepseek-ai/DeepSeek-V3',
						'deepseek-ai/DeepSeek-R1',
						'Qwen/Qwen2.5-72B-Instruct',
						'Qwen/Qwen2.5-32B-Instruct',
						'Qwen/Qwen2.5-14B-Instruct',
						'Qwen/Qwen2.5-7B-Instruct',
						'THUDM/glm-4-9b-chat',
						'internlm/internlm2_5-20b-chat'
					];
					break;
				case 'moonshot':
					presetModels = ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'];
					break;
				case 'zhipu':
					presetModels = ['glm-4-flash', 'glm-4-plus', 'glm-4-air', 'glm-4-long'];
					break;
				case 'openrouter':
					presetModels = [
						'meta-llama/llama-3.3-70b-instruct',
						'deepseek/deepseek-chat',
						'google/gemini-2.5-flash',
						'anthropic/claude-3.5-sonnet'
					];
					break;
				case 'groq':
					presetModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
					break;
				case 'qwen':
				default:
					presetModels = [
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
					break;
			}

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
					} else if (keyPrefix === 'openai') {
						dropdown.addOption('gpt-4o', 'GPT-4o');
						dropdown.addOption('gpt-4o-mini', 'GPT-4o-mini');
						dropdown.addOption('o1-mini', 'o1-mini');
						dropdown.addOption('o3-mini', 'o3-mini');
						dropdown.addOption('gpt-4-turbo', 'GPT-4-turbo');
					} else if (keyPrefix === 'claude') {
						dropdown.addOption('claude-3-5-sonnet-latest', 'Claude 3.5 Sonnet');
						dropdown.addOption('claude-3-5-haiku-latest', 'Claude 3.5 Haiku');
						dropdown.addOption('claude-3-opus-latest', 'Claude 3 Opus');
					} else if (keyPrefix === 'siliconflow') {
						dropdown.addOption('deepseek-ai/DeepSeek-V3', 'DeepSeek V3');
						dropdown.addOption('deepseek-ai/DeepSeek-R1', 'DeepSeek R1');
						dropdown.addOption('Qwen/Qwen2.5-72B-Instruct', 'Qwen 2.5 72B');
						dropdown.addOption('Qwen/Qwen2.5-32B-Instruct', 'Qwen 2.5 32B');
						dropdown.addOption('Qwen/Qwen2.5-14B-Instruct', 'Qwen 2.5 14B');
						dropdown.addOption('Qwen/Qwen2.5-7B-Instruct', 'Qwen 2.5 7B');
						dropdown.addOption('THUDM/glm-4-9b-chat', 'GLM 4 9B');
						dropdown.addOption('internlm/internlm2_5-20b-chat', 'InternLM 2.5 20B');
					} else if (keyPrefix === 'moonshot') {
						dropdown.addOption('moonshot-v1-8k', 'Kimi 8k');
						dropdown.addOption('moonshot-v1-32k', 'Kimi 32k');
						dropdown.addOption('moonshot-v1-128k', 'Kimi 128k');
					} else if (keyPrefix === 'zhipu') {
						dropdown.addOption('glm-4-flash', 'GLM-4 Flash');
						dropdown.addOption('glm-4-plus', 'GLM-4 Plus');
						dropdown.addOption('glm-4-air', 'GLM-4 Air');
						dropdown.addOption('glm-4-long', 'GLM-4 Long');
					} else if (keyPrefix === 'openrouter') {
						dropdown.addOption('meta-llama/llama-3.3-70b-instruct', 'Llama 3.3 70B');
						dropdown.addOption('deepseek/deepseek-chat', 'DeepSeek V3');
						dropdown.addOption('google/gemini-2.5-flash', 'Gemini 2.5 Flash');
						dropdown.addOption('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet');
					} else if (keyPrefix === 'groq') {
						dropdown.addOption('llama-3.3-70b-versatile', 'Llama 3.3 70B');
						dropdown.addOption('llama-3.1-8b-instant', 'Llama 3.1 8B');
						dropdown.addOption('mixtral-8x7b-32768', 'Mixtral 8x7B');
						dropdown.addOption('gemma2-9b-it', 'Gemma 2 9B');
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

module.exports = TranslatorPlugin;