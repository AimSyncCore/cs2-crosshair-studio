import {
  AUTOEXEC_CATEGORIES,
  AUTOEXEC_SETTINGS,
  defaultAutoexecState,
} from "./autoexec-settings.js";
import { generateAutoexec, getSettingsByCategory } from "./autoexec.js";

export function initAutoexec({ getCrosshairState, copyText }) {
  const autoexecState = defaultAutoexecState();
  const panel = document.getElementById("panel-autoexec");
  const exportPanel = document.getElementById("panel-autoexec-export");
  const settingsRoot = document.getElementById("autoexec-settings");
  const output = document.getElementById("autoexec-output");

  function renderOutput() {
    output.value = generateAutoexec(getCrosshairState(), autoexecState);
  }

  function createSettingRow(setting) {
    const row = document.createElement("div");
    row.className = "autoexec-setting";

    const header = document.createElement("div");
    header.className = "autoexec-setting-header";

    const include = document.createElement("input");
    include.type = "checkbox";
    include.checked = Boolean(autoexecState.enabled[setting.id]);
    include.addEventListener("change", () => {
      autoexecState.enabled[setting.id] = include.checked;
      renderOutput();
    });

    const title = document.createElement("div");
    title.innerHTML = `<strong>${setting.label}</strong> <code>${setting.command}</code>`;
    header.append(include, title);

    const control = document.createElement("div");
    control.className = "autoexec-setting-control";

    let input;
    if (setting.type === "bool") {
      input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(autoexecState.values[setting.id]);
      input.addEventListener("change", () => {
        autoexecState.values[setting.id] = input.checked;
        renderOutput();
      });
      control.append(input);
    } else {
      input = document.createElement("input");
      input.type = "number";
      input.value = String(autoexecState.values[setting.id]);
      input.min = String(setting.min);
      input.max = String(setting.max);
      input.step = String(setting.step);
      input.addEventListener("input", () => {
        autoexecState.values[setting.id] = setting.type === "float"
          ? parseFloat(input.value)
          : parseInt(input.value, 10);
        renderOutput();
      });
      control.append(input);
    }

    const description = document.createElement("p");
    description.className = "autoexec-setting-desc";
    description.textContent = setting.description;

    row.append(header, control, description);
    return row;
  }

  function renderSettings() {
    settingsRoot.innerHTML = "";

    AUTOEXEC_CATEGORIES.forEach((category) => {
      const section = document.createElement("section");
      section.className = "autoexec-category";

      const header = document.createElement("div");
      header.className = "autoexec-category-header";

      const categoryToggle = document.createElement("input");
      categoryToggle.type = "checkbox";
      categoryToggle.checked = Boolean(autoexecState.enabled[category.id]);
      categoryToggle.addEventListener("change", () => {
        autoexecState.enabled[category.id] = categoryToggle.checked;
        if (category.id === "crosshair") {
          renderOutput();
          return;
        }
        getSettingsByCategory(category.id).forEach((setting) => {
          autoexecState.enabled[setting.id] = categoryToggle.checked;
        });
        renderSettings();
        renderOutput();
      });

      const title = document.createElement("div");
      title.innerHTML = `<h3>${category.label}</h3><p>${category.description}</p>`;
      header.append(categoryToggle, title);
      section.append(header);

      if (category.id === "crosshair") {
        const note = document.createElement("p");
        note.className = "autoexec-sync-note";
        note.textContent =
          "Uses your current crosshair from the Custom or Pro tabs. Change the crosshair there and this section updates automatically.";
        section.append(note);
      } else {
        const list = document.createElement("div");
        list.className = "autoexec-setting-list";
        getSettingsByCategory(category.id).forEach((setting) => {
          list.append(createSettingRow(setting));
        });
        section.append(list);
      }

      settingsRoot.append(section);
    });
  }

  document.getElementById("copy-autoexec").addEventListener("click", (event) => {
    copyText(output.value, event.currentTarget);
  });

  document.getElementById("download-autoexec").addEventListener("click", () => {
    const blob = new Blob([output.value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "autoexec.cfg";
    link.click();
    URL.revokeObjectURL(url);
  });

  renderSettings();
  renderOutput();

  return {
    panel,
    exportPanel,
    refresh: renderOutput,
  };
}
