/**
 * api.js — Thin fetch wrappers for the Flask todo API.
 *
 * Every function returns a Promise that resolves to parsed JSON
 * (or undefined for 204 No Content). On a non-2xx response the
 * promise rejects with an Error whose message is the server's
 * "error" field (or a generic HTTP status string).
 */

const API_BASE = "http://127.0.0.1:5000/api/todos";

/**
 * Internal helper: execute a fetch, check the response status,
 * and return parsed JSON (or undefined for 204).
 *
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<object|undefined>}
 */
async function _request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (response.status === 204) return undefined;

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

/**
 * GET /api/todos — retrieve all todos.
 * @returns {Promise<object[]>}
 */
function getTodos() {
  return _request(API_BASE);
}

/**
 * POST /api/todos — create a new todo.
 * @param {string} title
 * @param {string} [description]
 * @returns {Promise<object>}
 */
function createTodo(title, description = "") {
  return _request(API_BASE, {
    method: "POST",
    body: JSON.stringify({ title, description }),
  });
}

/**
 * PUT /api/todos/:id — update fields on an existing todo.
 * @param {number} id
 * @param {Partial<{title:string, description:string, completed:boolean}>} fields
 * @returns {Promise<object>}
 */
function updateTodo(id, fields) {
  return _request(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(fields),
  });
}

/**
 * PATCH /api/todos/:id/toggle — flip the completed flag.
 * @param {number} id
 * @returns {Promise<object>}
 */
function toggleTodo(id) {
  return _request(`${API_BASE}/${id}/toggle`, { method: "PATCH" });
}

/**
 * DELETE /api/todos/:id — remove a todo permanently.
 * @param {number} id
 * @returns {Promise<undefined>}
 */
function deleteTodo(id) {
  return _request(`${API_BASE}/${id}`, { method: "DELETE" });
}
