/**
 * app.js — UI logic + spectacle for the Todo application.
 *
 * Responsibilities:
 *  - Render the todo list from API data with staggered animations
 *  - Handle form submission, toggle, delete with fluid transitions
 *  - Particle canvas background (mouse-reactive dot grid)
 *  - Cursor glow follower
 *  - Button ripple on submit
 *  - Particle burst on task complete
 *  - Animated counter on remaining count
 *  - Live progress bar
 *  - Confetti + celebration overlay when all tasks are done
 */

// ── State ────────────────────────────────────────────────────────────────────

/** @type {object[]} */
let todos = [];

/** @type {string} "all" | "active" | "completed" */
let currentFilter = "all";

// ── DOM references ────────────────────────────────────────────────────────────

const form            = document.getElementById("todo-form");
const titleInput      = document.getElementById("todo-title");
const descInput       = document.getElementById("todo-description");
const todoList        = document.getElementById("todo-list");
const emptyState      = document.getElementById("empty-state");
const errorBanner     = document.getElementById("error-banner");
const errorText       = errorBanner.querySelector(".error-text");
const remainingCount  = document.getElementById("remaining-count");
const progressFill    = document.getElementById("progress-fill");
const progressLabel   = document.getElementById("progress-label");
const progressShell   = document.getElementById("progress-shell");
const celebrationEl   = document.getElementById("celebration");
const confettiCanvas  = document.getElementById("confetti-canvas");
const cursorGlow      = document.getElementById("cursor-glow");
const btnAdd          = document.querySelector(".btn-add");
const btnRipple       = document.querySelector(".btn-ripple");

// ── Error handling ────────────────────────────────────────────────────────────

function showError(message) {
  errorText.textContent = message;
  errorBanner.classList.remove("hidden");
  setTimeout(() => errorBanner.classList.add("hidden"), 5000);
}
function hideError() { errorBanner.classList.add("hidden"); }

// ── Progress bar ──────────────────────────────────────────────────────────────

let prevPercent = 0;

function updateProgress() {
  const total     = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const pct       = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressFill.style.width = pct + "%";
  animateCounter(progressLabel, prevPercent, pct, 500, v => v + "%");
  prevPercent = pct;

  if (pct === 100 && total > 0) {
    progressShell.classList.add("is-complete");
  } else {
    progressShell.classList.remove("is-complete");
  }
}

// ── Animated counter ──────────────────────────────────────────────────────────

/**
 * Smoothly tween a displayed number from `from` to `to`.
 * @param {HTMLElement} el
 * @param {number} from
 * @param {number} to
 * @param {number} duration ms
 * @param {function} format  maps number → string
 */
function animateCounter(el, from, to, duration, format = v => String(v)) {
  if (from === to) { el.textContent = format(to); return; }
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    // ease-out quad
    const eased = 1 - (1 - t) * (1 - t);
    const value = Math.round(from + (to - from) * eased);
    el.textContent = format(value);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

let prevActive = 0;

function updateRemainingCount() {
  const active = todos.filter(t => !t.completed).length;
  animateCounter(
    remainingCount,
    prevActive,
    active,
    400,
    v => v === 1 ? "1 item left" : `${v} items left`
  );
  prevActive = active;
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function filteredTodos() {
  if (currentFilter === "active")    return todos.filter(t => !t.completed);
  if (currentFilter === "completed") return todos.filter(t => t.completed);
  return todos;
}

function render() {
  const visible = filteredTodos();
  todoList.innerHTML = "";

  if (visible.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
    visible.forEach((todo, i) => {
      const el = createTodoElement(todo);
      todoList.appendChild(el);
      requestAnimationFrame(() => {
        setTimeout(() => el.classList.add("is-visible"), i * 45);
      });
    });
  }

  updateRemainingCount();
  updateProgress();
  checkCelebration();
}

// ── Celebration ───────────────────────────────────────────────────────────────

let celebrationShown = false;

function checkCelebration() {
  const total     = todos.length;
  const completed = todos.filter(t => t.completed).length;

  if (total > 0 && completed === total && !celebrationShown) {
    celebrationShown = true;
    showCelebration();
  } else if (completed < total) {
    celebrationShown = false;
  }
}

function showCelebration() {
  celebrationEl.classList.remove("hidden");
  launchConfetti();
  // Auto-hide after 3.5s
  setTimeout(() => {
    celebrationEl.style.transition = "opacity 0.6s";
    celebrationEl.style.opacity = "0";
    setTimeout(() => {
      celebrationEl.classList.add("hidden");
      celebrationEl.style.opacity = "";
      celebrationEl.style.transition = "";
    }, 600);
  }, 3500);
}

// ── Confetti ──────────────────────────────────────────────────────────────────

function launchConfetti() {
  const ctx    = confettiCanvas.getContext("2d");
  confettiCanvas.width  = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const COLORS = ["#7c6cfc", "#3ecfcf", "#f06bff", "#22d67a", "#ffd166", "#ff6b9d"];
  const pieces = Array.from({ length: 120 }, () => ({
    x:    Math.random() * confettiCanvas.width,
    y:    Math.random() * -confettiCanvas.height,
    w:    6 + Math.random() * 8,
    h:    10 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    speed: 2.5 + Math.random() * 4,
    drift: (Math.random() - 0.5) * 2,
    spin:  (Math.random() - 0.5) * 0.15,
    angle: Math.random() * Math.PI * 2,
  }));

  let frame;
  const endAt = performance.now() + 3000;

  function draw(now) {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    for (const p of pieces) {
      p.y     += p.speed;
      p.x     += p.drift;
      p.angle += p.spin;
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, Math.max(0, (endAt - now) / 800));
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (now < endAt) {
      frame = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }
  frame = requestAnimationFrame(draw);
}

// ── Particle burst on checkbox complete ───────────────────────────────────────

function spawnBurst(checkboxEl) {
  const rect   = checkboxEl.getBoundingClientRect();
  const cx     = rect.left + rect.width  / 2;
  const cy     = rect.top  + rect.height / 2;
  const COLORS = ["#7c6cfc", "#3ecfcf", "#22d67a", "#f06bff", "#ffd166"];
  const N      = 10;

  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2;
    const dist  = 28 + Math.random() * 24;
    const dx    = Math.cos(angle) * dist;
    const dy    = Math.sin(angle) * dist;

    const dot = document.createElement("div");
    dot.className = "burst-particle";
    dot.style.left  = cx + "px";
    dot.style.top   = cy + "px";
    dot.style.background = COLORS[i % COLORS.length];
    dot.style.setProperty("--burst-end", `translate(${dx}px, ${dy}px)`);
    dot.style.width  = (4 + Math.random() * 5) + "px";
    dot.style.height = dot.style.width;
    document.body.appendChild(dot);

    dot.addEventListener("animationend", () => dot.remove());
  }
}

// ── Button ripple ─────────────────────────────────────────────────────────────

btnAdd.addEventListener("click", (e) => {
  const rect = btnAdd.getBoundingClientRect();
  btnRipple.style.left = (e.clientX - rect.left) + "px";
  btnRipple.style.top  = (e.clientY - rect.top)  + "px";
  btnRipple.classList.remove("ripple-active");
  // Force reflow so re-adding the class triggers the animation
  void btnRipple.offsetWidth;
  btnRipple.classList.add("ripple-active");
});

// ── Cursor glow ───────────────────────────────────────────────────────────────

let glowVisible = false;
document.addEventListener("mousemove", (e) => {
  cursorGlow.style.left = e.clientX + "px";
  cursorGlow.style.top  = e.clientY + "px";
  if (!glowVisible) {
    cursorGlow.style.opacity = "1";
    glowVisible = true;
  }
});
document.addEventListener("mouseleave", () => {
  cursorGlow.style.opacity = "0";
  glowVisible = false;
});

// ── Particle canvas ───────────────────────────────────────────────────────────

(function initParticles() {
  const canvas = document.getElementById("particle-canvas");
  const ctx    = canvas.getContext("2d");
  let W, H, particles, mouse = { x: -9999, y: -9999 };

  const PARTICLE_COUNT = 70;
  const CONNECT_DIST   = 130;
  const MOUSE_REPEL    = 100;
  const SPEED          = 0.28;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkParticle() {
    return {
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * SPEED * 2,
      vy: (Math.random() - 0.5) * SPEED * 2,
      r:  1 + Math.random() * 1.2,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, mkParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Move
    for (const p of particles) {
      // Gentle mouse repulsion
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d  = Math.hypot(dx, dy);
      if (d < MOUSE_REPEL) {
        const force = (MOUSE_REPEL - d) / MOUSE_REPEL * 0.6;
        p.vx += (dx / d) * force;
        p.vy += (dy / d) * force;
      }

      // Dampen velocity
      p.vx *= 0.995;
      p.vy *= 0.995;

      // Clamp speed
      const spd = Math.hypot(p.vx, p.vy);
      if (spd > SPEED * 3) {
        p.vx = (p.vx / spd) * SPEED * 3;
        p.vy = (p.vy / spd) * SPEED * 3;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Wrap
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
    }

    // Draw dots
    ctx.fillStyle = "rgba(124, 108, 252, 0.6)";
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a  = particles[i];
        const b  = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d  = Math.hypot(dx, dy);
        if (d < CONNECT_DIST) {
          const alpha = (1 - d / CONNECT_DIST) * 0.25;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(124, 108, 252, ${alpha})`;
          ctx.lineWidth   = 0.8;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", () => {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, mkParticle);
  });

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  init();
  draw();
})();

// ── Todo element builder ──────────────────────────────────────────────────────

function createTodoElement(todo) {
  const li = document.createElement("li");
  li.className = `todo-item${todo.completed ? " completed" : ""}`;
  li.dataset.id = todo.id;

  const inner = document.createElement("div");
  inner.className = "todo-inner";

  const checkWrap = document.createElement("div");
  checkWrap.className = "todo-checkbox-wrap";

  const checkbox = document.createElement("input");
  checkbox.type    = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.setAttribute(
    "aria-label",
    `Mark "${todo.title}" as ${todo.completed ? "incomplete" : "complete"}`
  );
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) spawnBurst(checkbox);
    handleToggle(todo.id);
  });
  checkWrap.appendChild(checkbox);

  const body     = document.createElement("div");
  body.className = "todo-body";

  const titleEl     = document.createElement("span");
  titleEl.className = "todo-title";
  titleEl.textContent = todo.title;
  body.appendChild(titleEl);

  if (todo.description) {
    const descEl     = document.createElement("span");
    descEl.className = "todo-description";
    descEl.textContent = todo.description;
    body.appendChild(descEl);
  }

  const actions     = document.createElement("div");
  actions.className = "todo-actions";

  const deleteBtn     = document.createElement("button");
  deleteBtn.className = "btn-delete";
  deleteBtn.setAttribute("aria-label", `Delete "${todo.title}"`);
  deleteBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
  deleteBtn.addEventListener("click", () => handleDelete(todo.id, li));
  actions.appendChild(deleteBtn);

  inner.append(checkWrap, body, actions);
  li.appendChild(inner);
  return li;
}

// ── API action handlers ───────────────────────────────────────────────────────

async function loadTodos() {
  try {
    todos = await getTodos();
    render();
  } catch (err) {
    showError(`Could not load tasks: ${err.message}`);
  }
}

async function handleCreate(event) {
  event.preventDefault();
  hideError();

  const title = titleInput.value.trim();
  if (!title) {
    titleInput.focus();
    titleInput.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-7px)" },
        { transform: "translateX(7px)" },
        { transform: "translateX(-4px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 320, easing: "ease-out" }
    );
    return;
  }

  try {
    const newTodo = await createTodo(title, descInput.value.trim());
    todos.unshift(newTodo);
    titleInput.value = "";
    descInput.value  = "";
    render();
  } catch (err) {
    showError(`Could not create task: ${err.message}`);
  }
}

async function handleToggle(id) {
  try {
    const updated = await toggleTodo(id);
    todos = todos.map(t => t.id === id ? updated : t);
    render();
  } catch (err) {
    showError(`Could not update task: ${err.message}`);
    render();
  }
}

async function handleDelete(id, el) {
  el.classList.add("is-removing");
  await new Promise(r => setTimeout(r, 320));
  try {
    await deleteTodo(id);
    todos = todos.filter(t => t.id !== id);
    render();
  } catch (err) {
    el.classList.remove("is-removing");
    showError(`Could not delete task: ${err.message}`);
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
loadTodos();
