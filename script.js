if (typeof window === "undefined") {
  const [{ createServer }, fsModule, pathModule, { fileURLToPath }] = await Promise.all([
    import("node:http"), import("node:fs"), import("node:path"), import("node:url")
  ]);
  const fs = fsModule.default;
  const path = pathModule.default;
  const root = path.dirname(fileURLToPath(import.meta.url));
  const port = Number(process.env.PORT) || 4173;
  const types = {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
    ".png": "image/png", ".webp": "image/webp", ".mp4": "video/mp4"
  };
  createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, `http://localhost:${port}`).pathname);
    } catch {
      response.writeHead(400).end();
      return;
    }
    const file = path.resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
    if (!file.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    fs.stat(file, (error, stat) => {
      if (error || !stat.isFile()) {
        response.writeHead(404).end();
        return;
      }
      const headers = {
        "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Accept-Ranges": "bytes"
      };
      const match = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range || "");
      if (match) {
        const start = Number(match[1]);
        const end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
        if (start > end || start >= stat.size) {
          response.writeHead(416, { "Content-Range": `bytes */${stat.size}` }).end();
          return;
        }
        response.writeHead(206, {
          ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Content-Length": end - start + 1
        });
        fs.createReadStream(file, { start, end }).pipe(response);
      } else {
        response.writeHead(200, { ...headers, "Content-Length": stat.size });
        fs.createReadStream(file).pipe(response);
      }
    });
  }).listen(port, "127.0.0.1", () =>
    console.log(`GFX disponible en http://127.0.0.1:${port}`)
  );
} else {
const projects = {
  carmin: {
    title: "CARMÍN",
    youtubeId: "8_iNv5ftGKc",
    links: [
      ["Ver portada", "imagenes/album-carmin.webp"],
      ["Ver en YouTube", "https://www.youtube.com/watch?v=8_iNv5ftGKc"],
    ],
  },
  trama: {
    title: "TRAMA",
    document: { pages: 29, path: "imagenes" },
    links: [],
  },
  ice: {
    title: "ICE",
    video: "imagenes/ice-full.mp4",
    poster: "imagenes/album-ice.webp",
    links: [["Abrir vídeo", "imagenes/ice-full.mp4"]],
  },
  belleza: {
    title: "BELLEZA ANGUSTIOSA",
    image: "imagenes/belleza-angustiosa.webp",
    imageAlt: "Mariposa blanca posada sobre una flor",
    links: [
      ["Ver imagen", "imagenes/belleza-angustiosa.webp"],
    ],
  },
  archivo: {
    title: "ARCHIVO FOTOGRÁFICO",
    gallery: [
      [
        "imagenes/fotografia-1.webp",
        "Detalle de un tocadiscos",
        "imagenes/fotografia-1.webp",
      ],
      [
        "imagenes/fotografia-2.webp",
        "Retrato en un estudio musical",
        "imagenes/fotografia-2.webp",
      ],
      [
        "imagenes/fotografia-3.webp",
        "Detalle rojo de un Ferrari",
        "imagenes/fotografia-3.webp",
      ],
      [
        "imagenes/fotografia-4.webp",
        "Escena urbana con coches",
        "imagenes/fotografia-4.webp",
      ],
    ],
    links: [],
  },
};

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const cards = [...document.querySelectorAll(".project-card")];
const dialog = document.getElementById("project-dialog");
const media = document.getElementById("dialog-media");
const menu = document.getElementById("site-menu");
const menuButton = document.getElementById("menu-toggle");
let activeProject = null;
let opener = null;
let activeCarousel = null;

function closeWithAnimation(element, onClose) {
  if (!element.open || element.classList.contains("is-closing")) return;
  if (element === dialog) media.querySelector("video")?.pause();
  if (reducedMotion.matches) {
    element.close();
    onClose?.();
    return;
  }
  element.classList.add("is-closing");
  const finish = (event) => {
    if (event && event.target !== element) return;
    element.removeEventListener("animationend", finish);
    clearTimeout(fallback);
    element.classList.remove("is-closing");
    element.close();
    onClose?.();
  };
  element.addEventListener("animationend", finish);
  const fallback = setTimeout(() => finish(), 500);
}

function clickedOutside(event, element) {
  const box = element.getBoundingClientRect();
  return (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  );
}

function projectIds() {
  return cards.map((card) => card.dataset.project);
}

function buildPhotoCarousel(gallery, links) {
  const carousel = document.createElement("div");
  carousel.className = "photo-carousel";
  const stage = document.createElement("div");
  stage.className = "carousel-stage";
  const track = document.createElement("div");
  track.className = "carousel-track";
  track.tabIndex = 0;
  track.setAttribute("role", "region");
  track.setAttribute("aria-label", "Fotografías del archivo");
  const thumbs = document.createElement("div");
  thumbs.className = "carousel-thumbs";
  thumbs.setAttribute("role", "group");
  thumbs.setAttribute("aria-label", "Elegir fotografía");
  const counter = document.createElement("span");
  counter.className = "carousel-count";
  counter.setAttribute("aria-live", "polite");
  const originalLink = document.createElement("a");
  originalLink.target = "_blank";
  originalLink.rel = "noopener";
  originalLink.textContent = "Ver foto ↗";
  links.append(originalLink);
  let current = 0;
  let scrollFrame = 0;

  function sync(index) {
    current = Math.max(0, Math.min(gallery.length - 1, index));
    counter.textContent = `${String(current + 1).padStart(2, "0")} / ${String(gallery.length).padStart(2, "0")}`;
    originalLink.href = gallery[current][2];
    [...thumbs.children].forEach((button, itemIndex) => {
      button.setAttribute("aria-pressed", String(itemIndex === current));
    });
  }
  function go(index) {
    sync((index + gallery.length) % gallery.length);
    track.scrollTo({
      left: current * track.clientWidth,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }

  gallery.forEach(([src, alt], index) => {
    const slide = document.createElement("figure");
    slide.className = "carousel-slide";
    const image = document.createElement("img");
    image.src = src;
    image.alt = alt;
    if (index > 0) image.loading = "lazy";
    slide.append(image);
    track.append(slide);

    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.setAttribute("aria-label", `Ver fotografía ${index + 1}`);
    const thumbImage = document.createElement("img");
    thumbImage.src = src;
    thumbImage.alt = "";
    thumbImage.loading = "lazy";
    thumb.append(thumbImage);
    thumb.addEventListener("click", () => go(index));
    thumbs.append(thumb);
  });
  track.addEventListener(
    "scroll",
    () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        if (track.clientWidth)
          sync(Math.round(track.scrollLeft / track.clientWidth));
      });
    },
    { passive: true },
  );

  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "carousel-arrow is-prev";
  previous.setAttribute("aria-label", "Fotografía anterior");
  previous.textContent = "←";
  previous.addEventListener("click", () => go(current - 1));
  const next = document.createElement("button");
  next.type = "button";
  next.className = "carousel-arrow is-next";
  next.setAttribute("aria-label", "Fotografía siguiente");
  next.textContent = "→";
  next.addEventListener("click", () => go(current + 1));
  stage.append(track, previous, next);
  const footer = document.createElement("div");
  footer.className = "carousel-footer";
  footer.append(counter, thumbs);
  carousel.append(stage, footer);
  sync(0);
  activeCarousel = { step: (direction) => go(current + direction) };
  return carousel;
}

function buildManualViewer(manual) {
  const viewer = document.createElement("div");
  viewer.className = "manual-viewer";
  viewer.setAttribute("role", "region");
  viewer.setAttribute("aria-label", "Manual de identidad de TRAMA");
  const toolbar = document.createElement("div");
  toolbar.className = "manual-toolbar";
  const previous = document.createElement("button");
  previous.type = "button";
  previous.textContent = "←";
  previous.setAttribute("aria-label", "Página anterior del manual");
  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "→";
  next.setAttribute("aria-label", "Página siguiente del manual");
  const counter = document.createElement("span");
  counter.className = "manual-counter";
  counter.setAttribute("aria-live", "polite");
  const zoom = document.createElement("button");
  zoom.type = "button";
  zoom.className = "manual-zoom";
  zoom.textContent = "Ampliar";
  zoom.setAttribute("aria-pressed", "false");
  zoom.setAttribute("aria-label", "Ampliar página del manual");
  const stage = document.createElement("div");
  stage.className = "manual-stage";
  stage.tabIndex = 0;
  stage.setAttribute("role", "region");
  stage.setAttribute(
    "aria-label",
    "Página del manual; usa las flechas para cambiar de página",
  );
  const image = document.createElement("img");
  image.width = 1800;
  image.height = 1273;
  const status = document.createElement("p");
  status.className = "manual-status";
  status.setAttribute("role", "status");
  stage.append(image, status);
  toolbar.append(previous, counter, next, zoom);
  viewer.append(toolbar, stage);
  let current = 0;
  function showPage(index) {
    current = Math.max(0, Math.min(manual.pages - 1, index));
    counter.textContent = `${current + 1} / ${manual.pages}`;
    previous.disabled = current === 0;
    next.disabled = current === manual.pages - 1;
    status.hidden = false;
    status.textContent = "Cargando página…";
    image.style.visibility = "hidden";
    image.alt = `Página ${current + 1} del manual de identidad de TRAMA`;
    image.src = `${manual.path}/page-${String(current + 1).padStart(2, "0")}.webp`;
    stage.scrollTo(0, 0);
  }
  image.addEventListener("load", () => {
    image.style.visibility = "visible";
    status.hidden = true;
  });
  image.addEventListener("error", () => {
    status.textContent =
      "No se ha podido cargar esta página. Prueba a cambiar de página y volver.";
  });
  previous.addEventListener("click", () => showPage(current - 1));
  next.addEventListener("click", () => showPage(current + 1));
  zoom.addEventListener("click", () => {
    const expanded = stage.classList.toggle("is-zoomed");
    zoom.setAttribute("aria-pressed", String(expanded));
    zoom.textContent = expanded ? "Ajustar" : "Ampliar";
    zoom.setAttribute(
      "aria-label",
      expanded ? "Ajustar página del manual" : "Ampliar página del manual",
    );
    stage.scrollTo(0, 0);
  });
  activeCarousel = { step: (direction) => showPage(current + direction) };
  showPage(0);
  return viewer;
}

function setProject(id) {
  const project = projects[id];
  if (!project) return;
  activeProject = id;
  document.getElementById("dialog-title").textContent = project.title;
  media.querySelector("video")?.pause();
  media.replaceChildren();
  activeCarousel = null;
  media.classList.toggle("is-gallery", Boolean(project.gallery));
  media.classList.toggle("is-video", Boolean(project.youtubeId));
  media.classList.toggle("is-document", Boolean(project.document));
  dialog.classList.toggle("is-document", Boolean(project.document));
  const links = document.getElementById("dialog-links");
  links.replaceChildren();

  if (project.document) {
    media.append(buildManualViewer(project.document));
  } else if (project.youtubeId) {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${project.youtubeId}?rel=0`;
    iframe.title = `Vídeo de ${project.title} en YouTube`;
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    media.append(iframe);
  } else if (project.video) {
    const video = document.createElement("video");
    video.src = project.video;
    video.poster = project.poster;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("aria-label", `Vídeo completo de ${project.title}`);
    media.append(video);
  } else if (project.gallery) {
    media.append(buildPhotoCarousel(project.gallery, links));
  } else {
    const image = document.createElement("img");
    image.src = project.image;
    image.alt = project.imageAlt;
    media.append(image);
  }

  project.links.forEach(([label, href]) => {
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = `${label} ↗`;
    links.append(link);
  });
  dialog.scrollTop = 0;
}

cards.forEach((card) =>
  card.addEventListener("click", () => {
    opener = card;
    setProject(card.dataset.project);
    dialog.showModal();
    media.querySelector("video")?.play().catch(() => {});
    document.getElementById("dialog-close").focus();
  }),
);
document
  .getElementById("dialog-close")
  .addEventListener("click", () => closeWithAnimation(dialog));
dialog.addEventListener("click", (event) => {
  if (event.target === dialog && clickedOutside(event, dialog))
    closeWithAnimation(dialog);
});
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeWithAnimation(dialog);
});
dialog.addEventListener("close", () => {
  media.querySelector("video")?.pause();
  media.replaceChildren();
  activeCarousel = null;
  opener?.focus();
});

function stepProject(direction) {
  const ids = projectIds();
  const index = ids.indexOf(activeProject);
  setProject(ids[(index + direction + ids.length) % ids.length]);
  media.querySelector("video")?.play().catch(() => {});
}
document
  .getElementById("dialog-prev")
  .addEventListener("click", () => stepProject(-1));
document
  .getElementById("dialog-next")
  .addEventListener("click", () => stepProject(1));
dialog.addEventListener("keydown", (event) => {
  if (event.target.closest("video")) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    const direction = event.key === "ArrowLeft" ? -1 : 1;
    if (activeCarousel) activeCarousel.step(direction);
    else stepProject(direction);
  }
});

menuButton.addEventListener("click", () => {
  menu.showModal();
  document.getElementById("menu-close").focus();
});
document
  .getElementById("menu-close")
  .addEventListener("click", () => closeWithAnimation(menu));
menu.addEventListener("click", (event) => {
  if (event.target === menu && clickedOutside(event, menu))
    closeWithAnimation(menu);
});
menu.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeWithAnimation(menu);
});
menu.querySelectorAll("nav a").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const hash = link.getAttribute("href");
    closeWithAnimation(menu, () => {
      location.hash = hash;
    });
  });
});

const heroStage = document.getElementById("hero-stage");
const heroSection = document.querySelector(".hero");
const siteHeader = document.querySelector(".site-header");
heroStage.addEventListener("pointermove", (event) => {
  if (reducedMotion.matches || event.pointerType === "touch") return;
  const box = heroStage.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width - 0.5;
  const y = (event.clientY - box.top) / box.height - 0.5;
  heroStage.style.setProperty("--type-x", `${(-x * 13).toFixed(1)}px`);
  heroStage.style.setProperty("--type-y", `${(-y * 9).toFixed(1)}px`);
  heroStage.style.setProperty("--person-x", `${(x * 16).toFixed(1)}px`);
  heroStage.style.setProperty("--person-y", `${(y * 12).toFixed(1)}px`);
});
heroStage.addEventListener("pointerleave", () => {
  ["--type-x", "--type-y", "--person-x", "--person-y"].forEach((name) =>
    heroStage.style.removeProperty(name),
  );
});

function splitBounceText(element) {
  const accessibleText = element.innerText.replace(/\s+/g, " ").trim();
  element.setAttribute("aria-label", accessibleText);
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const segmenter =
    "Segmenter" in Intl
      ? new Intl.Segmenter("es", { granularity: "grapheme" })
      : null;
  let index = 0;
  nodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    const parts = node.textContent.match(/\s+|\S+/g) || [];
    parts.forEach((part) => {
      if (/^\s+$/.test(part)) {
        fragment.append(document.createTextNode(" "));
        return;
      }
      const word = document.createElement("span");
      word.className = "bounce-word";
      word.setAttribute("aria-hidden", "true");
      const letters = segmenter
        ? [...segmenter.segment(part)].map((item) => item.segment)
        : Array.from(part);
      letters.forEach((letter) => {
        const char = document.createElement("span");
        char.className = "bounce-char";
        char.textContent = letter;
        char.style.setProperty("--char-delay", `${index++ * 19}ms`);
        word.append(char);
      });
      fragment.append(word);
    });
    node.replaceWith(fragment);
  });
}
if (!reducedMotion.matches) {
  document.querySelectorAll(".bounce-text").forEach(splitBounceText);
}

let scrollFrame = 0;
function updateScrollEffects() {
  scrollFrame = 0;
  siteHeader.classList.toggle("is-scrolled", scrollY > 26);
  // Follow the entire hero height so shrinking continues while the next
  // section rises over it, and reverses naturally when scrolling back up.
  const progress = reducedMotion.matches
    ? 0
    : Math.max(0, Math.min(1, scrollY / Math.max(1, heroSection.offsetHeight)));
  const scale = 1 - progress * 0.38;
  heroStage.style.setProperty("--hero-scale", scale.toFixed(4));
  heroStage.style.setProperty("--hero-shadow", (progress * 0.24).toFixed(3));
  heroStage.style.setProperty(
    "--background-scale",
    (1 + progress * 0.08).toFixed(4),
  );
  heroStage.style.setProperty(
    "--type-scroll",
    `${(-progress * 45).toFixed(2)}px`,
  );
  heroStage.style.setProperty(
    "--person-scroll",
    `${(progress * 24).toFixed(2)}px`,
  );
  heroStage.style.visibility = progress >= 1 ? "hidden" : "visible";
}
function scheduleScrollEffects() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollEffects);
}
window.addEventListener("scroll", scheduleScrollEffects, { passive: true });
window.addEventListener("resize", scheduleScrollEffects);
reducedMotion.addEventListener("change", scheduleScrollEffects);
updateScrollEffects();

if (!reducedMotion.matches && "IntersectionObserver" in window) {
  const motionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-entering");
          motionObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(".motion-target")
    .forEach((element) => motionObserver.observe(element));
}

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

(() => {
  const carousel = document.querySelector(".album-carousel");
  if (!carousel) return;
  const albums = [...carousel.querySelectorAll(".album")];
  const dots = [...carousel.querySelectorAll(".album-dot")];
  const caption = carousel.querySelector(".album-caption");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let current = 0;
  let timer;
  let inView = false;
  let hovered = false;
  let focused = false;

  albums.forEach((album, index) => {
    album.querySelector(".vinyl-cover").style.backgroundImage =
      `url("${album.dataset.coverUrl}")`;
    album.addEventListener("click", () => goTo(index, true));
  });

  function schedule() {
    clearInterval(timer);
    if (!motion.matches && inView && !hovered && !focused && !document.hidden) {
      timer = setInterval(() => goTo(current + 1), 4000);
    }
  }

  function goTo(index, announce = false) {
    current = (index + albums.length) % albums.length;
    albums.forEach((album, i) => {
      const center = i === current;
      const left = i === (current - 1 + albums.length) % albums.length;
      const right = i === (current + 1) % albums.length;
      album.classList.toggle("is-center", center);
      album.classList.toggle("is-left", left);
      album.classList.toggle("is-right", right);
      album.classList.toggle("is-hidden", !center && !left && !right);
      album.setAttribute("aria-current", String(center));
      album.setAttribute("aria-hidden", String(!center && !left && !right));
      album.tabIndex = center ? 0 : -1;
      dots[i].setAttribute("aria-current", String(center));
    });
    caption.setAttribute("aria-live", announce ? "polite" : "off");
    caption.textContent = albums[current].dataset.title;
    schedule();
  }

  dots.forEach((dot, index) =>
    dot.addEventListener("click", () => goTo(index, true)),
  );
  carousel
    .querySelector(".album-prev")
    .addEventListener("click", () => goTo(current - 1, true));
  carousel
    .querySelector(".album-next")
    .addEventListener("click", () => goTo(current + 1, true));
  carousel.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const albumFocused = event.target.closest(".album");
    goTo(
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? albums.length - 1
          : current + (event.key === "ArrowRight" ? 1 : -1),
      true,
    );
    if (albumFocused) albums[current].focus({ preventScroll: true });
  });
  carousel.addEventListener("mouseenter", () => {
    hovered = true;
    schedule();
  });
  carousel.addEventListener("mouseleave", () => {
    hovered = false;
    schedule();
  });
  carousel.addEventListener("focusin", () => {
    focused = true;
    schedule();
  });
  carousel.addEventListener("focusout", () => {
    requestAnimationFrame(() => {
      focused = carousel.contains(document.activeElement);
      schedule();
    });
  });
  let touchStart;
  const stage = carousel.querySelector(".album-stage");
  stage.addEventListener(
    "touchstart",
    (event) => {
      touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    },
    { passive: true },
  );
  stage.addEventListener(
    "touchend",
    (event) => {
      if (!touchStart) return;
      const dx = event.changedTouches[0].clientX - touchStart.x;
      const dy = event.changedTouches[0].clientY - touchStart.y;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy))
        goTo(current + (dx < 0 ? 1 : -1), true);
      touchStart = null;
    },
    { passive: true },
  );
  stage.addEventListener("touchcancel", () => {
    touchStart = null;
  });
  document.addEventListener("visibilitychange", schedule);
  motion.addEventListener("change", schedule);
  new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      schedule();
    },
    { threshold: 0.25 },
  ).observe(carousel);
  goTo(0);
})();

}
