$(function () {
  AOS.init({
    duration: 900,
    once: false,
    offset: 60,
    easing: "ease-out-cubic",
  });

  new Swiper(".hero-swiper", {
    loop: true,
    speed: 900,
    effect: "fade",
    fadeEffect: {
      crossFade: true,
    },
    autoplay: {
      delay: 3600,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".hero-pagination",
      clickable: true,
    },
  });

  new Swiper(".business-swiper", {
    loop: true,
    speed: 700,
    spaceBetween: 18,
    autoplay: {
      delay: 2800,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".business-swiper .swiper-pagination",
      clickable: true,
    },
    breakpoints: {
      0: { slidesPerView: 1.1 },
      640: { slidesPerView: 2 },
      1024: { slidesPerView: 3 },
    },
  });

  new Swiper(".advantage-swiper", {
    speed: 700,
    loop: false,
    slidesPerView: 4,
    slidesPerGroup: 4,
    spaceBetween: 20,
    pagination: {
      el: ".advantage-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".adv-next",
      prevEl: ".adv-prev",
    },
    breakpoints: {
      0: { slidesPerView: 1.1, slidesPerGroup: 1, spaceBetween: 12 },
      640: { slidesPerView: 2, slidesPerGroup: 2, spaceBetween: 16 },
      1024: { slidesPerView: 4, slidesPerGroup: 4, spaceBetween: 20 },
    },
  });

  $(".menu-toggle").on("click", function () {
    $(".site-nav").toggleClass("is-open");
  });

  $(".nav-trigger").on("click", function (event) {
    event.preventDefault();
    var $item = $(this).closest(".nav-item");
    if (window.innerWidth > 768) {
      $(".nav-item").not($item).removeClass("is-open");
    }
    $item.toggleClass("is-open");
  });

  $(".submenu a").on("click", function () {
    $(".site-nav").removeClass("is-open");
    $(".nav-item").removeClass("is-open");
  });

  $(document).on("click", function (event) {
    if (!$(event.target).closest(".site-nav, .menu-toggle").length) {
      $(".nav-item").removeClass("is-open");
    }
  });

  function getActiveNewsPanel() {
    return $(".news-panel.is-active");
  }

  function renderNewsPagination(total, activeIndex) {
    var dots = "";
    for (var i = 0; i < total; i += 1) {
      dots +=
        '<button class="news-dot' +
        (i === activeIndex ? " is-active" : "") +
        '" type="button" data-index="' +
        i +
        '" aria-label="第' +
        (i + 1) +
        '页"></button>';
    }
    $(".news-pagination").html(dots);
  }

  function showNewsSlide($panel, targetIndex) {
    var $slides = $panel.find(".news-slide");
    var total = $slides.length;
    if (!total) return;

    var safeIndex = ((targetIndex % total) + total) % total;
    $panel.attr("data-slide-index", safeIndex);
    $slides.removeClass("is-active").eq(safeIndex).addClass("is-active");
    renderNewsPagination(total, safeIndex);
  }

  $(".news-tabs li").on("click", function () {
    var target = $(this).data("target");
    $(".news-tabs li").removeClass("is-active");
    $(this).addClass("is-active");
    $(".news-panel").removeClass("is-active");
    var $targetPanel = $("#" + target);
    $targetPanel.addClass("is-active");
    showNewsSlide($targetPanel, 0);
  });

  $(".news-prev").on("click", function () {
    var $panel = getActiveNewsPanel();
    var currentIndex = parseInt($panel.attr("data-slide-index"), 10) || 0;
    showNewsSlide($panel, currentIndex - 1);
  });

  $(".news-next").on("click", function () {
    var $panel = getActiveNewsPanel();
    var currentIndex = parseInt($panel.attr("data-slide-index"), 10) || 0;
    showNewsSlide($panel, currentIndex + 1);
  });

  $(document).on("click", ".news-dot", function () {
    var $panel = getActiveNewsPanel();
    var targetIndex = parseInt($(this).data("index"), 10) || 0;
    showNewsSlide($panel, targetIndex);
  });

  var $counter = $(".counter");
  var counterStarted = false;
  function animateCounter() {
    if (counterStarted) return;
    if (!$counter.length) {
      counterStarted = true;
      return;
    }
    var triggerTop = $counter.offset().top - window.innerHeight;
    if ($(window).scrollTop() > triggerTop) {
      counterStarted = true;
      $counter.each(function () {
        var $el = $(this);
        var goal = parseInt($el.data("count"), 10) || 0;
        $({ value: 0 }).animate(
          { value: goal },
          {
            duration: 1400,
            easing: "swing",
            step: function () {
              $el.text(Math.floor(this.value));
            },
            complete: function () {
              $el.text(goal);
            },
          }
        );
      });
    }
  }

  function heroParallax() {
    var scrolled = $(window).scrollTop();
    $(".hero-swiper .swiper-slide .hero-content").css("transform", "translateY(0)");
    $(".hero-swiper .swiper-slide-active .hero-content").css(
      "transform",
      "translateY(" + scrolled * 0.1 + "px)"
    );
  }

  $(window).on("scroll", function () {
    animateCounter();
    heroParallax();
  });

  $(window).on("resize", function () {
    if (window.innerWidth > 768) {
      $(".site-nav").removeClass("is-open");
    }
    $(".nav-item").removeClass("is-open");
  });

  animateCounter();
  heroParallax();
  showNewsSlide(getActiveNewsPanel(), 0);
});
