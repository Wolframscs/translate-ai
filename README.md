# 前言
考虑到工作场景下需要频繁查阅英文文献与记录笔记，为提升阅读效率，期望在 Obsidian 软件中实现以下功能：  **选中文本后，通过快捷键即可调用高质量翻译，并直接插入笔记**。

尽管 Obsidian 社区已有不少翻译插件，但实测中，多数插件依赖的翻译接口在准确性和语境贴合度上常不尽人意。相比之下，当前各类 AI 窗口（如 DeepSeek (V3/R1)、通义千问 (Qwen) 和 豆包 (Doubao) API 等）的翻译结果往往更贴近原文语义与学术表达。

为此，基于 **Gemini 3** 全新开发了一款 Obsidian 翻译插件，该插件旨在无缝融入文献阅读与笔记整理流程，让翻译更准确，操作更高效，并分享出来。

而目前阿里云百炼送了百万Token，刚好可以尽情享用啦。
![Obsidian-AI 翻译插件-2](https://raw.githubusercontent.com/Wolframscs/PIC-Vault/main/pic/20260210210037011.png)

**下载链接**：https://github.com/Wolframscs/translate-ai

**公众号后台**：关注微信公众号`仿真操作工`，并回复：`Translate` ，`Trans`,  `translate`,  `翻译`
其中一个即可，发送夸克网盘下载链接。

# Obsidian Translate AI 插件指南
Translate AI 是一款专为 Obsidian 设计的智能翻译插件，支持对接 DeepSeek、通义千问和豆包等多个国产大模型。它能将选中的英文文献内容快速翻译为高质量中文（或其他语言），并直接插入笔记中，显著提升文献阅读和笔记整理效率。

## ✨ 核心功能
- **多模型支持**：无缝接入 **DeepSeek (V3/R1)**、**通义千问 (Qwen)** 和 **豆包 (Doubao)** 的官方 API。

- **一键智能翻译**：通过右键菜单、命令面板或自定义快捷键，快速将选中的外文翻译为目标语言。

- **原文对照呈现**：翻译结果自动插入到原文下方，形成清晰对照，便于理解和校验。
    
- **高度可定制化**：支持自定义翻译提示词（System Prompt）、目标语言等，满足学术、技术等不同场景的翻译风格要求。
    

---

## 📥 安装与启用

### 安装
1. 下载本插件的最新发布版本。

2. 将插件文件夹解压后，点击第三方插件，打开插件文件夹。
![Obsidian-AI 翻译插件-3](https://raw.githubusercontent.com/Wolframscs/PIC-Vault/main/pic/20260210210037013.png)

3. 放入你的 Obsidian 库的 `.obsidian/plugins/` 目录下。
![Obsidian-AI 翻译插件-4](https://raw.githubusercontent.com/Wolframscs/PIC-Vault/main/pic/20260210210037014.png)
4. 重启 Obsidian，或在 `设置` -> `第三方插件` 中点击 `重新加载插件`。

### 启用
1. 打开 Obsidian `设置`。

2. 进入 `第三方插件` 选项卡。
![Obsidian-AI 翻译插件-5](https://raw.githubusercontent.com/Wolframscs/PIC-Vault/main/pic/20260210210037015.png)
3. 找到 `AI Translator` 并启用它。
![Obsidian-AI 翻译插件-6](https://raw.githubusercontent.com/Wolframscs/PIC-Vault/main/pic/20260210210037016.png)
---

## ⚙️ 配置 API

启用插件后，进入 `设置` -> `AI Translator` 界面，根据您选择的服务商进行配置。
![Obsidian-AI 翻译插件-7](https://raw.githubusercontent.com/Wolframscs/PIC-Vault/main/pic/20260210210037017.png)
### DeepSeek 配置
1. **AI Provider**: 选择 `DeepSeek`。
    
2. **API Key**: 填入您的 DeepSeek API Key。通过在 [DeepSeek](https://platform.deepseek.com/api_keys)  开发平台获取。
    ![Obsidian-AI 翻译插件-12](https://raw.githubusercontent.com/Wolframscs/PIC-Vault/main/pic/20260210210037018.png)
3. **Model**: 在下拉菜单中选择您想使用的模型（例如 `deepseek-chat`）。
![wechat_post-1](https://raw.githubusercontent.com/Wolframscs/PIC-Vault/main/pic/20260210210037019.png)
4. **测试连接**: 点击 `Test Connection` 按钮，状态栏显示 “Success” 即表示配置成功。
![Obsidian-AI 翻译插件-9](https://raw.githubusercontent.com/Wolframscs/PIC-Vault/main/pic/20260210210037020.png)

### 通义千问 (阿里云) 配置

1. **AI Provider**: 选择 `Tongyi Qianwen (Qwen)`。
    
2. **API Key**: 填入您的阿里云 DashScope API Key，通过在[阿里云百炼](https://bailian.console.aliyun.com/cn-beijing/?spm=a2ty02.30260209.overview_recent.1.4f8f74a1kNTaRr&tab=model#/api-key)获取。
![Obsidian-AI 翻译插件-11](https://raw.githubusercontent.com/Wolframscs/PIC-Vault/main/pic/20260210210037021.png)
3. **Model**: 选择模型（如 `qwen-plus`）。
![wechat_post-2](https://raw.githubusercontent.com/Wolframscs/PIC-Vault/main/pic/20260210210037022.png)
4. **测试连接**: 点击 `Test Connection` 按钮，状态栏显示 “Success” 即表示配置成功。

### 豆包 (火山引擎) 配置

1. **AI Provider**: 选择 `Doubao`。
    
2. **API Key**: 填入您的火山引擎方舟 API Key。
    
3. **Model (Endpoint ID)**: **此处需要特别注意**，您需要填入在火山引擎控制台创建的 **终端节点 ID**（格式类似 `ep-202406xxxxxxxxxx`），而不是模型的通用名称。
![wechat_post-3](https://raw.githubusercontent.com/Wolframscs/PIC-Vault/main/pic/20260210210037023.png)
4. **测试连接**: 点击 `Test Connection` 按钮，状态栏显示 “Success” 即表示配置成功。

---

## 🚀 使用方式

配置完成后，您可以通过以下任一方式使用翻译功能：

1. **右键菜单（推荐）**：
    
    - 在编辑器中选中需要翻译的文本。
        
    - 点击鼠标右键，在弹出的菜单中选择 `Translate Selection`。
![wechat_post-5](https://raw.githubusercontent.com/Wolframscs/PIC-Vault/main/pic/20260210210037024.png)
    - 插件将在状态栏显示 “Translating...”，翻译完成后，结果会自动插入到选中文本的下方。
        
2. **命令面板**：
    
    - 选中文本后，按下 `Ctrl/Cmd + P` 打开命令面板。
        ![Obsidian-AI 翻译插件](https://raw.githubusercontent.com/Wolframscs/PIC-Vault/main/pic/20260210210037025.png)
    - 输入 `Translate` 并选择 `AI Translator: Translate Selection` 命令。
        
1. **自定义快捷键（效率之选，强烈推荐）**：
    
    - 进入 `设置` -> `快捷键`。
    - 搜索 `Translate Selection`，为它设置一个顺手的快捷键（比如我这里设置的为 `Ctrl+T`）。
        ![Obsidian-AI 翻译插件-1](https://raw.githubusercontent.com/Wolframscs/PIC-Vault/main/pic/20260210210037026.png)
    - 之后，选中文本并按下快捷键（比如我这里设置的为 `Ctrl+T`）即可瞬间完成翻译。
        

---

## 🔧 进阶设置

### 修改目标语言

- 默认翻译目标语言为中文 (`Chinese`)。如需翻译成英文、日文等，请在插件设置的 `Target Language` 字段中修改，例如输入 `English`, `Japanese`。
    

### 自定义系统提示词 (System Prompt)

- 如果您对翻译风格有特殊要求（例如“请以严谨的学术风格翻译”），可以在 `Custom System Prompt` 框中输入您的专属提示词。
    
- 插件会优先使用您的自定义提示词，这将使翻译结果更符合您的个性化需求。
    

### 疑难解答

- **翻译失败？** 请检查：
    
    1. API Key 是否正确且未过期。
        
    2. 网络连接是否正常。
        
    3. 对于豆包用户，请确认填写的 `Model` 字段是有效的 **Endpoint ID**。
        
- **结果不理想？** 尝试优化您的 `Custom System Prompt`，明确您对翻译风格、术语准确性的要求。



















