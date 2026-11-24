const HEX_COLOUR = /^#[\da-f]{6}$/i;
let generatedId = 0;

export function normalizeHex(value) {
  const candidate = String(value).trim();
  return HEX_COLOUR.test(candidate) ? candidate.toLowerCase() : null;
}

export function attachColorHexFields(root = document) {
  const fields = [...root.querySelectorAll('input[type="color"]')]
    .filter(colorInput => !colorInput.closest(".color-field"));

  for (const colorInput of fields) {
    const wrapper = document.createElement("span");
    wrapper.className = "color-field";
    colorInput.before(wrapper);
    wrapper.append(colorInput);

    const label = colorInput.getAttribute("aria-label")
      || colorInput.closest("label")?.querySelector(":scope > span")?.textContent.trim()
      || "Colour";
    const key = colorInput.id || `color-${++generatedId}`;
    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.id = `hex-${key}`;
    hexInput.className = "color-hex";
    hexInput.inputMode = "text";
    hexInput.maxLength = 7;
    hexInput.autocomplete = "off";
    hexInput.spellcheck = false;
    hexInput.setAttribute("aria-label", `${label} hex value`);
    hexInput.value = normalizeHex(colorInput.value) || "#000000";

    const error = document.createElement("span");
    error.id = `${hexInput.id}-error`;
    error.className = "color-hex-error";
    error.setAttribute("role", "alert");
    error.textContent = "Enter a 6-digit hex colour, such as #A1B2C3.";
    error.hidden = true;
    hexInput.setAttribute("aria-describedby", error.id);
    wrapper.append(hexInput, error);

    const setError = invalid => {
      hexInput.setAttribute("aria-invalid", String(invalid));
      error.hidden = !invalid;
    };
    const syncFromColor = () => {
      hexInput.value = normalizeHex(colorInput.value) || "#000000";
      setError(false);
    };

    colorInput.addEventListener("input", syncFromColor);
    colorInput.addEventListener("change", syncFromColor);
    hexInput.addEventListener("input", () => {
      const value = normalizeHex(hexInput.value);
      setError(!value);
      if (!value) return;
      colorInput.value = value;
      colorInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    hexInput.addEventListener("change", () => {
      const value = normalizeHex(hexInput.value);
      setError(!value);
      if (!value) return;
      hexInput.value = value;
      colorInput.value = value;
      colorInput.dispatchEvent(new Event("input", { bubbles: true }));
      colorInput.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }
}

export function syncColorHexFields(root = document) {
  root.querySelectorAll(".color-field input[type='color']").forEach(colorInput => {
    const hexInput = colorInput.closest(".color-field").querySelector(".color-hex");
    const error = colorInput.closest(".color-field").querySelector(".color-hex-error");
    hexInput.value = normalizeHex(colorInput.value) || "#000000";
    hexInput.setAttribute("aria-invalid", "false");
    error.hidden = true;
  });
}
