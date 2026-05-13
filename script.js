const pet = document.querySelector("#pet");
const bubble = document.querySelector("#bubble");
const heart = document.querySelector("#heart");
const closeBtn = document.querySelector("#closeBtn");
const contextMenu = document.querySelector("#contextMenu");
const girl = document.querySelector(".girl");
const roleBtn = document.querySelector("#roleBtn");
const roleMenu = document.querySelector("#roleMenu");
const styleBtn = document.querySelector("#styleBtn");
const styleMenu = document.querySelector("#styleMenu");
const persistBtn = document.querySelector("#persistBtn");

const idleLines = [
  "\u6211\u4f1a\u4e56\u4e56\u5f85\u5728\u684c\u9762\u4e0a\u3002",
  "\u4eca\u5929\u4e5f\u4e00\u8d77\u52aa\u529b\u5427\u3002",
  "\u9f20\u6807\u9760\u8fd1\u7684\u8bdd\uff0c\u6211\u4f1a\u6709\u70b9\u5f00\u5fc3\u3002",
  "\u6eda\u8f6e\u53ef\u4ee5\u8ba9\u6211\u53d8\u5927\u6216\u53d8\u5c0f\u54e6\u3002",
];

const touchLines = [
  "\u8bf6\u563f\uff0c\u88ab\u53d1\u73b0\u5566\u3002",
  "\u6478\u6478\u5934\u5145\u80fd\u6210\u529f\u3002",
  "\u6211\u4f1a\u966a\u4f60\u770b\u7740\u5c4f\u5e55\u3002",
  "\u4e0d\u8981\u5de5\u4f5c\u592a\u4e45\uff0c\u8bb0\u5f97\u4f11\u606f\u3002",
];

const BASE_PET_WIDTH = 330;
const BASE_PET_HEIGHT = 454;
const MIN_SCALE = 0.2;
const HARD_MAX_SCALE = 4;
const BUBBLE_GAP = 14;
const EDGE_PADDING = 8;
const AURA_PADDING = 28;
const STORAGE_KEY = "desktop-pet-state-v1";

let scale = 1;
let petX = 0;
let petY = 0;
let dragging = false;
let didMove = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let bubbleTimer = 0;
let idleTimer = 0;
let roleConfig = [];
let activeRole = "";
let activeStyle = "";
let overInteractive = false;
let shouldPersist = false;
let restoredState = null;

function pick(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
}

function petWidth() {
  return BASE_PET_WIDTH * scale;
}

function petHeight() {
  return BASE_PET_HEIGHT * scale;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function maxScaleForViewport() {
  const widthScale = (window.innerWidth - EDGE_PADDING * 2) / BASE_PET_WIDTH;
  const heightScale = (window.innerHeight - EDGE_PADDING * 2) / BASE_PET_HEIGHT;
  return Math.max(MIN_SCALE, Math.min(HARD_MAX_SCALE, widthScale, heightScale));
}

function clampPetPosition() {
  const maxX = Math.max(EDGE_PADDING, window.innerWidth - petWidth() - EDGE_PADDING);
  const maxY = Math.max(EDGE_PADDING, window.innerHeight - petHeight() - EDGE_PADDING);

  petX = clamp(petX, EDGE_PADDING, maxX);
  petY = clamp(petY, EDGE_PADDING, maxY);
}

function renderPetPosition() {
  clampPetPosition();
  pet.style.left = `${petX}px`;
  pet.style.top = `${petY}px`;
  pet.style.width = `${petWidth()}px`;
  pet.style.height = `${petHeight()}px`;
  if (bubble.classList.contains("show")) {
    syncBubblePosition();
  }
}

function readSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function applyPersistButtonState() {
  persistBtn.setAttribute("aria-pressed", String(shouldPersist));
}

function savedStatePayload() {
  return {
    persist: shouldPersist,
    role: activeRole,
    style: activeStyle,
    x: petX,
    y: petY,
    scale,
  };
}

function saveState() {
  if (!shouldPersist) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStatePayload()));
}

function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY);
}

function setPersistEnabled(nextValue) {
  shouldPersist = Boolean(nextValue);
  applyPersistButtonState();
  if (shouldPersist) {
    saveState();
    say("\u5df2\u5f00\u542f\u72b6\u6001\u8bb0\u5f55\u3002", 1600);
    return;
  }

  clearSavedState();
  say("\u5df2\u5173\u95ed\u72b6\u6001\u8bb0\u5f55\u3002", 1600);
}

function initPetPosition() {
  const rect = pet.getBoundingClientRect();
  petX = rect.left;
  petY = rect.top;
  renderPetPosition();
}

function syncBubblePosition() {
  const petRect = pet.getBoundingClientRect();
  const bubbleRect = bubble.getBoundingClientRect();
  const petCenterX = petRect.left + petRect.width / 2;
  const bubbleLeft = clamp(petCenterX - bubbleRect.width / 2, EDGE_PADDING, window.innerWidth - bubbleRect.width - EDGE_PADDING);
  const bubbleTop = Math.max(EDGE_PADDING, petRect.top - bubbleRect.height - BUBBLE_GAP * scale);

  bubble.style.left = `${bubbleLeft}px`;
  bubble.style.top = `${bubbleTop}px`;
}

function say(text, duration = 2400) {
  window.clearTimeout(bubbleTimer);
  bubble.textContent = text;
  bubble.classList.add("show");
  syncBubblePosition();
  bubbleTimer = window.setTimeout(() => {
    bubble.classList.remove("show");
  }, duration);
}

function popHeart(event) {
  const petRect = pet.getBoundingClientRect();
  const localX = clamp(event.clientX - petRect.left, 0, petRect.width);
  const localY = clamp(event.clientY - petRect.top, 0, petRect.height);
  pet.style.setProperty("--heart-x", `${localX}px`);
  pet.style.setProperty("--heart-y", `${localY}px`);
  heart.classList.remove("pop");
  void heart.offsetWidth;
  heart.classList.add("pop");
}

function hideMenu() {
  contextMenu.classList.remove("show");
  contextMenu.setAttribute("aria-hidden", "true");
  roleMenu.classList.remove("show");
  roleMenu.setAttribute("aria-hidden", "true");
  roleBtn.setAttribute("aria-expanded", "false");
  styleMenu.classList.remove("show");
  styleMenu.setAttribute("aria-hidden", "true");
  styleBtn.setAttribute("aria-expanded", "false");
}

function showMenu(event) {
  event.preventDefault();
  window.desktopPet.setIgnoreMouse(false);
  const left = Math.min(event.clientX, window.innerWidth - 260);
  const top = Math.min(event.clientY, window.innerHeight - 270);
  contextMenu.style.left = `${Math.max(EDGE_PADDING, left)}px`;
  contextMenu.style.top = `${Math.max(EDGE_PADDING, top)}px`;
  contextMenu.classList.add("show");
  contextMenu.setAttribute("aria-hidden", "false");
}

function activeRoleConfig() {
  return roleConfig.find((role) => role.name === activeRole) || roleConfig[0];
}

function characterPath(roleName = activeRole, styleName = activeStyle) {
  const role = roleConfig.find((item) => item.name === roleName);
  const style = role?.styles.find((item) => item.name === styleName) || role?.styles[0];
  return style?.src || "";
}

function setPetImage() {
  const src = characterPath();
  if (src) {
    girl.src = src;
    if (girl.complete) {
      updateAuraPositions();
    }
  }
  renderMenus();
  saveState();
}

function setAuraFallback() {
  pet.style.setProperty("--aura-one-x", "-34px");
  pet.style.setProperty("--aura-one-y", "92px");
  pet.style.setProperty("--aura-one-size", "26px");
  pet.style.setProperty("--aura-two-x", "338px");
  pet.style.setProperty("--aura-two-y", "72px");
  pet.style.setProperty("--aura-two-size", "18px");
}

function updateAuraPositions() {
  if (!girl.complete || !girl.naturalWidth || !girl.naturalHeight) {
    setAuraFallback();
    return;
  }

  const canvas = document.createElement("canvas");
  const sampleWidth = 180;
  const sampleHeight = Math.max(1, Math.round((girl.naturalHeight / girl.naturalWidth) * sampleWidth));
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    setAuraFallback();
    return;
  }

  try {
    ctx.clearRect(0, 0, sampleWidth, sampleHeight);
    ctx.drawImage(girl, 0, 0, sampleWidth, sampleHeight);
    const { data } = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    let minX = sampleWidth;
    let minY = sampleHeight;
    let maxX = 0;
    let maxY = 0;
    let found = false;

    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = 0; x < sampleWidth; x += 1) {
        const alpha = data[(y * sampleWidth + x) * 4 + 3];
        if (alpha < 24) continue;
        found = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (!found) {
      setAuraFallback();
      return;
    }

    const scaleX = BASE_PET_WIDTH / sampleWidth;
    const scaleY = BASE_PET_HEIGHT / sampleHeight;
    const left = minX * scaleX;
    const right = maxX * scaleX;
    const top = minY * scaleY;
    const bottom = maxY * scaleY;
    const oneSize = 26;
    const twoSize = 18;
    const oneX = Math.max(-oneSize - AURA_PADDING, left - AURA_PADDING - oneSize);
    const twoX = Math.min(BASE_PET_WIDTH + AURA_PADDING, right + AURA_PADDING);
    const oneY = clamp(top + (bottom - top) * 0.23, -AURA_PADDING, BASE_PET_HEIGHT - oneSize);
    const twoY = clamp(top + (bottom - top) * 0.16, -AURA_PADDING, BASE_PET_HEIGHT - twoSize);

    pet.style.setProperty("--aura-one-x", `${Math.round(oneX)}px`);
    pet.style.setProperty("--aura-one-y", `${Math.round(oneY)}px`);
    pet.style.setProperty("--aura-one-size", `${oneSize}px`);
    pet.style.setProperty("--aura-two-x", `${Math.round(twoX)}px`);
    pet.style.setProperty("--aura-two-y", `${Math.round(twoY)}px`);
    pet.style.setProperty("--aura-two-size", `${twoSize}px`);
  } catch {
    setAuraFallback();
  }
}

function pointInRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function isInteractivePoint(x, y) {
  if (pointInRect(x, y, pet.getBoundingClientRect())) return true;
  if (contextMenu.classList.contains("show") && pointInRect(x, y, contextMenu.getBoundingClientRect())) return true;
  if (roleMenu.classList.contains("show") && pointInRect(x, y, roleMenu.getBoundingClientRect())) return true;
  if (styleMenu.classList.contains("show") && pointInRect(x, y, styleMenu.getBoundingClientRect())) return true;
  return false;
}

function updateMousePassthrough(event) {
  const nextOverInteractive = isInteractivePoint(event.clientX, event.clientY);
  if (nextOverInteractive === overInteractive) return;

  overInteractive = nextOverInteractive;
  window.desktopPet.setIgnoreMouse(!overInteractive && !dragging);
}

function makeMenuOption(text, isActive, onClick) {
  const option = document.createElement("button");
  option.className = "menu-option";
  option.type = "button";
  option.textContent = text;
  option.classList.toggle("active", isActive);
  option.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return option;
}

function renderMenus() {
  if (!roleConfig.length) {
    roleMenu.replaceChildren(makeMenuOption("\u6ca1\u6709\u4eba\u7269", false, () => {}));
    styleMenu.replaceChildren(makeMenuOption("\u6ca1\u6709\u98ce\u683c", false, () => {}));
    return;
  }

  roleMenu.replaceChildren(
    ...roleConfig.map((role) =>
      makeMenuOption(role.name, role.name === activeRole, () => {
        activeRole = role.name;
        activeStyle = role.styles[0].name;
        setPetImage();
        hideMenu();
        say("\u6362\u597d\u4eba\u7269\u5566\u3002", 1800);
      }),
    ),
  );

  const role = activeRoleConfig();
  styleMenu.replaceChildren(
    ...role.styles.map((styleItem) =>
      makeMenuOption(styleItem.name, styleItem.name === activeStyle, () => {
        activeStyle = styleItem.name;
        setPetImage();
        hideMenu();
        say("\u6362\u597d\u98ce\u683c\u5566\u3002", 1800);
      }),
    ),
  );
}

function toggleSubmenu(menu, button, shouldOpen) {
  roleMenu.classList.remove("show");
  roleMenu.setAttribute("aria-hidden", "true");
  roleBtn.setAttribute("aria-expanded", "false");
  styleMenu.classList.remove("show");
  styleMenu.setAttribute("aria-hidden", "true");
  styleBtn.setAttribute("aria-expanded", "false");

  menu.classList.toggle("show", shouldOpen);
  menu.setAttribute("aria-hidden", String(!shouldOpen));
  button.setAttribute("aria-expanded", String(shouldOpen));
}

function updateScale(nextScale, event) {
  const oldWidth = petWidth();
  const oldHeight = petHeight();
  const anchorRatioX = (event.clientX - petX) / oldWidth;
  const anchorRatioY = (event.clientY - petY) / oldHeight;

  scale = clamp(nextScale, MIN_SCALE, maxScaleForViewport());
  document.documentElement.style.setProperty("--scale", scale.toFixed(2));

  petX = event.clientX - anchorRatioX * petWidth();
  petY = event.clientY - anchorRatioY * petHeight();
  renderPetPosition();
  saveState();
}

pet.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  hideMenu();
  dragging = true;
  didMove = false;
  dragOffsetX = event.clientX - petX;
  dragOffsetY = event.clientY - petY;
  window.desktopPet.setIgnoreMouse(false);
  pet.setPointerCapture(event.pointerId);
});

pet.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  didMove = true;
  petX = event.clientX - dragOffsetX;
  petY = event.clientY - dragOffsetY;
  renderPetPosition();
});

pet.addEventListener("pointerup", (event) => {
  if (!dragging) return;
  dragging = false;
  pet.releasePointerCapture(event.pointerId);
  window.setTimeout(() => {
    didMove = false;
  }, 0);
  saveState();
});

pet.addEventListener("pointercancel", () => {
  dragging = false;
});

pet.addEventListener("mouseenter", () => {
  pet.classList.add("hovering");
  say("\u4f60\u6765\u5566\uff0c\u8981\u6478\u6478\u5934\u5417\uff1f");
});

pet.addEventListener("mouseleave", () => {
  pet.classList.remove("hovering");
  if (!dragging && !contextMenu.classList.contains("show")) {
    window.desktopPet.setIgnoreMouse(true);
  }
});

pet.addEventListener("click", (event) => {
  if (dragging || didMove) return;
  hideMenu();
  say(pick(touchLines));
  popHeart(event);
});

pet.addEventListener("contextmenu", showMenu);
girl.addEventListener("load", updateAuraPositions);

pet.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    hideMenu();
    updateScale(scale + (event.deltaY < 0 ? 0.12 : -0.12), event);
    say(`\u5f53\u524d\u5927\u5c0f ${Math.round(scale * 100)}%`, 1200);
  },
  { passive: false },
);

closeBtn.addEventListener("click", () => {
  window.desktopPet.close();
});

persistBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  setPersistEnabled(!shouldPersist);
});

roleBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleSubmenu(roleMenu, roleBtn, !roleMenu.classList.contains("show"));
});

styleBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleSubmenu(styleMenu, styleBtn, !styleMenu.classList.contains("show"));
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".context-menu")) {
    hideMenu();
  }
});

document.addEventListener("mousemove", updateMousePassthrough);

window.addEventListener("resize", () => {
  scale = clamp(scale, MIN_SCALE, maxScaleForViewport());
  document.documentElement.style.setProperty("--scale", scale.toFixed(2));
  renderPetPosition();
  saveState();
});

function scheduleIdleLine() {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    say(pick(idleLines), 2200);
    scheduleIdleLine();
  }, 8000 + Math.random() * 7000);
}

async function initRoleConfig() {
  restoredState = readSavedState();
  shouldPersist = Boolean(restoredState?.persist);
  applyPersistButtonState();
  roleConfig = await window.desktopPet.getRoles();
  if (!roleConfig.length) {
    renderMenus();
    say("\u6ca1\u6709\u627e\u5230\u53ef\u7528\u4eba\u7269\u3002", 3200);
    return;
  }

  const savedRole = roleConfig.find((role) => role.name === restoredState?.role);
  activeRole = savedRole?.name || roleConfig[0].name;
  const role = activeRoleConfig();
  const savedStyle = role.styles.find((style) => style.name === restoredState?.style);
  activeStyle = savedStyle?.name || role.styles[0].name;
  if (shouldPersist) {
    scale = clamp(Number(restoredState?.scale) || 1, MIN_SCALE, maxScaleForViewport());
    document.documentElement.style.setProperty("--scale", scale.toFixed(2));
    petX = Number.isFinite(Number(restoredState?.x)) ? Number(restoredState.x) : petX;
    petY = Number.isFinite(Number(restoredState?.y)) ? Number(restoredState.y) : petY;
    renderPetPosition();
  }
  setPetImage();
}

initPetPosition();
initRoleConfig();
say("\u6211\u51fa\u73b0\u5566\uff0c\u62d6\u6211\u5230\u559c\u6b22\u7684\u4f4d\u7f6e\u5427\u3002", 3200);
scheduleIdleLine();
