/* =========================================================
   RICARDO VELASCO — EXPEDIENTE
   Interacciones mínimas: idioma, revelado, progreso, reloj.
   Sin dependencias.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Idioma ES / EN ---------- */
  var STORE = "rv-lang";

  function applyLang(lang) {
    document.querySelectorAll("[data-en]").forEach(function (el) {
      if (el.dataset.es === undefined) el.dataset.es = el.innerHTML;
      var next = lang === "en" ? el.dataset.en : el.dataset.es;
      if (el.innerHTML !== next) el.innerHTML = next;
    });

    root.lang = lang;
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });
    try {
      localStorage.setItem(STORE, lang);
    } catch (e) {}
  }

  function detectLang() {
    // 1. Explicit link override, e.g. /?lang=en, wins over everything.
    try {
      var q = new URLSearchParams(window.location.search).get("lang");
      if (q === "es" || q === "en") return q;
    } catch (e) {}

    // 2. A language the visitor chose by hand is remembered.
    try {
      var saved = localStorage.getItem(STORE);
      if (saved === "es" || saved === "en") return saved;
    } catch (e) {}

    // 3. Otherwise follow the browser, using the whole ordered preference
    //    list (Chrome/Edge/Firefox/Safari expose navigator.languages).
    var prefs =
      navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || ""];
    for (var i = 0; i < prefs.length; i++) {
      var l = String(prefs[i]).toLowerCase();
      if (l === "es" || l.indexOf("es-") === 0) return "es";
      if (l === "en" || l.indexOf("en-") === 0) return "en";
    }

    // Anything else gets the international version of the dossier.
    return "en";
  }

  applyLang(detectLang());

  document.querySelectorAll("[data-lang]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLang(btn.dataset.lang);
    });
  });

  /* ---------- Revelado al hacer scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) {
      el.classList.add("in");
    });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ---------- Barra de progreso ---------- */
  var bar = document.getElementById("progress");
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var h = document.body.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, window.pageYOffset / h) : 0;
      if (bar) bar.style.transform = "scaleX(" + p + ")";
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Navegación activa ---------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.top__nav a[href^="#"]')
  );
  var targets = navLinks
    .map(function (a) {
      return document.querySelector(a.getAttribute("href"));
    })
    .filter(Boolean);

  if (targets.length && "IntersectionObserver" in window) {
    var navIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (a) {
            a.classList.toggle(
              "is-active",
              a.getAttribute("href") === "#" + entry.target.id
            );
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    targets.forEach(function (t) {
      navIO.observe(t);
    });
  }

  /* ---------- Reloj de Málaga ---------- */
  var clock = document.getElementById("clock");
  if (clock) {
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Europe/Madrid"
      });
    } catch (e) {
      fmt = null;
    }
    var tick = function () {
      if (!fmt) return;
      clock.textContent = "MÁLAGA " + fmt.format(new Date());
    };
    tick();
    setInterval(tick, 30000);
  }
})();
