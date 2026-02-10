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
        }

        if (!apiKey) {
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

        const requestParam = {
            url: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
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
        const tempSettings = { ...this.settings, provider, [provider + 'Key']: apiKey };
        if (provider === 'deepseek') tempSettings.deepseekModel = model;
        if (provider === 'qwen') tempSettings.qwenModel = model;
        if (provider === 'doubao') tempSettings.doubaoModel = model;

        // Use a temporary translator instance or just call translate with logic
        // But to reuse logic, let's just swap settings temporarily or allow passing context.
        // Actually, let's just use the current instance logic but we need to override the settings being used.
        // A cleaner way is to make `translate` accept optional override settings, or just manually construct the request here for the test.
        // I will manually look up the URL similar to translate() to avoid messing with instance state.

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
        }

        const requestBody = {
            model: targetModel,
            messages: [
                { role: "user", content: "Test" }
            ],
            max_tokens: 5
        };

        const requestParam = {
            url: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
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
