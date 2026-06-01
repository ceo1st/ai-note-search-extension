// lib/vector.js - Cosine similarity calculation
// Pure client-side vector operations

/**
 * Calculate cosine similarity between two vectors
 * @param {Float32Array|number[]} a - first vector
 * @param {Float32Array|number[]} b - second vector
 * @returns {number} similarity score between -1 and 1
 */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Vector dimensions mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);

  // Avoid division by zero
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Find top-K most similar vectors to a query vector
 * @param {Float32Array|number[]} queryVector - the query embedding
 * @param {Array<{id: number, noteId: number, vector: number[]}>} embeddings - stored embeddings
 * @param {number} topK - number of results to return (default: 10)
 * @returns {Array<{noteId: number, score: number}>} sorted by score descending
 */
export function findTopK(queryVector, embeddings, topK = 10) {
  const scored = embeddings.map(emb => ({
    noteId: emb.noteId,
    score: cosineSimilarity(queryVector, emb.vector)
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}
