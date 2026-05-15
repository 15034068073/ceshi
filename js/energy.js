(function () {
  const revealNodes = Array.from(document.querySelectorAll(".reveal"));
  const counterNodes = Array.from(document.querySelectorAll("[data-counter]"));
  const thumbButtons = Array.from(document.querySelectorAll(".thumb-btn"));
  const mainImage = document.getElementById("project-main-image");

  const imageMap = {
    t1: "https://images.unsplash.com/photo-1604373438348-6b3f7f2f0bb6?auto=format&fit=crop&w=1600&q=80",
    t2: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=1600&q=80",
    t3: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1600&q=80",
    t4: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&w=1600&q=80",
    t5: "https://images.unsplash.com/photo-1566093097221-ac2335b09e70?auto=format&fit=crop&w=1600&q=80",
  };

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

  thumbButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.image;
      const image = key ? imageMap[key] : "";
      if (!image || !mainImage) return;

      thumbButtons.forEach((node) => node.classList.toggle("is-active", node === button));
      mainImage.style.backgroundImage = `linear-gradient(180deg, rgba(10, 24, 55, 0.08), rgba(10, 24, 55, 0.28)), url("${image}")`;
    });
  });
})();
