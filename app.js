// app.js - Main application logic for AI Note Search Extension
// Orchestrates DB, embedding model, search, and UI

import { addNote, updateNote, deleteNote, getAllNotes, getNote, getEmbedding, exportData, importData, getNoteCount } from "./lib/db.js";
import { initModel, getEmbedding as embed, isModelReady, getModelError, resetModel } from "./lib/embedding.js";
import { findTopK } from "./lib/vector.js";
import { buildIndex, search as fuseSearch, highlightMatches, isReady as fuseReady } from "./lib/fuseSearch.js";
import { getAllEmbeddings } from "./lib/db.js";

// ===== State =====
let searchMode = "loading"; // "semantic" | "keyword" | "loading"
let currentNoteId = null;
let allNotes = [];

// ===== DOM Elements =====
const els = {
  modeBadge: document.getElementById("mode-badge"),
  modelProgress: document.getElementById("model-progress"),
  modelProgressFill: document.getElementById("model-progress-fill"),
  modelProgressText: document.getElementById("model-progress-text"),
  searchInput: document.getElementById("search-input"),
  btnSearch: document.getElementById("btn-search"),
  searchModeDiv: document.getElementById("search-mode"),
  listTitle: document.getElementById("list-title"),
  notesList: document.getElementById("notes-list"),
  btnNewNote: document.getElementById("btn-new-note"),
  editorPlaceholder: document.getElementById("editor-placeholder"),
  editor: document.getElementById("editor"),
  editorTitle: document.getElementById("editor-title"),
  editorContent: document.getElementById("editor-content"),
  btnSave: document.getElementById("btn-save"),
  btnDelete: document.getElementById("btn-delete"),
  btnClose: document.getElementById("btn-close"),
  btnImport: document.getElementById("btn-import"),
  btnExport: document.getElementById("btn-export"),
  fileImport: document.getElementById("file-import"),
  noteCount: document.getElementById("note-count"),
  statusText: document.getElementById("status-text")
};

// ===== Initialization =====
async function init() {
  setStatus("正在初始化...");
  showModelProgress(true);

  // Load notes from DB
  try {
    allNotes = await getAllNotes();
    renderNotesList(allNotes);
    updateNoteCount();
  } catch (err) {
    console.error("Failed to load notes:", err);
    setStatus("数据库加载失败");
  }

  // Try to load embedding model
  try {
    setModeBadge("loading", "⏳ 加载 AI 模型...");
    await initModel((pct) => {
      els.modelProgressFill.style.width = `${pct}%`;
      els.modelProgressText.textContent = `正在加载 AI 模型: ${pct}%`;
    });

    searchMode = "semantic";
    setModeBadge("semantic", "🧠 语义搜索");
    setStatus("AI 模型加载完成，可以使用语义搜索");
    showModelProgress(false);

    // Generate embeddings for notes that don't have them
    await ensureEmbeddings();
  } catch (err) {
    console.warn("Embedding model failed, falling back to keyword search:", err);
    searchMode = "keyword";
    setModeBadge("keyword", "🔤 关键词搜索");
    setStatus("AI 模型加载失败，已切换到关键词搜索模式");
    showModelProgress(false);

    // Build Fuse.js index
    if (fuseReady()) {
      buildIndex(allNotes);
    }
  }

  // Bind events
  bindEvents();
  setStatus("就绪");
}

// ===== Event Binding =====
function bindEvents() {
  els.btnSearch.addEventListener("click", handleSearch);
  els.searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
  });
  els.btnNewNote.addEventListener("click", handleNewNote);
  els.btnSave.addEventListener("click", handleSave);
  els.btnDelete.addEventListener("click", handleDelete);
  els.btnClose.addEventListener("click", closeEditor);
  els.btnExport.addEventListener("click", handleExport);
  els.btnImport.addEventListener("click", () => els.fileImport.click());
  els.fileImport.addEventListener("change", handleImport);
}

// ===== Search =====
async function handleSearch() {
  const query = els.searchInput.value.trim();
  if (!query) {
    renderNotesList(allNotes);
    els.searchModeDiv.style.display = "none";
    els.listTitle.textContent = "📝 我的笔记";
    return;
  }

  setStatus("搜索中...");
  els.listTitle.textContent = "🔍 搜索结果";

  try {
    if (searchMode === "semantic") {
      await semanticSearch(query);
    } else {
      keywordSearch(query);
    }
  } catch (err) {
    console.error("Search failed:", err);
    setStatus("搜索失败: " + err.message);
    // Fallback to keyword search
    if (searchMode === "semantic") {
      keywordSearch(query);
    }
  }
}

async function semanticSearch(query) {
  els.searchModeDiv.style.display = "block";
  els.searchModeDiv.innerHTML = "🧠 <strong>语义搜索</strong> — 基于 AI 嵌入的语义相似度匹配";

  const queryVector = await embed(query);
  const embeddings = await getAllEmbeddings();

  if (embeddings.length === 0) {
    renderNotesList([]);
    setStatus("没有可用的嵌入向量，请先添加笔记");
    return;
  }

  const results = findTopK(queryVector, embeddings, 20);

  // Map results to notes with scores
  const noteMap = new Map(allNotes.map(n => [n.id, n]));
  const searchResults = results
    .filter(r => r.score > 0.1) // minimum similarity threshold
    .map(r => ({
      ...noteMap.get(r.noteId),
      score: r.score
    }))
    .filter(n => n.id !== undefined);

  renderNotesList(searchResults, true);
  setStatus(`找到 ${searchResults.length} 条相关笔记`);
}

function keywordSearch(query) {
  els.searchModeDiv.style.display = "block";
  els.searchModeDiv.innerHTML = "🔤 <strong>关键词搜索</strong> — 基于 Fuse.js 的模糊匹配" +
    (searchMode === "keyword" ? " <em>(AI 模型不可用，已降级)</em>" : "");

  if (!fuseReady()) {
    buildIndex(allNotes);
  }

  const results = fuseSearch(query);
  const searchResults = results.map(r => ({
    ...r.item,
    score: 1 - (r.score || 0), // Fuse score: 0=best, invert for display
    matches: r.matches
  }));

  renderNotesList(searchResults, true);
  setStatus(`找到 ${searchResults.length} 条相关笔记`);
}

// ===== Notes CRUD =====
function handleNewNote() {
  currentNoteId = null;
  els.editorTitle.value = "";
  els.editorContent.value = "";
  els.editorPlaceholder.style.display = "none";
  els.editor.style.display = "flex";
  els.btnDelete.style.display = "none";
  els.editorTitle.focus();
  setStatus("新建笔记");
}

async function handleSave() {
  const title = els.editorTitle.value.trim();
  const content = els.editorContent.value.trim();

  if (!title && !content) {
    alert("标题和内容不能都为空");
    return;
  }

  const noteData = { title: title || "无标题笔记", content };
  setStatus("保存中...");

  try {
    let vector = null;

    if (searchMode === "semantic" && isModelReady()) {
      const textToEmbed = `${noteData.title} ${noteData.content}`;
      vector = await embed(textToEmbed);
    }

    if (currentNoteId) {
      await updateNote(currentNoteId, noteData, vector);
      setStatus("笔记已更新");
    } else {
      const newId = await addNote(noteData, vector);
      currentNoteId = newId;
      setStatus("笔记已创建");
    }

    // Refresh notes list
    allNotes = await getAllNotes();

    // Rebuild Fuse index if in keyword mode
    if (searchMode === "keyword" && fuseReady()) {
      buildIndex(allNotes);
    }

    // If we have a search query, re-run search; otherwise show all
    const query = els.searchInput.value.trim();
    if (query) {
      handleSearch();
    } else {
      renderNotesList(allNotes);
    }

    updateNoteCount();
  } catch (err) {
    console.error("Save failed:", err);
    setStatus("保存失败: " + err.message);
    alert("保存失败: " + err.message);
  }
}

async function handleDelete() {
  if (!currentNoteId) return;

  if (!confirm("确定要删除这条笔记吗？此操作不可撤销。")) return;

  try {
    await deleteNote(currentNoteId);
    currentNoteId = null;
    closeEditor();

    allNotes = await getAllNotes();

    if (searchMode === "keyword" && fuseReady()) {
      buildIndex(allNotes);
    }

    renderNotesList(allNotes);
    updateNoteCount();
    setStatus("笔记已删除");
  } catch (err) {
    console.error("Delete failed:", err);
    setStatus("删除失败: " + err.message);
  }
}

async function openNote(id) {
  try {
    const note = await getNote(id);
    if (!note) return;

    currentNoteId = id;
    els.editorTitle.value = note.title;
    els.editorContent.value = note.content;
    els.editorPlaceholder.style.display = "none";
    els.editor.style.display = "flex";
    els.btnDelete.style.display = "inline-flex";

    // Highlight active item in list
    document.querySelectorAll(".note-item").forEach(el => {
      el.classList.toggle("active", parseInt(el.dataset.id) === id);
    });

    setStatus("编辑笔记");
  } catch (err) {
    console.error("Failed to open note:", err);
    setStatus("加载笔记失败");
  }
}

function closeEditor() {
  currentNoteId = null;
  els.editor.style.display = "none";
  els.editorPlaceholder.style.display = "flex";
  document.querySelectorAll(".note-item").forEach(el => el.classList.remove("active"));
}

// ===== Import / Export =====
async function handleExport() {
  try {
    setStatus("导出中...");
    const data = await exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatus(`导出完成: ${data.notes.length} 条笔记`);
  } catch (err) {
    console.error("Export failed:", err);
    setStatus("导出失败: " + err.message);
  }
}

async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!confirm("导入将清空现有所有数据，确定要继续吗？")) {
    e.target.value = "";
    return;
  }

  try {
    setStatus("导入中...");
    const text = await file.text();
    const data = JSON.parse(text);

    await importData(data);

    allNotes = await getAllNotes();

    if (searchMode === "keyword" && fuseReady()) {
      buildIndex(allNotes);
    }

    // If semantic mode, re-generate embeddings
    if (searchMode === "semantic" && isModelReady()) {
      await ensureEmbeddings();
    }

    renderNotesList(allNotes);
    updateNoteCount();
    closeEditor();
    setStatus(`导入完成: ${data.notes.length} 条笔记`);
  } catch (err) {
    console.error("Import failed:", err);
    setStatus("导入失败: " + err.message);
    alert("导入失败: " + err.message);
  }

  e.target.value = "";
}

// ===== Embeddings Management =====
async function ensureEmbeddings() {
  if (!isModelReady()) return;

  const embeddings = await getAllEmbeddings();
  const embeddedNoteIds = new Set(embeddings.map(e => e.noteId));
  const missingNotes = allNotes.filter(n => !embeddedNoteIds.has(n.id));

  if (missingNotes.length === 0) return;

  setStatus(`为 ${missingNotes.length} 条笔记生成嵌入向量...`);

  for (let i = 0; i < missingNotes.length; i++) {
    const note = missingNotes[i];
    try {
      const text = `${note.title} ${note.content}`;
      const vector = await embed(text);
      const { updateNote: updateFn } = await import("./lib/db.js");
      // Add embedding without updating the note itself
      const db = (await import("./lib/db.js")).default;
      await db.embeddings.add({ noteId: note.id, vector: Array.from(vector) });

      setStatus(`生成嵌入: ${i + 1}/${missingNotes.length}`);
    } catch (err) {
      console.warn(`Failed to embed note ${note.id}:`, err);
    }
  }

  setStatus("嵌入向量生成完成");
}

// ===== Rendering =====
function renderNotesList(notes, isSearch = false) {
  if (notes.length === 0) {
    els.notesList.innerHTML = `<div class="empty-state">${isSearch ? "没有找到匹配的笔记" : "暂无笔记，点击上方按钮创建"}</div>`;
    return;
  }

  const query = isSearch ? els.searchInput.value.trim() : "";

  els.notesList.innerHTML = notes.map(note => {
    const preview = note.content.length > 100 ? note.content.slice(0, 100) + "..." : note.content;
    const title = note.title || "无标题笔记";

    // Highlight matches if in keyword search mode with Fuse.js matches
    let displayTitle = escapeHtml(title);
    let displayPreview = escapeHtml(preview);

    if (isSearch && note.matches && searchMode === "keyword") {
      displayTitle = highlightMatches(title, note.matches, "title");
      displayPreview = highlightMatches(preview, note.matches, "content");
    } else if (isSearch && query && searchMode === "keyword") {
      // Simple highlight for keyword mode without Fuse matches
      displayTitle = simpleHighlight(displayTitle, query);
      displayPreview = simpleHighlight(displayPreview, query);
    }

    const scoreHtml = note.score !== undefined
      ? `<span class="note-item-score">相关度: ${(note.score * 100).toFixed(0)}%</span>`
      : "";

    const date = note.updatedAt ? new Date(note.updatedAt).toLocaleDateString("zh-CN") : "";

    return `
      <div class="note-item ${note.id === currentNoteId ? 'active' : ''}" data-id="${note.id}">
        <div class="note-item-title">${displayTitle}</div>
        <div class="note-item-preview">${displayPreview}</div>
        <div class="note-item-meta">
          <span>${date}</span>
          ${scoreHtml}
        </div>
      </div>
    `;
  }).join("");

  // Bind click events
  els.notesList.querySelectorAll(".note-item").forEach(el => {
    el.addEventListener("click", () => openNote(parseInt(el.dataset.id)));
  });
}

/**
 * Simple highlight for search query in text
 * @param {string} html - already escaped HTML
 * @param {string} query - search query
 * @returns {string} HTML with <mark> tags
 */
function simpleHighlight(html, query) {
  if (!query || query.length < 2) return html;

  // Split query into words, filter short ones
  const words = query.split(/\s+/).filter(w => w.length >= 2);
  if (words.length === 0) return html;

  for (const word of words) {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedWord})`, "gi");
    html = html.replace(regex, "<mark>$1</mark>");
  }

  return html;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ===== UI Helpers =====
function setModeBadge(mode, text) {
  els.modeBadge.className = `mode-badge ${mode}`;
  els.modeBadge.textContent = text;
}

function showModelProgress(show) {
  els.modelProgress.style.display = show ? "block" : "none";
}

function setStatus(text) {
  els.statusText.textContent = text;
}

function updateNoteCount() {
  els.noteCount.textContent = `笔记: ${allNotes.length}`;
}

// ===== Start =====
init();
