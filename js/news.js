(function () {
  const revealNodes = Array.from(document.querySelectorAll(".reveal"));
  const sidebarButtons = Array.from(document.querySelectorAll(".news-menu [data-news-category]"));
  const tabButtons = Array.from(document.querySelectorAll(".news-tab[data-news-category]"));
  const searchInput = document.getElementById("news-search");
  const listNode = document.getElementById("news-list");
  const emptyNode = document.getElementById("news-empty");
  const paginationNode = document.getElementById("news-pagination");
  const allItems = Array.from(listNode?.querySelectorAll(".news-item") || []);

  let activeCategory = "all";
  let keyword = "";
  let activePage = 1;
  const pageSize = 5;

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

  function normalize(value) {
    return (value || "").toLowerCase().trim();
  }

  function getFilteredItems() {
    const search = normalize(keyword);
    return allItems.filter((item) => {
      const category = item.dataset.category || "";
      const title = normalize(item.dataset.title || item.textContent);
      const matchesCategory = activeCategory === "all" || category === activeCategory;
      const matchesKeyword = !search || title.includes(search);
      return matchesCategory && matchesKeyword;
    });
  }

  function setActiveCategory(nextCategory) {
    activeCategory = nextCategory;
    activePage = 1;
    sidebarButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.newsCategory === nextCategory);
    });
    tabButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.newsCategory === nextCategory);
    });
    render();
  }

  function buildPagination(totalPages) {
    paginationNode.innerHTML = "";

    function createButton(label, page, disabled, isActive) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(label);
      button.className = "page-btn";
      if (isActive) button.classList.add("is-active");
      if (disabled) button.disabled = true;
      button.addEventListener("click", () => {
        activePage = page;
        render();
      });
      return button;
    }

    paginationNode.appendChild(createButton("‹", Math.max(1, activePage - 1), activePage === 1, false));

    for (let i = 1; i <= totalPages; i += 1) {
      paginationNode.appendChild(createButton(i, i, false, i === activePage));
    }

    paginationNode.appendChild(
      createButton("›", Math.min(totalPages, activePage + 1), activePage === totalPages, false)
    );
  }

  function render() {
    const filtered = getFilteredItems();
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    activePage = Math.min(activePage, totalPages);
    const start = (activePage - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = new Set(filtered.slice(start, end));

    allItems.forEach((item) => {
      item.hidden = !pageItems.has(item);
    });

    emptyNode.hidden = filtered.length !== 0;
    paginationNode.hidden = filtered.length === 0;
    if (!paginationNode.hidden) {
      buildPagination(totalPages);
    }
  }

  sidebarButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const category = button.dataset.newsCategory;
      if (!category) return;
      setActiveCategory(category);
    });
  });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.newsCategory;
      if (!category) return;
      setActiveCategory(category);
    });
  });

  searchInput?.addEventListener("input", () => {
    keyword = searchInput.value;
    activePage = 1;
    render();
  });

  render();
})();
