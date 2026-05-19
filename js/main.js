$(function () {
  AOS.init({
    duration: 900,
    once: false,
    offset: 60,
    easing: "ease-out-cubic",
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

  $(".menu-toggle").on("click", function () {
    $(".site-nav").toggleClass("is-open");
  });

  $(".site-nav a").on("click", function () {
    $(".site-nav").removeClass("is-open");
  });

  $(".news-tabs li").on("click", function () {
    var target = $(this).data("target");
    $(".news-tabs li").removeClass("is-active");
    $(this).addClass("is-active");
    $(".news-panel").removeClass("is-active");
    $("#" + target).addClass("is-active");
  });

  var $counter = $(".counter");
  var counterStarted = false;
  function animateCounter() {
    if (counterStarted) return;
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
    $(".hero").css("background-position", "center " + scrolled * 0.2 + "px");
    $(".hero-content").css("transform", "translateY(" + scrolled * 0.1 + "px)");
  }

  $(window).on("scroll", function () {
    animateCounter();
    heroParallax();
  });

  animateCounter();
  heroParallax();
});
