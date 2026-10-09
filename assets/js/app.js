const projects = {
  carmin: {
    title: "CARMÍN",
    youtubeId: "8_iNv5ftGKc",
    links: [
      ["Ver portada", "proyectos/portadas-albums/portada1.jpg"],
      ["Ver en YouTube", "https://www.youtube.com/watch?v=8_iNv5ftGKc"],
    ],
  },
  trama: {
    title: "TRAMA",
    document: { pages: 29, path: "assets/images/projects/trama-manual" },
    links: [],
  },
  ice: {
    title: "ICE",
    video: "assets/videos/ice-full.mp4",
    poster: "assets/images/albums/album-ice.webp",
    links: [["Ver archivo original", "proyectos/audiovisual/ice/ICE_FINAL.mp4"]],
  },
  belleza: {
    title: "BELLEZA ANGUSTIOSA",
    image: "assets/images/photography/belleza-angustiosa.webp",
    imageAlt: "Mariposa blanca posada sobre una flor",
    links: [
      ["Ver imagen original", "proyectos/fotografia/Belleza angustiosa.jpg"],
    ],
  },
  archivo: {
    title: "ARCHIVO FOTOGRÁFICO",
    gallery: [
      [
        "assets/images/photography/fotografia-1.webp",
        "Detalle de un tocadiscos",
        "proyectos/fotografia/fotografia-1.JPG",
      ],
      [
        "assets/images/photography/fotografia-2.webp",
        "Retrato en un estudio musical",
        "proyectos/fotografia/fotografia-2.JPG",
      ],
      [
        "assets/images/photography/fotografia-3.webp",
        "Detalle rojo de un Ferrari",
        "proyectos/fotografia/fotografia-3.png",
      ],
      [
        "assets/images/photography/fotografia-4.webp",
        "Escena urbana con coches",
        "proyectos/fotografia/fotografia-4.png",
      ],
    ],
    links: [["Descargar HEIC original", "proyectos/fotografia/IMG_1911.HEIC"]],
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
  originalLink.textContent = "Ver foto original ↗";
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
    if (href.toLowerCase().endsWith(".heic")) link.download = "IMG_1911.HEIC";
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
