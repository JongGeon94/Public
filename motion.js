(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showAll() {
    root.classList.remove("motion");
    document.querySelectorAll(".timeline").forEach(function (t) {
      t.classList.add("is-in");
    });
  }

  window.__motionReady = true;

  if (typeof anime === "undefined" || reduce) {
    showAll();
    return;
  }

  const ease = "cubicBezier(0.22, 1, 0.36, 1)";

  document.querySelectorAll("[data-split]").forEach(function (el) {
    const text = el.textContent;
    el.textContent = "";
    el.setAttribute("aria-label", text);
    Array.from(text).forEach(function (ch) {
      const span = document.createElement("span");
      span.className = "char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = ch === " " ? "\u00a0" : ch;
      el.appendChild(span);
    });
    el.style.opacity = "1";
  });

  const intro = anime.timeline({ easing: ease });

  const heroLogo = document.querySelector(".hero .logo-wrap");
  if (heroLogo) {
    intro.add({
      targets: heroLogo,
      opacity: [0, 1],
      scale: [0.6, 1],
      filter: ["blur(12px)", "blur(0px)"],
      duration: 1200
    });
  }

  const chars = document.querySelectorAll(".hero [data-split] .char");
  if (chars.length) {
    intro.add({
      targets: chars,
      opacity: [0, 1],
      translateY: ["0.6em", "0em"],
      filter: ["blur(8px)", "blur(0px)"],
      delay: anime.stagger(45),
      duration: 1000
    }, heroLogo ? "-=800" : 0);
  }

  const heroRest = document.querySelectorAll(".hero .subtitle");
  if (heroRest.length) {
    intro.add({
      targets: heroRest,
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 900
    }, "-=700");
  }

  const companyLogo = document.querySelector(".company-hero .logo-wrap");
  if (companyLogo) {
    intro.add({
      targets: companyLogo,
      opacity: [0, 1],
      scale: [0.55, 1],
      filter: ["blur(24px) brightness(0.3)", "blur(0px) brightness(1)"],
      duration: 1600
    }).add({
      targets: ".logo-shine",
      translateX: ["-140%", "300%"],
      duration: 900,
      easing: "easeInOutQuart"
    }, "-=700");
  }

  const revealSelector = [
    ".section-title",
    ".tab",
    ".requirement-grid > .slot",
    ".section > .slot",
    ".student-card",
    ".student-head",
    ".story > .section"
  ].join(",");

  const io = new IntersectionObserver(function (entries) {
    const shown = entries
      .filter(function (e) { return e.isIntersecting; })
      .map(function (e) { return e.target; });
    if (!shown.length) return;

    shown.forEach(function (el) {
      io.unobserve(el);
      el.style.transition = "none";
      el.querySelectorAll(".timeline").forEach(function (t) {
        t.classList.add("is-in");
      });
    });

    anime({
      targets: shown,
      opacity: [0, 1],
      translateY: [48, 0],
      scale: [0.98, 1],
      duration: 1100,
      easing: ease,
      delay: anime.stagger(80),
      complete: function () {
        shown.forEach(function (el) {
          el.style.transform = "";
          el.style.transition = "";
        });
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  document.querySelectorAll(revealSelector).forEach(function (el) {
    io.observe(el);
  });
})();
