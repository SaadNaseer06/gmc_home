(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("primary-nav");

  root.classList.add("js", "reveal-ready");

  // Header: transparent over the dark hero, solid once the page scrolls
  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-solid", window.scrollY > 12 || header.classList.contains("menu-open"));
  };
  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  // Mobile menu
  if (header && toggle && nav) {
    const setMenu = (open) => {
      header.classList.toggle("menu-open", open);
      document.body.classList.toggle("menu-locked", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      setHeaderState();
    };

    toggle.addEventListener("click", () => setMenu(!header.classList.contains("menu-open")));
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && header.classList.contains("menu-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", (event) => {
      if (event.matches) setMenu(false);
    });
  }

  // Home hero: slow cross-fade between the background photographs
  const slides = [...document.querySelectorAll(".hero__slide")];
  if (slides.length > 1 && !reduceMotion) {
    const loadSlides = () =>
      slides.forEach((slide) => {
        const src = slide.getAttribute("data-bg");
        if (src) slide.style.backgroundImage = `url("${src}")`;
      });
    if (document.readyState === "complete") loadSlides();
    else window.addEventListener("load", loadSlides, { once: true });

    let current = 0;
    window.setInterval(() => {
      if (document.hidden) return;
      slides[current].classList.remove("is-active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("is-active");
    }, 6000);
  }

  // Rotating headline words: all phrases share one grid cell, so the heading never jumps
  const rotator = document.querySelector(".rotator");
  if (rotator && !reduceMotion) {
    const phrases = [...rotator.children];
    let index = 0;
    window.setInterval(() => {
      if (document.hidden) return;
      phrases[index].classList.remove("is-active");
      phrases[index].setAttribute("aria-hidden", "true");
      index = (index + 1) % phrases.length;
      phrases[index].classList.add("is-active");
      phrases[index].removeAttribute("aria-hidden");
    }, 3200);
  }

  // Stat counters: count up once when the numbers come into view
  const countUp = (el) => {
    const target = Number(el.getAttribute("data-count")) || 0;
    if (reduceMotion) return;
    // Hold the final number's width so nothing beside it moves while counting
    el.style.minWidth = `${el.getBoundingClientRect().width}px`;
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) requestAnimationFrame(tick);
    };
    el.textContent = "0";
    requestAnimationFrame(tick);
  };

  // Scroll animations: each [data-reveal] element animates in once.
  // Elements that arrive together are staggered top-to-bottom, left-to-right.
  const reveal = (el, delay = 0) => {
    el.style.setProperty("--d", `${delay}ms`);
    el.classList.add("is-in");
    el.querySelectorAll("[data-count]").forEach(countUp);
    if (el.matches("[data-count]")) countUp(el);
  };

  const revealables = [...document.querySelectorAll("[data-reveal]")];
  if (root.classList.contains("no-reveal")) {
    // The fail-safe already showed everything; do not animate it again.
  } else if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("is-in"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.round(a.boundingClientRect.top / 40) - Math.round(b.boundingClientRect.top / 40) ||
              a.boundingClientRect.left - b.boundingClientRect.left
          )
          .forEach((entry, order) => {
            reveal(entry.target, Math.min(order, 6) * 110);
            observer.unobserve(entry.target);
          });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    revealables.forEach((el) => observer.observe(el));
  }

  // Testimonials slider: one quote at a time, arrows, keyboard and swipe
  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const section = carousel.closest("section") || document;
    const wrap = section.querySelector(".wrap");
    const prev = section.querySelector("[data-carousel-prev]");
    const next = section.querySelector("[data-carousel-next]");
    const bar = section.querySelector(".carousel__progress");
    const track = carousel.querySelector(".carousel__track");
    const cards = [...carousel.querySelectorAll(".quote-card")];

    // Line the first card up with the page's content edge
    const setEdge = () => {
      if (wrap) carousel.style.setProperty("--edge", `${Math.max(0, wrap.getBoundingClientRect().left)}px`);
    };
    const stepSize = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 24;
      return cards.length ? cards[0].getBoundingClientRect().width + gap : carousel.clientWidth * 0.8;
    };
    const update = () => {
      const max = carousel.scrollWidth - carousel.clientWidth;
      const x = carousel.scrollLeft;
      prev?.setAttribute("aria-disabled", String(x <= 2));
      next?.setAttribute("aria-disabled", String(x >= max - 2));
      if (bar) {
        bar.style.setProperty("--p-size", String(Math.min(1, carousel.clientWidth / carousel.scrollWidth)));
        bar.style.setProperty("--p-start", String(x / carousel.scrollWidth));
      }
    };
    const go = (direction) => carousel.scrollBy({ left: direction * stepSize(), behavior: reduceMotion ? "auto" : "smooth" });

    prev?.addEventListener("click", () => go(-1));
    next?.addEventListener("click", () => go(1));
    carousel.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", () => {
      setEdge();
      update();
    });
    setEdge();
    update();

    // Drag with the mouse (touch and trackpads scroll natively)
    let drag = null;
    carousel.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      drag = { x: event.clientX, left: carousel.scrollLeft, moved: false, id: event.pointerId };
    });
    carousel.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const dx = event.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 5) {
        drag.moved = true;
        carousel.classList.add("is-dragging");
        carousel.setPointerCapture(drag.id);
      }
      if (drag.moved) carousel.scrollLeft = drag.left - dx;
    });
    const endDrag = () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (!moved) return;
      carousel.classList.remove("is-dragging");
      const step = stepSize();
      carousel.scrollTo({ left: Math.round(carousel.scrollLeft / step) * step, behavior: reduceMotion ? "auto" : "smooth" });
    };
    carousel.addEventListener("pointerup", endDrag);
    carousel.addEventListener("pointercancel", endDrag);
  });

  // Why Choose Us: the pinned photo follows the reason being read
  document.querySelectorAll("[data-why]").forEach((story) => {
    const steps = [...story.querySelectorAll(".why-step")];
    const images = [...story.querySelectorAll(".why-story__frame img")];
    const dots = [...story.querySelectorAll(".why-story__dots span")];
    const activate = (index) => {
      [steps, images, dots].forEach((list) => list.forEach((el, n) => el.classList.toggle("is-active", n === index)));
    };
    activate(0);
    if (!("IntersectionObserver" in window)) return;
    const watcher = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) activate(steps.indexOf(entry.target));
        });
      },
      { rootMargin: "-48% 0px -48% 0px" }
    );
    steps.forEach((step) => watcher.observe(step));
  });

  // Statement banner: pinned while scrolling, the words light up one by one
  document.querySelectorAll("[data-statement]").forEach((section) => {
    const heading = section.querySelector("h2");
    if (!heading) return;
    const words = [];
    const splitWords = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              fragment.appendChild(document.createTextNode(part));
            } else {
              const span = document.createElement("span");
              span.className = "w";
              span.textContent = part;
              words.push(span);
              fragment.appendChild(span);
            }
          });
          child.replaceWith(fragment);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          splitWords(child);
        }
      });
    };
    splitWords(heading);

    if (reduceMotion) {
      words.forEach((word) => word.classList.add("is-lit"));
      return;
    }

    let queued = false;
    const update = () => {
      queued = false;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.4; // begin while the band is still rising into view
      const progress = Math.min(1, Math.max(0, (start - rect.top) / (rect.height - vh + start)));
      section.style.setProperty("--p", progress.toFixed(3));
      const lit = Math.ceil(progress * 1.15 * words.length);
      words.forEach((word, index) => word.classList.toggle("is-lit", index < lit));
    };
    const queue = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    update();
  });

  // Contact form (static site): keep the existing note
  document.querySelectorAll(".contact-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const note = form.querySelector(".form-note");
      if (note) {
        note.hidden = false;
        note.textContent = "Thank you. Please email Info@ghausia-research.ae and we will follow up shortly.";
      }
    });
  });
})();
