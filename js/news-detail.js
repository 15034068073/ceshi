(function () {
  const revealNodes = Array.from(document.querySelectorAll(".reveal"));
  const shareButtons = Array.from(document.querySelectorAll("[data-share]"));

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

  shareButtons.forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("is-active");
    });
  });
})();
