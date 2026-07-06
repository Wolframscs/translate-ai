const { requestUrl } = require('obsidian');

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

module.exports = Translator;
