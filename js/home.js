(function () {
  const slides = Array.from(document.querySelectorAll(".hero-slide"));
  const dots = Array.from(document.querySelectorAll(".hero-dot"));
  const prevBtn = document.querySelector(".hero-arrow.prev");
  const nextBtn = document.querySelector(".hero-arrow.next");

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

  document.querySelector(".hero")?.addEventListener("mouseenter", stopAutoPlay);
  document.querySelector(".hero")?.addEventListener("mouseleave", startAutoPlay);

  render(0);
  startAutoPlay();
})();
