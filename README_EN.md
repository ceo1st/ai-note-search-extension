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

### Chrome / Edge

1. Download or clone this repository
2. Navigate to `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project folder
5. Click the extension icon in the toolbar to open

### Firefox

1. Download or clone this repository
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file

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

## 🏗️ Architecture

```
ai-note-search-extension/
├── manifest.json          # Manifest V3 configuration
├── background.js          # Service Worker (icon click handler)
├── app.html               # Main UI HTML
├── app.js                 # Application logic
├── styles.css             # Stylesheet
├── lib/
│   ├── db.js              # Dexie.js database wrapper
│   ├── vector.js          # Cosine similarity calculation
│   ├── embedding.js       # Transformers.js embedding model
│   └── fuseSearch.js      # Fuse.js keyword search
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md              # Chinese documentation
├── README_EN.md           # English documentation
└── PRD.md                 # Product Requirements Document
```

### Core Dependencies (CDN)

| Library | Purpose | CDN |
|---|---|---|
| Dexie.js 3.2.7 | IndexedDB wrapper | unpkg.com |
| Transformers.js 3.0.0 | AI embedding model | cdn.jsdelivr.net |
| Fuse.js 7.0.0 | Keyword fuzzy search | cdn.jsdelivr.net |

### Search Flow

1. User enters a query
2. If AI model is available (semantic mode):
   - Convert query to embedding vector
   - Compute cosine similarity against all note embeddings
   - Return Top-K most similar results
3. If AI model is unavailable (keyword mode):
   - Use Fuse.js for fuzzy keyword matching
   - Show degradation notice in the UI
4. Render results with highlighted matches

## ⚠️ Notes

- First use requires downloading the AI model (~23MB) — ensure a network connection
- The AI model requires browser support for WebGPU or WASM
- All data is stored locally in the browser — clearing browser data will delete notes. Export backups regularly
- Large note collections (>1000) may experience slight search delays

## 📄 License

MIT License
