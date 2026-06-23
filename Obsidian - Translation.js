const { requestUrl } = require('obsidian');

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

module.exports = AITranslator;
