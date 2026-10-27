/* =========================================================
   For You ❤ — motion engine
   GSAP + ScrollTrigger + Lenis when online, graceful
   vanilla fallback when offline.
   ========================================================= */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.toggle("gsap", hasGSAP);

  /* -------------------------------------------------
     1. SPLIT TEXT HELPERS
  ------------------------------------------------- */
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words
      .map((w) => '<span class="w-mask"><span class="w">' + w + "</span></span>")
      .join(" ");
    return el.querySelectorAll(".w");
  }

  /* -------------------------------------------------
     2. PRELOADER
  ------------------------------------------------- */
  const preloader = document.getElementById("preloader");
  const loadFill = document.getElementById("loadFill");
  const loadNum = document.getElementById("loadNum");
  const intro = document.getElementById("intro");

  function startExperience() {
    intro.classList.add("show");
  }

  (function preload() {
    const sources = Array.prototype.slice
      .call(document.images)
      .filter(function (i) { return i.loading !== "lazy"; })
      .map(function (i) { return i.currentSrc || i.src; })
      .filter(function (s) { return s && s.indexOf("data:") !== 0; });
    const total = Math.max(sources.length, 1);
    let done = 0;
    let shown = 0;
    let finished = false;

    function paint() {
      const target = Math.round((done / total) * 100);
      if (shown < target) shown = Math.min(target, shown + Math.max(1, (target - shown) / 4));
      loadFill.style.width = shown + "%";
      loadNum.textContent = Math.round(shown);
      if (done >= total && shown >= target) finish();
      else requestAnimationFrame(paint);
    }

    function finish() {
      if (finished) return;
      finished = true;
      loadNum.textContent = "100";
      loadFill.style.width = "100%";
      setTimeout(function () {
        preloader.classList.add("done");
        setTimeout(startExperience, 500);
      }, 350);
    }

    sources.forEach(function (src) {
      const im = new Image();
      im.onload = im.onerror = function () { done++; };
      im.src = src;
    });
    // hard cap so we never hang
    setTimeout(function () { done = total; }, 6000);
    requestAnimationFrame(paint);
  })();

  /* -------------------------------------------------
     3. MUSIC
  ------------------------------------------------- */
  const main = document.getElementById("main");
  const musicBar = document.getElementById("musicBar");
  const musicToggle = document.getElementById("musicToggle");
  const musicFill = document.getElementById("musicFill");
  const musicTime = document.getElementById("musicTime");
  const musicTrack = document.querySelector(".music__track");
  const song = new Audio("assets/audio/sirf-tum.mp3");
  song.preload = "auto";
  song.loop = true;
  song.volume = 0.75;

  function fmt(s) {
    if (!isFinite(s)) return "0:00";
    return Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  }
  function syncUI() { musicBar.classList.toggle("playing", !song.paused); }
  function playSong() {
    const p = song.play();
    if (p && p.catch) p.catch(function () {});
    syncUI();
  }

  song.addEventListener("timeupdate", function () {
    const pct = song.duration ? (song.currentTime / song.duration) * 100 : 0;
    musicFill.style.width = pct + "%";
    musicTime.textContent = fmt(song.currentTime);
  });
  musicTrack.addEventListener("click", function (e) {
    if (!song.duration) return;
    const r = musicTrack.getBoundingClientRect();
    song.currentTime = ((e.clientX - r.left) / r.width) * song.duration;
  });

  /* -------------------------------------------------
     4. ENTER → MAIN EXPERIENCE
  ------------------------------------------------- */
  const enterBtn = document.getElementById("enterBtn");
  let entered = false;

  enterBtn.addEventListener("click", function () {
    if (entered) return;
    entered = true;

    const finishEnter = function () {
      intro.style.display = "none";
      if (hasGSAP) ScrollTrigger.refresh();
    };

    if (hasGSAP && !reduceMotion) {
      const tl = gsap.timeline({ onComplete: finishEnter });
      tl.to(".intro__inner", { y: -60, opacity: 0, filter: "blur(12px)", duration: 0.7, ease: "power3.in" })
        .to(intro, { opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.2")
        .add(function () {
          main.classList.remove("is-locked");
          musicBar.classList.add("show");
          playSong();
          heroIn();
        }, "-=0.45");
    } else {
      intro.classList.add("hide");
      main.classList.remove("is-locked");
      musicBar.classList.add("show");
      playSong();
      setTimeout(finishEnter, 950);
    }
    window.dispatchEvent(new Event("scroll"));
  });

  musicToggle.addEventListener("click", function () {
    if (song.paused) playSong();
    else { song.pause(); syncUI(); }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pauseAllVideos();
  });

  /* -------------------------------------------------
     5. LENIS SMOOTH SCROLL + GSAP TICKER
  ------------------------------------------------- */
  let lenis = null;
  if (typeof window.Lenis !== "undefined" && !reduceMotion && hasGSAP) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    window.lenis = lenis;
  }
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { offset: 0 });
    else el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* -------------------------------------------------
     6. CUSTOM CURSOR + MAGNETIC BUTTONS
  ------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    const dot = document.getElementById("cursorDot");
    let mx = innerWidth / 2, my = innerHeight / 2;

    window.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; });
    (function loop() {
      dot.style.transform = "translate(" + (mx - 4) + "px," + (my - 4) + "px)";
      requestAnimationFrame(loop);
    })();

    // magnetic pull
    document.querySelectorAll(".magnetic").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        if (hasGSAP) gsap.to(el, { x: x * 0.35, y: y * 0.45, duration: 0.4, ease: "power3.out" });
        else el.style.transform = "translate(" + x * 0.3 + "px," + y * 0.4 + "px)";
      });
      el.addEventListener("pointerleave", function () {
        if (hasGSAP) gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" });
        else el.style.transform = "";
      });
    });
  }

  /* -------------------------------------------------
     7. HERO INTRO + PARALLAX
  ------------------------------------------------- */
  const hero = document.getElementById("hero");
  const heroStage = document.getElementById("heroStage");
  const floatCards = document.querySelectorAll(".float-card");

  function heroIn() {
    if (!hasGSAP || reduceMotion) return;
    const words = document.querySelectorAll("#heroTitle .w");
    const tl = gsap.timeline();
    tl.from(words, {
      yPercent: 120, rotate: 6, opacity: 0, duration: 1.05, ease: "power4.out", stagger: 0.07
    })
      .from(".hero .eyebrow", { opacity: 0, letterSpacing: "1.4em", duration: 0.9, ease: "power3.out" }, 0.1)
      .from(".hero__sub", { opacity: 0, y: 26, duration: 0.8, ease: "power3.out" }, "-=0.5")
      .from(".scroll-cue", { opacity: 0, y: 20, duration: 0.7 }, "-=0.4")
      .from(floatCards, {
        opacity: 0, scale: 0.6, y: 120, rotate: function (i) { return i % 2 ? 18 : -18; },
        duration: 1.2, ease: "back.out(1.4)", stagger: 0.12
      }, 0.15);
  }

  // split hero text
  document.querySelectorAll("[data-split='words']").forEach(splitWords);

  /* scroll + pointer parallax on hero */
  if (hasGSAP && !reduceMotion) {
    gsap.to(heroStage, {
      yPercent: 22, scale: 1.06, ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
    });
    gsap.to(".hero__copy", {
      yPercent: -18, opacity: 0.1, ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
    });
  }

  if (finePointer && !reduceMotion && hero) {
    hero.addEventListener("pointermove", function (e) {
      const ry = (e.clientX / innerWidth - 0.5) * 14;
      const rx = (e.clientY / innerHeight - 0.5) * -10;
      floatCards.forEach(function (c) {
        const depth = parseFloat(c.dataset.depth || 1);
        const rot = c.dataset.rot || 0;
        const x = ry * depth, y = rx * depth;
        if (hasGSAP) gsap.to(c, { x: x, y: y, rotate: rot, duration: 0.9, ease: "power3.out", overwrite: "auto" });
        else c.style.transform = "rotate(" + rot + "deg) translate3d(" + x + "px," + y + "px,0)";
      });
    });
  }

  /* -------------------------------------------------
     8. REVEALS (GSAP batch or IO fallback)
  ------------------------------------------------- */
  const reveals = document.querySelectorAll(".reveal");
  if (hasGSAP && !reduceMotion) {
    ScrollTrigger.batch(reveals, {
      start: "top 86%",
      once: true,
      onEnter: function (batch) {
        gsap.from(batch, {
          y: 60, opacity: 0, rotateX: -8, transformOrigin: "top center",
          duration: 1.05, ease: "power3.out", stagger: 0.09, clearProps: "transform,rotateX"
        });
      }
    });
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* -------------------------------------------------
     9. MARQUEE — speed reacts to scroll velocity
  ------------------------------------------------- */
  const marqueeTrack = document.getElementById("marqueeTrack");
  if (hasGSAP && !reduceMotion && marqueeTrack) {
    let mx = 0, base = 0.9, vel = 0;
    const half = () => marqueeTrack.scrollWidth / 2;
    if (lenis) lenis.on("scroll", function (e) { vel = e.velocity || 0; });
    gsap.ticker.add(function () {
      mx -= base + Math.min(Math.abs(vel) * 0.35, 14);
      if (Math.abs(mx) >= half()) mx = 0;
      marqueeTrack.style.transform = "translateX(" + mx + "px)";
      vel *= 0.92;
    });
    marqueeTrack.style.animation = "none";
  }

  /* -------------------------------------------------
     10. US — PINNED HORIZONTAL JOURNEY
  ------------------------------------------------- */
  const usPin = document.getElementById("usPin");
  const usTrack = document.getElementById("usTrack");
  const usBar = document.getElementById("usBar");

  if (hasGSAP && !reduceMotion && usPin && usTrack) {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", function () {
      const distance = () => usTrack.scrollWidth - innerWidth + 80;
      const tween = gsap.to(usTrack, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: usPin,
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: function (self) { if (usBar) usBar.style.width = (self.progress * 100) + "%"; }
        }
      });
      // inner parallax: each photo drifts against the scroll direction
      gsap.utils.toArray(".us-card__img img").forEach(function (img) {
        gsap.fromTo(img, { xPercent: -6, scale: 1.12 }, {
          xPercent: 6, scale: 1.02, ease: "none",
          scrollTrigger: { trigger: img.closest(".us-card"), containerAnimation: tween, start: "left right", end: "right left", scrub: true }
        });
      });
      // cards breathe in as they enter
      gsap.utils.toArray(".us-card").forEach(function (card) {
        gsap.from(card, {
          opacity: 0, y: 70, rotateY: -14, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 92%", once: true }
        });
      });
      return function () { gsap.set(usTrack, { x: 0 }); };
    });
  }

  /* -------------------------------------------------
     11. GALLERY: scrub zoom reveal + tilt + lightbox
  ------------------------------------------------- */
  const cards = document.querySelectorAll(".ph");
  if (hasGSAP && !reduceMotion) {
    cards.forEach(function (card) {
      const img = card.querySelector("img");
      gsap.fromTo(img, { scale: 1.35, yPercent: -6 }, {
        scale: 1, yPercent: 0, ease: "none",
        scrollTrigger: { trigger: card, start: "top bottom", end: "top 35%", scrub: true }
      });
      gsap.fromTo(card, { clipPath: "inset(12% 12% 12% 12% round 2px)" }, {
        clipPath: "inset(0% 0% 0% 0% round 2px)", ease: "none",
        scrollTrigger: { trigger: card, start: "top 92%", end: "top 40%", scrub: true }
      });
    });
  }

  if (finePointer && !reduceMotion) {
    cards.forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateY(" + px * 12 + "deg) rotateX(" + -py * 12 + "deg) translateZ(16px)";
        card.style.zIndex = "5";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = ""; card.style.zIndex = "";
      });
    });
  }

  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCap = document.getElementById("lbCap");
  function openLb(src, cap) {
    lbImg.src = src; lbImg.alt = cap || "Her"; lbCap.textContent = cap || "";
    lb.hidden = false; document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
  }
  function closeLb() {
    lb.hidden = true; lbImg.removeAttribute("src"); document.body.style.overflow = "";
    if (lenis) lenis.start();
  }
  document.querySelectorAll("[data-src], .portrait").forEach(function (el) {
    if (!el.matches(".ph, .us-card, .portrait")) return;
    el.setAttribute("tabindex", "0");
    var src = el.dataset.src;
    if (!src) {
      var pimg = el.querySelector(".portrait__img img");
      src = pimg ? pimg.getAttribute("src") : "";
    }
    el.addEventListener("click", function () {
      var capEl = el.querySelector("figcaption");
      var cap = capEl ? capEl.textContent.replace(/^\s*no\.\s*[ivx]+\s*/i, "").trim() : "";
      if (capEl) {
        var b = capEl.querySelector("b"), e = capEl.querySelector("em");
        if (b) cap = b.textContent + (e ? " — " + e.textContent : "");
      }
      if (src) openLb(src, cap);
    });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); }
    });
  });
  document.getElementById("lbClose").addEventListener("click", closeLb);
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) closeLb(); });

  /* -------------------------------------------------
     12. VIDEOS
  ------------------------------------------------- */
  const videos = Array.prototype.slice.call(document.querySelectorAll(".vid-card video"));
  function pauseAllVideos(except) {
    videos.forEach(function (v) {
      if (v !== except) {
        v.pause();
        v.closest(".vid-card").classList.remove("playing");
        v.muted = true;
        const btn = v.closest(".vid-card").querySelector(".vid-sound");
        if (btn) btn.textContent = "sound on";
      }
    });
  }
  if ("IntersectionObserver" in window) {
    const vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        const v = en.target;
        if (en.isIntersecting && en.intersectionRatio >= 0.55) {
          if (document.hidden) return;
          pauseAllVideos(v);
          v.play().catch(function () {});
        } else {
          v.pause();
          v.closest(".vid-card").classList.remove("playing");
        }
      });
    }, { threshold: [0, 0.55, 0.9] });
    videos.forEach(function (v) { vio.observe(v); });
  }
  document.querySelectorAll(".vid-card").forEach(function (card) {
    const v = card.querySelector("video");
    const btn = card.querySelector(".vid-sound");
    btn.addEventListener("click", function () {
      if (v.muted) {
        pauseAllVideos(v); v.muted = false; song.volume = 0.22;
        btn.textContent = "sound off"; card.classList.add("playing");
        v.play().catch(function () {});
      } else {
        v.muted = true; btn.textContent = "sound on";
        card.classList.remove("playing"); song.volume = 0.75;
      }
    });
    card.addEventListener("click", function (e) {
      if (e.target === btn) return;
      if (v.paused) { pauseAllVideos(v); v.play().catch(function () {}); }
      else { v.pause(); song.volume = 0.75; }
    });
  });

  /* -------------------------------------------------
     13. KINETIC TYPOGRAPHY (scroll-scrubbed words)
  ------------------------------------------------- */
  const kineticText = document.getElementById("kineticText");
  if (kineticText) {
    const accent = ["light", "hold.", "stayed,", "fix", "see", "you."];
    const words = kineticText.textContent.trim().split(/\s+/);
    kineticText.innerHTML = words
      .map(function (w) {
        const clean = w.replace(/[^a-zA-Z.]/g, "").toLowerCase();
        return '<span class="kw' + (accent.indexOf(clean) > -1 ? " accent" : "") + '">' + w + "</span>";
      })
      .join(" ");
    const kws = kineticText.querySelectorAll(".kw");
    if (hasGSAP && !reduceMotion) {
      ScrollTrigger.create({
        trigger: "#kinetic", start: "top 75%", end: "bottom 60%", scrub: true,
        onUpdate: function (self) {
          const n = Math.floor(self.progress * kws.length * 1.15);
          kws.forEach(function (k, i) { k.classList.toggle("lit", i < n); });
        }
      });
      gsap.from(kineticText, {
        scale: 0.94, opacity: 0.2, ease: "none",
        scrollTrigger: { trigger: "#kinetic", start: "top bottom", end: "top 40%", scrub: true }
      });
    } else {
      kws.forEach(function (k) { k.classList.add("lit"); });
    }
  }

  /* -------------------------------------------------
     14. LETTERS
  ------------------------------------------------- */
  document.querySelectorAll(".letter").forEach(function (l) {
    const flip = function () { l.classList.toggle("flipped"); };
    l.addEventListener("click", flip);
    l.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
    });
  });

  /* -------------------------------------------------
     15. FINALE: hold-to-reveal + heart burst
  ------------------------------------------------- */
  const holdBtn = document.getElementById("holdBtn");
  const holdArc = document.getElementById("holdArc");
  const holdMsg = document.getElementById("holdMsg");
  if (holdBtn) {
    const LEN = 352;
    let raf = null, p = 0;
    function setArc(v) { holdArc.style.strokeDashoffset = LEN - LEN * v; }
    function step(ts) {
      p = Math.min(1, p + 0.016);
      setArc(p);
      if (p >= 1) { done(); return; }
      raf = requestAnimationFrame(step);
    }
    function start(e) {
      e.preventDefault();
      holdBtn.classList.add("holding");
      raf = requestAnimationFrame(step);
    }
    function cancel() {
      holdBtn.classList.remove("holding");
      cancelAnimationFrame(raf);
      if (p < 1) {
        const from = p;
        let s = null;
        const back = function (t) {
          if (!s) s = t;
          const k = Math.min(1, (t - s) / 500);
          p = from * (1 - k); setArc(p);
          if (k < 1) requestAnimationFrame(back);
        };
        requestAnimationFrame(back);
      }
    }
    function done() {
      holdBtn.classList.remove("holding");
      p = 0; setArc(0);
      holdMsg.classList.add("show");
      const r = holdBtn.getBoundingClientRect();
      burstHearts(r.left + r.width / 2, r.top + r.height / 2, 60);
      if (hasGSAP) gsap.fromTo(holdBtn, { scale: 1 }, { scale: 1.15, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" });
    }
    holdBtn.addEventListener("pointerdown", start);
    holdBtn.addEventListener("pointerup", cancel);
    holdBtn.addEventListener("pointerleave", cancel);
    holdBtn.addEventListener("pointercancel", cancel);
  }

  /* -------------------------------------------------
     16. REPLAY + DOT NAV + SCROLL PROGRESS
  ------------------------------------------------- */
  document.getElementById("replayBtn").addEventListener("click", function () {
    const top = document.getElementById("hero");
    if (lenis) lenis.scrollTo(0); else window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    if (song.paused) playSong();
  });

  const dotLinks = Array.prototype.slice.call(document.querySelectorAll(".dots a"));
  if ("IntersectionObserver" in window) {
    const nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        dotLinks.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id);
        });
      });
    }, { threshold: 0.35 });
    ["hero", "gratitude", "us", "gallery", "portraits", "moments", "letters", "finale"].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) nio.observe(el);
    });
  }
  dotLinks.forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      const el = document.querySelector(a.getAttribute("href"));
      if (el) scrollToEl(el);
    });
  });

  const scrollBar = document.getElementById("scrollBar");
  function updateProgress() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - innerHeight;
    const p = max > 0 ? (window.scrollY / max) * 100 : 0;
    scrollBar.style.width = p + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  if (lenis) lenis.on("scroll", updateProgress);
  updateProgress();

  /* -------------------------------------------------
     17. HEART PARTICLES + BURST
  ------------------------------------------------- */
  const canvas = document.getElementById("hearts");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, DPR = Math.min(devicePixelRatio || 1, 2);
  const particles = [];
  const bursts = [];

  function resize() {
    W = canvas.width = innerWidth * DPR;
    H = canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
  }
  resize();
  window.addEventListener("resize", resize);

  function makeParticle(initial) {
    const star = Math.random() < 0.42;
    return {
      x: Math.random() * W, y: initial ? Math.random() * H : H + 30,
      s: ((star ? 3 : 5) + Math.random() * (star ? 7 : 9)) * DPR,
      vy: (0.25 + Math.random() * 0.65) * DPR,
      vx: (Math.random() - 0.5) * 0.35 * DPR,
      a: 0.2 + Math.random() * 0.45,
      star: star,
      color: star ? "#e8d29a" : (Math.random() < 0.3 ? "#8b1019" : "#c4202d"),
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.02
    };
  }
  const COUNT = Math.min(30, Math.floor(innerWidth / 44));
  for (let i = 0; i < COUNT; i++) particles.push(makeParticle(true));

  function burstHearts(x, y, n) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = (2 + Math.random() * 9) * DPR;
      const star = Math.random() < 0.45;
      bursts.push({
        x: x * DPR, y: y * DPR,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 3 * DPR,
        s: ((star ? 4 : 6) + Math.random() * 10) * DPR, life: 1,
        star: star,
        color: star ? "#e8d29a" : (Math.random() < 0.35 ? "#8b1019" : "#d2202f")
      });
    }
  }
  window.burstHearts = burstHearts;

  function heartPath(c, s) {
    c.beginPath();
    c.moveTo(0, s * 0.35);
    c.bezierCurveTo(0, -s * 0.1, -s * 0.5, -s * 0.15, -s * 0.5, s * 0.2);
    c.bezierCurveTo(-s * 0.5, s * 0.6, -s * 0.1, s * 0.8, 0, s);
    c.bezierCurveTo(s * 0.1, s * 0.8, s * 0.5, s * 0.6, s * 0.5, s * 0.2);
    c.bezierCurveTo(s * 0.5, -s * 0.15, 0, -s * 0.1, 0, s * 0.35);
    c.closePath();
  }

  /* four-point sparkle star — the neoclassical/gothic ✦ glyph */
  function starPath(c, s) {
    const a = s, b = s * 0.24;
    c.beginPath();
    c.moveTo(0, -a);
    c.quadraticCurveTo(b, -b, a, 0);
    c.quadraticCurveTo(b, b, 0, a);
    c.quadraticCurveTo(-b, b, -a, 0);
    c.quadraticCurveTo(-b, -b, 0, -a);
    c.closePath();
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(function (p, i) {
      p.y -= p.vy;
      p.x += p.vx + Math.sin(p.y / (90 * DPR)) * 0.3 * DPR;
      p.rot += p.vr;
      if (p.y < -40) particles[i] = makeParticle(false);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.color;
      if (p.star) starPath(ctx, p.s); else heartPath(ctx, p.s);
      ctx.fill(); ctx.restore();
    });
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.vy += 0.12 * DPR;
      b.x += b.vx; b.y += b.vy;
      b.life -= 0.012;
      if (b.life <= 0) { bursts.splice(i, 1); continue; }
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.life * 3);
      ctx.globalAlpha = Math.max(b.life, 0);
      ctx.fillStyle = b.color;
      if (b.star) starPath(ctx, b.s * (0.5 + b.life)); else heartPath(ctx, b.s * (0.5 + b.life));
      ctx.fill(); ctx.restore();
    }
    requestAnimationFrame(tick);
  }
  if (!reduceMotion) tick();
  else canvas.style.display = "none";

  /* refresh triggers once everything loaded */
  window.addEventListener("load", function () {
    if (hasGSAP) ScrollTrigger.refresh();
  });
})();
