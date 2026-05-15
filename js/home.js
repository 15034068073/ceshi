(function () {
  const slides = Array.from(document.querySelectorAll(".hero-slide"));
  const dots = Array.from(document.querySelectorAll(".hero-dot"));
  const prevBtn = document.querySelector(".hero-arrow.prev");
  const nextBtn = document.querySelector(".hero-arrow.next");
  const hero = document.querySelector(".hero");
  const revealNodes = Array.from(document.querySelectorAll(".reveal"));
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sectionNodes = Array.from(
    document.querySelectorAll("section[id], footer[id]")
  );
  const counterNodes = Array.from(document.querySelectorAll("[data-counter]"));

  if (!slides.length || !dots.length) return;

  let active = 0;
  let timer = null;

  function render(index) {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === active);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === active);
    });
  }

  function startAutoPlay() {
    stopAutoPlay();
    timer = window.setInterval(() => {
      render(active + 1);
    }, 5000);
  }

  function stopAutoPlay() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      render(index);
      startAutoPlay();
    });
  });

  prevBtn?.addEventListener("click", () => {
    render(active - 1);
    startAutoPlay();
  });

  nextBtn?.addEventListener("click", () => {
    render(active + 1);
    startAutoPlay();
  });

  hero?.addEventListener("mouseenter", stopAutoPlay);
  hero?.addEventListener("mouseleave", startAutoPlay);

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || !targetId.startsWith("#")) return;

      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;

      event.preventDefault();
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealNodes.forEach((node) => revealObserver.observe(node));

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
        });
      });
    },
    {
      threshold: 0.4,
      rootMargin: "-25% 0px -45% 0px",
    }
  );

  sectionNodes.forEach((node) => navObserver.observe(node));

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const node = entry.target;
        const target = Number(node.getAttribute("data-counter")) || 0;
        const suffix = node.getAttribute("data-suffix") || "";
        const duration = 1400;
        const startTime = performance.now();

        function tick(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          const current = Math.floor(target * progress);
          node.textContent = String(current) + suffix;
          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            node.textContent = String(target) + suffix;
          }
        }

        requestAnimationFrame(tick);
        counterObserver.unobserve(node);
      });
    },
    { threshold: 0.5 }
  );

  counterNodes.forEach((node) => counterObserver.observe(node));

  render(0);
  startAutoPlay();
})();
