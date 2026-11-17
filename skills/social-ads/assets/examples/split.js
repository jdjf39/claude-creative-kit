/* "Same objection. Two reps."  Shared build for split_v.html / split_h.html.
   Reads window.AD = {w, h}. Builds all DOM, then registers one paused timeline. */
window.buildSplit = function () {
  var AD = window.AD;
  var V = AD.h > AD.w;
  var ID = V ? "split_v" : "split_h";
  var L = 19.75;

  // ---------- layout per format ----------
  var C = V
    ? {
        pad: 72, mastTop: 72, mastSize: 22,
        titleSize: 190,
        topPanel: { top: 180, h: 720 }, rule: 928, botPanel: { top: 960, h: 910 },
        labelSize: 72, spkSize: 25, quoteSize: 52, cardSize: 50, gap: 28,
        stampSize: 78,
        bigSize: 134, bigW: 950, subSize: 60, subW: 930,
        chipSize: 74, tileSize: 300, wordSize: 230, tagSize: 64, pillSize: 52,
      }
    : {
        pad: 96, mastTop: 58, mastSize: 20,
        titleSize: 176,
        panelTop: 168, panelH: 862, panelW: 780,
        labelSize: 40, spkSize: 22, quoteSize: 50, cardSize: 46, gap: 36,
        stampSize: 76,
        bigSize: 168, bigW: 1600, subSize: 58, subW: 1600,
        chipSize: 72, tileSize: 230, wordSize: 200, tagSize: 52, pillSize: 40,
      };

  var root = document.getElementById(ID);
  root.style.setProperty("--pad", C.pad + "px");

  function h(tag, cls, html, parent, style) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (style) for (var k in style) e.style[k] = style[k];
    if (parent) parent.appendChild(e);
    return e;
  }
  var DMARK =
    '<svg viewBox="0 0 80 96" aria-hidden="true"><path fill-rule="evenodd" d="M0 0L56 0L80 24L80 72L56 96L0 96ZM22 14L50.2 14L66 29.8L66 66.2L50.2 82L22 82Z"/></svg>';

  // seeded rng
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  // ---------- scene containers (clips live in HTML) ----------
  var sTitle = document.getElementById(ID + "-title");
  var sCall = document.getElementById(ID + "-call");
  var sBig = document.getElementById(ID + "-big");
  var sChips = document.getElementById(ID + "-chips");
  var sEnd = document.getElementById(ID + "-end");

  // ---------- title ----------
  var tWrap = h("div", "title-wrap", null, sTitle);
  tWrap.style.fontSize = C.titleSize + "px";
  var t1 = h("div", "tline", '<span class="tin">Same objection.</span>', tWrap);
  var t2 = h("div", "tline", '<span class="tin">Two reps.</span>', tWrap);
  var tRule = h("div", "title-rule", null, sTitle);
  var tKick = h("div", "title-kick", "A pricing objection · two answers", sTitle);
  tKick.style.fontSize = (V ? 30 : 28) + "px";

  // ---------- call scene ----------
  var mast = h("div", "mast", null, sCall);
  mast.style.top = C.mastTop + "px";
  mast.style.fontSize = C.mastSize + "px";
  var mastL = h("span", "", "Harness · discovery call", mast);
  var mastR = h("span", "", "Objection · price", mast);
  var mastRule = h("div", "mast-rule", null, sCall);
  mastRule.style.top = C.mastTop + C.mastSize + 22 + "px";

  var pA, pB, divider;
  if (V) {
    pA = h("div", "panel", null, sCall, { left: C.pad + "px", right: C.pad + "px", top: C.topPanel.top + "px", height: C.topPanel.h + "px" });
    pB = h("div", "panel", null, sCall, { left: C.pad + "px", right: C.pad + "px", top: C.botPanel.top + "px", height: C.botPanel.h + "px" });
    divider = h("div", "divider-h", null, sCall, { top: C.rule + "px", left: C.pad + "px", right: C.pad + "px" });
  } else {
    pA = h("div", "panel", null, sCall, { left: C.pad + "px", width: C.panelW + "px", top: C.panelTop + "px", height: C.panelH + "px" });
    pB = h("div", "panel", null, sCall, { left: AD.w - C.pad - C.panelW + "px", width: C.panelW + "px", top: C.panelTop + "px", height: C.panelH + "px" });
    divider = h("div", "divider-v", null, sCall, { left: AD.w / 2 + "px", top: C.panelTop + "px", height: C.panelH + "px" });
  }
  [pA, pB].forEach(function (p) {
    p.style.setProperty("--q", C.quoteSize + "px");
    p.style.setProperty("--spk", C.spkSize + "px");
    p.style.setProperty("--gap", C.gap + "px");
  });

  var labA = h("div", "lab lab-without", "Without Acme", pA);
  var labB = h("div", "lab lab-with", '<span class="chip-lime">With Acme</span>', pB);
  labA.style.fontSize = labB.style.fontSize = C.labelSize + "px";

  function line(parent, speaker, cls) {
    var wrap = h("div", "line " + (cls || ""), null, parent);
    var spk = h("div", "spk", speaker, wrap);
    var q = h("div", "quote", null, wrap);
    return { wrap: wrap, spk: spk, q: q };
  }
  var A1 = line(pA, "Marcus · Prospect", "prospect");
  var A2 = line(pA, "Rep", "rep");
  var A3 = line(pA, "Marcus · Prospect", "prospect");

  var B1 = line(pB, "Marcus · Prospect", "prospect");
  var card = h("div", "card", null, pB);
  card.style.fontSize = C.cardSize + "px";
  var cardHead = h("div", "card-head", '<span class="card-mark">' + DMARK + '</span><span class="card-title">Acme · say this next</span><span class="lat">1.4s</span>', card);
  var cardQ = h("div", "card-q", "“Fair. What would another quarter of this cost you?”", card);
  var B2 = line(pB, "Rep", "rep");
  var B3 = line(pB, "Marcus · Prospect", "prospect");

  var stampA = h("div", "stamp stamp-red", "Deal lost", pA);
  var stampB = h("div", "stamp stamp-green", V ? "Next meeting booked" : "<span style=\"display:block\">Next meeting</span><span style=\"display:block\">booked</span>", pB);
  stampA.style.fontSize = C.stampSize + "px";
  stampB.style.fontSize = C.stampSize * (V ? 0.8 : 0.82) + "px";
  // stamps sit centred over the lower transcript, like ink on paper
  stampA.style.right = stampB.style.right = "10px";
  stampA.style.bottom = V ? "36px" : "60px";
  stampB.style.bottom = V ? "26px" : "30px";

  // ---------- typing ----------
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function typer(el, text, seed) {
    var r = rng(seed), acc = 0, cum = [];
    for (var i = 0; i < text.length; i++) {
      var c = text[i], prev = text[i - 1];
      var w = 0.7 + r() * 0.7;
      if (c === " ") w += 0.35;
      if (prev === "." || prev === "," || prev === "?") w += 2.4;
      acc += w; cum.push(acc);
    }
    var state = { p: 0 };
    function render() {
      var p = state.p, n = 0;
      if (p >= 1) n = text.length;
      else { var target = p * acc; while (n < text.length && cum[n] <= target) n++; }
      var caret = p > 0 && p < 1 ? '<span class="caret"></span>' : "";
      el.innerHTML = '<span class="typed">' + esc(text.slice(0, n)) + "</span>" + caret + '<span class="ghost">' + esc(text.slice(n)) + "</span>";
    }
    render();
    return { state: state, render: render };
  }
  function addType(tl, el, text, start, dur, seed) {
    var t = typer(el, "“" + text + "”", seed);
    tl.fromTo(t.state, { p: 0 }, { p: 1, duration: dur, ease: "none", onUpdate: t.render, immediateRender: false }, start);
  }

  // ---------- big type ----------
  var big = h("div", "big", null, sBig, { width: C.bigW + "px", fontSize: C.bigSize + "px" });
  var bigWords = ["The", "difference", "was"].map(function (w) { return h("span", "bw", w, big); });
  var bigHi = h("span", "bw hi", "one line.", big);
  bigWords.push(bigHi);
  var sub = h("div", "sub", null, sBig, { width: C.subW + "px", fontSize: C.subSize + "px" });
  var subText = "Acme gives your reps the right line, live, on every call.";
  var subWords = subText.split(" ").map(function (w) { return h("span", "sw", w, sub); });

  // ---------- chips ----------
  var chipsWrap = h("div", "chips chips-v", null, sChips);
  var chipData = [["01", "Before the call", "Preps every call"], ["02", "On the call", "Coaches it live"], ["03", "After the call", "Reviews every call"]];
  var chips = chipData.map(function (d) {
    var col = h("div", "chip-col", null, chipsWrap);
    var meta = h("div", "chip-meta", '<span class="num">' + d[0] + "</span> · " + d[1], col);
    meta.style.fontSize = (V ? 26 : 22) + "px";
    var chip = h("div", "chip", '<span class="tick"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" /></svg></span><span>' + d[2] + "</span>", col);
    chip.style.fontSize = C.chipSize + "px";
    return { col: col, meta: meta, chip: chip, tick: chip.querySelector(".tick") };
  });

  // ---------- end card ----------
  var end = h("div", "end " + (V ? "end-v" : "end-h"), null, sEnd);
  var lockup = h("div", "lockup", null, end);
  var tile = h("div", "tile", DMARK, lockup, { width: C.tileSize + "px", height: C.tileSize + "px", borderRadius: C.tileSize * 0.24 + "px" });
  var wmWrap = h("div", "wm-wrap", null, lockup);
  var wm = h("div", "wm", "Acme", wmWrap, { fontSize: C.wordSize + "px" });
  var endBelow = h("div", "end-below", null, end);
  var tag = h("div", "tag", "AI sales coaching.", endBelow, { fontSize: C.tagSize + "px" });
  var pill = h("div", "pill", "acme.example", endBelow, { fontSize: C.pillSize + "px" });

  // =====================================================================
  var tl = gsap.timeline({ paused: true });

  // --- 0.00 to 1.95  title ---
  tl.fromTo(t1.firstChild, { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: "power4.out" }, 0.12);
  tl.fromTo(tRule, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power3.inOut" }, 0.3);
  tl.fromTo(t2.firstChild, { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: "power4.out" }, 0.85);
  tl.fromTo(tKick, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, 1.05);
  tl.to([t1.firstChild, t2.firstChild], { yPercent: -110, duration: 0.32, ease: "power3.in", stagger: 0.05 }, 1.62);
  tl.to(tRule, { scaleX: 0, transformOrigin: "right center", duration: 0.3, ease: "power3.in" }, 1.66);
  tl.to(tKick, { opacity: 0, duration: 0.2 }, 1.66);

  // --- 1.95  panels open ---
  tl.fromTo(mastRule, { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power3.out" }, 1.9);
  tl.fromTo([mastL, mastR], { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", stagger: 0.06 }, 1.95);
  tl.fromTo(divider, V ? { scaleX: 0 } : { scaleY: 0 }, V ? { scaleX: 1, duration: 0.45, ease: "power3.out" } : { scaleY: 1, duration: 0.45, ease: "power3.out" }, 1.95);
  tl.fromTo(labA, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, 2.0);
  tl.fromTo(labB.firstChild, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.4)" }, 2.04);
  function spk(l, t) { tl.fromTo(l.spk, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.25, ease: "power2.out" }, t); }

  // prospect line, both sides, simultaneously
  spk(A1, 2.2); spk(B1, 2.2);
  var PROS = "Honestly it's the price. We'd need to see ROI first.";
  addType(tl, A1.q, PROS, 2.3, 1.55, 11);
  addType(tl, B1.q, PROS, 2.3, 1.55, 11);

  // --- without side ---
  spk(A2, 4.38);
  addType(tl, A2.q, "Totally, let me check with the team and circle back.", 4.5, 2.0, 23);
  spk(A3, 7.08);
  addType(tl, A3.q, "Sure. Just send something over.", 7.2, 0.95, 37);
  // transcript scrolls: first line collapses to make room for the stamp
  function collapse(l, t) {
    tl.to(l.wrap, { height: 0, marginBottom: -C.gap, opacity: 0, duration: 0.34, ease: "power3.inOut" }, t);
  }
  collapse(A1, 8.18);
  // DEAL LOST stamp 8.6
  tl.fromTo(stampA, { scale: 2.4, opacity: 0, rotation: -18 }, { scale: 1, opacity: 1, rotation: -9, duration: 0.14, ease: "power4.in" }, 8.46);
  tl.to(pA, { keyframes: { x: [0, -7, 6, -3, 0], y: [0, 4, -3, 1, 0] }, duration: 0.22, ease: "none" }, 8.6);
  tl.to([A1.wrap, A2.wrap, A3.wrap, labA], { opacity: 0.45, duration: 0.4 }, 8.7);

  // --- with side ---
  tl.fromTo(card, { scale: 0.7, opacity: 0, y: 24 }, { scale: 1, opacity: 1, y: 0, duration: 0.42, ease: "back.out(2.2)", transformOrigin: "left top" }, 4.6);
  tl.fromTo(card.querySelector(".lat"), { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(3)" }, 4.82);
  // groove drop 5.64: card punches, rep begins
  tl.to(card, { keyframes: { scale: [1, 1.035, 1] }, duration: 0.3, ease: "power2.out" }, 5.64);
  spk(B2, 5.58);
  addType(tl, B2.q, "Fair. What would another quarter of this cost you?", 5.7, 1.6, 51);
  spk(B3, 7.9);
  addType(tl, B3.q, "Honestly? A lot. Let's get my CFO on a call.", 8.0, 1.4, 67);
  collapse(B1, 9.5);
  tl.fromTo(stampB, { scale: 2.4, opacity: 0, rotation: 4 }, { scale: 1, opacity: 1, rotation: -6, duration: 0.14, ease: "power4.in" }, 9.86);
  tl.to(pB, { keyframes: { x: [0, 6, -5, 2, 0], y: [0, 4, -3, 1, 0] }, duration: 0.22, ease: "none" }, 10.0);

  // --- 11.0 without desaturates, shrinks away; with takes the stage ---
  tl.to(pA, { filter: "grayscale(1)", opacity: 0.55, duration: 0.4, ease: "power1.out" }, 11.0);
  tl.to([mastL, mastR, mastRule], { opacity: 0, duration: 0.3 }, 11.4);
  tl.to(divider, { opacity: 0, duration: 0.25 }, 11.45);
  if (V) {
    tl.to(pA, { scale: 0.72, y: -260, opacity: 0, duration: 0.5, ease: "power3.in" }, 11.4);
    tl.to(pB, { y: (AD.h - C.botPanel.h) / 2 - C.botPanel.top, duration: 0.75, ease: "power3.inOut" }, 11.7);
  } else {
    tl.to(pA, { scale: 0.72, x: -300, opacity: 0, duration: 0.5, ease: "power3.in" }, 11.4);
    tl.to(pB, { x: (AD.w - C.panelW) / 2 - (AD.w - C.pad - C.panelW), scale: 1.06, duration: 0.75, ease: "power3.inOut" }, 11.7);
  }
  // highlighter across the rep's line
  tl.to(stampB, { opacity: 0, scale: 0.9, duration: 0.3 }, 12.1);
  tl.to([B3.wrap, labB, card], { opacity: 0.35, duration: 0.3 }, 12.1);
  tl.fromTo(B2.q.parentNode, { "--hl": "0%" }, { "--hl": "100%", duration: 0.45, ease: "power2.inOut" }, 12.3);
  // panel clears
  tl.to(pB, { y: V ? "-=120" : 0, yPercent: V ? 0 : -8, opacity: 0, duration: 0.4, ease: "power3.in" }, 13.0);

  // big type
  tl.fromTo(bigWords, { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: "power4.out", stagger: 0.09 }, 13.4);
  tl.fromTo(bigHi, { "--hl": "0%" }, { "--hl": "100%", duration: 0.4, ease: "power2.inOut" }, 13.8);
  tl.fromTo(subWords, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out", stagger: 0.045 }, 14.3);
  tl.to([big, sub], { y: -60, opacity: 0, duration: 0.35, ease: "power3.in", stagger: 0.04 }, 15.35);

  // chips cascade
  chips.forEach(function (c, i) {
    var t = 15.65 + i * 0.36;
    tl.fromTo(c.meta, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, t - 0.05);
    tl.fromTo(c.chip, { scale: 0.6, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(2.6)" }, t);
    tl.fromTo(c.tick, { scale: 0, rotation: -45 }, { scale: 1, rotation: 0, duration: 0.3, ease: "back.out(3)" }, t + 0.16);
  });
  tl.to(chips.map(function (c) { return c.col; }), { scale: 0.7, opacity: 0, y: V ? -40 : 0, duration: 0.32, ease: "power3.in", stagger: 0.06 }, 19.0);

  // end card, tile pops at L
  tl.fromTo(tile, { scale: 0, rotation: -12 }, { scale: 1, rotation: 0, duration: 0.55, ease: "back.out(2.2)" }, L);
  tl.fromTo(wm, { clipPath: "inset(0 100% 0 0)", x: -30 }, { clipPath: "inset(0 0% 0 0)", x: 0, duration: 0.45, ease: "power3.out" }, L + 0.35);
  tl.fromTo(tag, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, L + 0.65);
  tl.fromTo(pill, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.6)" }, L + 0.9);
  tl.set({}, {}, 22.5);

  return tl;
};
