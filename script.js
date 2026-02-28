// ===============================
// LOGIN CREDENTIALS
// ===============================
const HER_NAME = "Aria";     // username (case-insensitive)
const PASSWORD = "lily";     // password (EXACT match)

// ===============================
// Helper
// ===============================
function $(id) {
  const el = document.getElementById(id);
  if (!el) console.error(`Missing element with id="${id}"`);
  return el;
}

// ===============================
// Screen helpers
// ===============================
const screens = {
  login: $("screenLogin"),
  poem: $("screenPoem"),
  question: $("screenQuestion"),
  pass: $("screenPass"),
};

function showScreen(which) {
  Object.values(screens).forEach(s => s && s.classList.remove("screen--active"));
  screens[which] && screens[which].classList.add("screen--active");
  window.scrollTo({ top: 0, behavior: "auto" });
}

// ===============================
// Font readiness (prevents flash)
// ===============================
async function ensureFontsReady() {
  try {
    if (document.fonts && document.fonts.load) {
      await Promise.all([
        document.fonts.load('12px "Press Start 2P"'),
        document.fonts.load('28px "Dancing Script"')
      ]);
      await document.fonts.ready;
    }
  } catch (_) {
    // don't block experience
  } finally {
    document.body.classList.add("fonts-ready");
  }
}
ensureFontsReady();

// ===============================
// Transition helpers
// ===============================
const themeTransition = $("themeTransition");

function restartOverlayAnimation(mode) {
  if (!themeTransition) return;
  themeTransition.classList.remove("play", "fadeplay");
  // force reflow so animation always restarts
  void themeTransition.offsetWidth;
  themeTransition.classList.add(mode);
}

function setOverlayOrigin(originEl) {
  if (!originEl || !themeTransition) return;
  const r = originEl.getBoundingClientRect();
  themeTransition.style.setProperty("--cx", `${r.left + r.width / 2}px`);
  themeTransition.style.setProperty("--cy", `${r.top + r.height / 2}px`);
}

/**
 * Proper transition: show overlay, switch screen mid-fade, then remove overlay.
 */
function transitionToScreen(target, originEl) {
  return new Promise((resolve) => {
    setOverlayOrigin(originEl);
    restartOverlayAnimation("fadeplay");

    // ✅ Switch screen while overlay is opaque (this is the key fix)
    const switchAt = 260; // ms (during the "opaque" part)
    const endAt = 650;    // ms (match CSS fadeWipe duration)

    setTimeout(() => showScreen(target), switchAt);
    setTimeout(() => {
      themeTransition?.classList.remove("fadeplay");
      resolve();
    }, endAt);
  });
}

// ===============================
// Screen 1: Win95 Login
// ===============================
const usernameEl = $("username");
const passwordEl = $("password");
const loginError = $("loginError");
const startBtn = $("startBtn");
const win95Window = $("win95Window");

if (usernameEl) {
  usernameEl.autocapitalize = "none";
  usernameEl.autocomplete = "off";
}
if (passwordEl) passwordEl.autocomplete = "off";

function validateLogin() {
  const typedUser = (usernameEl?.value || "").trim().toLowerCase();
  const expectedUser = HER_NAME.trim().toLowerCase();
  const typedPass = (passwordEl?.value || "").trim();
  return typedUser === expectedUser && typedPass === PASSWORD;
}

async function playThemeTransitionAndGo() {
  setOverlayOrigin(startBtn);

  // Win95 -> Romantic wipe
  restartOverlayAnimation("play");
  win95Window?.classList.add("fade-out");

  setTimeout(() => {
    document.body.classList.remove("mode-login");
  }, 220);

  await ensureFontsReady();

  setTimeout(() => {
    themeTransition?.classList.remove("play");
    showScreen("poem");
    initPoem();
    win95Window?.classList.remove("fade-out");
  }, 980);
}

startBtn?.addEventListener("click", async () => {
  if (!validateLogin()) {
    if (loginError) loginError.textContent = "Your username or password is incorrect, please try again.";

    // shake
    try {
      win95Window?.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-6px)" },
          { transform: "translateX(6px)" },
          { transform: "translateX(0)" }
        ],
        { duration: 220 }
      );
    } catch (_) {}

    passwordEl?.focus();
    return;
  }

  if (loginError) loginError.textContent = "";
  await playThemeTransitionAndGo();
});

// Enter triggers Start (login screen only)
document.addEventListener("keydown", (e) => {
  if (!screens.login?.classList.contains("screen--active")) return;
  if (e.key === "Enter") startBtn?.click();
});

// ===============================
// Screen 2: Poem
// ===============================
const poemBox = $("poemBox");
const poemNextBtn = $("poemNextBtn");
const poemPanel = $("poemPanel");

const poemLines = [
  "Roses🌹 are red, Violets💙 are blue.",
  "But I couldn’t really care less about either of the two.",
  "For among all the things in this beautiful world,",
  "I believe you are most fine ✨",
  "And all I wish to ask you is...."
];

let poemIndex = 0;

function initPoem() {
  if (poemBox) poemBox.innerHTML = "";
  poemIndex = 0;
  if (poemNextBtn) poemNextBtn.textContent = "Next";
}

function addPoemLine(text) {
  if (!poemBox) return;

  const line = document.createElement("div");
  line.className = "poem-line mario";
  line.textContent = text;

  // Slower typing
  const chars = Math.max(12, Math.min(140, text.length));
  const dur = Math.max(2.0, Math.min(5.2, chars * 0.07));

  line.style.setProperty("--chars", String(chars));
  line.style.setProperty("--typeDur", `${dur}s`);

  poemBox.appendChild(line);

  // remove cursor after typing ends
  setTimeout(() => line.classList.add("done"), (dur * 1000) + 80);
}

async function nextPoem() {
  if (poemIndex < poemLines.length) {
    addPoemLine(poemLines[poemIndex]);
    poemIndex++;

    if (poemIndex === poemLines.length && poemNextBtn) {
      poemNextBtn.textContent = "Continue";
    }
    return;
  }

  // ✅ Now transition actually shows (screen switches mid-fade)
  await transitionToScreen("question", poemNextBtn || poemPanel);
}

poemNextBtn?.addEventListener("click", nextPoem);
poemPanel?.addEventListener("click", (e) => {
  if (e.target.closest("button")) return;
  if (!screens.poem?.classList.contains("screen--active")) return;
  nextPoem();
});

// ===============================
// Screen 3 + 4: Question -> Pass
// ===============================
const herNameInline = $("herNameInline");
if (herNameInline) herNameInline.textContent = HER_NAME;

const serial = $("serial");
const issuedOn = $("issuedOn");

const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");

if (serial) serial.textContent = `PASS-ID:UR2CUTE-${yyyy}${mm}${dd}`;
if (issuedOn) issuedOn.textContent = "Issued: 28th February 2026";

const opt1 = $("opt1");
const opt2 = $("opt2");
const note = $("note");
const restartBtn = $("restartBtn");
const hearts = $("hearts");

let heartInterval = null;

function burstHearts(count = 28) {
  if (!hearts) return;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "heart";
    el.textContent = Math.random() < 0.85 ? "💗" : (Math.random() < 0.5 ? "💖" : "💞");

    el.style.setProperty("--x", (Math.random() * 100) + "vw");
    el.style.setProperty("--size", (18 + Math.random() * 22) + "px");
    el.style.setProperty("--dur", (2.2 + Math.random() * 2.2) + "s");
    el.style.setProperty("--drift", ((Math.random() * 120 - 60)) + "px");

    hearts.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }
}

function startHearts() {
  burstHearts(36);
  if (heartInterval) clearInterval(heartInterval);
  heartInterval = setInterval(() => burstHearts(14), 550);

  setTimeout(() => {
    if (heartInterval) clearInterval(heartInterval);
    heartInterval = null;
  }, 5200);
}

function accept() {
  if (note) note.textContent = "YAYYYYY! 💘 Officially claimed.";
  showScreen("pass");
  startHearts();
  if (opt1) opt1.disabled = true;
  if (opt2) opt2.disabled = true;
}

opt1?.addEventListener("change", () => {
  if (opt1.checked && opt2) opt2.checked = false;
  if (opt1.checked) accept();
});

opt2?.addEventListener("change", () => {
  if (opt2.checked && opt1) opt1.checked = false;
  if (opt2.checked) accept();
});

restartBtn?.addEventListener("click", () => {
  document.body.classList.add("mode-login");
  showScreen("login");

  if (usernameEl) usernameEl.value = "";
  if (passwordEl) passwordEl.value = "";
  if (loginError) loginError.textContent = "";

  initPoem();

  if (opt1) { opt1.disabled = false; opt1.checked = false; }
  if (opt2) { opt2.disabled = false; opt2.checked = false; }
  if (note) note.textContent = "Pick one 💘";

  if (heartInterval) clearInterval(heartInterval);
  heartInterval = null;
  if (hearts) hearts.innerHTML = "";

});
