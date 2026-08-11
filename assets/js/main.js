/* ============================================
   main.js — Navigation, scroll, reveal animations
   ============================================ */

(function () {
  "use strict";

  // ----- Mobile nav toggle -----
  const toggle = document.querySelector(".nav-toggle");
  const mobile = document.querySelector(".nav-mobile");
  if (toggle && mobile) {
    toggle.addEventListener("click", () => {
      mobile.classList.toggle("open");
    });
    // Close on link click
    mobile.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => mobile.classList.remove("open"));
    });
  }

  // ----- Navbar background on scroll -----
  const nav = document.querySelector(".nav");
  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 8) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ----- Active nav link by current path -----
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link, .nav-mobile a").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;
    const target = href.split("/").pop().split("#")[0];
    if (target === path || (path === "" && target === "index.html")) {
      a.classList.add("active");
    }
  });

  // ----- Reveal on scroll -----
  let revealObserver = null;
  const initReveal = () => {
    if (!("IntersectionObserver" in window)) {
      document
        .querySelectorAll(".reveal, .reveal-stagger")
        .forEach((el) => el.classList.add("is-visible"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
      );
    }
    document
      .querySelectorAll(".reveal:not(.is-visible), .reveal-stagger:not(.is-visible)")
      .forEach((el) => revealObserver.observe(el));
  };
  initReveal();
  // Expose for dynamic content (blog/portfolio renderers)
  window.__reveal = initReveal;

  // ----- Year in footer -----
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
