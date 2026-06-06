import {
  MAP_BACKGROUNDS,
  PRESETS,
  applyCrosshairCodeCommand,
  decodeShareCode,
  defaultCrosshair,
  drawPreview,
  encodeShareCode,
  toConsoleCommands,
} from "./crosshair.js";
import { PRO_CROSSHAIR_GROUPS } from "./pro-crosshairs.js";
import { initAutoexec } from "./autoexec-ui.js";

const state = { ...defaultCrosshair() };
const previewState = {
  offsetX: 0,
  offsetY: 0,
  mapId: MAP_BACKGROUNDS[0].id,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  dragOriginX: 0,
  dragOriginY: 0,
};

const uiState = {
  activeTab: "custom",
  selectedProPlayerId: null,
  openProGroups: new Set([PRO_CROSSHAIR_GROUPS[0]?.id]),
};

const mapImages = new Map();

const canvas = document.getElementById("preview");
const previewFrame = document.getElementById("preview-frame");
const ctx = canvas.getContext("2d");
const shareCodeOutput = document.getElementById("share-code");
const consoleOutput = document.getElementById("console-commands");
const applyCommandOutput = document.getElementById("apply-command");
const importInput = document.getElementById("import-code");
const importStatus = document.getElementById("import-status");
const presetContainer = document.getElementById("presets");
const mapSelect = document.getElementById("map-background");
const panelCustom = document.getElementById("panel-custom");
const panelPro = document.getElementById("panel-pro");
const panelAutoexec = document.getElementById("panel-autoexec");
const panelAutoexecExport = document.getElementById("panel-autoexec-export");
const mainLayout = document.getElementById("main-layout");
const previewPanel = document.querySelector(".preview-panel");
const exportPanel = document.querySelector(".export-panel");
const proGroupsContainer = document.getElementById("pro-groups");
const proSearchInput = document.getElementById("pro-search");
const proLoadStatus = document.getElementById("pro-load-status");

const bindings = [
  { id: "style", key: "style", type: "number" },
  { id: "length", key: "length", type: "float", step: 0.1 },
  { id: "gap", key: "gap", type: "float", step: 0.1 },
  { id: "thickness", key: "thickness", type: "float", step: 0.1 },
  { id: "outline", key: "outline", type: "float", step: 0.1 },
  { id: "alpha", key: "alpha", type: "number" },
  { id: "color", key: "color", type: "number" },
  { id: "red", key: "red", type: "number" },
  { id: "green", key: "green", type: "number" },
  { id: "blue", key: "blue", type: "number" },
  { id: "splitDistance", key: "splitDistance", type: "number" },
  { id: "fixedCrosshairGap", key: "fixedCrosshairGap", type: "float", step: 0.1 },
];

const toggles = [
  { id: "centerDotEnabled", key: "centerDotEnabled" },
  { id: "outlineEnabled", key: "outlineEnabled" },
  { id: "tStyleEnabled", key: "tStyleEnabled" },
  { id: "alphaEnabled", key: "alphaEnabled" },
  { id: "followRecoil", key: "followRecoil" },
  { id: "deployedWeaponGapEnabled", key: "deployedWeaponGapEnabled" },
];

function readControl(binding) {
  const element = document.getElementById(binding.id);
  if (binding.type === "float") {
    return parseFloat(element.value);
  }
  return parseInt(element.value, 10);
}

function writeControl(binding, value) {
  const element = document.getElementById(binding.id);
  element.value = String(value);
}

function writeToggle(toggle, value) {
  document.getElementById(toggle.id).checked = Boolean(value);
}

function syncControlsFromState() {
  bindings.forEach((binding) => writeControl(binding, state[binding.key]));
  toggles.forEach((toggle) => writeToggle(toggle, state[toggle.key]));
}

function syncRgbVisibility() {
  const custom = state.color === 4 || state.color === 5;
  document.getElementById("rgb-group").hidden = !custom;
}

function clampOffset() {
  const margin = 24;
  const maxX = canvas.width / 2 - margin;
  const maxY = canvas.height / 2 - margin;
  previewState.offsetX = Math.max(-maxX, Math.min(maxX, previewState.offsetX));
  previewState.offsetY = Math.max(-maxY, Math.min(maxY, previewState.offsetY));
}

function getCurrentBackgroundImage() {
  return mapImages.get(previewState.mapId) ?? null;
}

function renderPreview() {
  drawPreview(ctx, canvas.width, canvas.height, state, {
    backgroundImage: getCurrentBackgroundImage(),
    offsetX: previewState.offsetX,
    offsetY: previewState.offsetY,
  });
}

function renderOutputs() {
  const shareCode = encodeShareCode(state);
  shareCodeOutput.value = shareCode;
  consoleOutput.value = toConsoleCommands(state);
  applyCommandOutput.value = applyCrosshairCodeCommand(shareCode);
}

function refresh() {
  syncRgbVisibility();
  renderPreview();
  renderOutputs();
  autoexecUi?.refresh();
}

let autoexecUi;

function applyCrosshairToState(crosshair, options = {}) {
  const { resetSelection = true } = options;
  Object.assign(state, defaultCrosshair(), crosshair);
  syncControlsFromState();
  if (resetSelection) {
    uiState.selectedProPlayerId = null;
    renderProCrosshairs();
  }
  refresh();
}

function updateFromControls() {
  bindings.forEach((binding) => {
    state[binding.key] = readControl(binding);
  });
  toggles.forEach((toggle) => {
    state[toggle.key] = document.getElementById(toggle.id).checked;
  });
  uiState.selectedProPlayerId = null;
  renderProCrosshairs();
  refresh();
}

function applyPreset(preset) {
  applyCrosshairToState(preset.crosshair ?? {});
}

function centerCrosshair() {
  previewState.offsetX = 0;
  previewState.offsetY = 0;
  renderPreview();
}

function importShareCode() {
  const code = importInput.value.trim();
  if (!code) {
    importStatus.textContent = "Paste a CSGO- share code first.";
    importStatus.dataset.type = "error";
    return;
  }

  try {
    const decoded = decodeShareCode(code);
    applyCrosshairToState(decoded);
    importStatus.textContent = "Share code imported.";
    importStatus.dataset.type = "success";
    proLoadStatus.textContent = "";
    proLoadStatus.dataset.type = "";
  } catch (error) {
    importStatus.textContent = error.message || "Invalid share code.";
    importStatus.dataset.type = "error";
  }
}

function loadProCrosshair(group, player) {
  try {
    const decoded = decodeShareCode(player.shareCode);
    applyCrosshairToState(decoded, { resetSelection: false });
    uiState.selectedProPlayerId = player.id;
    importInput.value = player.shareCode;
    importStatus.textContent = "";
    importStatus.dataset.type = "";
    proLoadStatus.textContent = `Loaded ${player.name} (${group.label}). Edit in Custom or export below.`;
    proLoadStatus.dataset.type = "success";
    renderProCrosshairs();
    centerCrosshair();
  } catch (error) {
    proLoadStatus.textContent = error.message || "Could not load this pro crosshair.";
    proLoadStatus.dataset.type = "error";
  }
}

function setActiveTab(tabId) {
  uiState.activeTab = tabId;
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tabId);
  });

  const isCustom = tabId === "custom";
  const isPro = tabId === "pro";
  const isAutoexec = tabId === "autoexec";

  panelCustom.hidden = !isCustom;
  panelPro.hidden = !isPro;
  panelAutoexec.hidden = !isAutoexec;
  panelAutoexecExport.hidden = !isAutoexec;
  previewPanel.hidden = isAutoexec;
  exportPanel.hidden = isAutoexec;

  panelCustom.classList.toggle("is-active", isCustom);
  panelPro.classList.toggle("is-active", isPro);
  panelAutoexec.classList.toggle("is-active", isAutoexec);
  mainLayout.classList.toggle("layout-autoexec", isAutoexec);
}

function getProSearchQuery() {
  return proSearchInput.value.trim().toLowerCase();
}

function playerMatchesSearch(group, player, query) {
  if (!query) {
    return true;
  }

  return [player.name, group.label, group.id]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function renderProCrosshairs() {
  const query = getProSearchQuery();
  proGroupsContainer.innerHTML = "";

  const visibleGroups = PRO_CROSSHAIR_GROUPS.map((group) => ({
    group,
    players: group.players.filter((player) => playerMatchesSearch(group, player, query)),
  })).filter(({ players }) => players.length > 0);

  if (visibleGroups.length === 0) {
    const empty = document.createElement("p");
    empty.className = "pro-empty";
    empty.textContent = "No pro crosshairs match your search.";
    proGroupsContainer.appendChild(empty);
    return;
  }

  visibleGroups.forEach(({ group, players }) => {
    if (query) {
      uiState.openProGroups.add(group.id);
    }

    const groupElement = document.createElement("section");
    groupElement.className = "pro-group";
    if (uiState.openProGroups.has(group.id)) {
      groupElement.classList.add("is-open");
    }

    const header = document.createElement("button");
    header.type = "button";
    header.className = "pro-group-header";
    header.innerHTML = `
      <span>
        <span class="pro-group-title">${group.label}</span>
        <span class="pro-group-count">${players.length} players</span>
      </span>
      <span class="pro-group-chevron" aria-hidden="true">▼</span>
    `;
    header.addEventListener("click", () => {
      if (uiState.openProGroups.has(group.id)) {
        uiState.openProGroups.delete(group.id);
      } else {
        uiState.openProGroups.add(group.id);
      }
      renderProCrosshairs();
    });

    const list = document.createElement("div");
    list.className = "pro-player-list";

    players.forEach((player) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pro-player-btn";
      if (uiState.selectedProPlayerId === player.id) {
        button.classList.add("is-selected");
      }
      button.innerHTML = `
        <span class="pro-player-name">${player.name}</span>
        <span class="pro-player-action">Load</span>
      `;
      button.addEventListener("click", () => loadProCrosshair(group, player));
      list.appendChild(button);
    });

    groupElement.appendChild(header);
    groupElement.appendChild(list);
    proGroupsContainer.appendChild(groupElement);
  });
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const original = button.textContent;
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = original;
    }, 1200);
  } catch {
    button.textContent = "Copy failed";
  }
}

function getPointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function startDrag(event) {
  event.preventDefault();
  const point = getPointerPosition(event);
  previewState.isDragging = true;
  previewState.dragStartX = point.x;
  previewState.dragStartY = point.y;
  previewState.dragOriginX = previewState.offsetX;
  previewState.dragOriginY = previewState.offsetY;
  previewFrame.classList.add("is-dragging");
  canvas.setPointerCapture(event.pointerId);
}

function moveDrag(event) {
  if (!previewState.isDragging) {
    return;
  }

  const point = getPointerPosition(event);
  previewState.offsetX = previewState.dragOriginX + (point.x - previewState.dragStartX);
  previewState.offsetY = previewState.dragOriginY + (point.y - previewState.dragStartY);
  clampOffset();
  renderPreview();
}

function endDrag(event) {
  if (!previewState.isDragging) {
    return;
  }

  previewState.isDragging = false;
  previewFrame.classList.remove("is-dragging");
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

function preloadMapImages() {
  MAP_BACKGROUNDS.forEach((map) => {
    const image = new Image();
    image.src = map.src;
    image.addEventListener("load", () => {
      if (map.id === previewState.mapId) {
        renderPreview();
      }
    });
    mapImages.set(map.id, image);
  });
}

function initMapSelector() {
  MAP_BACKGROUNDS.forEach((map) => {
    const option = document.createElement("option");
    option.value = map.id;
    option.textContent = map.label;
    mapSelect.appendChild(option);
  });

  mapSelect.value = previewState.mapId;
  mapSelect.addEventListener("change", () => {
    previewState.mapId = mapSelect.value;
    renderPreview();
  });
}

function initPreviewInteraction() {
  canvas.addEventListener("pointerdown", startDrag);
  canvas.addEventListener("pointermove", moveDrag);
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("dblclick", centerCrosshair);
  document.getElementById("center-crosshair").addEventListener("click", centerCrosshair);
}

function initTabs() {
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tab);
    });
  });
}

function initProCrosshairs() {
  proSearchInput.addEventListener("input", renderProCrosshairs);
  renderProCrosshairs();
}

function initPresets() {
  PRESETS.forEach((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-btn";
    button.textContent = preset.label;
    button.addEventListener("click", () => applyPreset(preset));
    presetContainer.appendChild(button);
  });
}

function initControls() {
  bindings.forEach((binding) => {
    const element = document.getElementById(binding.id);
    element.addEventListener("input", updateFromControls);
  });
  toggles.forEach((toggle) => {
    document.getElementById(toggle.id).addEventListener("change", updateFromControls);
  });

  document.getElementById("reset-btn").addEventListener("click", () => applyPreset({ crosshair: {} }));
  document.getElementById("import-btn").addEventListener("click", importShareCode);
  document.getElementById("copy-share").addEventListener("click", (event) => {
    copyText(shareCodeOutput.value, event.currentTarget);
  });
  document.getElementById("copy-console").addEventListener("click", (event) => {
    copyText(toConsoleCommands(state, true), event.currentTarget);
  });
  document.getElementById("copy-apply").addEventListener("click", (event) => {
    copyText(applyCommandOutput.value, event.currentTarget);
  });
}

function init() {
  syncControlsFromState();
  autoexecUi = initAutoexec({
    getCrosshairState: () => state,
    copyText,
  });
  initTabs();
  initMapSelector();
  preloadMapImages();
  initPreviewInteraction();
  initProCrosshairs();
  initPresets();
  initControls();
  setActiveTab("custom");
  refresh();
}

init();
