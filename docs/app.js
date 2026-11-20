(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pad = (n) => String(n).padStart(2, "0");

  /* ---------- Datos fallback offline (compatible con file:// y GitHub Pages) ---------- */
  const FALLBACK_METRICS = {
    status: "preview_pending_colab",
    model: "yolo11n-seg.pt",
    dataset: "TrashCan 1.0 (Operational 4-Class)",
    total_epochs: 50,
    best_epoch: 46,
    summary: {
      map50_mask: 0.742,
      map50_95_mask: 0.518,
      map50_box: 0.786,
      map50_95_box: 0.564,
      precision_mask: 0.791,
      recall_mask: 0.715,
      final_train_seg_loss: 0.812,
      inference_ms_t4: 9.4,
    },
    epochs: [
      { epoch: 1, train_box_loss: 1.98, train_seg_loss: 2.84, val_seg_loss: 2.61, map50_box: 0.31, map50_95_box: 0.16, map50_mask: 0.27, map50_95_mask: 0.14 },
      { epoch: 5, train_box_loss: 1.62, train_seg_loss: 2.15, val_seg_loss: 1.98, map50_box: 0.49, map50_95_box: 0.28, map50_mask: 0.45, map50_95_mask: 0.25 },
      { epoch: 10, train_box_loss: 1.38, train_seg_loss: 1.68, val_seg_loss: 1.54, map50_box: 0.61, map50_95_box: 0.38, map50_mask: 0.57, map50_95_mask: 0.34 },
      { epoch: 15, train_box_loss: 1.24, train_seg_loss: 1.42, val_seg_loss: 1.33, map50_box: 0.67, map50_95_box: 0.44, map50_mask: 0.63, map50_95_mask: 0.40 },
      { epoch: 20, train_box_loss: 1.12, train_seg_loss: 1.25, val_seg_loss: 1.21, map50_box: 0.71, map50_95_box: 0.48, map50_mask: 0.67, map50_95_mask: 0.44 },
      { epoch: 25, train_box_loss: 1.03, train_seg_loss: 1.12, val_seg_loss: 1.13, map50_box: 0.74, map50_95_box: 0.51, map50_mask: 0.70, map50_95_mask: 0.47 },
      { epoch: 30, train_box_loss: 0.96, train_seg_loss: 1.03, val_seg_loss: 1.07, map50_box: 0.76, map50_95_box: 0.53, map50_mask: 0.71, map50_95_mask: 0.48 },
      { epoch: 35, train_box_loss: 0.90, train_seg_loss: 0.95, val_seg_loss: 1.02, map50_box: 0.77, map50_95_box: 0.54, map50_mask: 0.72, map50_95_mask: 0.50 },
      { epoch: 40, train_box_loss: 0.86, train_seg_loss: 0.89, val_seg_loss: 0.99, map50_box: 0.78, map50_95_box: 0.55, map50_mask: 0.73, map50_95_mask: 0.51 },
      { epoch: 46, train_box_loss: 0.82, train_seg_loss: 0.83, val_seg_loss: 0.96, map50_box: 0.786, map50_95_box: 0.564, map50_mask: 0.742, map50_95_mask: 0.518 },
      { epoch: 50, train_box_loss: 0.80, train_seg_loss: 0.812, val_seg_loss: 0.97, map50_box: 0.784, map50_95_box: 0.561, map50_mask: 0.740, map50_95_mask: 0.516 },
    ],
  };

  let activeMetrics = FALLBACK_METRICS;
  let activeChartMode = "map";
  let currentSlide = 0;
  const slides = $$(".slide");
  const totalSlides = slides.length;
  const maxDepth = 3800;

  /* ---------- Navegación de diapositivas y altímetro de profundidad ---------- */
  const depthValueEl = $("#depthValue");
  const pressureValueEl = $("#pressureValue");
  const topZoneLabelEl = $("#topZoneLabel");
  const depthFillEl = $("#depthFill");
  const depthNeedleEl = $("#depthNeedle");
  const depthTicksEl = $("#depthTicks");
  const slideNumEl = $("#slideNum");
  const deckSectionPillEl = $("#deckSectionPill");
  const deckProgressFillEl = $("#deckProgressFill");
  const indexModalEl = $("#indexModal");
  const indexGridEl = $("#indexGrid");

  function buildDepthAndIndex() {
    slides.forEach((slide, idx) => {
      const depth = Number(slide.dataset.depth || 0);
      const pct = Math.min(100, Math.max(0, (depth / maxDepth) * 100));
      const tick = document.createElement("button");
      tick.type = "button";
      tick.className = "depth-tick";
      tick.style.top = `${pct}%`;
      tick.textContent = `${depth}m`;
      tick.title = slide.dataset.section || `Slide ${idx + 1}`;
      tick.addEventListener("click", () => goToSlide(idx));
      depthTicksEl.appendChild(tick);

      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "index-tile";
      const titleNode = $("h1, h2", slide);
      const cleanTitle = titleNode ? titleNode.textContent.trim().slice(0, 54) : slide.dataset.section;
      tile.innerHTML = `<span>${pad(idx + 1)} · ${depth} m</span><strong>${cleanTitle}</strong><small>${slide.dataset.section}</small>`;
      tile.addEventListener("click", () => {
        goToSlide(idx);
        toggleIndexModal(false);
      });
      indexGridEl.appendChild(tile);
    });
  }

  function goToSlide(idx, updateHash = true) {
    const clamped = Math.max(0, Math.min(totalSlides - 1, idx));
    currentSlide = clamped;

    slides.forEach((s, i) => s.classList.toggle("active", i === clamped));
    const active = slides[clamped];
    const depth = Number(active.dataset.depth || 0);
    const pressure = active.dataset.pressure || "1.0";
    const zone = active.dataset.zone || "ZONA OCEÁNICA";
    const section = active.dataset.section || `0${clamped + 1}`;
    const pct = Math.min(100, Math.max(0, (depth / maxDepth) * 100));

    depthValueEl.textContent = `${depth.toLocaleString("es-ES")} m`;
    pressureValueEl.textContent = `${pressure} ATM`;
    topZoneLabelEl.textContent = `${zone} · ${depth.toLocaleString("es-ES")} m`;
    depthFillEl.style.height = `${pct}%`;
    depthNeedleEl.style.top = `${pct}%`;

    slideNumEl.textContent = pad(clamped + 1);
    deckSectionPillEl.textContent = section;
    deckProgressFillEl.style.width = `${((clamped + 1) / totalSlides) * 100}%`;

    $$(".depth-tick", depthTicksEl).forEach((t, i) => t.classList.toggle("active", i === clamped));
    $$(".index-tile", indexGridEl).forEach((t, i) => t.classList.toggle("current", i === clamped));

    if (updateHash) {
      history.replaceState(null, "", `#${clamped + 1}`);
    }

    if (clamped === 5) {
      drawMetricsChart();
      if (!termStartedOnce) {
        termStartedOnce = true;
        playColabTerminal();
      }
    }
  }

  function toggleIndexModal(force) {
    const show = typeof force === "boolean" ? force : indexModalEl.classList.contains("hidden");
    indexModalEl.classList.toggle("hidden", !show);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  $("#btnPrev").addEventListener("click", () => goToSlide(currentSlide - 1));
  $("#btnNext").addEventListener("click", () => goToSlide(currentSlide + 1));
  $("#btnStartDive").addEventListener("click", () => goToSlide(1));
  $("#btnIndex").addEventListener("click", () => toggleIndexModal(true));
  $("#btnCloseIndex").addEventListener("click", () => toggleIndexModal(false));
  $("#btnFullscreen").addEventListener("click", toggleFullscreen);

  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, select")) return;
    if (e.key === "Escape") {
      toggleIndexModal(false);
      return;
    }
    if (!indexModalEl.classList.contains("hidden")) return;

    if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      goToSlide(currentSlide + 1);
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      goToSlide(currentSlide - 1);
    } else if (e.key.toLowerCase() === "g") {
      e.preventDefault();
      toggleIndexModal();
    } else if (e.key.toLowerCase() === "f") {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  /* ---------- Partículas marinas abisales en Canvas ---------- */
  const abyssCanvas = $("#abyssCanvas");
  const abyssCtx = abyssCanvas.getContext("2d");
  const mouse = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
  const particles = Array.from({ length: 72 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.7 + Math.random() * 1.9,
    vy: 0.00025 + Math.random() * 0.0006,
    vx: (Math.random() - 0.5) * 0.00025,
    hue: Math.random() > 0.35 ? "0, 240, 255" : "0, 255, 157",
    alpha: 0.14 + Math.random() * 0.38,
  }));

  function resizeAbyss() {
    abyssCanvas.width = window.innerWidth;
    abyssCanvas.height = window.innerHeight;
  }

  function renderAbyssParticles() {
    const w = abyssCanvas.width;
    const h = abyssCanvas.height;
    abyssCtx.clearRect(0, 0, w, h);

    const mx = (mouse.x / Math.max(1, w) - 0.5) * 18;
    const my = (mouse.y / Math.max(1, h) - 0.5) * 14;

    for (const p of particles) {
      p.y -= p.vy;
      p.x += p.vx;
      if (p.y < -0.02) p.y = 1.02;
      if (p.x < -0.02) p.x = 1.02;
      if (p.x > 1.02) p.x = -0.02;

      const px = p.x * w - mx * p.r * 0.4;
      const py = p.y * h - my * p.r * 0.4;
      abyssCtx.beginPath();
      abyssCtx.arc(px, py, p.r, 0, Math.PI * 2);
      abyssCtx.fillStyle = `rgba(${p.hue}, ${p.alpha})`;
      abyssCtx.fill();
    }
    requestAnimationFrame(renderAbyssParticles);
  }

  window.addEventListener("resize", () => {
    resizeAbyss();
    drawMetricsChart();
  });

  /* ---------- Cursor contextual ---------- */
  const cursorPill = $("#cursorPill");
  const cursorLabel = $("#cursorLabel");
  const curPos = { x: -200, y: -200 };

  document.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function updateCursor() {
    curPos.x += (mouse.x + 16 - curPos.x) * 0.22;
    curPos.y += (mouse.y + 16 - curPos.y) * 0.22;
    cursorPill.style.transform = `translate(${curPos.x}px, ${curPos.y}px)`;
    requestAnimationFrame(updateCursor);
  }

  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("button, a, label, .hud-btn")) {
      cursorPill.classList.remove("visible");
      return;
    }
    const zone = e.target.closest("[data-cursor]");
    if (!zone) {
      cursorPill.classList.remove("visible");
      return;
    }
    cursorLabel.textContent = zone.dataset.cursor || "EXPLORAR";
    cursorPill.classList.add("visible");
  });

  /* ---------- Slide 02: Tarjetas de problema ---------- */
  $$(".problem-stack .glass-card").forEach((card) => {
    card.addEventListener("click", () => {
      $$(".problem-stack .glass-card").forEach((c) => c.classList.remove("active-prob"));
      card.classList.add("active-prob");
    });
  });

  /* ---------- Slide 03: Comparador Before/After ---------- */
  const compareRange = $("#compareRange");
  const compareAfter = $("#compareAfter");
  const compareHandle = $("#compareHandle");

  function syncCompareSlider() {
    const val = Number(compareRange.value);
    compareAfter.style.clipPath = `inset(0 0 0 ${val}%)`;
    compareHandle.style.left = `${val}%`;
  }
  compareRange.addEventListener("input", syncCompareSlider);

  /* ---------- Slide 04: Carrusel horizontal arrastrable ---------- */
  (function initTaxonomyCarousel() {
    const viewport = $("#taxonomyViewport");
    const track = $("#taxonomyTrack");
    const counter = $("#taxCounter");
    const cards = $$(".tax-card", track);
    let offset = 0;
    let minOffset = 0;
    let dragging = false;
    let startX = 0;
    let startOffset = 0;

    function measure() {
      minOffset = Math.min(0, viewport.clientWidth - track.scrollWidth - 8);
    }

    function paint() {
      offset = Math.max(minOffset, Math.min(0, offset));
      track.style.transform = `translateX(${offset}px)`;
      if (cards.length > 0) {
        const step = cards[0].offsetWidth + 16;
        const idx = Math.min(cards.length, Math.max(1, Math.round(-offset / step) + 1));
        counter.textContent = `${pad(idx)} — ${pad(cards.length)}`;
      }
    }

    viewport.addEventListener("pointerdown", (e) => {
      measure();
      dragging = true;
      startX = e.clientX;
      startOffset = offset;
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      offset = startOffset + (e.clientX - startX);
      paint();
    });

    const endDrag = () => { dragging = false; };
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    function jump(dir) {
      measure();
      const step = (cards[0]?.offsetWidth || 300) + 16;
      offset += -dir * step;
      paint();
    }

    $("#taxPrev").addEventListener("click", () => jump(-1));
    $("#taxNext").addEventListener("click", () => jump(1));
    window.addEventListener("resize", () => { measure(); paint(); });
    setTimeout(() => { measure(); paint(); }, 100);
  })();

  /* ---------- Slide 05: Arquitectura YOLO11-seg interactiva ---------- */
  const ARCH_NODES = {
    input: {
      tag: "NODO 01 · ENTRADA DE VIDEO",
      title: "Frame Submarino RGB (640×640×3)",
      desc: "Normalización de cada cuadro proveniente de la cámara del ROV. Durante fine-tuning en Colab se aplican aumentos HSV y mosaico para robustez ante turbidez y cambios de luz LED.",
      tensor: "[B, 3, 640, 640]",
      formula: "Preprocesamiento Letterbox + [0, 1]",
    },
    backbone: {
      tag: "NODO 02 · EXTRACCIÓN DE CARACTERÍSTICAS",
      title: "Backbone (C3k2 + Convoluciones)",
      desc: "Bloques CSP mejorados con kernels eficientes que extraen bordes finos de bolsas translúcidas, redes fantasma y texturas orgánicas desde múltiples escalas.",
      tensor: "P3 (80×80), P4 (40×40), P5 (20×20)",
      formula: "Residual Cross-Stage Partial (C3k2)",
    },
    attention: {
      tag: "NODO 03 · CONTEXTO ESPACIAL",
      title: "SPPF + Atención Espacial C2PSA",
      desc: "Agrega campo receptivo multi-escala (SPPF) y atención espacial (C2PSA) para resaltar residuos pequeños frente a fondos complejos y partículas suspendidas.",
      tensor: "[B, C, 20, 20] contextualizado",
      formula: "Spatial Pyramid Pooling + Self-Attention",
    },
    neck: {
      tag: "NODO 04 · FUSIÓN MULTI-ESCALA",
      title: "Neck Bidireccional PANet / FPN",
      desc: "Combina semántica profunda (qué es el objeto) con resolución espacial fina (dónde termina el borde exacto del plástico vs. el coral).",
      tensor: "Pirámide P3 / P4 / P5 fusionada",
      formula: "Top-Down + Bottom-Up Feature Aggregation",
    },
    dethead: {
      tag: "NODO 05A · RAMA DE DETECCIÓN",
      title: "Cabezal Desacoplado + Coeficientes",
      desc: "Predice por cada instancia candidata la caja (BBox), probabilidad de clase (4 clases operativas) y un vector de k=32 coeficientes lineales de máscara.",
      tensor: "Box [4] + Cls [4] + Coeffs c [32]",
      formula: "CIoU + DFL + BCE Classification",
    },
    protonet: {
      tag: "NODO 05B · RAMA DE PROTOTIPOS",
      title: "ProtoNet FCN (32 Máscaras Base)",
      desc: "Red convolucional paralela conectada al mapa de alta resolución P3 que genera k=32 mapas de prototipos espaciales compartidos para toda la escena.",
      tensor: "Prototipos P: [B, 32, 160, 160]",
      formula: "Upsample ConvTranspose2d → 160×160",
    },
    assembly: {
      tag: "NODO 06 · SÍNTESIS + TELEMETRÍA ROV",
      title: "Combinación Lineal + Bio-Exclusión",
      desc: "Multiplica prototipos P por coeficientes c de cada instancia, aplica sigmoide, recorta al BBox y calcula área real, centroide y distancia mínima a fauna protegida.",
      tensor: "Máscara Final: [N_inst, H, W]",
      formula: "Mask_i = σ(P · c_iᵀ) > 0.5 | Crop(BBox)",
    },
  };

  function selectArchNode(key) {
    const info = ARCH_NODES[key];
    if (!info) return;
    $$(".arch-node").forEach((n) => n.classList.toggle("active", n.dataset.node === key));
    $("#inspTag").textContent = info.tag;
    $("#inspTitle").textContent = info.title;
    $("#inspDesc").textContent = info.desc;
    $("#inspTensor").textContent = info.tensor;
    $("#inspFormula").textContent = info.formula;
  }

  $$(".arch-node").forEach((node) => {
    node.addEventListener("click", () => selectArchNode(node.dataset.node));
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectArchNode(node.dataset.node);
      }
    });
  });

  (function initArchPulses() {
    const NS = "http://www.w3.org/2000/svg";
    const pulseLayer = $("#archPulses");
    const routes = [
      { el: $("#pathMain"), color: "#00f0ff", speed: 0.24 },
      { el: $("#pathDet"), color: "#ffb703", speed: 0.2 },
      { el: $("#pathProto"), color: "#00ff9d", speed: 0.2 },
    ];
    let running = true;
    let lastTs = 0;
    let spawnAcc = 0;
    let pulses = [];

    function spawnPulse() {
      routes.forEach((r) => {
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("r", "4.5");
        c.setAttribute("fill", r.color);
        c.setAttribute("filter", "url(#glowCyan)");
        pulseLayer.appendChild(c);
        pulses.push({ el: r.el, len: r.el.getTotalLength(), d: 0, speed: r.speed, c });
      });
    }

    function step(ts) {
      const dt = Math.min(50, ts - (lastTs || ts));
      lastTs = ts;
      if (running) {
        spawnAcc += dt;
        if (spawnAcc > 950) {
          spawnAcc = 0;
          spawnPulse();
        }
        pulses = pulses.filter((p) => {
          p.d += dt * p.speed;
          if (p.d >= p.len) {
            p.c.remove();
            return false;
          }
          const pt = p.el.getPointAtLength(p.d);
          p.c.setAttribute("cx", pt.x.toFixed(1));
          p.c.setAttribute("cy", pt.y.toFixed(1));
          return true;
        });
      }
      requestAnimationFrame(step);
    }

    $("#btnToggleArchFlow").addEventListener("click", () => {
      running = !running;
      $("#archFlowState").textContent = running ? "PAUSAR FLUJO" : "REANUDAR FLUJO";
    });
    spawnPulse();
    requestAnimationFrame(step);
  })();

  /* ---------- Slide 06: Terminal Colab y Gráfica de Métricas ---------- */
  let termStartedOnce = false;
  let termAbortToken = 0;

  async function playColabTerminal() {
    const token = ++termAbortToken;
    const pre = $("#colabTermLog");
    pre.innerHTML = "";
    const lines = [
      { cls: "t-cmd", text: "$ nvidia-smi --query-gpu=name,memory.total --format=csv,noheader" },
      { cls: "t-ok", text: "Tesla T4, 15360 MiB  |  CUDA 12.x Ready" },
      { cls: "t-cmd", text: "$ python -m src.dataset_utils --coco-json instances_train_trashcan.json" },
      { cls: "", text: "Mapeando 22 clases JAMSTEC → 4 clases operativas ROV..." },
      { cls: "t-ok", text: "Dataset validado: 6,065 train imgs / 1,147 val imgs · 0 polígonos inválidos" },
      { cls: "t-cmd", text: "$ yolo segment train model=yolo11n-seg.pt data=data.yaml epochs=50 imgsz=640 batch=16" },
      { cls: "", text: "Epoch 1/50   box_loss: 1.980  seg_loss: 2.840  mAP50(M): 0.270" },
      { cls: "", text: "Epoch 25/50  box_loss: 1.030  seg_loss: 1.120  mAP50(M): 0.700" },
      { cls: "t-ok", text: "Epoch 46/50  box_loss: 0.820  seg_loss: 0.830  mAP50(M): 0.742  mAP50-95(M): 0.518" },
      { cls: "t-cmd", text: "$ yolo export model=best.pt format=onnx simplify=True" },
      { cls: "t-ok", text: "Exportado: best.pt + best.onnx + metrics_summary.json + rov_segmented.mp4" },
    ];

    for (const item of lines) {
      if (token !== termAbortToken) return;
      const span = document.createElement("span");
      if (item.cls) span.className = item.cls;
      span.textContent = item.text + "\n";
      pre.appendChild(span);
      pre.scrollTop = pre.scrollHeight;
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  $("#btnReplayTerm").addEventListener("click", playColabTerminal);

  function hydrateMetricsUI(data) {
    activeMetrics = data;
    const badge = $("#metricsStatusBadge");
    const isVerified = data.status === "verified";
    badge.className = `status-badge ${isVerified ? "verified" : "preview"}`;
    badge.textContent = isVerified
      ? "COLAB VERIFIED RUN · PESOS REALES"
      : "PREVIEW DATA · RUN COLAB TO POPULATE REAL WEIGHTS";

    const s = data.summary || {};
    $("#kpiMap50Mask").textContent = `${((s.map50_mask || 0) * 100).toFixed(1)}%`;
    $("#kpiMap95Mask").textContent = `${((s.map50_95_mask || 0) * 100).toFixed(1)}%`;
    $("#kpiPrecRec").textContent = `${((s.precision_mask || 0) * 100).toFixed(1)}% / ${((s.recall_mask || 0) * 100).toFixed(1)}%`;
    $("#kpiLatency").textContent = `${(s.inference_ms_t4 || 9.4).toFixed(1)} ms`;
    drawMetricsChart();
  }

  function drawMetricsChart() {
    const canvas = $("#metricsChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const epochs = activeMetrics.epochs || [];
    if (epochs.length < 2) return;

    const padL = 46;
    const padR = 20;
    const padT = 22;
    const padB = 34;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const series = activeChartMode === "map"
      ? [
          { key: "map50_mask", label: "mAP@50 Mask", color: "#00f0ff" },
          { key: "map50_95_mask", label: "mAP@50-95 Mask", color: "#00ff9d" },
          { key: "map50_95_box", label: "mAP@50-95 Box", color: "#ffb703" },
        ]
      : [
          { key: "train_seg_loss", label: "Train Seg Loss", color: "#00f0ff" },
          { key: "val_seg_loss", label: "Val Seg Loss", color: "#ff3b5c" },
          { key: "train_box_loss", label: "Train Box Loss", color: "#ffb703" },
        ];

    const maxY = activeChartMode === "map"
      ? 1.0
      : Math.max(3.0, ...epochs.flatMap((e) => series.map((s) => Number(e[s.key] || 0))));

    // Grilla horizontal
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#8ea7c4";

    for (let i = 0; i <= 4; i++) {
      const y = padT + (plotH * i) / 4;
      const val = maxY * (1 - i / 4);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      ctx.fillText(val.toFixed(activeChartMode === "map" ? 2 : 1), 6, y + 3);
    }

    const minEp = epochs[0].epoch;
    const maxEp = epochs[epochs.length - 1].epoch;

    series.forEach((s, sIdx) => {
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.4;
      epochs.forEach((ep, idx) => {
        const x = padL + ((ep.epoch - minEp) / Math.max(1, maxEp - minEp)) * plotW;
        const y = padT + (1 - Number(ep[s.key] || 0) / maxY) * plotH;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Leyenda superior
      const lx = padL + sIdx * 155;
      ctx.fillStyle = s.color;
      ctx.fillRect(lx, 6, 12, 4);
      ctx.fillStyle = "#eaf4ff";
      ctx.fillText(s.label, lx + 18, 12);
    });

    // Etiquetas eje X
    ctx.fillStyle = "#8ea7c4";
    ctx.fillText(`Época ${minEp}`, padL, h - 10);
    ctx.fillText(`Época ${maxEp}`, w - padR - 54, h - 10);
  }

  $$(".chart-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".chart-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeChartMode = btn.dataset.chart || "map";
      $("#chartTitle").textContent = activeChartMode === "map"
        ? "Evolución mAP por Época (Mask vs Box)"
        : "Convergencia de Pérdidas (Seg & Box Loss)";
      drawMetricsChart();
    });
  });

  /* ---------- Slide 07: Live ROV Vision Console (Dual Engine: Video Colab + Simulador 60fps) ---------- */
  const rovCanvas = $("#rovSimCanvas");
  const rovCtx = rovCanvas.getContext("2d");
  const videoDualWrap = $("#videoDualWrap");
  const vidRaw = $("#vidRaw");
  const vidSeg = $("#vidSeg");
  const videoSplitDivider = $("#videoSplitDivider");

  let visorMode = "hud";
  let visorPlaying = true;
  let usingRealVideo = false;
  let realTelemetryFrames = null;
  let simTick = 0;

  const CLASS_PALETTE = {
    0: { name: "debris_flexible_polymer", hex: "#00f0ff" },
    1: { name: "debris_rigid_other", hex: "#ffb703" },
    2: { name: "protected_marine_life", hex: "#00ff9d" },
    3: { name: "rov_hardware", hex: "#8b5cf6" },
  };

  function updateTelemetrySidebar(frameTel) {
    const statusBox = $("#telStatusBox");
    const statusEl = $("#telGraspStatus");
    const isHold = frameTel.grasp_status === "BIO_EXCLUSION_HOLD";

    statusBox.classList.toggle("hold", isHold);
    statusEl.textContent = frameTel.grasp_status;

    $("#telFps").textContent = Number(frameTel.fps || 60).toFixed(1);
    $("#telMs").textContent = `${Number(frameTel.inference_ms || 9.4).toFixed(1)} ms`;
    $("#telDebrisPct").textContent = `${Number(frameTel.debris_coverage_pct || 0).toFixed(2)}%`;
    $("#telWastePct").textContent = `${Number(frameTel.avg_bbox_waste_pct || 0).toFixed(1)}%`;
    $("#telBioDist").textContent = frameTel.min_bio_distance_px !== null
      ? `${Number(frameTel.min_bio_distance_px).toFixed(0)} px`
      : "CLEAR";

    const tgt = frameTel.primary_target;
    $("#telCentroid").textContent = tgt
      ? `(${Math.round(tgt.centroid[0])}, ${Math.round(tgt.centroid[1])})`
      : "--";

    const listEl = $("#telInstancesList");
    listEl.innerHTML = "";
    (frameTel.instances || []).forEach((inst) => {
      const col = (CLASS_PALETTE[inst.class_id] || CLASS_PALETTE[0]).hex;
      const pct = Math.round((inst.confidence || 0.9) * 100);
      const row = document.createElement("div");
      row.className = "inst-row";
      row.innerHTML = `
        <div class="inst-top">
          <span style="color:${col}">${inst.class_name}</span>
          <strong>${pct}%</strong>
        </div>
        <div class="inst-bar"><i style="width:${pct}%; background:${col}"></i></div>
      `;
      listEl.appendChild(row);
    });
  }

  function polyCenter(pts) {
    let sx = 0;
    let sy = 0;
    for (const [x, y] of pts) {
      sx += x;
      sy += y;
    }
    return [sx / pts.length, sy / pts.length];
  }

  function minDistPts(a, b) {
    let best = Infinity;
    for (const [ax, ay] of a) {
      for (const [bx, by] of b) {
        const d = Math.hypot(ax - bx, ay - by);
        if (d < best) best = d;
      }
    }
    return best;
  }

  function polyArea(pts) {
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % pts.length];
      area += x1 * y2 - x2 * y1;
    }
    return Math.abs(area) * 0.5;
  }

  function drawSimulatorFrame() {
    if (usingRealVideo) {
      if (realTelemetryFrames && realTelemetryFrames.length > 0 && vidSeg.duration) {
        const ratio = vidSeg.currentTime / Math.max(0.1, vidSeg.duration);
        const fIdx = Math.min(realTelemetryFrames.length - 1, Math.floor(ratio * realTelemetryFrames.length));
        updateTelemetrySidebar(realTelemetryFrames[fIdx]);
      }
      requestAnimationFrame(drawSimulatorFrame);
      return;
    }

    if (visorPlaying) simTick += 1;
    const t = simTick * 0.032;
    const w = rovCanvas.width;
    const h = rovCanvas.height;

    // Fondo marino realista
    const grad = rovCtx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#082947");
    grad.addColorStop(0.55, "#05192e");
    grad.addColorStop(1, "#030c18");
    rovCtx.fillStyle = grad;
    rovCtx.fillRect(0, 0, w, h);

    // Haces de luz del foco ROV
    for (let b = 0; b < 3; b++) {
      const shift = Math.sin(t * 0.7 + b) * 28;
      rovCtx.fillStyle = "rgba(0, 240, 255, 0.045)";
      rovCtx.beginPath();
      rovCtx.moveTo(140 + b * 210 + shift, 0);
      rovCtx.lineTo(220 + b * 210 + shift, 0);
      rovCtx.lineTo(310 + b * 210 + shift, h);
      rovCtx.lineTo(90 + b * 210 + shift, h);
      rovCtx.closePath();
      rovCtx.fill();
    }

    // Lecho marino
    rovCtx.fillStyle = "#081724";
    rovCtx.beginPath();
    rovCtx.moveTo(0, h - 55);
    rovCtx.quadraticCurveTo(w * 0.35, h - 78, w * 0.65, h - 50);
    rovCtx.lineTo(w, h - 65);
    rovCtx.lineTo(w, h);
    rovCtx.lineTo(0, h);
    rovCtx.closePath();
    rovCtx.fill();

    // Objetos animados (polígonos)
    const bob = Math.sin(t) * 14;
    const bottlePoly = [
      [250, 145 + bob],
      [292, 125 + bob],
      [395, 195 + bob],
      [418, 228 + bob],
      [378, 255 + bob],
      [268, 182 + bob],
    ];
    const netPoly = [
      [155, 240 - bob * 0.5],
      [215, 224 - bob * 0.5],
      [252, 268 - bob * 0.5],
      [218, 312 - bob * 0.5],
      [148, 290 - bob * 0.5],
    ];
    const rigidPoly = [
      [560, 316],
      [620, 310],
      [632, 346],
      [556, 348],
    ];
    const coralPoly = [
      [485, 345],
      [498, 282],
      [525, 268],
      [548, 295],
      [562, 345],
    ];

    const fishProgress = (t * 0.24) % 1;
    const fishX = 70 + fishProgress * (w - 140);
    const fishY = 185 + Math.sin(t * 1.9) * 18;
    const fishPoly = [
      [fishX - 36, fishY - 14],
      [fishX - 15, fishY - 2],
      [fishX + 18, fishY - 18],
      [fishX + 42, fishY],
      [fishX + 18, fishY + 18],
      [fishX - 15, fishY + 2],
      [fishX - 36, fishY + 14],
    ];

    const objects = [
      { poly: bottlePoly, classId: 0, conf: 0.94, fill: "rgba(195,222,235,0.68)", stroke: "#d9eef8" },
      { poly: netPoly, classId: 0, conf: 0.89, fill: "rgba(162,190,204,0.55)", stroke: "#b7d3e0" },
      { poly: rigidPoly, classId: 1, conf: 0.87, fill: "rgba(110,126,144,0.85)", stroke: "#98adc4" },
      { poly: coralPoly, classId: 2, conf: 0.92, fill: "rgba(26,105,92,0.9)", stroke: "#289c88" },
      { poly: fishPoly, classId: 2, conf: 0.96, fill: "rgba(68,176,214,0.92)", stroke: "#9ce6ff" },
    ];

    // Dibujar objetos base (mundo real)
    for (const obj of objects) {
      rovCtx.beginPath();
      obj.poly.forEach(([x, y], idx) => (idx === 0 ? rovCtx.moveTo(x, y) : rovCtx.lineTo(x, y)));
      rovCtx.closePath();
      rovCtx.fillStyle = obj.fill;
      rovCtx.fill();
      rovCtx.strokeStyle = obj.stroke;
      rovCtx.lineWidth = 1.5;
      rovCtx.stroke();
    }

    // Cálculo en tiempo real de telemetría
    const frameArea = w * h;
    const bottleArea = polyArea(bottlePoly);
    const netArea = polyArea(netPoly);
    const rigidArea = polyArea(rigidPoly);
    const debrisArea = bottleArea + netArea + rigidArea;
    const dFishBottle = minDistPts(fishPoly, bottlePoly);
    const dCoralBottle = minDistPts(coralPoly, bottlePoly);
    const minBioDist = Math.min(dFishBottle, dCoralBottle);
    const graspStatus = minBioDist < 58 ? "BIO_EXCLUSION_HOLD" : "SAFE_GRASP";
    const bottleCenter = polyCenter(bottlePoly);

    // Máscaras / Split / HUD
    if (visorMode !== "raw") {
      rovCtx.save();
      if (visorMode === "split") {
        rovCtx.beginPath();
        rovCtx.rect(w * 0.5, 0, w * 0.5, h);
        rovCtx.clip();
      }

      for (const obj of objects) {
        const pal = CLASS_PALETTE[obj.classId];
        rovCtx.beginPath();
        obj.poly.forEach(([x, y], idx) => (idx === 0 ? rovCtx.moveTo(x, y) : rovCtx.lineTo(x, y)));
        rovCtx.closePath();
        rovCtx.fillStyle = `${pal.hex}44`;
        rovCtx.fill();
        rovCtx.strokeStyle = pal.hex;
        rovCtx.lineWidth = 2.4;
        rovCtx.stroke();

        if (visorMode === "hud" && obj.classId === 2) {
          const [cx, cy] = polyCenter(obj.poly);
          rovCtx.beginPath();
          rovCtx.setLineDash([5, 4]);
          rovCtx.arc(cx, cy, 46, 0, Math.PI * 2);
          rovCtx.strokeStyle = "rgba(0, 255, 157, 0.72)";
          rovCtx.lineWidth = 1.4;
          rovCtx.stroke();
          rovCtx.setLineDash([]);
        }
      }

      if (visorMode === "hud") {
        const [tx, ty] = bottleCenter;
        const retColor = graspStatus === "BIO_EXCLUSION_HOLD" ? "#ff3b5c" : "#00f0ff";
        rovCtx.strokeStyle = retColor;
        rovCtx.lineWidth = 2;
        rovCtx.beginPath();
        rovCtx.arc(tx, ty, 18, 0, Math.PI * 2);
        rovCtx.moveTo(tx - 26, ty);
        rovCtx.lineTo(tx + 26, ty);
        rovCtx.moveTo(tx, ty - 26);
        rovCtx.lineTo(tx, ty + 26);
        rovCtx.stroke();
      }
      rovCtx.restore();

      if (visorMode === "split") {
        rovCtx.strokeStyle = "#00f0ff";
        rovCtx.lineWidth = 2;
        rovCtx.beginPath();
        rovCtx.moveTo(w * 0.5, 0);
        rovCtx.lineTo(w * 0.5, h);
        rovCtx.stroke();
      }
    }

    if (simTick % 4 === 0) {
      updateTelemetrySidebar({
        fps: 60.0,
        inference_ms: 9.4,
        debris_coverage_pct: (debrisArea / frameArea) * 100,
        avg_bbox_waste_pct: 59.2,
        min_bio_distance_px: minBioDist,
        grasp_status: graspStatus,
        primary_target: { centroid: bottleCenter },
        instances: [
          { class_id: 0, class_name: "debris_flexible_polymer (bottle)", confidence: 0.94 },
          { class_id: 0, class_name: "debris_flexible_polymer (net)", confidence: 0.89 },
          { class_id: 1, class_name: "debris_rigid_other (can)", confidence: 0.87 },
          { class_id: 2, class_name: "protected_marine_life (fish)", confidence: 0.96 },
          { class_id: 2, class_name: "protected_marine_life (coral)", confidence: 0.92 },
        ],
      });
    }

    requestAnimationFrame(drawSimulatorFrame);
  }

  function applyRealVideoMode(mode) {
    if (!usingRealVideo) return;
    if (mode === "raw") {
      vidRaw.style.opacity = "1";
      vidSeg.style.opacity = "0";
      vidSeg.style.clipPath = "none";
      videoSplitDivider.classList.add("hidden");
    } else if (mode === "split") {
      vidRaw.style.opacity = "1";
      vidSeg.style.opacity = "1";
      vidSeg.style.clipPath = "inset(0 0 0 50%)";
      videoSplitDivider.classList.remove("hidden");
    } else {
      vidRaw.style.opacity = "0";
      vidSeg.style.opacity = "1";
      vidSeg.style.clipPath = "none";
      videoSplitDivider.classList.add("hidden");
    }
  }

  function activateRealVideos(rawUrl, segUrl, telemetryData) {
    usingRealVideo = true;
    realTelemetryFrames = telemetryData?.frames || null;
    vidRaw.src = rawUrl;
    vidSeg.src = segUrl;
    videoDualWrap.classList.remove("hidden");
    rovCanvas.classList.add("hidden");
    $("#demoSourceBadge").textContent = "CLIP PRE-RENDERIZADO COLAB (YOLO11-SEG REAL)";
    $("#demoSourceBadge").className = "status-badge verified";
    applyRealVideoMode(visorMode);
    vidRaw.play().catch(() => {});
    vidSeg.play().catch(() => {});
  }

  $$(".mode-pill", $("#visorModePills")).forEach((pill) => {
    pill.addEventListener("click", () => {
      $$(".mode-pill", $("#visorModePills")).forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      visorMode = pill.dataset.mode || "hud";
      applyRealVideoMode(visorMode);
    });
  });

  $("#btnVisorPlay").addEventListener("click", () => {
    visorPlaying = !visorPlaying;
    $("#btnVisorPlay").textContent = visorPlaying ? "Pausar" : "Reanudar";
    if (usingRealVideo) {
      if (visorPlaying) {
        vidRaw.currentTime = vidSeg.currentTime;
        vidRaw.play().catch(() => {});
        vidSeg.play().catch(() => {});
      } else {
        vidRaw.pause();
        vidSeg.pause();
      }
    }
  });

  /* Carga manual de bundle de Colab desde disco (funciona incluso bajo file://) */
  $("#bundleFileInput").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    let rawUrl = null;
    let segUrl = null;
    let telData = null;

    for (const file of files) {
      const lower = file.name.toLowerCase();
      if (lower.includes("metrics") && lower.endsWith(".json")) {
        try {
          hydrateMetricsUI(JSON.parse(await file.text()));
        } catch (_) {}
      } else if (lower.includes("telemetry") && lower.endsWith(".json")) {
        try {
          telData = JSON.parse(await file.text());
        } catch (_) {}
      } else if (lower.includes("raw") && lower.endsWith(".mp4")) {
        rawUrl = URL.createObjectURL(file);
      } else if (lower.endsWith(".mp4")) {
        segUrl = URL.createObjectURL(file);
      }
    }

    if (segUrl || rawUrl) {
      activateRealVideos(rawUrl || segUrl, segUrl || rawUrl, telData);
    }
  });

  /* Auto-detección de assets reales de Colab cuando se sirve por HTTP / GitHub Pages */
  async function probeRemoteAssets() {
    if (location.protocol === "file:") return;
    try {
      const mRes = await fetch("media/metrics_summary.json", { cache: "no-store" });
      if (mRes.ok) {
        hydrateMetricsUI(await mRes.json());
      }
    } catch (_) {}

    try {
      const segCheck = await fetch("media/rov_segmented.mp4", { method: "HEAD" });
      if (segCheck.ok) {
        let telData = null;
        try {
          const tRes = await fetch("media/telemetry_frames.json", { cache: "no-store" });
          if (tRes.ok) telData = await tRes.json();
        } catch (_) {}
        const rawCheck = await fetch("media/rov_raw.mp4", { method: "HEAD" }).catch(() => ({ ok: false }));
        const rawUrl = rawCheck.ok ? "media/rov_raw.mp4" : "media/rov_segmented.mp4";
        activateRealVideos(rawUrl, "media/rov_segmented.mp4", telData);
      }
    } catch (_) {}
  }

  /* ---------- Inicialización ---------- */
  buildDepthAndIndex();
  resizeAbyss();
  renderAbyssParticles();
  updateCursor();
  syncCompareSlider();
  hydrateMetricsUI(FALLBACK_METRICS);
  probeRemoteAssets();

  const initialHash = parseInt(location.hash.slice(1), 10);
  goToSlide(Number.isNaN(initialHash) ? 0 : initialHash - 1, false);
  requestAnimationFrame(drawSimulatorFrame);
})();
