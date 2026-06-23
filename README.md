# 🚀 Obsidian 效率神器：Translate AI - 你的私人多模型翻译助手

还在为 Obsidian 里看英文资料发愁？还在频繁切换窗口去复制粘贴翻译？

今天给大家推荐一款超轻量、可定制的 Obsidian 翻译插件 —— **Translate AI**。它不仅支持 DeepSeek、通义千问、豆包等主流模型，还全面支持 Google Gemini 以及任意自定义的 OpenAI 兼容接口，并能一键生成翻译并自动插入笔记！

## ✨ 核心亮点

### 1. 🤖 支持多种主流 AI 模型与自定义端点
支持 **DeepSeek (V3/R1)**、**通义千问 (Qwen-Max/Plus)**、**字节豆包** 以及 **Google Gemini (2.5/2.0/1.5)**。
不仅如此，还支持 **任意自定义 OpenAI 兼容接口 (如 Ollama、Groq、OpenRouter、自建代理等)**！
告别昂贵的 API，享受极速、精准的翻译体验！

### 2. ⚡️ 极致流畅的交互体验
*   **右键菜单**：选中文字 -> 右键 "Translate Selection"，翻译立马出现。
*   **命令面板**：键盘党最爱，`Ctrl/Cmd + P` 呼出命令即可翻译。
*   **自动插入**：翻译结果会自动插入到原文下方，保留原文对照，方便复习。

### 3. 🛠️ 高度可定制化
*   **自定义提示词 (System Prompt)**：想让它翻译成“鲁迅风”？还是“学术风”？在设置里改改 Prompt 就能实现！
*   **目标语言**：不仅是英译中，想译成法语、日语？随时可以在设置里调整。

### 4. 🔍 贴心的测试功能
担心 API Key 填错？设置页新增 **"Test Connection"** 按钮，一键测试连通性，再也不用瞎猜是网络问题还是 Key 的问题了。

---

## 📖 使用指南

### 第一步：安装插件
(在此处填写你的安装包下载链接或 GitHub 链接)

### 第二步：配置 API
1.  打开 Obsidian **设置** -> **AI Translator**。
2.  **选择服务商**：选择 `DeepSeek`、`Qwen`、`Doubao`、`Google Gemini` 或 `Custom API`。
3.  **配置参数**：
    *   对于 **Gemini**，选择合适的模型（推荐 `gemini-2.5-flash`），填入 Gemini API Key。
    *   对于 **Custom API (自定义模型)**，填入你的 Custom API URL（例如：`https://api.openai.com/v1/chat/completions` 或本地 Ollama `http://localhost:11434/v1/chat/completions`）、API Key（若有）和 Model ID。
4.  **点击测试**：点一下 `Test Connection`，看到 "Success" 就搞定啦！

### 💡 配置示例

#### 1. Google Gemini
*   **AI Provider**: `Google Gemini`
*   **Google Gemini API Key**: 填写你的 API Key
*   **Google Gemini Model**: 选择 `gemini-2.5-flash` 或其他版本

#### 2. 本地 Ollama (以 Llama 3 为例)
*   **AI Provider**: `Custom API (自定义 API)`
*   **Custom API URL**: `http://localhost:11434/v1/chat/completions`
*   **Custom API Key**: 留空（不填）
*   **Custom Model ID**: `llama3`

#### 3. OpenAI / 其他第三方中转代理
*   **AI Provider**: `Custom API (自定义 API)`
*   **Custom API URL**: `https://api.openai.com/v1/chat/completions` (或你的中转代理 URL)
*   **Custom API Key**: 填写你的 API Key
*   **Custom Model ID**: 填写具体模型，如 `gpt-4o`

### 第三步：开始翻译
在笔记里选中一段英文，**右键点击**选择 **"Translate Selection"**。
稍等片刻，翻译好的中文就会自动出现在下方。

---

💡 **小贴士**：
*   如果使用 DeepSeek，推荐尝试 **DeepSeek-V3** 模型，速度快且翻译质量极高。
*   如果使用 Gemini，推荐尝试 **Gemini 2.5 Flash**，速度和准确性表现都非常优秀。
*   如果用于学术翻译，可以在设置里把 System Prompt 改为："你是一个专业的学术翻译助手，请将以下文本翻译成通顺、专业的学术中文。"

💪 快去试试吧，让你的 Obsidian 笔记效率起飞！

#Obsidian #效率工具 #AI翻译 #DeepSeek #Gemini #Ollama #自定义模型 #笔记方法
