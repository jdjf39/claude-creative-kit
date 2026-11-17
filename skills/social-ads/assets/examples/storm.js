/* Acme ad "storm": shared build for storm_v.html (1080x1920) and storm_h.html (1920x1080).
   window.AD = { w, h, id } picks the layout. Everything is built before the timeline is registered.
   The notification storm, badge, buzz and flying cards are a pure function of time (render(t)),
   driven by one tween on the paused root timeline, so any seek is exact. */
(function () {
  const AD = window.AD;
  const W = AD.w;
  const H = AD.h;
  const V = H > W;
  const DUR = 22.5;
  const L = 19.75; // end card tile pop, lands on the music's final hit
  const BEAT = 0.7055; // groove grid: 5.64 + n * BEAT, n = 20 lands on L
  const B = (n) => +(5.64 + n * BEAT).toFixed(3);

  const scene = document.getElementById("scene");
  const el = (tag, cls, html, parent, style) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (style) Object.assign(e.style, style);
    (parent || scene).appendChild(e);
    return e;
  };
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const outCubic = (x) => 1 - Math.pow(1 - x, 3);
  const inQuad = (x) => x * x;
  const outBack = (x, s = 1.70158) => {
    const c3 = s + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  };
  function mulberry(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry(20260928);

  // ---------- layout per format ----------
  const C = V
    ? {
        camIn: { cx: 540, cy: 1420, s: 1.46 },
        cam0: { cx: 540, cy: 1310, s: 1.5 },
        camD: { cx: 540, cy: 1322, s: 1.58 },
        type: { l: 80, t: 104, w: 920, h: 450 },
        fs: 122,
        fsWhy: 320,
        fsLong: 100,
        wcScale: 1.9,
        tile: { cx: 540, cy: 760, s: 290 },
        word: { cx: 540, top: 948, fs: 210 },
        tagline: { cx: 540, top: 1196, fs: 68 },
        pill: { cx: 540, top: 1312, fs: 50 },
      }
    : {
        camIn: { cx: 1410, cy: 820, s: 1.3 },
        cam0: { cx: 1410, cy: 740, s: 1.35 },
        camD: { cx: 1370, cy: 614, s: 1.3 },
        type: { l: 120, t: 0, w: 920, h: 1080 },
        fs: 120,
        fsWhy: 330,
        fsLong: 100,
        wcScale: 1.6,
        tile: { cx: 600, cy: 430, s: 256 },
        word: { left: 782, cy: 430, fs: 250 },
        tagline: { cx: 960, top: 640, fs: 72 },
        pill: { cx: 960, top: 764, fs: 52 },
      };
  const camXY = (c) => ({ x: c.cx - 230, y: c.cy - 480, scale: c.s });

  // ---------- icons ----------
  const D_PATH = "M12 0L68 0L80 12L80 84L68 96L12 96L0 84L0 12ZM20 20L60 20L60 76L20 76Z" /* placeholder mark: swap in your own logo path */;
  const dMark = (fill, w, hgt) =>
    `<svg viewBox="0 0 80 96" width="${w}" height="${hgt}"><path fill="${fill}" fill-rule="evenodd" d="${D_PATH}"/></svg>`;
  const pipeIcon =
    '<svg viewBox="0 0 48 48" width="48" height="48"><rect x="11" y="13" width="26" height="5" rx="2.5" fill="#fff"/><rect x="11" y="21.5" width="19" height="5" rx="2.5" fill="#fff" opacity=".9"/><rect x="11" y="30" width="11" height="5" rx="2.5" fill="#fff" opacity=".8"/></svg>';
  const statusIcons = (c) =>
    `<svg class="icons" viewBox="0 0 74 18" width="74" height="18"><rect x="0" y="11" width="4" height="7" rx="1" fill="${c}"/><rect x="6" y="8" width="4" height="10" rx="1" fill="${c}"/><rect x="12" y="4" width="4" height="14" rx="1" fill="${c}"/><rect x="18" y="0" width="4" height="18" rx="1" fill="${c}"/><rect x="36" y="2" width="32" height="14" rx="4" fill="none" stroke="${c}" stroke-width="2" opacity=".55"/><rect x="39" y="5" width="22" height="8" rx="2" fill="${c}"/><rect x="69.5" y="6.5" width="2.5" height="5" rx="1" fill="${c}" opacity=".55"/></svg>`;
  const arcs = (flip) =>
    `<svg viewBox="0 0 70 220" width="70" height="220" style="transform:scaleX(${flip ? -1 : 1})"><g fill="none" stroke="#F4F1EA" stroke-width="7" stroke-linecap="round"><path d="M14 80 Q30 110 14 140"/><path d="M34 58 Q58 110 34 162"/><path d="M54 36 Q86 110 54 184"/></g></svg>`;

  // ---------- world ----------
  el("div", null, null, scene, {}).id = "bg";
  const glowO = el("div", "glow");
  glowO.id = "glowOlive";
  const glowR = el("div", "glow");
  glowR.id = "glowRed";
  const glowL = el("div", "glow");
  glowL.id = "glowLime";
  const redwash = el("div");
  redwash.id = "redwash";

  // ---------- phone ----------
  const phoneWrap = el("div");
  phoneWrap.id = "phoneWrap";
  const worldCards = el("div");
  worldCards.id = "worldCards";
  const buzzL = el("div", "buzz", arcs(true), phoneWrap, { left: "-92px" });
  const buzzR = el("div", "buzz", arcs(false), phoneWrap, { left: "482px" });
  const phoneShake = el("div", null, null, phoneWrap);
  phoneShake.id = "phoneShake";
  const phone = el("div", null, null, phoneShake);
  phone.id = "phone";
  el("div", "sidebtn", null, phone, { left: "-5px", top: "200px", height: "60px" });
  el("div", "sidebtn", null, phone, { left: "-5px", top: "280px", height: "96px" });
  el("div", "sidebtn", null, phone, { right: "-5px", top: "250px", height: "130px" });
  const screen = el("div", null, null, phone);
  screen.id = "screen";
  el("div", null, null, screen).id = "wall";
  const wallRed = el("div", null, null, screen);
  wallRed.id = "wallRed";
  const wallDim = el("div", null, null, screen);
  wallDim.id = "wallDim";
  el("div", "status", statusIcons("#F4F1EA"), screen);
  const lock = el(
    "div",
    null,
    '<div class="date">Monday, March 9</div><div class="clock">8:12</div>',
    screen,
  );
  lock.id = "lock";
  const stack = el("div", null, null, screen);
  stack.id = "stack";

  // notification copy (all made up, no real brands)
  const PRE = [
    ["Deal lost", "Northwind Logistics · $48k", 1],
    ["Deal lost", "Halcyon Grid", 1],
    ["Maya Rosenthal", "I'll circle back on pricing", 0],
    ["Deal lost", "Fenwick Robotics", 1],
    ["Forecast at risk", "This quarter", 1],
    ["Deal lost", "Ostrander Freight · $22k", 1],
    ["Maya Rosenthal", "Let me check with the team", 0],
    ["Deal stalled", "Kestrel Health", 1],
    ["Deal lost", "Juniper Mills · $57k", 1],
  ];
  const MORE = [
    ["Deal lost", "Corvid Systems · $36k", 1],
    ["No reply", "Marlow Foods", 1],
    ["Deal lost", "Alder & Pike", 1],
    ["Forecast at risk", "This quarter", 1],
    ["Maya Rosenthal", "I'll circle back on pricing", 0],
    ["Deal lost", "Tessellate Labs · $64k", 1],
    ["Deal stalled", "Birchwood Supply", 1],
    ["Deal lost", "Northwind Logistics · $48k", 1],
    ["Deal lost", "Quarry Street Media", 1],
    ["No reply", "Halcyon Grid", 1],
    ["Deal lost", "Fenwick Robotics", 1],
    ["Deal lost", "Pemberton Air · $29k", 1],
  ];
  const PRE_T = [1.41, 2.47, 3.17, 3.7, 4.23, 4.58, 4.93, 5.2, 5.42];
  const TOR_T = [];
  for (let t = 5.64; t < 8.98; ) {
    TOR_T.push(+t.toFixed(3));
    const p = (t - 5.64) / 3.34;
    t += 0.24 - 0.165 * Math.pow(p, 0.8);
  }
  const ARR = PRE_T.concat(TOR_T);
  const N = ARR.length;
  const whenLbl = (i) => (i < 3 ? "now" : "now");
  const cardHTML = (c, when) =>
    `<div class="tint"></div><div class="ic">${pipeIcon}</div><div class="app">PIPELINE</div><div class="when">${when}</div><div class="ti${c[2] ? " bad" : ""}">${c[0]}</div><div class="bo">${c[1]}</div>`;
  const cards = [];
  for (let i = 0; i < N; i++) {
    const c = i < PRE.length ? PRE[i] : MORE[(i - PRE.length) % MORE.length];
    const e = el("div", "nc", cardHTML(c, whenLbl(i)), stack);
    cards.push({ e, tint: e.firstChild, r1: rnd(), r2: rnd(), torrent: i >= PRE.length });
  }
  // newest on top in paint order
  cards.forEach((c, i) => (c.e.style.zIndex = String(10 + i)));

  // world cards bursting out of the phone during the torrent
  const WC = [];
  const WCN = 22;
  for (let k = 0; k < WCN; k++) {
    const c = MORE[(k * 5 + 3) % MORE.length];
    const e = el("div", "nc wc", cardHTML(c, "now"), worldCards);
    const side = k % 2 === 0 ? 1 : -1;
    let ang;
    if (V) {
      ang = (side > 0 ? 0 : Math.PI) + (rnd() - 0.45) * 0.9 * side;
    } else {
      ang = (rnd() - 0.5) * 2.6; // rightward fan, up to about 75 degrees up or down
    }
    WC.push({
      e,
      t0: +(5.7 + k * 0.145 + rnd() * 0.06).toFixed(3),
      life: 1.3 + rnd() * 0.35,
      ang,
      dist: (V ? 760 : 900) + rnd() * 200,
      r0: (rnd() - 0.5) * 16,
      spin: (rnd() - 0.5) * 50,
      oy: (V ? 60 : -40) + (rnd() - 0.5) * 260,
    });
  }

  // Acme notification + expanded view
  const dn = el(
    "div",
    null,
    `<div class="ic"><div style="position:absolute;left:13px;top:10px">${dMark("#EDFC47", 22, 27)}</div></div><div class="app">ACME</div><div class="when">now</div><div class="ti">Maya is slipping.</div><div class="bo">She dodged the price question in 6 of her last 10 calls.</div>`,
    screen,
  );
  dn.id = "dn";
  const dnHalo = el("div", null, null, screen);
  dnHalo.id = "dnHalo";
  const exp = el("div", null, null, screen);
  exp.id = "exp";
  const app = el("div", null, null, screen);
  app.id = "app";
  const appStatus = el("div", "status", `<div class="stime">8:12</div>${statusIcons("#0F0F0F")}`, app);
  const hdr = el(
    "div",
    "hdr",
    `<div class="tile"><div style="position:absolute;left:11px;top:8px">${dMark("#0F0F0F", 20, 25)}</div></div><div class="nm">Acme</div><div class="chip">Coaching</div>`,
    app,
  );
  const rep = el(
    "div",
    null,
    '<div class="av">MR</div><div class="nm">Maya Rosenthal</div><div class="sub">Harness · last 10 calls</div><div class="stat"><div class="big">0%</div><div class="small">team avg 14%</div></div>',
    app,
  );
  rep.id = "rep";
  const lbl = el("div", null, "<i></i>THE MISSED MOMENT", app);
  lbl.id = "lbl";
  const bubM = el("div", "bub", "<b>Marcus</b>Honestly it's the price. We'd need to see ROI first.", app);
  bubM.id = "bubM";
  const bubY = el("div", "bub", "<b>Maya</b>Totally, let me check with the team and circle back.", app);
  bubY.id = "bubY";
  const tagRed = el("div", null, "Dodged the price question", app);
  tagRed.id = "tagRed";
  const QUOTE = "Fair. What would another quarter of this cost you?".split(" ");
  const fix = el(
    "div",
    null,
    `<div class="k">WHAT SHE SHOULD HAVE SAID</div><div class="q">${QUOTE.map((w) => `<span>${w}</span>`).join("")}</div><div class="pb">From your playbook</div>`,
    app,
  );
  fix.id = "fix";
  const qWords = Array.from(fix.querySelectorAll(".q span"));
  const btn = el(
    "div",
    null,
    '<div id="btnA">Assign course</div><div id="btnG"><div class="l1"><svg width="24" height="24" viewBox="0 0 24 24"><polyline id="chk" points="4,12.5 10,18 20,6" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="30" stroke-dashoffset="30"/></svg>Assigned</div><div class="l2">Maya is off live calls until she finishes</div></div>',
    app,
  );
  btn.id = "btn";
  const btnA = btn.querySelector("#btnA");
  const btnG = btn.querySelector("#btnG");
  const chk = btn.querySelector("#chk");
  const sparks = [];
  for (let k = 0; k < 12; k++) {
    sparks.push(el("div", "spark", null, app, { background: k % 3 === 0 ? "#22A55B" : k % 3 === 1 ? "#EDFC47" : "#0F0F0F" }));
  }
  const tap = el("div", "tap", null, screen);
  const rip = el("div", "rip", null, screen);
  const limeFlash = el("div", null, null, screen);
  limeFlash.id = "limeFlash";
  el("div", null, null, screen).id = "camhole";
  const badge = el("div", null, "1", phone);
  badge.id = "badge";

  // ---------- type ----------
  const type = el("div", null, null, scene, {
    left: C.type.l + "px",
    top: C.type.t + "px",
    width: C.type.w + "px",
    height: C.type.h + "px",
  });
  type.id = "type";
  // lines: array of arrays of [word, cls]
  function slide(lines, fs, extra) {
    const s = el("div", "slide", null, type, extra || {});
    const out = [];
    lines.forEach((ln) => {
      const lineEl = el("div", "line", null, s, { fontSize: fs + "px" });
      const inners = [];
      ln.forEach(([w, cls]) => {
        const m = el("span", "w", null, lineEl);
        inners.push(el("span", "wi" + (cls ? " " + cls : ""), w, m));
      });
      out.push({ lineEl, inners });
    });
    return { el: s, lines: out, all: out.flatMap((o) => o.inners) };
  }
  // markup: *lime*  !red!  ~dim~ ; "|" breaks lines (explicit, designed per format)
  const mk = (str) =>
    str.split("|").map((ln) =>
      ln
        .trim()
        .split(" ")
        .map((w) => {
          const m = w.match(/^([*!~])(.*)\1$/);
          return m ? [m[2], { "*": "lime", "!": "red", "~": "dim" }[m[1]]] : [w, ""];
        }),
    );

  const sMon = slide(mk("Monday ~morning.~"), C.fs * 0.88);
  const sLost = slide(mk("Another deal lost.|!And! !another.!"), C.fs * 0.9);
  const sWhy = slide(mk("!Why?!"), C.fsWhy);
  sWhy.el.querySelectorAll(".w").forEach((w) => (w.style.overflow = "visible"));
  const sCant = slide(mk(V ? "You can't listen|to !every! !call.!" : "You can't|listen to|!every! !call.!"), C.fs);
  const sCan = slide(mk("*Acme* can."), C.fs * 1.25);
  const sMoment = slide(mk("It finds the|!exact! !moment.!"), C.fs);
  const sSay = slide(mk("And what to|*say* *instead.*"), C.fs);
  const sCoach = slide(mk("Then it|*coaches* *her.*"), C.fs);
  const sFinal = slide(mk("Acme listens to|*every* *call* so you|don't have to."), C.fsLong);

  // ---------- end card ----------
  const end = el("div");
  end.id = "end";
  const ring = el("div", null, null, end, {
    left: C.tile.cx - C.tile.s * 0.75 + "px",
    top: C.tile.cy - C.tile.s * 0.75 + "px",
    width: C.tile.s * 1.5 + "px",
    height: C.tile.s * 1.5 + "px",
  });
  ring.id = "ring";
  const tile = el("div", null, dMark("#0F0F0F", "100%", "100%"), end, {
    left: C.tile.cx - C.tile.s / 2 + "px",
    top: C.tile.cy - C.tile.s / 2 + "px",
    width: C.tile.s + "px",
    height: C.tile.s + "px",
  });
  tile.id = "tile";
  const word = el("div", null, "Acme", end, { fontSize: C.word.fs + "px" });
  word.id = "word";
  const tagline = el("div", null, "AI sales coaching.", end, { fontSize: C.tagline.fs + "px" });
  tagline.id = "tagline";
  const pill = el("div", null, "acme.example", end, {
    fontSize: C.pill.fs + "px",
    padding: `${C.pill.fs * 0.34}px ${C.pill.fs * 0.72}px ${C.pill.fs * 0.4}px`,
  });
  pill.id = "pill";
  if (V) {
    Object.assign(word.style, { left: "0", width: W + "px", textAlign: "center", top: C.word.top + "px" });
    Object.assign(tagline.style, { left: "0", width: W + "px", textAlign: "center", top: C.tagline.top + "px" });
    Object.assign(pill.style, { left: C.pill.cx + "px", top: C.pill.top + "px", transformOrigin: "50% 50%" });
  } else {
    Object.assign(word.style, { left: C.word.left + "px", top: C.word.cy - C.word.fs * 0.52 + "px" });
    Object.assign(tagline.style, { left: "0", width: W + "px", textAlign: "center", top: C.tagline.top + "px" });
    Object.assign(pill.style, { left: C.pill.cx + "px", top: C.pill.top + "px" });
  }

  // glows follow the phone's home position
  [glowO, glowR, glowL].forEach((g) => {
    g.style.left = C.cam0.cx + "px";
    g.style.top = C.cam0.cy - (V ? 260 : 0) + "px";
  });

  // ---------- render(t): storm, badge, buzz, flying cards ----------
  const SWIPE = B(5); // 9.168, a beat
  const ACME = B(6); // 9.873, a beat
  const TOR0 = 5.64;
  const BADGE_TOR = TOR_T.map((_, k) => 9 + Math.round(90 * Math.pow((k + 1) / TOR_T.length, 1.6)));
  const phoneCam = { cx: C.cam0.cx, cy: C.cam0.cy }; // world origin for flying cards

  function render(t) {
    const m = outCubic(clamp((t - TOR0) / 0.45)); // torrent mode
    const gone = t > SWIPE + 0.8;
    // stack
    for (let i = 0; i < N; i++) {
      const c = cards[i];
      const e = (t - ARR[i]) / 0.4;
      if (e <= 0 || gone) {
        c.e.style.visibility = "hidden";
        continue;
      }
      let s = 0;
      for (let j = i + 1; j < N; j++) {
        const p = (t - ARR[j]) / 0.3;
        if (p <= 0) break;
        s += p >= 1 ? 1 : outBack(p, 1.3);
      }
      // calm pile: 4 full cards then compressed peeks
      const calmY = s <= 3 ? 290 + 116 * s : 290 + 348 + 15 * (s - 3);
      const calmSc = s <= 3 ? 1 : 1 - 0.05 * (s - 3);
      const calmOp = s <= 3 ? 1 : clamp(1 - (s - 3) * 0.34);
      const torY = 150 + 102 * s;
      let y = lerp(calmY, torY, m);
      let sc = lerp(calmSc, 1, m);
      let op = lerp(calmOp, 1, m);
      let x = (c.r1 - 0.5) * 22 * m;
      let rot = (c.r2 - 0.5) * 6 * m;
      // entry: drop from above with bounce
      const ee = clamp(e);
      y += -80 * (1 - outCubic(ee));
      sc *= 0.84 + 0.16 * outBack(ee, 2.4);
      op *= clamp(e * 4);
      // swipe away, top cards first
      const sw = clamp((t - SWIPE - 0.012 * Math.min(s, 8)) / 0.3);
      if (sw > 0) {
        const k = inQuad(sw);
        x -= 640 * k;
        rot -= 14 * k;
        y -= 30 * k;
        op *= 1 - clamp((sw - 0.55) / 0.45);
      }
      if (op <= 0.01 || y > 960) {
        c.e.style.visibility = "hidden";
        continue;
      }
      c.e.style.visibility = "visible";
      c.e.style.opacity = op.toFixed(3);
      c.e.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      c.tint.style.opacity = (0.75 * m).toFixed(3);
    }

    // badge
    let nPre = 0;
    for (let i = 0; i < PRE_T.length; i++) if (t >= PRE_T[i]) nPre++;
    let nTor = 0;
    for (let k = 0; k < TOR_T.length; k++) if (t >= TOR_T[k]) nTor++;
    let last = -10;
    for (let i = 0; i < N; i++) if (t >= ARR[i]) last = ARR[i];
    const val = nTor > 0 ? BADGE_TOR[nTor - 1] : nPre;
    badge.textContent = val >= 99 ? "99+" : String(val);
    const dt = t - last;
    let bs = nPre > 0 ? 1 + 0.3 * m : 0;
    if (nPre > 0) {
      if (t - PRE_T[0] < 0.35) bs *= outBack(clamp((t - PRE_T[0]) / 0.35), 3);
      bs *= 1 + 0.28 * Math.exp(-dt / 0.07) * (dt < 0.4 ? 1 : 0);
    }
    const bOut = clamp((t - SWIPE - 0.05) / 0.22);
    if (bOut > 0) bs *= 1 - outBack(bOut, 2) * 1;
    bs = Math.max(0, bs);
    badge.style.transform = `scale(${bs.toFixed(4)})`;
    badge.style.visibility = bs < 0.01 ? "hidden" : "visible";

    // buzz: phone shake + vibration arcs
    let sh = 0;
    let env = 0;
    const buzzTimes = ARR.concat([ACME + 0.02]);
    for (let i = 0; i < buzzTimes.length; i++) {
      const d = t - buzzTimes[i];
      if (d < 0 || d > 0.45) continue;
      const soft = buzzTimes[i] === ACME + 0.02 ? 0.45 : 1;
      sh += soft * Math.exp(-d / 0.1) * Math.sin(d * 2 * Math.PI * 21);
      env = Math.max(env, soft * Math.exp(-d / 0.14));
    }
    if (t > TOR0 && t < SWIPE) {
      sh += 0.55 * m * Math.sin(t * 2 * Math.PI * 17);
      env = Math.max(env, 0.7 * m);
    }
    sh = clamp(sh, -1.4, 1.4);
    phoneShake.style.transform = `translate(${(sh * 9).toFixed(2)}px,0) rotate(${(sh * 1.3).toFixed(3)}deg)`;
    const ao = env * (t < SWIPE ? 1 : t < ACME ? 0 : 1);
    [buzzL, buzzR].forEach((b, idx) => {
      b.style.opacity = clamp(ao).toFixed(3);
      const push = (1 - env) * 20 * (idx ? 1 : -1);
      b.style.transform = `translateX(${push.toFixed(1)}px) scale(${(0.85 + 0.2 * env).toFixed(3)})`;
    });

    // flying world cards
    const fade = 1 - clamp((t - SWIPE) / 0.18);
    for (let k = 0; k < WCN; k++) {
      const w = WC[k];
      const p = (t - w.t0) / w.life;
      if (p <= 0 || p >= 1 || fade <= 0) {
        w.e.style.visibility = "hidden";
        continue;
      }
      const d = w.dist * outCubic(p);
      const ox = phoneCam.cx + Math.cos(w.ang) * d;
      const oy = phoneCam.cy + w.oy + Math.sin(w.ang) * d * (V ? 1 : 0.9);
      const sc = C.wcScale * (0.62 + 0.38 * outCubic(p));
      const rot = w.r0 + w.spin * p;
      w.e.style.visibility = "visible";
      w.e.style.opacity = (clamp(p * 8) * (1 - clamp((p - 0.72) / 0.28)) * fade).toFixed(3);
      w.e.style.transform = `translate(${(ox - 204).toFixed(1)}px,${(oy - 55).toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
    }
  }

  // ---------- timeline ----------
  const tl = gsap.timeline({ paused: true });
  const clock = { t: 0 };
  render(0);
  tl.to(clock, { t: DUR, duration: DUR, ease: "none", onUpdate: () => render(clock.t) }, 0);

  const wordIn = (s, at, opt) => {
    const o = Object.assign({ stagger: 0.06, dur: 0.55 }, opt || {});
    tl.fromTo(
      s,
      { yPercent: 150, rotation: 6 },
      { yPercent: 0, rotation: 0, duration: o.dur, ease: "expo.out", stagger: o.stagger },
      at,
    );
  };
  const wordOut = (s, at) =>
    tl.to(s, { yPercent: -115, duration: 0.26, ease: "power3.in", stagger: 0.02 }, at);
  const allWords = [sMon, sLost, sWhy, sCant, sCan, sMoment, sSay, sCoach, sFinal].flatMap((s) => s.all);
  tl.set(allWords, { yPercent: 150 }, 0);

  // camera
  tl.fromTo(phoneWrap, camXY(C.camIn), Object.assign(camXY(C.cam0), { duration: 0.9, ease: "expo.out" }), 0);
  tl.to(phoneWrap, Object.assign(camXY({ cx: C.cam0.cx, cy: C.cam0.cy, s: C.cam0.s * 1.02 }), { duration: 4.4, ease: "sine.inOut" }), 1.0);
  // torrent: hard punch in on the drop, then settle, snap back on the swipe
  tl.to(phoneWrap, Object.assign(camXY({ cx: C.cam0.cx, cy: C.cam0.cy + (V ? 30 : 40), s: C.cam0.s * (V ? 1.08 : 1.05) }), { duration: 0.18, ease: "power4.out" }), TOR0);
  tl.to(phoneWrap, Object.assign(camXY({ cx: C.cam0.cx, cy: C.cam0.cy + (V ? 0 : 30), s: C.cam0.s * (V ? 1.05 : 1.03) }), { duration: 3.2, ease: "none" }), TOR0 + 0.18);
  tl.to(phoneWrap, Object.assign(camXY(C.cam0), { duration: 0.5, ease: "expo.out" }), SWIPE);
  // into the Acme view
  tl.to(phoneWrap, Object.assign(camXY(C.camD), { duration: 0.8, ease: "power3.inOut" }), B(8) + 0.02);
  tl.to(phoneWrap, Object.assign(camXY(C.cam0), { duration: 0.7, ease: "power3.inOut" }), B(17) - 0.2);

  // glows and washes
  tl.fromTo(glowO, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" }, 0);
  tl.to(glowO, { opacity: 0, duration: 0.2 }, TOR0);
  tl.fromTo(glowR, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1.15, duration: 0.35, ease: "power3.out" }, TOR0);
  tl.to(glowR, { opacity: 0, duration: 0.3, ease: "power2.out" }, SWIPE + 0.1);
  tl.fromTo(redwash, { opacity: 0 }, { opacity: 1, duration: 0.3 }, TOR0);
  tl.to(redwash, { opacity: 0, duration: 0.25 }, SWIPE + 0.1);
  const flash = el("div");
  flash.id = "flash";
  tl.fromTo(flash, { opacity: 0.55 }, { opacity: 0, duration: 0.45, ease: "power2.out" }, TOR0);
  tl.set(flash, { opacity: 0 }, 0);
  tl.fromTo(wallRed, { opacity: 0 }, { opacity: 1, duration: 0.4 }, TOR0);
  tl.to(wallRed, { opacity: 0, duration: 0.25 }, SWIPE + 0.12);
  tl.to(wallDim, { opacity: 0.3, duration: 0.3 }, SWIPE + 0.12);
  tl.to(lock, { opacity: 0.25, scale: 0.9, duration: 0.35, ease: "power3.out" }, TOR0);
  tl.to(lock, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, SWIPE + 0.3);
  tl.fromTo(glowL, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }, ACME);
  tl.to(glowL, { opacity: 0, duration: 0.4 }, B(19) + 0.1);

  // swipe finger
  tl.fromTo(tap, { x: 400, y: 470, opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.14, ease: "power2.out" }, SWIPE - 0.2);
  tl.to(tap, { x: -60, y: 440, duration: 0.3, ease: "power2.in" }, SWIPE - 0.02);
  tl.to(tap, { opacity: 0, duration: 0.1 }, SWIPE + 0.2);

  // ---- slides ----
  wordIn(sMon.all, 0.04);
  wordOut(sMon.all, 1.18);
  wordIn(sLost.lines[0].inners, PRE_T[0] + 0.02);
  wordIn(sLost.lines[1].inners, PRE_T[1] + 0.02);
  tl.to(sLost.lines[0].lineEl, { opacity: 0.38, duration: 0.3 }, PRE_T[1]);
  wordOut(sLost.all, 3.98);
  // Why? slams in on the beat
  tl.fromTo(sWhy.all, { yPercent: 0, scale: 2.4, opacity: 0 }, { yPercent: 0, scale: 1, opacity: 1, duration: 0.32, ease: "power4.out" }, B(-2));
  tl.to(sWhy.el, { keyframes: { x: [0, -14, 12, -8, 5, 0] }, duration: 0.3, ease: "none" }, B(-2) + 0.1);
  tl.to(sWhy.all, { scale: 0.8, opacity: 0, duration: 0.18, ease: "power3.in" }, 5.44);
  wordIn(sCant.all, TOR0, { stagger: 0.07, dur: 0.45 });
  // swiped away with the notifications
  tl.to(sCant.el, { x: -1400, rotation: -4, duration: 0.34, ease: "power2.in" }, SWIPE);
  wordIn(sCan.all, ACME + 0.12, { stagger: 0.12 });
  wordOut(sCan.all, B(9) - 0.4);
  wordIn(sMoment.all, B(9) - 0.08);
  wordOut(sMoment.all, B(11) - 0.3);
  wordIn(sSay.all, B(11) - 0.02);
  wordOut(sSay.all, B(14) - 0.3);
  wordIn(sCoach.all, B(14) + 0.1);
  wordOut(sCoach.all, B(17) - 0.3);
  wordIn(sFinal.all, B(17), { stagger: 0.05 });
  tl.to(sFinal.all, { yPercent: -115, duration: 0.3, ease: "power3.in", stagger: 0.015 }, B(19) - 0.05);

  // ---- Acme notification ----
  tl.fromTo(dn, { y: 60, opacity: 0, scale: 0.86 }, { y: 290, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)" }, ACME);
  tl.fromTo(dnHalo, { y: 290, opacity: 0.9, boxShadow: "0 0 0 0px rgba(237,252,71,0.85)" }, { opacity: 0, boxShadow: "0 0 0 26px rgba(237,252,71,0)", duration: 0.8, ease: "power2.out" }, ACME + 0.4);
  // tap
  const TAP1 = B(8); // 11.284
  tl.fromTo(tap, { x: 330, y: 470, opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.2, ease: "power2.out" }, TAP1 - 0.36);
  tl.to(tap, { scale: 0.78, duration: 0.08, ease: "power2.in" }, TAP1 - 0.08);
  tl.to(tap, { scale: 1, opacity: 0, duration: 0.25, ease: "power2.out" }, TAP1);
  tl.fromTo(rip, { x: 330, y: 470, opacity: 0.9, scale: 0.6 }, { opacity: 0, scale: 2.4, duration: 0.45, ease: "power2.out" }, TAP1);
  tl.to(dn, { scale: 0.965, duration: 0.08, ease: "power2.in" }, TAP1 - 0.08);
  tl.to(dn, { scale: 1, duration: 0.12, ease: "power2.out" }, TAP1);
  // expand into the Acme view
  tl.set(exp, { opacity: 1 }, TAP1 + 0.04);
  tl.set(dn, { opacity: 0 }, TAP1 + 0.06);
  tl.fromTo(exp, { left: 12, top: 290, width: 408, height: 150, borderRadius: 30 }, { left: 0, top: 0, width: 432, height: 932, borderRadius: 62, duration: 0.45, ease: "power4.inOut" }, TAP1 + 0.04);
  tl.to(app, { opacity: 1, duration: 0.2 }, TAP1 + 0.4);
  const T_APP = TAP1 + 0.45;
  tl.fromTo([appStatus, hdr], { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "expo.out", stagger: 0.05 }, T_APP);
  tl.fromTo(rep, { y: 40, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, T_APP + 0.1);
  const T_LBL = B(9) - 0.08; // with "It finds the exact moment."
  tl.fromTo(lbl, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "expo.out" }, T_LBL);
  const T_M = B(9) + 0.3525; // half beat
  tl.fromTo(bubM, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2)" }, T_M);
  const T_Y = B(10);
  tl.fromTo(bubY, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2)" }, T_Y);
  const T_TAG = B(10) + 0.3525;
  tl.fromTo(tagRed, { scale: 2.2, opacity: 0, rotation: -10 }, { scale: 1, opacity: 1, rotation: -3, duration: 0.22, ease: "power4.in" }, T_TAG - 0.22);
  tl.to(bubY, { keyframes: { x: [0, -6, 5, -3, 0] }, duration: 0.25, ease: "none" }, T_TAG);
  const T_FIX = B(11);
  tl.fromTo(fix, { y: 90, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.5)" }, T_FIX);
  tl.fromTo(qWords, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out", stagger: 0.075 }, T_FIX + 0.18);
  const T_BTN = B(12) + 0.3525;
  tl.fromTo(btn, { y: 140, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }, T_BTN);
  // tap assign
  const TAP2 = B(14); // 15.517
  tl.fromTo(tap, { x: 290, y: 800, opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.22, ease: "power2.out" }, TAP2 - 0.42);
  tl.to(tap, { scale: 0.78, duration: 0.08, ease: "power2.in" }, TAP2 - 0.08);
  tl.to(tap, { scale: 1, opacity: 0, duration: 0.3, ease: "power2.out" }, TAP2);
  tl.fromTo(rip, { x: 290, y: 800, opacity: 0.9, scale: 0.6 }, { opacity: 0, scale: 2.6, duration: 0.5, ease: "power2.out" }, TAP2);
  tl.to(btn, { scale: 0.95, y: 4, boxShadow: "0 1px 0 #0F0F0F", duration: 0.08, ease: "power2.in" }, TAP2 - 0.08);
  tl.to(btn, { scale: 1, y: 0, height: 88, borderColor: "#22A55B", boxShadow: "0 5px 0 #146b3a", duration: 0.45, ease: "back.out(2.2)" }, TAP2 + 0.02);
  tl.to(btnA, { opacity: 0, duration: 0.1 }, TAP2 + 0.02);
  tl.to(btnG, { opacity: 1, duration: 0.14 }, TAP2 + 0.04);
  tl.to(chk, { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" }, TAP2 + 0.1);
  sparks.forEach((sp, k) => {
    const a = (k / sparks.length) * Math.PI * 2 + 0.2;
    const r = 150 + (k % 3) * 40;
    tl.fromTo(
      sp,
      { x: 216, y: 772, opacity: 1, scale: 1 },
      { x: 216 + Math.cos(a) * r, y: 772 + Math.sin(a) * r * 0.55, opacity: 0, scale: 0.3, duration: 0.6, ease: "power3.out" },
      TAP2 + 0.06,
    );
  });

  // ---- exit into the end card ----
  const T_OUT = B(19); // 19.044
  const tileXY = { x: C.tile.cx - 230, y: C.tile.cy - 480, scale: (C.tile.s * 1.15) / 960 };
  tl.to(phoneWrap, Object.assign({}, tileXY, { rotation: -10, duration: L - T_OUT - 0.03, ease: "power3.in" }), T_OUT);
  tl.fromTo(limeFlash, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.in" }, L - 0.38);
  tl.set(phoneWrap, { opacity: 0 }, L);

  // end card
  tl.set([tile, pill], { scale: 0 }, 0);
  tl.fromTo(tile, { scale: 0.35, rotation: -14 }, { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2.6)" }, L);
  tl.fromTo(ring, { opacity: 0.9, scale: 0.5 }, { opacity: 0, scale: 1.7, duration: 0.7, ease: "power2.out" }, L);
  tl.fromTo(word, { clipPath: "inset(0% 100% 0% 0%)", x: V ? 0 : -30 }, { clipPath: "inset(0% 0% 0% 0%)", x: 0, duration: 0.5, ease: "power3.out" }, L + 0.35);
  tl.fromTo(tagline, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.45, ease: "expo.out" }, L + 0.65);
  tl.fromTo(pill, { scale: 0, xPercent: -50, opacity: 1 }, { scale: 1, xPercent: -50, opacity: 1, duration: 0.5, ease: "back.out(2.4)" }, L + 0.9);
  tl.set(pill, { opacity: 0 }, 0);

  // fromTo tweens render their start state at build time; park every one-shot element hidden at t=0
  tl.set([ring, rip, tap].concat(sparks), { opacity: 0 }, 0);

  window.__timelines[AD.id] = tl;
})();
