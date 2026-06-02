// lib/embedding.js - Text embedding using Transformers.js
// Model: Xenova/all-MiniLM-L6-v2 (384-dim, ~23MB, runs in browser)
// Uses global TransformersAPI loaded from vendor/transformers.bundle.js

const { pipeline, env } = window.TransformersAPI;

// Configure: allow remote model download (first use downloads from HuggingFace)
env.allowLocalModels = false;

let embedder = null;
let modelReady = false;
let modelError = null;

/**
 * Initialize the embedding model
 * @param {function} onProgress - callback(progress: number 0-100) for loading status
 * @returns {Promise<boolean>} true if model loaded successfully
 */
export async function initModel(onProgress = null) {
  if (modelReady) return true;
  if (modelError) throw modelError;

  try {
    // Create feature-extraction pipeline with progress tracking
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      progress_callback: (progress) => {
        if (onProgress && progress.status === "progress") {
          const pct = Math.round(progress.progress || 0);
          onProgress(pct);
        } else if (onProgress && progress.status === "done") {
          onProgress(100);
        } else if (onProgress && progress.status === "initiate") {
          onProgress(0);
        }
      }
    });

    modelReady = true;
    return true;
  } catch (err) {
    modelError = err;
    console.error("Failed to load embedding model:", err);
    throw err;
  }
}

/**
 * Generate embedding vector for a text string
 * @param {string} text - input text
 * @returns {Promise<Float32Array>} embedding vector (384 dimensions)
 * @throws {Error} if model is not initialized
 */
export async function getEmbedding(text) {
  if (!modelReady || !embedder) {
    throw new Error("Embedding model not initialized. Call initModel() first.");
  }

  try {
    const output = await embedder(text, { pooling: "mean", normalize: true });
    return output.data;
  } catch (err) {
    console.error("Embedding generation failed:", err);
    throw new Error("Embedding generation failed: " + err.message);
  }
}

/**
 * Check if model is ready
 * @returns {boolean}
 */
export function isModelReady() {
  return modelReady;
}

/**
 * Get model error if initialization failed
 * @returns {Error|null}
 */
export function getModelError() {
  return modelError;
}

/**
 * Reset model state (for retry)
 */
export function resetModel() {
  embedder = null;
  modelReady = false;
  modelError = null;
}
