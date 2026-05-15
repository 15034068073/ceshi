(function () {
  const revealNodes = Array.from(document.querySelectorAll(".reveal"));
  const counterNodes = Array.from(document.querySelectorAll("[data-counter]"));

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
        const duration = 1200;
        const startTime = performance.now();

        function tick(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          node.textContent = `${Math.floor(target * progress)}${suffix}`;
          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            node.textContent = `${target}${suffix}`;
          }
        }

        requestAnimationFrame(tick);
        counterObserver.unobserve(node);
      });
    },
    { threshold: 0.55 }
  );

  counterNodes.forEach((node) => counterObserver.observe(node));
})();
