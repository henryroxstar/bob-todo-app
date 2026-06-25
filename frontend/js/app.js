/**
 * app.js — UI logic for the Todo application.
 *
 * Responsibilities:
 *  - Render the todo list from API data
 *  - Handle form submission (create)
 *  - Handle per-item actions (toggle complete, delete)
 *  - Client-side filter tabs (All / Active / Completed)
 *  - Show/hide error banner
 *
 * Architecture note:
 *  All network calls go through api.js. This file only touches the DOM
 *  and calls the api.js functions — it never uses fetch() directly.
 *  This separation makes both files easier to test and reason about.
 */

// ── State ────────────────────────────────────────────────────────────────────

/**
 * In-memory cache of todos fetched from the server.
 * The UI always renders from this array, never re-fetching on every render.
 * @type {object[]}
 */
let todos = [];

/**
 * Active filter: "all" | "active" | "completed"
 * @type {string}
 */
let currentFilter = "all";

// ── DOM references ────────────────────────────────────────────────────────────

const form          = document.getElementById("todo-form");
const titleInput    = document.getElementById("todo-title");
const descInput     = document.getElementById("todo-description");
const todoList      = document.getElementById("todo-list");
const emptyState    = document.getElementById("empty-state");
const errorBanner   = document.getElementById("error-banner");
const remainingCount = document.getElementById("remaining-count");

// ── Error handling ────────────────────────────────────────────────────────────

/**
 * Display an error message at the top of the page.
 *
 * Why we show errors here instead of alert():
 *  - alert() blocks the main thread and is jarring for users.
 *  - An inline banner is dismissible and doesn't interrupt flow.
 *
 * @param {string} message
 */
function showError(message) {
  errorBanner.textContent = message;
  errorBanner.classList.remove("hidden");
  // Auto-hide after 5 seconds so the banner doesn't clutter the UI
  setTimeout(() => errorBanner.classList.add("hidden"), 5000);
}

function hideError() {
  errorBanner.classList.add("hidden");
}

// ── Rendering ─────────────────────────────────────────────────────────────────

/**
 * Return the subset of todos that match the current filter.
 * @returns {object[]}
 */
function filteredTodos() {
  if (currentFilter === "active")    return todos.filter(t => !t.completed);
  if (currentFilter === "completed") return todos.filter(t => t.completed);
  return todos;
}

/**
 * Re-render the todo list from the in-memory `todos` array.
 *
 * We rebuild the list on every change rather than doing surgical DOM
 * updates. For a todo list this is fast enough and keeps the code simple.
 */
function render() {
  const visible = filteredTodos();
  todoList.innerHTML = "";

  if (visible.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
    visible.forEach(todo => todoList.appendChild(createTodoElement(todo)));
  }

  // Footer count — only counts truly incomplete todos regardless of filter
  const activeCount = todos.filter(t => !t.completed).length;
  remainingCount.textContent =
    activeCount === 1 ? "1 item left" : `${activeCount} items left`;
}

/**
 * Build a <li> element for a single todo.
 *
 * @param {object} todo - Todo data from the API
 * @returns {HTMLLIElement}
 */
function createTodoElement(todo) {
  const li = document.createElement("li");
  li.className = `todo-item${todo.completed ? " completed" : ""}`;
  li.dataset.id = todo.id;

  // Checkbox mirrors the completed state and triggers a toggle
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.setAttribute("aria-label", `Mark "${todo.title}" as ${todo.completed ? "incomplete" : "complete"}`);
  checkbox.addEventListener("change", () => handleToggle(todo.id));

  // Text content
  const body = document.createElement("div");
  body.className = "todo-body";

  const titleEl = document.createElement("span");
  titleEl.className = "todo-title";
  titleEl.textContent = todo.title;
  body.appendChild(titleEl);

  if (todo.description) {
    const descEl = document.createElement("p");
    descEl.className = "todo-description";
    descEl.textContent = todo.description;
    body.appendChild(descEl);
  }

  // Action buttons
  const actions = document.createElement("div");
  actions.className = "todo-actions";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn-danger btn-sm";
  deleteBtn.textContent = "Delete";
  deleteBtn.setAttribute("aria-label", `Delete "${todo.title}"`);
  deleteBtn.addEventListener("click", () => handleDelete(todo.id));

  actions.appendChild(deleteBtn);

  li.append(checkbox, body, actions);
  return li;
}

// ── API action handlers ───────────────────────────────────────────────────────

/**
 * Load all todos from the API and re-render.
 *
 * This is called once on page load, and after any mutation (create /
 * toggle / delete) to keep the UI in sync with the server.
 *
 * Why async/await instead of .then()/.catch():
 *  - async/await reads top-to-bottom like synchronous code.
 *  - Error handling with try/catch is cleaner than chained .catch().
 *  - Easier to add sequential await calls later without nesting.
 */
async function loadTodos() {
  try {
    todos = await getTodos();  // getTodos() is defined in api.js
    render();
  } catch (err) {
    showError(`Could not load todos: ${err.message}`);
  }
}

/**
 * Handle the "Add" form submission.
 *
 * We call event.preventDefault() to stop the browser's default form
 * behaviour (page reload), then POST to the API and refresh the list.
 *
 * @param {SubmitEvent} event
 */
async function handleCreate(event) {
  event.preventDefault();
  hideError();

  const title = titleInput.value.trim();
  if (!title) {
    titleInput.focus();
    return;
  }

  try {
    const newTodo = await createTodo(title, descInput.value.trim());
    todos.unshift(newTodo);  // Prepend to match backend's DESC ordering
    titleInput.value = "";
    descInput.value  = "";
    render();
  } catch (err) {
    showError(`Could not create todo: ${err.message}`);
  }
}

/**
 * Toggle a todo's completed state via the API.
 * @param {number} id
 */
async function handleToggle(id) {
  try {
    const updated = await toggleTodo(id);  // toggleTodo() is in api.js
    todos = todos.map(t => t.id === id ? updated : t);
    render();
  } catch (err) {
    showError(`Could not update todo: ${err.message}`);
    render(); // Re-render to restore checkbox to actual state
  }
}

/**
 * Delete a todo via the API.
 * @param {number} id
 */
async function handleDelete(id) {
  try {
    await deleteTodo(id);  // deleteTodo() is in api.js
    todos = todos.filter(t => t.id !== id);
    render();
  } catch (err) {
    showError(`Could not delete todo: ${err.message}`);
  }
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────

form.addEventListener("submit", handleCreate);

// Load todos as soon as the page is ready
loadTodos();
