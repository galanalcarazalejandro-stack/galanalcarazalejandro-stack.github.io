(() => {
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  if (!("showPopover" in HTMLElement.prototype)) return;

  const layer = document.createElement("div");
  layer.className = "cursor-layer";
  layer.setAttribute("popover", "manual");
  layer.setAttribute("aria-hidden", "true");
  const trail = Array.from({ length: 10 }, () => {
    const dot = document.createElement("span");
    dot.className = "cursor-trail";
    layer.append(dot);
    return { dot, x: 0, y: 0 };
  });
  const ring = document.createElement("span");
  ring.className = "cursor-ring";
  layer.append(ring);
  document.body.append(layer);

  const interactive =
    "a[href], button:not(:disabled), summary, [role='button']";
  const nativeControls =
    "iframe, video, input, textarea, [contenteditable='true']";
  const glowSurfaces =
    ".project-card, .header-whatsapp, .menu-toggle, .contact a";
  let enabled = false;
  let visible = false;
  let frame = 0;
  let x = 0;
  let y = 0;
  let lastMove = 0;
  let surface = null;

  function hide() {
    visible = false;
    layer.classList.remove("is-visible", "is-pressed", "is-interactive");
    document.documentElement.classList.remove("has-custom-cursor");
    cancelAnimationFrame(frame);
    frame = 0;
    if (layer.matches(":popover-open")) layer.hidePopover();
  }

  function updatePreference() {
    enabled = finePointer.matches && !reduceMotion.matches;
    if (!enabled) hide();
  }

  function render(now) {
    frame = 0;
    if (!visible) return;
    ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    document.body.style.setProperty("--ambient-x", `${x}px`);
    document.body.style.setProperty("--ambient-y", `${y}px`);
    if (surface) {
      const bounds = surface.getBoundingClientRect();
      surface.style.setProperty("--glow-x", `${x - bounds.left}px`);
      surface.style.setProperty("--glow-y", `${y - bounds.top}px`);
    }
    const fade = Math.max(0, 1 - (now - lastMove) / 450);
    let previousX = x;
    let previousY = y;
    trail.forEach((point, index) => {
      point.x += (previousX - point.x) * 0.35;
      point.y += (previousY - point.y) * 0.35;
      const scale = 1 - index / (trail.length + 1);
      point.dot.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) scale(${scale})`;
      point.dot.style.opacity = String(fade * scale * 0.65);
      previousX = point.x;
      previousY = point.y;
    });
    if (fade > 0) frame = requestAnimationFrame(render);
  }

  function queueFrame() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  document.addEventListener(
    "pointermove",
    (event) => {
      if (!enabled || event.pointerType !== "mouse") {
        hide();
        return;
      }
      if (event.target.closest(nativeControls)) {
        hide();
        return;
      }
      x = event.clientX;
      y = event.clientY;
      lastMove = performance.now();
      surface = event.target.closest(glowSurfaces);
      if (!visible) {
        trail.forEach((point) => {
          point.x = x;
          point.y = y;
        });
        if (!layer.matches(":popover-open")) layer.showPopover();
        visible = true;
        layer.classList.add("is-visible");
        document.documentElement.classList.add("has-custom-cursor");
      }
      layer.classList.toggle(
        "is-interactive",
        Boolean(event.target.closest(interactive)),
      );
      queueFrame();
    },
    { passive: true },
  );

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType !== "mouse") hide();
      else if (visible) layer.classList.add("is-pressed");
    },
    { passive: true },
  );
  document.addEventListener(
    "pointerover",
    (event) => {
      if (event.target.closest(nativeControls)) hide();
    },
    { passive: true },
  );
  document.addEventListener(
    "pointerup",
    () => layer.classList.remove("is-pressed"),
    { passive: true },
  );
  document.documentElement.addEventListener("pointerleave", hide);
  window.addEventListener("blur", hide);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hide();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab") hide();
  });
  document.querySelectorAll("dialog").forEach((modal) => {
    modal.addEventListener("toggle", () => {
      // Reinsert in the top layer after a dialog opens; never take focus.
      if (visible) {
        if (layer.matches(":popover-open")) layer.hidePopover();
        layer.showPopover();
      }
    });
  });
  finePointer.addEventListener("change", updatePreference);
  reduceMotion.addEventListener("change", updatePreference);
  updatePreference();
})();
