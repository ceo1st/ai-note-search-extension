// lib/fuseSearch.js - Keyword search fallback using Fuse.js
// Loaded via CDN: https://cdn.jsdelivr.net/npm/fuse.js@7.0.0
// Used when embedding model fails to load (WebGPU not supported, network error, etc.)

let fuseInstance = null;

/**
 * Build or rebuild the Fuse.js search index
 * @param {Array<Object>} notes - array of note objects with { id, title, content }
 */
export function buildIndex(notes) {
  // Dynamically load Fuse.js from CDN if not already loaded
  if (typeof window.Fuse === "undefined") {
    console.warn("Fuse.js not loaded yet, building index deferred");
    return;
  }

  fuseInstance = new window.Fuse(notes, {
    keys: [
      { name: "title", weight: 0.4 },
      { name: "content", weight: 0.6 }
    ],
    threshold: 0.4,         // 0.0 = exact match, 1.0 = match everything
    distance: 200,           // how close the match must be to the fuzzy location
    minMatchCharLength: 2,   // minimum character length of the pattern
    includeScore: true,      // include score in results (0 = perfect, 1 = worst)
    includeMatches: true,    // include match indices for highlighting
    ignoreLocation: true     // search the entire string, not just the start
  });
}

/**
 * Perform a keyword search
 * @param {string} query - search query
 * @returns {Array<{item: Object, score: number, matches: Array}>} results sorted by score
 */
export function search(query) {
  if (!fuseInstance) {
    console.warn("Fuse.js index not built");
    return [];
  }

  if (!query || query.trim().length < 2) {
    return [];
  }

  return fuseInstance.search(query.trim());
}

/**
 * Highlight matched text segments
 * @param {string} text - original text
 * @param {Array} matches - Fuse.js match objects for this item
 * @param {string} key - which field to highlight ("title" or "content")
 * @returns {string} HTML with <mark> tags around matches
 */
export function highlightMatches(text, matches, key) {
  if (!matches || !text) return escapeHtml(text || "");

  const fieldMatches = matches.filter(m => m.key === key);
  if (fieldMatches.length === 0) return escapeHtml(text);

  // Collect all match indices
  const indices = [];
  for (const match of fieldMatches) {
    for (const [start, end] of match.indices) {
      indices.push([start, end]);
    }
  }

  // Sort and merge overlapping indices
  indices.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of indices) {
    if (merged.length > 0 && start <= merged[merged.length - 1][1] + 1) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
    } else {
      merged.push([start, end]);
    }
  }

  // Build highlighted string
  let result = "";
  let lastEnd = 0;
  for (const [start, end] of merged) {
    result += escapeHtml(text.slice(lastEnd, start));
    result += `<mark>${escapeHtml(text.slice(start, end + 1))}</mark>`;
    lastEnd = end + 1;
  }
  result += escapeHtml(text.slice(lastEnd));

  return result;
}

/**
 * Escape HTML special characters
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Check if Fuse.js is available
 * @returns {boolean}
 */
export function isReady() {
  return typeof window.Fuse !== "undefined";
}

/**
 * Clear the search index
 */
export function clearIndex() {
  fuseInstance = null;
}
