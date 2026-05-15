(function () {
  const revealNodes = Array.from(document.querySelectorAll(".reveal"));
  const form = document.getElementById("message-form");
  const submitBtn = form?.querySelector(".submit-btn");
  const branchButtons = Array.from(document.querySelectorAll("[data-branch]"));
  const mapPin = document.getElementById("map-pin");
  const mapTooltip = document.getElementById("map-tooltip");
  const routeCar = document.getElementById("route-car");
  const routeBus = document.getElementById("route-bus");
  const routeAir = document.getElementById("route-air");

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

  function renderBranch(button) {
    const name = button.dataset.name || "";
    const address = button.dataset.address || "";
    const car = button.dataset.car || "";
    const bus = button.dataset.bus || "";
    const air = button.dataset.air || "";
    const left = Number(button.dataset.left || 52);
    const top = Number(button.dataset.top || 53);

    branchButtons.forEach((node) => node.classList.toggle("is-active", node === button));

    if (mapTooltip) {
      const h4 = mapTooltip.querySelector("h4");
      const p = mapTooltip.querySelector("p");
      if (h4) h4.textContent = name;
      if (p) p.textContent = address;
      mapTooltip.style.left = `${left}%`;
      mapTooltip.style.top = `${Math.max(8, top - 12)}%`;
    }

    if (mapPin) {
      mapPin.style.left = `${left}%`;
      mapPin.style.top = `${top}%`;
    }

    if (routeCar) routeCar.textContent = car;
    if (routeBus) routeBus.textContent = bus;
    if (routeAir) routeAir.textContent = air;
  }

  branchButtons.forEach((button) => {
    button.addEventListener("click", () => renderBranch(button));
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!submitBtn) return;

    submitBtn.classList.add("is-sent");
    submitBtn.textContent = "留言已提交";
    window.setTimeout(() => {
      submitBtn.classList.remove("is-sent");
      submitBtn.textContent = "提交留言";
      form.reset();
    }, 1500);
  });
})();
