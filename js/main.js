/* ==========================================================
   FN TRADUCTION — comportements
   ========================================================== */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }

  /* ---------- Langue FR / বাংলা ---------- */
  var lang = "fr";
  function t(el, name) { return el.getAttribute("data-" + lang) || el.getAttribute("data-fr") || ""; }

  function applyLang(l) {
    lang = l === "bn" ? "bn" : "fr";
    root.setAttribute("lang", lang);
    $$("[data-fr]").forEach(function (el) {
      var v = el.getAttribute("data-" + lang) || el.getAttribute("data-fr");
      if (el.innerHTML !== v) el.innerHTML = v;
    });
    $$("[data-fr-ph]").forEach(function (el) {
      el.setAttribute("placeholder", el.getAttribute("data-" + lang + "-ph") || el.getAttribute("data-fr-ph"));
    });
    $$("[data-fr-label]").forEach(function (el) {
      el.setAttribute("aria-label", el.getAttribute("data-" + lang + "-label") || el.getAttribute("data-fr-label"));
    });
    var title = document.documentElement.getAttribute("data-title-" + lang);
    if (title) document.title = title;
    $$(".lang button").forEach(function (b) {
      var on = b.getAttribute("data-lang") === lang;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    store("fn-lang", lang);
    document.dispatchEvent(new CustomEvent("fn:lang", { detail: lang }));
  }
  var q = /[?&]lang=(fr|bn)/.exec(location.search);
  applyLang(q ? q[1] : (store("fn-lang") === "bn" ? "bn" : "fr"));
  $$(".lang button").forEach(function (b) {
    b.addEventListener("click", function () { applyLang(b.getAttribute("data-lang")); });
  });

  /* ---------- Menu mobile + en-tête ---------- */
  var burger = $("#burger"), nav = $("#nav"), header = $(".site-header");
  function closeNav() { if (nav) { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); } }
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeNav(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
  }
  function onScroll() { if (header) header.classList.toggle("scrolled", window.scrollY > 8); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Barre de navigation : pastille glissante ---------- */
  var glider = $(".nav-glider");
  if (glider && nav) {
    var navLinks = $$("a:not(.nav-cta)", nav), cta = $(".nav-cta", nav);
    var place = function (el) {
      if (!el || getComputedStyle(glider).display === "none") { glider.style.opacity = 0; return; }
      glider.style.width = el.offsetWidth + "px";
      glider.style.transform = "translateX(" + el.offsetLeft + "px)";
      glider.style.opacity = 1;
    };
    var restG = function () { place($('a[aria-current="page"]:not(.nav-cta)', nav)); };
    navLinks.forEach(function (el) {
      el.addEventListener("mouseenter", function () { place(el); });
      el.addEventListener("focus", function () { place(el); });
    });
    if (cta) cta.addEventListener("mouseenter", function () { glider.style.opacity = 0; });
    nav.addEventListener("mouseleave", restG);
    nav.addEventListener("focusout", function (e) { if (!nav.contains(e.relatedTarget)) restG(); });
    window.addEventListener("resize", restG);
    glider.style.transition = "none"; restG(); void glider.offsetWidth; glider.style.transition = "";
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { glider.style.transition = "none"; restG(); void glider.offsetWidth; glider.style.transition = ""; });
    document.addEventListener("fn:lang", function () { setTimeout(function () { glider.style.transition = "none"; restG(); void glider.offsetWidth; glider.style.transition = ""; }, 60); });
  }


  /* ---------- Page Devis : révélation + inclinaison 3D ---------- */
  var qf = $("#devis-form");
  if (qf) {
    var rvs = [].slice.call(document.querySelectorAll("#devis-form fieldset, #devis-form .pick label, .form-wrap .panel, #devis-form .actions"));
    rvs.forEach(function (el, i) { el.classList.add("rv"); el.style.setProperty("--d", (el.matches(".pick label") ? (i % 6) * 0.06 : 0) + "s"); });
    if (reduce || !("IntersectionObserver" in window)) rvs.forEach(function (el) { el.classList.add("on"); });
    else {
      var rio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("on"); rio.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      rvs.forEach(function (el) { rio.observe(el); });
    }
    if (!reduce && window.matchMedia("(hover: hover)").matches) {
      [].forEach.call(document.querySelectorAll(".form-wrap .panel"), function (el) {
        el.classList.add("tilt");
        el.addEventListener("pointermove", function (e) {
          var b = el.getBoundingClientRect();
          el.style.setProperty("--ry", (((e.clientX - b.left) / b.width - 0.5) * 7).toFixed(2) + "deg");
          el.style.setProperty("--rx", (-((e.clientY - b.top) / b.height - 0.5) * 7).toFixed(2) + "deg");
        });
        el.addEventListener("pointerleave", function () { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
      });
    }
  }

  /* ---------- Héros : entrée orchestrée + parallaxe ---------- */
  var heroEl = $(".hero");
  if (heroEl) {
    var goHero = function () { heroEl.classList.add("in"); };
    if (reduce) goHero();
    else {
      var fontsOk = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 500); })]) : Promise.resolve();
      fontsOk.then(function () { requestAnimationFrame(function () { requestAnimationFrame(goHero); }); });
    }
    if (!reduce && window.matchMedia("(hover: hover)").matches) {
      var pf = 0;
      heroEl.addEventListener("pointermove", function (e) {
        if (pf) return;
        var bx = heroEl.getBoundingClientRect(), mx = (e.clientX - bx.left) / bx.width * 2 - 1, my = (e.clientY - bx.top) / bx.height * 2 - 1;
        pf = requestAnimationFrame(function () { pf = 0; heroEl.style.setProperty("--mx", mx.toFixed(3)); heroEl.style.setProperty("--my", my.toFixed(3)); });
      });
      heroEl.addEventListener("pointerleave", function () { heroEl.style.setProperty("--mx", 0); heroEl.style.setProperty("--my", 0); });
    }
  }


  /* ---------- Planche de documents (accueil) ---------- */
  var docs = $("#docs");
  if (docs) {
    var DOCS = [
      { k: "birth",
        fr: "Acte de naissance", bn: "জন্ম সনদ",
        oTitle: "জন্ম নিবন্ধন সনদ",
        o: [["নাম", "রাহিমা আক্তার"], ["জন্মতারিখ", "১২ মার্চ ১৯৯০"], ["জন্মস্থান", "ঢাকা"]],
        tTitle: "Acte de naissance",
        tr: [["Nom", "Rahima Akter"], ["Date de naissance", "12 mars 1990"], ["Lieu de naissance", "Dhaka"]] },
      { k: "passport",
        fr: "Passeport", bn: "পাসপোর্ট",
        oTitle: "পাসপোর্ট",
        o: [["নাম", "রাহিমা আক্তার"], ["জাতীয়তা", "বাংলাদেশি"], ["জন্মস্থান", "ঢাকা"]],
        tTitle: "Passeport",
        tr: [["Nom", "Rahima Akter"], ["Nationalité", "Bangladaise"], ["Lieu de naissance", "Dhaka"]] },
      { k: "diploma",
        fr: "Diplôme", bn: "শিক্ষাসনদ",
        oTitle: "স্নাতক সনদ",
        o: [["নাম", "রাহিমা আক্তার"], ["বিষয়", "অর্থনীতি"], ["সনদের ধরন", "স্নাতক"]],
        tTitle: "Diplôme de licence",
        tr: [["Nom", "Rahima Akter"], ["Spécialité", "Économie"], ["Niveau", "Licence"]] },
      { k: "marriage",
        fr: "Acte de mariage", bn: "বিবাহ সনদ",
        oTitle: "বিবাহ নিবন্ধন সনদ",
        o: [["স্বামী", "করিম হোসেন"], ["স্ত্রী", "রাহিমা আক্তার"], ["বিবাহের স্থান", "ঢাকা"]],
        tTitle: "Acte de mariage",
        tr: [["Époux", "Karim Hossain"], ["Épouse", "Rahima Akter"], ["Lieu du mariage", "Dhaka"]] }
    ];
    var tabsBox = $("#doc-tabs"), stamp = $("#stamp"), idx = 0, timer = null, paused = false;
    function dl(rows) { return rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join(""); }
    function show(i, animate) {
      idx = i;
      var d = DOCS[i];
      function paint() {
        $("#o-title").textContent = d.oTitle; $("#o-list").innerHTML = dl(d.o);
        $("#t-title").textContent = d.tTitle; $("#t-list").innerHTML = dl(d.tr);
        $$("button", tabsBox).forEach(function (b, n) { b.setAttribute("aria-selected", n === i ? "true" : "false"); });
        stamp.classList.remove("hit"); stamp.classList.add("off");
        void stamp.getBoundingClientRect();
        stamp.classList.remove("off");
        setTimeout(function () { stamp.classList.add("hit"); }, animate && !reduce ? 380 : 120);
      }
      if (animate && !reduce) {
        docs.classList.add("swapping");
        setTimeout(function () { paint(); docs.classList.remove("swapping"); }, 280);
      } else paint();
    }
    function buildTabs() {
      tabsBox.innerHTML = "";
      DOCS.forEach(function (d, i) {
        var b = document.createElement("button");
        b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", i === idx ? "true" : "false");
        b.textContent = lang === "bn" ? d.bn : d.fr;
        b.addEventListener("click", function () { stop(); show(i, true); });
        tabsBox.appendChild(b);
      });
    }
    function loop() { stop(); if (reduce) return; timer = setInterval(function () { if (!paused && !document.hidden) show((idx + 1) % DOCS.length, true); }, 5200); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    buildTabs(); show(0, false); loop();
    docs.addEventListener("mouseenter", function () { paused = true; });
    docs.addEventListener("mouseleave", function () { paused = false; });
    tabsBox.addEventListener("focusin", function () { paused = true; });
    tabsBox.addEventListener("focusout", function () { paused = false; });
    document.addEventListener("fn:lang", function () { buildTabs(); });
  }

  /* ---------- Onglets génériques (besoins, interprétation) ---------- */
  function tabs(list, getPanel, opts) {
    var btns = $$('[role="tab"]', list);
    if (!btns.length) return;
    function select(b, focus) {
      btns.forEach(function (x) {
        var on = x === b;
        x.setAttribute("aria-selected", on ? "true" : "false");
        x.tabIndex = on ? 0 : -1;
        var p = getPanel(x); if (p) p.hidden = !on;
      });
      if (focus) b.focus();
      if (opts && opts.hash) history.replaceState(null, "", "#" + b.getAttribute("aria-controls"));
    }
    btns.forEach(function (b, i) {
      b.addEventListener("click", function () { select(b); });
      b.addEventListener("keydown", function (e) {
        var vertical = opts && opts.vertical;
        var nextKey = vertical ? "ArrowDown" : "ArrowRight", prevKey = vertical ? "ArrowUp" : "ArrowLeft";
        if (e.key === nextKey) { e.preventDefault(); select(btns[(i + 1) % btns.length], true); }
        else if (e.key === prevKey) { e.preventDefault(); select(btns[(i - 1 + btns.length) % btns.length], true); }
        else if (e.key === "Home") { e.preventDefault(); select(btns[0], true); }
        else if (e.key === "End") { e.preventDefault(); select(btns[btns.length - 1], true); }
      });
    });
    var start = btns[0];
    if (opts && opts.hash) {
      var h = location.hash.slice(1);
      btns.forEach(function (b) { if (b.getAttribute("aria-controls") === h) start = b; });
    }
    select(start);
    return { select: select, btns: btns };
  }
  var seg = $("#seg");
  if (seg) {
    var segCtl = tabs(seg, function (b) { return document.getElementById(b.getAttribute("aria-controls")); }, { hash: true });
    window.addEventListener("hashchange", function () {
      var h = location.hash.slice(1);
      segCtl.btns.forEach(function (b) { if (b.getAttribute("aria-controls") === h) segCtl.select(b); });
    });
  }

  /* ---------- Pile de cartes (éventail au survol, glisser pour réordonner) ---------- */
  var deck = $("#deck");
  if (deck) {
    var wrapD = $("#deckwrap"), dcards = $$(".dcard", deck), order = dcards.slice();
    var DW = 260, spreadOn = false, fan = false, dragging = false;
    var mqd = window.matchMedia("(min-width: 900px)");
    function layoutDeck() {
      var n = order.length, mid = (n - 1) / 2, W = deck.clientWidth;
      var gap = Math.max(60, Math.min(128, (W - DW - 24) / (n - 1)));
      order.forEach(function (el, i) {
        var d = i - mid, x, y, r, z;
        if (spreadOn) { x = d * gap; y = d * d * 3.2; r = d * 2.4; z = i + 1; }
        else { x = d * 3; y = d * -1.5; r = ((i * 37) % 11 - 5) * 0.9; z = n - i; }
        el.style.setProperty("--x", x.toFixed(1) + "px");
        el.style.setProperty("--y", y.toFixed(1) + "px");
        el.style.setProperty("--r0", r.toFixed(2) + "deg");
        el.style.zIndex = z;
      });
      deck.gap = gap;
    }
    function setSpread(v) { if (dragging || spreadOn === v) return; spreadOn = v; deck.classList.toggle("open", v); layoutDeck(); }
    function onEnter() { if (window.matchMedia("(hover: hover)").matches) setSpread(true); }
    function onLeave() { if (window.matchMedia("(hover: hover)").matches) setSpread(false); }
    function onFocusIn() { setSpread(true); }
    function onFocusOut(e) { if (!deck.contains(e.relatedTarget)) setSpread(false); }
    function onDocDown(e) { if (!deck.contains(e.target)) setSpread(false); }

    function bindDrag(el) {
      var sx, sy, moved, id;
      el.addEventListener("pointerdown", function (e) {
        if (!fan || e.button > 0 || e.target.closest("a")) return;
        sx = e.clientX; sy = e.clientY; moved = false; id = e.pointerId;
        try { el.setPointerCapture(id); } catch (x) {}
      });
      el.addEventListener("pointermove", function (e) {
        if (id === undefined || e.pointerId !== id) return;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (!moved && Math.hypot(dx, dy) < 6) return;
        if (!moved) { moved = true; dragging = true; el.classList.add("drag"); }
        el.style.setProperty("--dx", dx + "px"); el.style.setProperty("--dy", dy + "px");
      });
      function end(e) {
        if (id === undefined || (e && e.pointerId !== id)) return;
        var dx = e ? e.clientX - sx : 0, dy = e ? e.clientY - sy : 0;
        id = undefined;
        el.classList.remove("drag"); el.style.removeProperty("--dx"); el.style.removeProperty("--dy");
        if (moved) {
          var n = order.length, mid = (n - 1) / 2, from = order.indexOf(el);
          order.splice(from, 1);
          if (spreadOn) {
            var to = Math.max(0, Math.min(n - 1, Math.round(((from - mid) * deck.gap + dx) / deck.gap + mid)));
            order.splice(to, 0, el);
          } else if (Math.hypot(dx, dy) > 50) order.push(el); else order.splice(from, 0, el);
          dragging = false; layoutDeck();
        } else if (!spreadOn) setSpread(true);
      }
      el.addEventListener("pointerup", end);
      el.addEventListener("pointercancel", end);
    }
    dcards.forEach(bindDrag);

    function enableDeck() {
      if (fan) return; fan = true;
      deck.classList.add("deck-fan"); wrapD.classList.add("fan");
      deck.addEventListener("mouseenter", onEnter); deck.addEventListener("mouseleave", onLeave);
      deck.addEventListener("focusin", onFocusIn); deck.addEventListener("focusout", onFocusOut);
      document.addEventListener("pointerdown", onDocDown); window.addEventListener("resize", layoutDeck);
      layoutDeck();
    }
    function disableDeck() {
      if (!fan) return; fan = false; spreadOn = false;
      deck.classList.remove("deck-fan", "open"); wrapD.classList.remove("fan");
      deck.removeEventListener("mouseenter", onEnter); deck.removeEventListener("mouseleave", onLeave);
      deck.removeEventListener("focusin", onFocusIn); deck.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("pointerdown", onDocDown); window.removeEventListener("resize", layoutDeck);
      dcards.forEach(function (el) { el.removeAttribute("style"); });
    }
    function syncDeck() { if (mqd.matches) enableDeck(); else disableDeck(); }
    syncDeck();
    if (mqd.addEventListener) mqd.addEventListener("change", syncDeck); else mqd.addListener(syncDeck);
  }

  /* ---------- Orbite de cartes 3D au défilement ---------- */
  var orbit = $("#services.orbit");
  if (orbit) {
    var stage = $(".orbit-stage", orbit), copy = $(".orbit-copy", orbit), hint = $(".orbit-hint", orbit);
    var cards = $$(".ocard", orbit), rings = $$(".orbit-rings i", orbit);
    var mq = window.matchMedia("(min-width: 1024px) and (min-height: 600px)");
    var CW = 290, CH = 290, GAP = 20, N = cards.length, TAU = Math.PI * 2;
    var DEPTH_SCALE = 0.8, DEPTH_OP = 0.3, ZR = 320, SCROLL_VH = 2.5, HEAD = 76;
    var cur = 0, target = 0, raf = 0, on = false;

    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
    function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function render(p) {
      var W = stage.clientWidth, H = stage.clientHeight;
      var copyH = copy.offsetHeight, rows = Math.ceil(N / 3);
      var gridW = 3 * CW + 2 * GAP, gridH = rows * CH + (rows - 1) * GAP;
      var total = copyH + 28 + gridH;
      var k = Math.min(1, (H - 30) / total, (W - 40) / gridW);
      var top = -total * k / 2;
      var titleY = top + copyH * k / 2;
      var gridCy = top + (copyH + 28) * k + gridH * k / 2;
      var t = smooth(0.5, 0.92, p);
      var spin = (1 - easeOut(clamp(p / 0.8, 0, 1))) * TAU * 0.85;
      var Rx = Math.min(W * 0.4, 520), Ry = H * 0.22, oy = H * 0.06;

      cards.forEach(function (el, i) {
        var a = i * TAU / N + spin, c = Math.cos(a), sn = Math.sin(a), d = (c + 1) / 2;
        var rx = sn * Rx, ry = c * Ry + oy, rz = c * ZR;
        var rot = -sn * 28, sc = lerp(DEPTH_SCALE, 1, d), op = lerp(DEPTH_OP, 1, d);
        var gx = ((i % 3) - 1) * (CW + GAP) * k;
        var gy = gridCy + (Math.floor(i / 3) - (rows - 1) / 2) * (CH + GAP) * k;
        var x = lerp(rx, gx, t), y = lerp(ry, gy, t), z = lerp(rz, 0, t);
        el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px," + z.toFixed(1) + "px) rotateY(" +
          lerp(rot, 0, t).toFixed(2) + "deg) scale(" + lerp(sc, k, t).toFixed(4) + ")";
        el.style.opacity = lerp(op, 1, t).toFixed(3);
        el.style.zIndex = Math.round(lerp(500 + (c * 400), 600, t));
      });
      copy.style.transform = "translate(-50%,-50%) translate3d(0," + lerp(0, titleY, t).toFixed(1) + "px,0) scale(" + lerp(1, k, t).toFixed(4) + ")";
      hint.style.opacity = (1 - clamp(p / 0.08, 0, 1)).toFixed(2);
      rings.forEach(function (r, n) {
        var f = n ? 0.62 : 1;
        r.style.width = (2 * Rx * f + CW * 0.1) + "px";
        r.style.height = (2 * Ry * f + 30) + "px";
        r.style.marginTop = (oy) + "px";
        r.style.opacity = (1 - t).toFixed(2);
      });
      orbit.classList.toggle("ready", p > 0.97);
    }
    function progress() {
      var r = orbit.getBoundingClientRect(), range = orbit.offsetHeight - stage.clientHeight;
      return range > 0 ? clamp((HEAD - r.top) / range, 0, 1) : 0;
    }
    function tick() {
      if (!on) { raf = 0; return; }
      cur += (target - cur) * 0.14;
      if (Math.abs(target - cur) < 0.0006) cur = target;
      render(cur);
      raf = cur === target ? 0 : requestAnimationFrame(tick);
    }
    function onScrollOrbit() { target = progress(); if (!raf) raf = requestAnimationFrame(tick); }
    function enable() {
      if (on) return; on = true;
      orbit.classList.add("orbit-3d");
      orbit.style.setProperty("--sl", (SCROLL_VH * 100) + "vh");
      cur = target = progress(); render(cur);
      window.addEventListener("scroll", onScrollOrbit, { passive: true });
      window.addEventListener("resize", onScrollOrbit);
    }
    function disable() {
      if (!on) return; on = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      window.removeEventListener("scroll", onScrollOrbit); window.removeEventListener("resize", onScrollOrbit);
      orbit.classList.remove("orbit-3d", "ready");
      cards.concat([copy, hint]).forEach(function (el) { el.removeAttribute("style"); });
      rings.forEach(function (r) { r.removeAttribute("style"); });
    }
    function sync() { if (mq.matches && !reduce) enable(); else disable(); }
    sync();
    if (mq.addEventListener) mq.addEventListener("change", sync); else mq.addListener(sync);
    document.addEventListener("fn:lang", function () { if (on) render(cur); });
    window.addEventListener("load", function () { if (on) { target = progress(); render(cur); } });
  }

  /* ---------- Apparition des étapes ---------- */
  var steps = $(".steps");
  if (steps && "IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { steps.classList.add("in"); io.disconnect(); } });
    }, { threshold: 0.35 });
    io.observe(steps);
  } else if (steps) steps.classList.add("in");

  /* ---------- Formulaire de devis ---------- */
  var form = $("#devis-form");
  if (form) {
    var EMAIL = form.getAttribute("data-email"), WA = form.getAttribute("data-wa");
    var sv = /[?&]s=([^&]+)/.exec(location.search);
    if (sv) {
      var want = decodeURIComponent(sv[1].replace(/\+/g, " "));
      $$('input[name="service"]', form).forEach(function (r) { if (r.value === want) r.checked = true; });
    }
    var file = $("#fichier"), fileNote = $("#file-note");
    if (file) file.addEventListener("change", function () { fileNote.hidden = !file.files.length; });

    function setBad(field, bad) { field.classList.toggle("bad", bad); }
    function validate() {
      var ok = true, first = null;
      $$(".field[data-req]", form).forEach(function (f) {
        var inp = $("input,select,textarea", f), v = (inp.value || "").trim(), bad = !v;
        if (!bad && inp.type === "email") bad = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
        setBad(f, bad); if (bad) { ok = false; if (!first) first = inp; }
      });
      var svc = $('input[name="service"]:checked', form), sf = $("#svc-fs");
      sf.classList.toggle("bad", !svc);
      if (!svc) { ok = false; if (!first) first = $('input[name="service"]', form); }
      if (first) first.focus();
      return ok;
    }
    $$(".field input,.field select,.field textarea", form).forEach(function (i) {
      i.addEventListener("input", function () { setBad(i.closest(".field"), false); });
    });
    $$('input[name="service"]', form).forEach(function (r) { r.addEventListener("change", function () { $("#svc-fs").classList.remove("bad"); }); });

    function summary() {
      var g = function (n) { return (form.elements[n] && form.elements[n].value || "").trim(); };
      return {
        subject: "Demande de devis — " + g("service") + " — " + g("nom"),
        body: [
          "Nom / নাম : " + g("nom"),
          "E-mail : " + g("email"),
          "Téléphone / ফোন : " + (g("tel") || "-"),
          "Service : " + g("service"),
          "Langues : " + g("source") + " -> " + g("cible"),
          "Délai / সময়সীমা : " + (g("delai") || "-"),
          "",
          "Message :",
          g("message")
        ].join("\n")
      };
    }
    var okBox = $("#form-success");
    function done() { okBox.classList.add("show"); okBox.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" }); }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;
      var s = summary();
      window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(s.subject) + "&body=" + encodeURIComponent(s.body);
      done();
    });
    var waBtn = $("#wa-btn");
    if (waBtn) waBtn.addEventListener("click", function () {
      if (!validate()) return;
      var s = summary();
      window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(s.subject + "\n\n" + s.body), "_blank", "noopener");
      done();
    });
  }
})();
