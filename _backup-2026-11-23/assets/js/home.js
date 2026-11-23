(() => {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && header && nav) {
    toggle.addEventListener("click", () => {
      const open = header.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Hero slideshow
  const slides = [...document.querySelectorAll(".hero__slide")];
  let slideIndex = 0;
  if (slides.length > 1) {
    setInterval(() => {
      slides[slideIndex].classList.remove("is-active");
      slideIndex = (slideIndex + 1) % slides.length;
      slides[slideIndex].classList.add("is-active");
    }, 4500);
  }

  // Rotating headline words
  const rotator = document.querySelector("[data-rotator]");
  if (rotator) {
    const words = JSON.parse(rotator.getAttribute("data-rotator"));
    let i = 0;
    setInterval(() => {
      i = (i + 1) % words.length;
      rotator.textContent = words[i];
    }, 3200);
  }

  // Testimonials
  const testimonials = [...document.querySelectorAll(".testimonial")];
  const prevBtn = document.querySelector("[data-testimonial-prev]");
  const nextBtn = document.querySelector("[data-testimonial-next]");
  let tIndex = 0;

  const showTestimonial = (index) => {
    if (!testimonials.length) return;
    testimonials[tIndex].classList.remove("is-active");
    tIndex = (index + testimonials.length) % testimonials.length;
    testimonials[tIndex].classList.add("is-active");
  };

  prevBtn?.addEventListener("click", () => showTestimonial(tIndex - 1));
  nextBtn?.addEventListener("click", () => showTestimonial(tIndex + 1));

  if (testimonials.length > 1) {
    setInterval(() => showTestimonial(tIndex + 1), 10000);
  }

  // Animated counters
  const animateCounter = (el) => {
    const target = Number(el.getAttribute("data-count") || 0);
    const duration = Number(el.getAttribute("data-duration") || 2000);
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = String(target);
    };

    requestAnimationFrame(tick);
  };

  const counters = [...document.querySelectorAll(".stat-number[data-count]")];
  const startCounters = () => counters.forEach(animateCounter);

  // Reveal on scroll
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (entry.target.classList.contains("stats")) startCounters();
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
    startCounters();
  }

  // Simple form feedback (static site)
  const form = document.querySelector(".contact-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const note = form.querySelector(".form-note");
    if (note) {
      note.hidden = false;
      note.textContent = "Thank you. Please email Info@ghausia-research.ae and we will follow up shortly.";
    }
  });
})();
