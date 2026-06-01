[English](#english) | [中文](#中文)

---

## English

# AI Note Search Extension

A browser extension powered by a local AI embedding model for semantic note search. Runs entirely in the browser — no server required, keeping your data private.

## ✨ Features

- **🧠 Semantic Search**: Uses Transformers.js with `Xenova/all-MiniLM-L6-v2` model to find semantically similar notes via cosine similarity
- **🔤 Fallback Search**: Automatically switches to Fuse.js keyword fuzzy search when the AI model fails to load, with clear UI indication
- **💾 Local Storage**: Dexie.js wrapping IndexedDB — all data stays in your browser
- **📥 Import/Export**: JSON-based data backup and restore
- **🔍 Search Highlighting**: Matched keywords highlighted in search results
- **📱 Responsive Design**: Switches from side-by-side to stacked layout on narrow screens
- **🔒 Privacy-First**: All computation (embedding, similarity) runs entirely client-side

## 🚀 Installation

### Download from Release

1. Download the latest release zip from [GitHub Releases](https://github.com/ceo1st/ai-note-search-extension/releases/download/v1.0.0/ai-note-search-extension-v1.0.0.zip)
2. Unzip the downloaded file
3. Open Chrome/Edge and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the unzipped folder
6. Click the extension icon in the toolbar to open

### Firefox

1. Download and unzip the release
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the unzipped folder

## 📖 Usage

### Creating Notes

1. Click the extension icon to open the main interface
2. Click "+ New Note" in the left panel
3. Enter a title and content
4. Click "💾 Save"

### Searching Notes

1. Type your query in the search bar at the top
2. Click "Search" or press Enter
3. Results are sorted by relevance in the left panel
4. Click any result to view the full note

### Import / Export

- **Export**: Click "📤 Export" to download a JSON backup of all notes and embeddings
- **Import**: Click "📥 Import" to restore from a JSON file. ⚠️ Warning: importing clears all existing data

## 🏗️ Tech Stack

| Component | Technology | Version |
|---|---|---|
| Extension Standard | Manifest V3 | — |
| Storage | IndexedDB via Dexie.js | 3.2.7 |
| Embedding Model | Transformers.js | 3.0.0 |
| Keyword Search | Fuse.js | 7.0.0 |
| Frontend | Vanilla HTML/CSS/JS ES Modules | — |

## 📄 License

MIT License

---

## 中文

# AI 笔记语义搜索扩展

一款基于本地 AI 嵌入模型的浏览器扩展，支持对笔记进行语义搜索。完全在浏览器端运行，无需服务器，保护您的隐私。

## ✨ 功能特点

- **🧠 语义搜索**：使用 Transformers.js 加载 `Xenova/all-MiniLM-L6-v2` 模型，基于余弦相似度匹配语义相近的笔记
- **🔤 降级搜索**：AI 模型加载失败时自动切换到 Fuse.js 关键词模糊搜索，界面明确提示
- **💾 本地存储**：使用 Dexie.js 封装 IndexedDB，数据完全存储在浏览器本地
- **📥 导入/导出**：支持 JSON 格式的数据导入和导出，方便备份和迁移
- **🔍 搜索高亮**：搜索结果中高亮显示匹配的关键词
- **📱 响应式设计**：窄屏时自动从左右布局切换为上下布局
- **🔒 隐私安全**：所有计算（嵌入、相似度）完全在客户端完成，不上传任何数据

## 🚀 安装方法

### 从 Release 下载

1. 从 [GitHub Releases](https://github.com/ceo1st/ai-note-search-extension/releases/download/v1.0.0/ai-note-search-extension-v1.0.0.zip) 下载最新版本 zip 文件
2. 解压下载的文件
3. 打开 Chrome/Edge，访问 `chrome://extensions/`
4. 开启右上角的「开发者模式」
5. 点击「加载已解压的扩展程序」，选择解压后的文件夹
6. 扩展安装完成后，点击工具栏上的扩展图标即可打开

### Firefox

1. 下载并解压 Release
2. 打开浏览器，访问 `about:debugging#/runtime/this-firefox`
3. 点击「临时载入附加组件」
4. 选择解压文件夹中的 `manifest.json` 文件

## 📖 使用说明

### 创建笔记

1. 点击扩展图标打开主界面
2. 点击左侧面板的「+ 新建笔记」按钮
3. 输入标题和内容
4. 点击「💾 保存」按钮

### 搜索笔记

1. 在顶部搜索框中输入查询内容
2. 点击「搜索」按钮或按 Enter 键
3. 搜索结果会按相关度排序显示在左侧面板
4. 点击任意结果可查看完整笔记

### 导入/导出

- **导出**：点击右上角「📤 导出」按钮，将下载包含所有笔记和嵌入向量的 JSON 文件
- **导入**：点击「📥 导入」按钮，选择之前导出的 JSON 文件。⚠️ 注意：导入会清空现有所有数据

## 🏗️ 技术栈

| 组件 | 技术选型 | 版本 |
|---|---|---|
| 扩展标准 | Manifest V3 | — |
| 存储 | IndexedDB via Dexie.js | 3.2.7 |
| 嵌入模型 | Transformers.js | 3.0.0 |
| 关键词搜索 | Fuse.js | 7.0.0 |
| 前端 | 纯原生 HTML/CSS/JS ES Modules | — |

## 📄 许可证

MIT License
