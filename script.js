/* =========================================================
   GRAN PAISAJE CHACO PANTANAL — interacciones
   ========================================================= */
(function () {
  "use strict";

  const hd = document.getElementById("hd");
  const burger = document.getElementById("hdBurger");
  const nav = document.getElementById("hdNav");

  /* ---- Header: sólido al hacer scroll ---- */
  const onScroll = () => hd.classList.toggle("is-solid", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Menú móvil ---- */
  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    document.body.classList.toggle("menu-abierto", open);
  };
  // Anti-rebote: en móvil un tap puede disparar un "click fantasma" (touch + click)
  // que abría y cerraba el menú al instante. Ignoramos disparos < 400 ms.
  let lastToggle = 0;
  burger.addEventListener("click", (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastToggle < 400) return;
    lastToggle = now;
    setMenu(!nav.classList.contains("is-open"));
  });
  // Cerrar al elegir un enlace del menú
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => setMenu(false))
  );
  // Cerrar al tocar fuera del menú (p. ej. sobre el mapa) o con Escape
  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("is-open")) return;
    if (nav.contains(e.target) || burger.contains(e.target)) return;
    setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Titulares palabra por palabra ---- */
  document.querySelectorAll(".texto-revelado").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((w, i) => {
      const span = document.createElement("span");
      span.className = "palabra";
      span.textContent = w + (i < words.length - 1 ? " " : "");
      span.style.transitionDelay = 140 + i * 55 + "ms";
      el.appendChild(span);
    });
  });

  /* ---- Reveal + revelado de palabras al entrar en viewport ---- */
  const revealEls = document.querySelectorAll(".reveal, .texto-revelado");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const delay = parseInt(el.dataset.delay || "0", 10);
          setTimeout(() => el.classList.add("is-visible"), delay);
          obs.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---- Contadores ---- */
  const counters = document.querySelectorAll(".cifra__num");
  const run = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const fmt = (n) => Math.round(n).toLocaleString("es-BO");
    if (reduce) { el.textContent = fmt(target) + suffix; return; }
    const dur = 1400, start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target) + suffix;
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { run(entry.target); obs.unobserve(entry.target); }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((c) => co.observe(c));
  } else {
    counters.forEach((c) => (c.textContent = parseFloat(c.dataset.count).toLocaleString("es-BO") + (c.dataset.suffix || "")));
  }

  /* ---- Año ---- */
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
