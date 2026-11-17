/* Acme ad "live" · "Watch it coach a call."
   Shared by live_h.html (1920x1080) and live_v.html (1080x1920).
   window.AD = { w, h, id } picks the layout. Deterministic: every
   continuous value is a pure function of timeline time. */
(function () {
  const AD = window.AD;
  const W = AD.w;
  const H = AD.h;
  const HOR = W > H;
  const DUR = 19.8;
  const L = 16.93; // end card tile pop, music final hit
  const BEAT = 0.7053; // groove period, first downbeat 2.81

  const MARK = "M0 0L56 0L80 24L80 72L56 96L0 96ZM22 14L50.2 14L66 29.8L66 66.2L50.2 82L22 82Z";
  const mark = (h) =>
    `<svg class="mk" viewBox="0 0 80 96" width="${((h * 80) / 96).toFixed(1)}" height="${h}"><path fill-rule="evenodd" d="${MARK}"/></svg>`;
  const check = (s, sw) =>
    `<svg viewBox="0 0 24 24" width="${s}" height="${s}"><path d="M4.5 12.8l4.6 4.6L19.5 7" fill="none" stroke="currentColor" stroke-width="${sw || 3.2}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const watch = (s) =>
    `<svg viewBox="0 0 24 24" width="${s}" height="${s}"><circle cx="12" cy="13.5" r="7.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 13.5V9.5M9.5 3h5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`;

  /* ---------------- story ---------------- */
  const LINES = [
    { id: "p1", rep: false, parts: [{ text: "We’re pretty happy with our current tool.", t: 1.32, e: 2.08 }] },
    { id: "r1", rep: true, parts: [{ text: "Fair. What does a slipped release cost you today?", t: 3.54, e: 4.16 }] },
    {
      id: "p2",
      rep: false,
      tag: { text: "Price objection", t: 6.37 },
      parts: [{ text: "Honestly it’s the price. We’d need to see ROI first.", t: 5.02, e: 5.95 }],
    },
    { id: "r2", rep: true, parts: [{ text: "Fair. What would another quarter of this cost you?", t: 8.48, e: 9.1 }] },
    {
      id: "p3",
      rep: false,
      parts: [
        { text: "…A lot, actually.", t: 9.91, e: 10.24 },
        { text: "Let’s get my CFO on a call.", t: 10.61, e: 11.02 },
      ],
    },
  ];
  const CARDS = [
    { id: "c1", enter: 2.14, ts: 2.18, land: 2.82, used: 4.24, repStart: 3.54, sug: "Ask what it costs them when a release slips." },
    {
      id: "c2",
      enter: 6.39,
      ts: 6.39,
      land: 7.79,
      used: 9.2,
      repStart: 8.48,
      sug: "Reframe on the cost of waiting.",
      pb: "“Fair. What would another quarter of this cost you?”",
    },
  ];
  const CHIP_T = 11.3;
  const PUSH_T = 11.3;
  const PULL_T = 12.71;
  const KIN = [
    { t: 13.41, html: 'Acme <span class="lime">listens.</span>' },
    { t: 14.47, html: 'Acme <span class="lime">suggests.</span>' },
    { t: 15.53, html: 'Your rep <span class="lime">answers.</span>' },
  ];
  const KIN_OUT = 16.59;

  /* ---------------- layout ---------------- */
  const X = HOR
    ? {
        title: { size: 112, w: 1800, top: 38, s: 0.34 },
        panel: { x: 80, y: 116, w: 1760, h: 924 },
        hdrH: 96,
        live: { x: 44, fs: 24, clock: 30 },
        label: { fs: 26 },
        chip: { fs: 25, pad: "12px 24px 12px 18px", icon: 24 },
        wave: { top: 96, h: 150, spkX: 44, spkFs: 22, svgX: 290, svgR: 44 },
        ts: { x: 44, y: 262, w: 1036, h: 626, lbl: 23, fs: 56, gap: 32 },
        col: { x: 1130, y: 282, w: 586, fs: 22, cardsY: 334, cardsH: 560 },
        card: { pad: "24px 28px 28px", brand: 25, mk: 23, timer: 23, sug: 44, pbl: 20, pb: 31, gap: 18 },
        kin: { fs: 196, w: 1800 },
        end: { tile: 196, wm: 212, gap: 44, cy: 432, tagFs: 58, tagY: 612, urlFs: 44, urlY: 712 },
      }
    : {
        title: { size: 100, w: 1000, top: 104, s: 0.47 },
        panel: { x: 36, y: 268, w: 1008, h: 1560 },
        hdrH: 152,
        live: { x: 40, fs: 30, clock: 38 },
        label: { fs: 32 },
        chip: { fs: 29, pad: "12px 26px 12px 20px", icon: 28 },
        wave: { top: 152, h: 170, spkX: 40, spkFs: 25, svgX: 250, svgR: 40 },
        ts: { x: 40, y: 332, w: 928, h: 730, lbl: 27, fs: 60, gap: 38 },
        col: { x: 40, y: 1088, w: 928, fs: 26, cardsY: 1142, cardsH: 450 },
        card: { pad: "28px 34px 34px", brand: 29, mk: 26, timer: 26, sug: 48, pbl: 24, pb: 37, gap: 0 },
        kin: { fs: 184, w: 1000 },
        end: { tile: 272, wm: 236, cy: 700, wmY: 962, tagFs: 72, tagY: 1236, urlFs: 58, urlY: 1356 },
      };

  const px = (n) => n + "px";
  const root = document.getElementById("root");
  const bg = document.getElementById("bg");
  const call = document.getElementById("scene-call");
  const endS = document.getElementById("scene-end");

  /* ---------------- DOM ---------------- */
  bg.innerHTML = `<div class="bg-grid"></div><div class="bg-glow"></div>
    <svg class="bg-noise" width="100%" height="100%"><filter id="nz"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#nz)"/></svg>`;

  const titleWords = ["Watch", "Acme", "coach", "a", "live", "call."];
  const titleHTML = titleWords
    .map((w, i) => `<span class="w${i >= 4 ? " lime" : ""}">${w}</span>`)
    .join(" ");

  const P = X.panel;
  let ts = "";
  LINES.forEach((ln) => {
    const words = [];
    ln.parts.forEach((pt, pi) =>
      pt.text.split(" ").forEach((w) => words.push(`<span class="w" data-p="${pi}">${w}</span>`)),
    );
    const tag = ln.tag
      ? `<span class="tag" style="font-size:${px(X.ts.lbl - 3)};padding:${HOR ? "4px 14px" : "5px 16px"}"><i style="width:${HOR ? 9 : 11}px;height:${HOR ? 9 : 11}px"></i>${ln.tag.text}</span>`
      : "";
    ts += `<div class="ln ${ln.rep ? "rep" : "pro"}" id="ln-${ln.id}" style="padding-left:${HOR ? 28 : 30}px;margin-bottom:${px(X.ts.gap)}">${ln.rep ? '<div class="bar"></div>' : ""}
      <div class="who" style="font-size:${px(X.ts.lbl)};margin-bottom:${HOR ? 8 : 10}px;height:${px(Math.round(X.ts.lbl * 1.6))}"><span class="who-t">${ln.rep ? "Your rep" : "Prospect"}</span>${tag}</div>
      <div class="tx" style="font-size:${px(X.ts.fs)};line-height:1.16">${words.join(" ")}</div></div>`;
  });

  const C = X.card;
  const cardHTML = (c) => {
    const top = (inner) => `<div class="top" style="margin-bottom:${HOR ? 14 : 18}px">
        <div class="brand" style="font-size:${px(C.brand)}">${mark(C.mk)}<span>Acme</span></div>
        <div class="meta">${inner}<div class="timer" style="font-size:${px(C.timer)};padding:${HOR ? "5px 14px 5px 11px" : "6px 16px 6px 13px"}">${watch(C.timer)}<span class="tv">0.0s</span></div></div>
      </div>`;
    const used = `<div class="used" style="font-size:${px(C.timer)};padding:${HOR ? "5px 14px 5px 10px" : "6px 16px 6px 12px"}">${check(C.timer)}Used</div>`;
    const sug = c.sug.split(" ").map((w) => `<span class="w" style="display:inline-block">${w}</span>`).join(" ");
    const pb = c.pb
      ? `<div class="pb-l" style="font-size:${px(C.pbl)};margin:${HOR ? "18px 0 8px" : "22px 0 10px"}">From your playbook</div>
         <div class="pb" style="font-size:${px(C.pb)};line-height:1.2;padding-left:${HOR ? 16 : 18}px">${c.pb}</div>`
      : "";
    const sk = HOR ? 30 : 38;
    return `<div class="card" id="${c.id}">
      <div class="ring" style="position:absolute;inset:-3px;border-radius:27px;border:3px solid var(--lime);opacity:0"></div>
      <div class="ghost-l"></div><div class="fill-l"></div>
      <div class="gh" style="padding:${C.pad}">${top("")}
        <div class="skel sk1" style="height:${sk}px;width:88%;margin-bottom:14px"></div>
        <div class="skel sk2" style="height:${sk}px;width:56%"></div></div>
      <div class="fl" style="padding:${C.pad}">${top(used)}
        <div class="sug" style="font-size:${px(C.sug)};line-height:1.1">${sug}</div>${pb}</div>
    </div>`;
  };

  const chipHTML = `<div class="chip" id="chip" style="font-size:${px(X.chip.fs)};padding:${X.chip.pad}"><div class="chip-ring"></div>${check(X.chip.icon, 3.4)}<span>Next step booked</span></div>`;

  call.innerHTML = `
    <div class="panel" id="panel" style="left:${px(P.x)};top:${px(P.y)};width:${px(P.w)};height:${px(P.h)}">
      <div class="hdr" id="hdr" style="height:${px(X.hdrH)}">
        <div class="live-pill" id="livepill" style="left:${px(X.live.x)};top:0;height:${px(HOR ? X.hdrH : 92)};font-size:${px(X.live.fs)}">
          <div class="live-dot-wrap"><div class="live-ring" id="lring"></div><div class="live-dot" id="ldot"></div></div>
          <span>LIVE</span>
          <span class="clock" id="clock" style="font-size:${px(X.live.clock)};margin-left:${HOR ? 10 : 12}px">03:12</span>
          ${HOR ? `<span class="sep" style="height:34px;margin:0 10px 0 14px"></span>` : ""}
        </div>
        <div class="call-label" id="calllabel" style="font-size:${px(X.label.fs)};${
          HOR ? "left:318px;top:0;height:96px;display:flex;align-items:center" : "left:40px;top:88px"
        }">Call with&nbsp;<b>Northwind Logistics</b></div>
        <div id="chipwrap" style="position:absolute;right:${px(X.live.x)};top:0;height:${px(HOR ? X.hdrH : 92)};display:flex;align-items:center">${chipHTML}</div>
      </div>
      <div class="wave" style="top:${px(X.wave.top)};height:${px(X.wave.h)}">
        <div class="spk" style="left:${px(X.wave.spkX)};top:0;height:100%;justify-content:center;font-size:${px(X.wave.spkFs)}">
          <div class="spk-row spk-p" id="spkP"><i></i>Prospect</div>
          <div class="spk-row spk-r" id="spkR"><i></i>Your rep</div>
        </div>
        <svg id="wsvg" style="left:${px(X.wave.svgX)};top:0" width="${P.w - X.wave.svgX - X.wave.svgR}" height="${X.wave.h}">
          <line class="mid" x1="0" x2="${P.w - X.wave.svgX - X.wave.svgR}" y1="${X.wave.h / 2}" y2="${X.wave.h / 2}"/>
          <path class="ghost" id="wg"/><path class="main" id="wm"/>
        </svg>
      </div>
      <div class="ts" id="ts" style="left:${px(X.ts.x)};top:${px(X.ts.y)};width:${px(X.ts.w)};height:${px(X.ts.h)}"><div class="ts-inner" id="tsi" style="padding-top:34px">${ts}</div></div>
      ${HOR ? `<div style="position:absolute;left:${px(X.col.x - 26)};top:${px(X.ts.y)};width:1px;height:${px(X.ts.h)};background:var(--line)"></div>` : `<div style="position:absolute;left:40px;right:40px;top:${px(X.col.y - 22)};height:1px;background:var(--line)"></div>`}
      <div class="col-label" id="collabel" style="left:${px(X.col.x)};top:${px(X.col.y)};font-size:${px(X.col.fs)}">
        <span style="color:var(--lime);display:flex">${mark(X.col.fs)}</span>Acme · live suggestions</div>
      <div class="cards" id="cards" style="left:${px(X.col.x)};top:${px(X.col.cardsY)};width:${px(X.col.w)};height:${px(X.col.cardsH)}">
        ${CARDS.map(cardHTML).join("")}
      </div>
    </div>
    <div class="title" id="title" style="top:${px(X.title.top)};width:${px(X.title.w)};font-size:${px(X.title.size)}">${titleHTML}</div>
    <div class="kin" id="kin">${KIN.map(
      (k, i) => `<div class="ph" id="ph${i}" style="font-size:${px(X.kin.fs)};width:${px(X.kin.w)};opacity:0">${k.html}</div>`,
    ).join("")}</div>`;

  const E = X.end;
  endS.innerHTML = `<div class="end">
    <div class="tile" id="tile" style="width:${px(E.tile)};height:${px(E.tile)};border-radius:${px(Math.round(E.tile * 0.24))}">${mark(Math.round(E.tile * 0.5))}</div>
    <div class="wordmark" id="wordmark" style="font-size:${px(E.wm)}">Acme</div>
    <div class="tagline" id="tagline" style="font-size:${px(E.tagFs)};left:0;right:0;top:${px(E.tagY)}">AI sales coaching.</div>
    <div class="url" id="url" style="font-size:${px(E.urlFs)};left:50%;top:${px(E.urlY)};padding:${HOR ? "12px 36px" : "16px 44px"}">acme.example</div>
  </div>`;
  // the col-label mark takes the lime colour
  document.querySelectorAll("#collabel svg path").forEach((p) => (p.style.fill = "var(--lime)"));

  /* ---------------- helpers ---------------- */
  const sstep = (a, b, x) => {
    const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };
  const el = (id) => document.getElementById(id);

  // speech windows for the waveform
  const SEG = [];
  LINES.forEach((ln) => ln.parts.forEach((pt, i) => SEG.push({ a: pt.t - 0.05, b: pt.e + 0.3, rep: ln.rep, ph: i * 1.7 + pt.t })));
  const env = (s, t) => sstep(s.a - 0.08, s.a + 0.1, t) * (1 - sstep(s.b - 0.12, s.b + 0.18, t));

  const wsvg = el("wsvg");
  const WW = +wsvg.getAttribute("width");
  const WH = X.wave.h;
  const N = HOR ? 150 : 110;
  const wavePath = (t, a, k) => {
    let d = "";
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * WW;
      const u = i / N;
      const win = Math.pow(Math.sin(Math.PI * u), 1.4);
      const f =
        0.55 * Math.sin(x * 0.034 * k + t * 8.7 * k) +
        0.3 * Math.sin(x * 0.083 - t * 12.9 + 1.3 * k) +
        0.2 * Math.sin(x * 0.19 + t * 19.3 + 2.1) +
        0.1 * Math.sin(x * 0.41 - t * 27.1);
      const y = WH / 2 - (WH * 0.62) * a * win * f;
      d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }
    return d;
  };

  const clock = el("clock");
  const ldot = el("ldot");
  const lring = el("lring");
  const spkP = el("spkP");
  const spkR = el("spkR");
  const wm = el("wm");
  const wg = el("wg");
  const timers = CARDS.map((c) => ({ c, els: el(c.id).querySelectorAll(".tv") }));

  const S = { t: 0 };
  function render() {
    const t = S.t;
    // call clock
    const sec = 12 + Math.max(0, Math.floor(t - 1.0));
    clock.textContent = "03:" + String(sec).padStart(2, "0");
    // live dot, pulsing on every other beat
    let fr = ((t - 2.81) / (BEAT * 2)) % 1;
    if (fr < 0) fr += 1;
    lring.style.transform = `scale(${(1 + 1.5 * fr).toFixed(3)})`;
    lring.style.opacity = (0.85 * (1 - fr)).toFixed(3);
    ldot.style.opacity = (0.75 + 0.25 * Math.cos(fr * Math.PI * 2)).toFixed(3);
    // waveform
    let aP = 0;
    let aR = 0;
    SEG.forEach((s) => {
      const e = env(s, t);
      if (s.rep) aR = Math.max(aR, e);
      else aP = Math.max(aP, e);
    });
    const syl =
      0.55 + 0.45 * Math.abs(Math.sin(2 * Math.PI * 3.3 * t + 0.7)) * (0.72 + 0.28 * Math.sin(2 * Math.PI * 0.93 * t));
    const amp = 0.06 + 0.02 * Math.sin(t * 2.1) + (aR * 1.0 + aP * 0.78) * syl;
    wm.setAttribute("d", wavePath(t, amp, 1));
    wg.setAttribute("d", wavePath(t + 0.37, amp * 0.62, 1.31));
    spkP.style.opacity = (0.3 + 0.7 * aP).toFixed(3);
    spkR.style.opacity = (0.3 + 0.7 * aR).toFixed(3);
    // suggestion timers: count to 1.4s exactly as the card lands
    timers.forEach(({ c, els }) => {
      const v = Math.min(1, Math.max(0, (t - c.ts) / (c.land - c.ts))) * 1.4;
      const s = (Math.floor(v * 10 + 1e-6) / 10).toFixed(1) + "s";
      els.forEach((e) => (e.textContent = s));
    });
  }

  /* ---------------- timeline ---------------- */
  function build() {
    const tl = gsap.timeline({ paused: true });
    tl.to(S, { t: DUR, duration: DUR, ease: "none", onUpdate: render }, 0);
    render();

    // --- title lands, then moves to the top
    const title = el("title");
    const th = title.offsetHeight;
    const y0 = H / 2 - th / 2 - X.title.top - (HOR ? 0 : 40);
    tl.fromTo(title, { y: y0, scale: 1 }, { y: 0, scale: X.title.s, duration: 0.42, ease: "power3.inOut" }, 0.8);
    tl.fromTo(
      "#title .w",
      { opacity: 0, y: 70, rotateX: -50 },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.5, ease: "expo.out", stagger: 0.07 },
      0.04,
    );
    tl.to(title, { opacity: 0, duration: 0.35, ease: "power2.in" }, PULL_T);

    // --- panel in
    const panel = el("panel");
    tl.fromTo(panel, { opacity: 0, y: 80, scale: 0.965 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "expo.out" }, 0.94);
    tl.fromTo(
      ["#livepill", "#calllabel", ".spk", "#wsvg", "#collabel"],
      { opacity: 0, x: -24 },
      { opacity: 1, x: 0, duration: 0.4, ease: "power3.out", stagger: 0.06 },
      1.02,
    );

    // --- transcript
    const tsi = el("tsi");
    const RH = X.ts.h;
    const blocks = LINES.map((ln) => el("ln-" + ln.id));
    LINES.forEach((ln, i) => {
      const b = blocks[i];
      const t0 = ln.parts[0].t;
      // push: keep the newest line in view
      const bottom = b.offsetTop + b.offsetHeight;
      const target = Math.min(0, RH - bottom);
      tl.to(tsi, { y: target, duration: 0.5, ease: "power3.out" }, t0 - 0.14);
      // dim older lines
      if (i > 0) tl.to(blocks.slice(0, i), { opacity: 0.36, duration: 0.3, ease: "power2.out" }, t0 - 0.1);
      tl.fromTo(b.querySelector(".who-t"), { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.25, ease: "power3.out" }, t0 - 0.12);
      if (ln.rep) {
        tl.fromTo(b.querySelector(".bar"), { scaleY: 0 }, { scaleY: 1, duration: 0.35, ease: "power3.out" }, t0 - 0.12);
      }
      ln.parts.forEach((pt, pi) => {
        const ws = b.querySelectorAll(`.tx .w[data-p="${pi}"]`);
        const step = (pt.e - pt.t) / Math.max(1, ws.length - 1);
        ws.forEach((w, wi) => {
          tl.fromTo(w, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" }, pt.t + wi * step);
        });
      });
      if (ln.tag) {
        const tg = b.querySelector(".tag");
        tl.fromTo(tg, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(3)" }, ln.tag.t);
      }
    });

    // --- Acme cards
    const c1 = el("c1");
    const c2 = el("c2");
    CARDS.forEach((c) => {
      const card = el(c.id);
      const gh = card.querySelector(".gh");
      const fill = card.querySelector(".fill-l");
      const fl = card.querySelector(".fl");
      const ring = card.querySelector(".ring");
      const used = card.querySelector(".used");
      gsap.set(card, { transformOrigin: "50% 0%" });
      gsap.set([fill, fl], { opacity: 0 });
      gsap.set(used, { opacity: 0, scale: 0.4 });
      // ghost slides in, timer counts
      tl.fromTo(
        card,
        HOR ? { opacity: 0, x: 90 } : { opacity: 0, y: 70 },
        HOR ? { opacity: 1, x: 0, duration: 0.34, ease: "power3.out" } : { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" },
        c.enter,
      );
      tl.fromTo(
        card.querySelectorAll(".skel"),
        { opacity: 0.35 },
        { opacity: 1, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: Math.max(1, Math.round((c.land - c.enter) / 0.18) - 1), stagger: 0.09 },
        c.enter + 0.1,
      );
      // land: fill, pop, ring burst
      tl.to(gh, { opacity: 0, duration: 0.08 }, c.land);
      tl.to(fill, { opacity: 1, duration: 0.08 }, c.land);
      tl.to(fl, { opacity: 1, duration: 0.08 }, c.land);
      tl.fromTo(card, { scale: 0.93 }, { scale: 1, duration: 0.55, ease: "back.out(3.2)", immediateRender: false }, c.land);
      tl.fromTo(ring, { opacity: 0.9, scale: 1 }, { opacity: 0, scale: 1.08, duration: 0.55, ease: "power2.out" }, c.land);
      tl.fromTo(
        card.querySelectorAll(".sug .w"),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.26, ease: "power3.out", stagger: 0.035 },
        c.land + 0.04,
      );
      const pbEls = card.querySelectorAll(".pb-l, .pb");
      if (pbEls.length)
        tl.fromTo(pbEls, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out", stagger: 0.08 }, c.land + 0.22);
      // rep starts saying it: the card nudges
      tl.fromTo(ring, { opacity: 0.55, scale: 1 }, { opacity: 0, scale: 1.05, duration: 0.5, ease: "power2.out", immediateRender: false }, c.repStart - 0.05);
      // used stamp
      tl.to(used, { opacity: 1, scale: 1, duration: 0.42, ease: "back.out(3)" }, c.used);
    });
    // card 1 makes room for card 2
    if (HOR) {
      const drop = c2.offsetHeight + C.gap;
      tl.to(c1, { y: drop, opacity: 0.38, scale: 0.97, duration: 0.42, ease: "power3.inOut" }, CARDS[1].enter - 0.06);
    } else {
      tl.to(c1, { y: -50, opacity: 0, scale: 0.96, duration: 0.3, ease: "power2.in" }, CARDS[1].enter - 0.1);
    }

    // --- next step booked chip
    const chip = el("chip");
    gsap.set(chip, { transformOrigin: "100% 50%" });
    tl.fromTo(chip, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2.6)" }, CHIP_T);
    tl.fromTo(chip.querySelector(".chip-ring"), { opacity: 0.9, scale: 1 }, { opacity: 0, scale: 1.35, duration: 0.7, ease: "power2.out" }, CHIP_T + 0.05);
    tl.fromTo(el("hdr"), { backgroundColor: "rgba(34,165,91,0)" }, { backgroundColor: "rgba(34,165,91,0.10)", duration: 0.5, ease: "power2.out" }, CHIP_T);

    // --- push in, then pull back and dim
    gsap.set(panel, { transformOrigin: "50% 50%" });
    tl.to(panel, { scale: 1.025, duration: PULL_T - PUSH_T, ease: "sine.inOut" }, PUSH_T);
    tl.to(panel, { scale: 0.84, opacity: 0.2, filter: "blur(6px)", duration: 0.62, ease: "power3.inOut" }, PULL_T);
    KIN.forEach((k, i) => tl.fromTo(panel, { scale: 0.855 }, { scale: 0.84, duration: 0.4, ease: "power2.out", immediateRender: false }, k.t));
    tl.to(panel, { opacity: 0, duration: 0.25, ease: "power2.in" }, KIN_OUT - 0.1);

    // --- kinetic type, hard cuts on the beat
    KIN.forEach((k, i) => {
      const ph = el("ph" + i);
      tl.set(ph, { opacity: 1 }, k.t);
      tl.fromTo(ph, { scale: 1.1, y: 10 }, { scale: 1, y: 0, duration: 0.4, ease: "expo.out", immediateRender: false }, k.t);
      tl.set(ph, { opacity: 0 }, i < KIN.length - 1 ? KIN[i + 1].t : KIN_OUT);
    });

    // --- end card at L
    const tile = el("tile");
    const wmk = el("wordmark");
    const tag = el("tagline");
    const url = el("url");
    const wmW = wmk.offsetWidth;
    const wmH = wmk.offsetHeight;
    if (HOR) {
      const gw = E.tile + E.gap + wmW;
      const lx = (W - gw) / 2;
      gsap.set(tile, { left: lx, top: E.cy - E.tile / 2 });
      gsap.set(wmk, { left: lx + E.tile + E.gap, top: E.cy - wmH / 2 - E.wm * 0.02 });
    } else {
      gsap.set(tile, { left: (W - E.tile) / 2, top: E.cy - E.tile / 2 });
      gsap.set(wmk, { left: (W - wmW) / 2, top: E.wmY });
    }
    gsap.set(url, { xPercent: -50 });
    tl.fromTo(tile, { scale: 0, rotation: -14 }, { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2.4)" }, L);
    tl.fromTo(
      wmk,
      { clipPath: "inset(0% 100% -10% 0%)", x: -30 },
      { clipPath: "inset(0% 0% -10% 0%)", x: 0, duration: 0.5, ease: "power3.out" },
      L + 0.35,
    );
    tl.fromTo(tag, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, L + 0.65);
    tl.fromTo(url, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2.6)" }, L + 0.9);

    window.__timelines[AD.id] = tl;
  }

  document.fonts
    .load("800 100px Inter")
    .then(() => document.fonts.load("700 50px Inter"))
    .then(() => document.fonts.ready)
    .then(build);
})();
