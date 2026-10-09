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
