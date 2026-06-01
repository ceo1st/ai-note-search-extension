# 产品需求文档 (PRD) — AI 笔记语义搜索浏览器扩展

## 概述

本项目旨在开发一款浏览器扩展，允许用户对笔记进行语义搜索。核心特点是使用本地 AI 嵌入模型（Transformers.js）在浏览器端完成所有计算，无需后端服务器，保护用户隐私。

---

## 功能需求

### 1. 笔记管理

#### 1.1 创建笔记
- 用户可以在主界面创建新笔记
- 笔记包含标题和正文两个字段
- 创建时间自动记录

#### 1.2 编辑笔记
- 点击笔记列表中的条目进入编辑模式
- 支持修改标题和正文
- 保存时自动更新修改时间

#### 1.3 删除笔记
- 编辑模式下提供删除按钮
- 删除前需用户确认
- 同时删除关联的嵌入向量

### 2. 语义搜索

#### 2.1 嵌入模型
- 使用 Transformers.js 库
- 模型: `Xenova/all-MiniLM-L6-v2`（384维向量，约23MB）
- 模型加载时在界面显示下载进度百分比
- 模型完全在浏览器端运行，不发送数据到外部服务器

#### 2.2 搜索流程
- 用户输入查询文本
- 将查询文本转换为嵌入向量
- 与所有笔记的嵌入向量计算余弦相似度
- 按相似度降序排列，返回 Top-K 结果
- 相似度阈值: 0.1（过滤不相关结果）

#### 2.3 降级搜索
- 当模型加载失败（网络错误、WebGPU 不支持等）时，自动切换至 Fuse.js 关键词搜索
- 界面明确显示当前搜索模式（语义搜索 / 关键词搜索）
- 降级时显示提示信息

### 3. 数据导入/导出

#### 3.1 导出
- 导出格式: JSON
- 包含内容: notes 数组 + embeddings 数组
- 导出文件名: `ai-notes-backup-{YYYY-MM-DD}.json`

#### 3.2 导入
- 导入时清空现有所有数据
- 数据格式验证（必须包含 notes 和 embeddings 数组）
- 导入失败时显示错误提示

### 4. 搜索结果高亮

- 基于查询词对笔记正文进行高亮
- 分词规则: 按空格分词，仅高亮长度 ≥ 2 的词
- 使用 `<mark>` 标签标记匹配内容
- 支持多关键词同时高亮

---

## 技术需求

### 技术栈

| 组件 | 技术选型 | 版本 |
|---|---|---|
| 扩展标准 | Manifest V3 | - |
| 存储 | IndexedDB via Dexie.js | 3.2.7 |
| 嵌入模型 | Transformers.js | 3.0.0 |
| 关键词搜索 | Fuse.js | 7.0.0 |
| 前端 | 纯原生 HTML/CSS/JS ES Modules | - |
| 第三方库 | 全部通过 CDN 引入 | - |

### 数据库设计

#### notes 表
```
{
  id: auto-increment,
  title: string,
  content: string,
  createdAt: ISO string,
  updatedAt: ISO string
}
```

#### embeddings 表
```
{
  id: auto-increment,
  noteId: number (关联 notes.id),
  vector: number[] (384维浮点数组)
}
```

### 文件结构

```
ai-note-search-extension/
├── manifest.json
├── background.js
├── app.html
├── app.js
├── styles.css
├── lib/
│   ├── db.js
│   ├── vector.js
│   ├── embedding.js
│   └── fuseSearch.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md
├── README_EN.md
└── PRD.md
```

---

## UI/UX 需求

### 布局
- **宽屏（>768px）**: 左右分栏 — 左侧笔记列表（350px），右侧编辑器
- **窄屏（≤768px）**: 上下分栏 — 上方列表（最大45vh），下方编辑器

### 交互
- 点击扩展图标: 打开独立标签页 app.html（已打开则切换到该标签）
- 搜索框: 支持 Enter 快捷键触发搜索
- 笔记列表: 悬停高亮，选中状态标记
- 进度条: 模型加载时显示百分比进度

### 视觉
- 使用系统字体栈（-apple-system, BlinkMacSystemFont, Segoe UI, Roboto...）
- 配色方案: 蓝紫色主色调 (#4f46e5)
- 圆角卡片风格
- 细滚动条样式

---

## 验收标准

1. 目录 `/root/ai-note-search-extension/` 存在且包含所有必需文件
2. `manifest.json` 是有效的 Manifest V3 格式
3. 所有 `.js` 文件语法正确（可用 `node --check` 验证）
4. Git 仓库已初始化，初始提交已完成
5. `README.md` 包含中文使用说明
6. `README_EN.md` 包含英文使用说明

---

## 约束

- 不使用任何构建工具（无 npm, webpack, vite 等）
- 所有第三方库通过 CDN 引入
- 纯原生 JavaScript ES Modules，无需编译
- 不向外部服务器发送任何数据
