// lib/db.js - Dexie.js wrapper for IndexedDB
// Stores notes and embeddings in two separate tables

import "https://unpkg.com/dexie@3.2.7/dist/dexie.js";

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
 * Export all data (notes + embeddings) as JSON
 * @returns {Promise<Object>}
 */
export async function exportData() {
  const notes = await db.notes.toArray();
  const embeddings = await db.embeddings.toArray();
  return { notes, embeddings };
}

/**
 * Import data from JSON, replacing all existing data
 * @param {Object} data - { notes: Array, embeddings: Array }
 * @throws {Error} if data format is invalid
 */
export async function importData(data) {
  // Validate format
  if (!data || !Array.isArray(data.notes) || !Array.isArray(data.embeddings)) {
    throw new Error("导入数据格式无效：需要包含 notes 和 embeddings 数组");
  }

  // Validate notes structure
  for (const note of data.notes) {
    if (!note.id || !note.title || !note.content) {
      throw new Error("导入数据中笔记格式无效：每条笔记需要 id, title, content 字段");
    }
  }

  // Clear existing data
  await db.notes.clear();
  await db.embeddings.clear();

  // Import new data
  await db.notes.bulkAdd(data.notes);
  await db.embeddings.bulkAdd(data.embeddings);
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

export default db;
