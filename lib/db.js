// lib/db.js - Dexie.js wrapper for IndexedDB
// Uses global Dexie loaded from vendor/dexie.min.js via <script> tag

const Dexie = window.Dexie;

const db = new Dexie("AINoteSearch");

// Define schema: notes table for content, embeddings table for vectors
db.version(1).stores({
  notes: "++id, title, content, createdAt, updatedAt",
  embeddings: "++id, noteId, vector"
});

/**
 * Add a new note with optional embedding
 * @param {Object} note - { title: string, content: string }
 * @param {Float32Array|null} vector - embedding vector or null
 * @returns {Promise<number>} - the new note's id
 */
export async function addNote(note, vector = null) {
  const now = new Date().toISOString();
  const noteData = {
    title: note.title,
    content: note.content,
    createdAt: now,
    updatedAt: now
  };

  const noteId = await db.notes.add(noteData);

  if (vector) {
    await db.embeddings.add({ noteId, vector: Array.from(vector) });
  }

  return noteId;
}

/**
 * Update an existing note and optionally its embedding
 * @param {number} id - note id
 * @param {Object} changes - partial note object
 * @param {Float32Array|null} vector - new embedding vector or null to skip
 */
export async function updateNote(id, changes, vector = null) {
  changes.updatedAt = new Date().toISOString();
  await db.notes.update(id, changes);

  if (vector) {
    // Remove old embedding for this note, add new one
    await db.embeddings.where("noteId").equals(id).delete();
    await db.embeddings.add({ noteId: id, vector: Array.from(vector) });
  }
}

/**
 * Delete a note and its embedding
 * @param {number} id - note id
 */
export async function deleteNote(id) {
  await db.notes.delete(id);
  await db.embeddings.where("noteId").equals(id).delete();
}

/**
 * Get all notes
 * @returns {Promise<Array>}
 */
export async function getAllNotes() {
  return await db.notes.orderBy("updatedAt").reverse().toArray();
}

/**
 * Get a single note by id
 * @param {number} id
 * @returns {Promise<Object|undefined>}
 */
export async function getNote(id) {
  return await db.notes.get(id);
}

/**
 * Get all embeddings
 * @returns {Promise<Array>}
 */
export async function getAllEmbeddings() {
  return await db.embeddings.toArray();
}

/**
 * Get embedding for a specific note
 * @param {number} noteId
 * @returns {Promise<Object|undefined>}
 */
export async function getEmbedding(noteId) {
  return await db.embeddings.where("noteId").equals(noteId).first();
}

/**
 * Delete embedding for a specific note (used when saving in degraded mode)
 * @param {number} noteId
 */
export async function deleteEmbeddingForNote(noteId) {
  await db.embeddings.where("noteId").equals(noteId).delete();
}

/**
 * Export all data (notes + embeddings) as JSON
 * @returns {Promise<Object>}
 */
export async function exportData() {
  const notes = await db.notes.toArray();
  const embeddings = await db.embeddings.toArray();
  return { notes, embeddings };
}

/**
 * Validate import data structure
 * @param {Object} data - raw parsed JSON
 * @throws {Error} if validation fails
 */
function validateImportData(data) {
  if (!data || typeof data !== "object") {
    throw new Error("导入数据格式无效：需要 JSON 对象");
  }
  if (!Array.isArray(data.notes)) {
    throw new Error("导入数据格式无效：缺少 notes 数组");
  }
  if (!Array.isArray(data.embeddings)) {
    throw new Error("导入数据格式无效：缺少 embeddings 数组");
  }

  for (let i = 0; i < data.notes.length; i++) {
    const note = data.notes[i];
    if (!note.id || !note.title || !note.content) {
      throw new Error(`笔记 #${i + 1} 格式无效：需要 id, title, content 字段`);
    }
  }

  for (let i = 0; i < data.embeddings.length; i++) {
    const emb = data.embeddings[i];
    if (!emb.noteId || !emb.vector) {
      throw new Error(`嵌入 #${i + 1} 格式无效：需要 noteId, vector 字段`);
    }
  }
}

/**
 * Import data from JSON, replacing all existing data
 * Uses Dexie transaction for atomicity - rolls back on failure
 * @param {Object} data - { notes: Array, embeddings: Array }
 * @throws {Error} if data format is invalid
 * @returns {Object} - { noteCount, embeddingCount }
 */
export async function importData(data) {
  validateImportData(data);

  // Use transaction for atomic clear + import
  await db.transaction("rw", db.notes, db.embeddings, async () => {
    await db.notes.clear();
    await db.embeddings.clear();
    await db.notes.bulkAdd(data.notes);
    await db.embeddings.bulkAdd(data.embeddings);
  });

  return { noteCount: data.notes.length, embeddingCount: data.embeddings.length };
}

/**
 * Clear all data
 */
export async function clearAll() {
  await db.notes.clear();
  await db.embeddings.clear();
}

/**
 * Get note count
 * @returns {Promise<number>}
 */
export async function getNoteCount() {
  return await db.notes.count();
}

/**
 * Get the raw Dexie instance (for advanced operations)
 */
export function getDb() {
  return db;
}

export default db;
