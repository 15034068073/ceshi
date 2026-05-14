(function () {
  const revealNodes = Array.from(document.querySelectorAll(".reveal"));
  const counterNodes = Array.from(document.querySelectorAll("[data-counter]"));
  const carouselNodes = Array.from(document.querySelectorAll("[data-carousel]"));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );
  revealNodes.forEach((node) => revealObserver.observe(node));

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const node = entry.target;
        const target = Number(node.getAttribute("data-counter")) || 0;
        const suffix = node.getAttribute("data-suffix") || "";
        const duration = 1100;
        const start = performance.now();

        function animate(now) {
          const progress = Math.min((now - start) / duration, 1);
          const value = Math.floor(target * progress);
          node.textContent = `${value}${suffix}`;
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            node.textContent = `${target}${suffix}`;
          }
        }

        requestAnimationFrame(animate);
        counterObserver.unobserve(node);
      });
    },
    { threshold: 0.55 }
  );
  counterNodes.forEach((node) => counterObserver.observe(node));

  function initCarousel(root) {
    const track = root.querySelector("[data-carousel-track]");
    const items = Array.from(track?.children || []);
    const prevBtn = root.querySelector("[data-carousel-prev]");
    const nextBtn = root.querySelector("[data-carousel-next]");
    const dotsWrap = root.querySelector("[data-carousel-dots]");
    const autoplayMs = Number(root.dataset.autoplay || 0);

    if (!track || items.length <= 1) return;

    let visible = 1;
    let maxIndex = 0;
    let active = 0;
    let timer = null;

    function getVisibleCount() {
      const width = window.innerWidth;
      if (width <= 760) return Number(root.dataset.mobile || 1);
      if (width <= 1120) return Number(root.dataset.tablet || 2);
      return Number(root.dataset.desktop || 4);
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      const pages = maxIndex + 1;

      for (let i = 0; i < pages; i += 1) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";
        dot.addEventListener("click", () => goTo(i, true));
        dotsWrap.appendChild(dot);
      }
    }

    function getStepSize() {
      if (items.length < 2) {
        return items[0]?.getBoundingClientRect().width || 0;
      }
      const first = items[0].getBoundingClientRect();
      const second = items[1].getBoundingClientRect();
      return second.left - first.left;
    }

    function refreshUi() {
      track.style.transform = `translateX(-${active * getStepSize()}px)`;

      if (prevBtn) prevBtn.disabled = maxIndex === 0;
      if (nextBtn) nextBtn.disabled = maxIndex === 0;

      if (dotsWrap) {
        const dots = Array.from(dotsWrap.children);
        dots.forEach((dot, index) => {
          dot.classList.toggle("is-active", index === active);
        });
      }
    }

    function goTo(index, byUser) {
      active = index;
      if (active < 0) active = maxIndex;
      if (active > maxIndex) active = 0;
      refreshUi();
      if (byUser) restartAutoplay();
    }

    function updateLayout() {
      visible = Math.max(1, getVisibleCount());
      root.style.setProperty("--visible", String(visible));
      maxIndex = Math.max(items.length - visible, 0);
      if (active > maxIndex) active = maxIndex;
      buildDots();
      refreshUi();
    }

    function stopAutoplay() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function startAutoplay() {
      if (!autoplayMs || maxIndex === 0) return;
      stopAutoplay();
      timer = window.setInterval(() => goTo(active + 1, false), autoplayMs);
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    prevBtn?.addEventListener("click", () => goTo(active - 1, true));
    nextBtn?.addEventListener("click", () => goTo(active + 1, true));
    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", startAutoplay);
    window.addEventListener("resize", updateLayout);

    updateLayout();
    startAutoplay();
  }

  carouselNodes.forEach((node) => initCarousel(node));
})();
