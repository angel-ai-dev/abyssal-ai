(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Fallback Metrics (file:// & HTTP compatible) ---------- */
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

  const CHAPTERS = [
    {
      id: 1,
      code: "CHAPTER 01",
      tag: "THE OCEAN CRISIS",
      title: "Beyond Bounding Boxes in Deep Water",
      heroHeadline: "Beyond Bounding Boxes<br />in Deep Water",
      excerpt: "Los rectángulos tradicionales abarcan hasta 68% de coral vivo y fondo marino. La segmentación pixel a pixel habilita agarre seguro.",
      badgeDark: "SEA OF JAPAN · ROV DEPTH",
      badgeLight: "PROBLEM STATEMENT",
      thumb: "media/thumb_01.jpg",
      scrollStop: 0.145,
    },
    {
      id: 2,
      code: "CHAPTER 02",
      tag: "TRASHCAN 1.0 DATASET",
      title: "7,212 Real ROV Frames Reimagined",
      heroHeadline: "7,212 Real ROV<br />Frames Reimagined",
      excerpt: "Curación oficial de JAMSTEC y la Universidad de Minnesota: 22 categorías marinas consolidadas en 4 clases operativas para pinza ROV.",
      badgeDark: "JAMSTEC J-EDI ARCHIVE",
      badgeLight: "DATASET PIPELINE",
      thumb: "media/thumb_02.jpg",
      scrollStop: 0.285,
    },
    {
      id: 3,
      code: "CHAPTER 03",
      tag: "YOLO11-SEG ARCHITECTURE",
      title: "Dual-Head Mask & Prototype Fusion",
      heroHeadline: "Dual-Head Mask &amp;<br />Prototype Fusion",
      excerpt: "Backbone C3k2 con atención espacial C2PSA, combinación lineal de 32 prototipos espaciales y función de pérdida multi-tarea.",
      badgeDark: "ULTRALYTICS YOLO11N-SEG",
      badgeLight: "NEURAL ARCHITECTURE",
      thumb: "media/thumb_03.jpg",
      scrollStop: 0.425,
    },
    {
      id: 4,
      code: "CHAPTER 04",
      tag: "COLAB T4 FINE-TUNING",
      title: "Cloud Training & Verified Metrics",
      heroHeadline: "Cloud Training &amp;<br />Verified Metrics",
      excerpt: "Entrenamiento automatizado en GPU T4 sin sobrecargar equipos locales, evaluando mAP@50-95 (Mask vs Box) y exportación a ONNX.",
      badgeDark: "GOOGLE COLAB · T4 GPU",
      badgeLight: "EVALUATION SUITE",
      thumb: "media/thumb_04.jpg",
      scrollStop: 0.565,
    },
    {
      id: 5,
      code: "CHAPTER 05",
      tag: "LIVE ROV VISION CONSOLE",
      title: "Real-Time Masking & Bio-Exclusion",
      heroHeadline: "Real-Time Masking &amp;<br />Bio-Exclusion",
      excerpt: "Consola de inferencia sincronizada: compara Raw vs. Máscaras, calcula centroide de agarre y frena la pinza ante fauna cercana.",
      badgeDark: "60 FPS SIM + COLAB MP4",
      badgeLight: "FUNCTIONAL DEMO",
      thumb: "media/thumb_05.jpg",
      scrollStop: 0.705,
    },
    {
      id: 6,
      code: "CHAPTER 06",
      tag: "FUTURE EXPEDITIONS",
      title: "From Notebook to Embedded Ocean ROV",
      heroHeadline: "From Notebook to<br />Embedded Ocean ROV",
      excerpt: "Limitaciones ópticas bajo turbidez extrema y hoja de ruta hacia TensorRT FP16 en Jetson Orin Nano, visión estéreo 3D y ByteTrack.",
      badgeDark: "EDGE ROBOTICS ROADMAP",
      badgeLight: "CONCLUSIONS",
      thumb: "media/thumb_06.jpg",
      scrollStop: 0.845,
    },
  ];

  const ARCH_NODES = {
    input: {
      tag: "NODO 01 · ENTRADA DE VIDEO",
      title: "Frame Submarino RGB (640×640×3)",
      desc: "Normalización de cada cuadro proveniente de la cámara del ROV. Durante fine-tuning en Colab se aplican aumentos HSV y mosaico para robustez ante turbidez y cambios de iluminación LED.",
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

  /* ---------- Estado global ---------- */
  let activeMetrics = FALLBACK_METRICS;
  let activeChartMode = "map";
  let currentChapterIdx = 0;
  let drawerState = "closed"; // 'closed' | 'menu' | 'detail'
  let activeDetailIdx = 0;

  let smoothProgress = 0;
  let targetProgress = 0;
  const mouse = { x: 0, y: 0, nx: 0, ny: 0 };

  let usingRealVideo = false;
  let realRawUrl = null;
  let realSegUrl = null;
  let realTelemetryFrames = null;
  let visorMode = "hud";
  let visorPlaying = true;
  let simTick = 0;
  let simRafId = null;
  let termToken = 0;

  /* ---------- Elementos DOM ---------- */
  const preloader = $("#preloader");
  const scroller = $("#scroller");
  const headerProgressFill = $("#headerProgressFill");
  const btnChapters = $("#btnChapters");
  const yearStamp = $("#yearStamp");
  const heroOverlay = $("#heroOverlay");
  const chapterOverlay = $("#chapterOverlay");
  const endingOverlay = $("#endingOverlay");
  const chIdxLabel = $("#chIdxLabel");
  const chLocationLabel = $("#chLocationLabel");
  const chTitle = $("#chTitle");
  const chExcerpt = $("#chExcerpt");
  const timelineChapterDots = $("#timelineChapterDots");
  const drawerBackdrop = $("#drawerBackdrop");
  const drawerShell = $("#drawerShell");
  const drawerMenuView = $("#drawerMenuView");
  const drawerDetailView = $("#drawerDetailView");
  const chaptersMenuList = $("#chaptersMenuList");
  const detailLeftPane = $("#detailLeftPane");
  const detailRightPane = $("#detailRightPane");
  const detailEditorialBody = $("#detailEditorialBody");

  /* ---------- Audio Ambiental Opcional (Web Audio API) ---------- */
  let audioCtx = null;
  let audioOn = false;
  let gainNode = null;
  const waveBack = $("#waveBack");
  const waveFront = $("#waveFront");

  function toggleAudio() {
    audioOn = !audioOn;
    $("#audioLabel").textContent = audioOn ? "AUDIO ON" : "AUDIO OFF";
    if (audioOn) {
      try {
        if (!audioCtx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          audioCtx = new AC();
          gainNode = audioCtx.createGain();
          gainNode.gain.value = 0.045;
          const filter = audioCtx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.value = 210;
          [55, 82.41, 110].forEach((freq) => {
            const osc = audioCtx.createOscillator();
            osc.type = "sine";
            osc.frequency.value = freq;
            osc.connect(filter);
            osc.start();
          });
          filter.connect(gainNode);
          gainNode.connect(audioCtx.destination);
        }
        if (audioCtx.state === "suspended") audioCtx.resume();
        gainNode.gain.setTargetAtTime(0.045, audioCtx.currentTime, 0.2);
      } catch (_) {}
    } else if (audioCtx && gainNode) {
      gainNode.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.15);
    }
  }

  $("#btnAudio").addEventListener("click", toggleAudio);

  function animateWaveIcon(t) {
    const amp = audioOn ? 7.5 : 1.8;
    const speed = audioOn ? t * 0.005 : t * 0.0015;
    const y1 = Math.sin(speed) * amp;
    const y2 = Math.cos(speed * 1.3) * amp;
    waveBack.setAttribute("d", `M4 18 Q 11 ${18 - y1}, 18 18 T 32 18`);
    waveFront.setAttribute("d", `M4 18 Q 11 ${18 + y2}, 18 18 T 32 18`);
  }

  /* ---------- Navegación Virtual & Timeline ---------- */
  let scrollAnimId = null;

  function scrollToProgress(p) {
    if (scrollAnimId) cancelAnimationFrame(scrollAnimId);
    const maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    const startY = scroller.scrollTop;
    const endY = Math.min(1, Math.max(0, p)) * maxScroll;
    if (Math.abs(endY - startY) < 2) {
      scroller.scrollTop = endY;
      targetProgress = p;
      return;
    }
    const t0 = performance.now();
    const duration = 680;
    function step(now) {
      const k = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - k, 3);
      scroller.scrollTop = startY + (endY - startY) * ease;
      targetProgress = scroller.scrollTop / maxScroll;
      if (k < 1) {
        scrollAnimId = requestAnimationFrame(step);
      } else {
        scrollAnimId = null;
      }
    }
    scrollAnimId = requestAnimationFrame(step);
  }

  $("#stickyStage").addEventListener("wheel", (e) => {
    if (drawerState !== "closed") return;
    if (scrollAnimId) {
      cancelAnimationFrame(scrollAnimId);
      scrollAnimId = null;
    }
    scroller.scrollTop += e.deltaY;
  }, { passive: true });

  function buildTimelineDotsAndMenu() {
    CHAPTERS.forEach((ch, idx) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "timeline-dot-btn";
      dot.title = `${ch.code}: ${ch.title}`;
      dot.addEventListener("click", () => scrollToProgress(ch.scrollStop));
      timelineChapterDots.appendChild(dot);

      const row = document.createElement("button");
      row.type = "button";
      row.className = "menu-chapter-row";
      row.innerHTML = `
        <img class="menu-thumb" src="${ch.thumb}" alt="${ch.title}" />
        <div class="menu-row-meta">
          <span class="eyebrow-row"><i class="sq"></i><span class="mono-12">${ch.code}</span></span>
          <strong>${ch.title}</strong>
        </div>
      `;
      row.addEventListener("click", () => {
        scrollToProgress(ch.scrollStop);
        openDetailDrawer(idx);
      });
      chaptersMenuList.appendChild(row);
    });
  }

  function updateStageOverlays(p) {
    document.documentElement.style.setProperty("--progress", p.toFixed(4));
    const inHero = p < 0.075;
    const inEnding = p > 0.905;
    const inTimeline = !inHero && !inEnding;

    heroOverlay.classList.toggle("is-hidden", !inHero);
    chapterOverlay.classList.toggle("is-hidden", !inTimeline);
    endingOverlay.classList.toggle("is-hidden", !inEnding);
    btnChapters.classList.toggle("is-hidden", inHero && drawerState === "closed");
    yearStamp.classList.toggle("is-hidden", inHero);

    if (inTimeline) {
      const normalized = (p - 0.08) / 0.82;
      const idx = Math.min(CHAPTERS.length - 1, Math.max(0, Math.floor(normalized * CHAPTERS.length)));
      if (idx !== currentChapterIdx || chIdxLabel.textContent !== CHAPTERS[idx].code) {
        currentChapterIdx = idx;
        const ch = CHAPTERS[idx];
        chIdxLabel.textContent = ch.code;
        chLocationLabel.textContent = ch.tag;
        chTitle.innerHTML = ch.heroHeadline;
        chExcerpt.textContent = ch.excerpt;
        $$(".timeline-dot-btn", timelineChapterDots).forEach((d, i) => d.classList.toggle("active", i === idx));
        $$(".menu-chapter-row", chaptersMenuList).forEach((r, i) => r.classList.toggle("current", i === idx));
      }
    }
  }

  scroller.addEventListener("scroll", () => {
    const maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    targetProgress = Math.min(1, Math.max(0, scroller.scrollTop / maxScroll));
  });

  $("#btnEnterExp").addEventListener("click", () => scrollToProgress(CHAPTERS[0].scrollStop));
  $("#btnBrandHome").addEventListener("click", () => {
    closeDrawer();
    scrollToProgress(0);
  });
  $("#btnLearnMore").addEventListener("click", () => openDetailDrawer(currentChapterIdx));
  $("#btnFullscreen").addEventListener("click", () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  });

  /* ---------- Shared Morphing Drawer System ---------- */
  function openMenuDrawer() {
    drawerState = "menu";
    scroller.classList.add("locked");
    btnChapters.classList.remove("is-hidden");
    btnChapters.classList.add("is-close");
    drawerBackdrop.classList.remove("hidden");
    drawerShell.classList.remove("hidden", "mode-detail");
    drawerShell.classList.add("mode-menu");
    drawerMenuView.classList.remove("hidden");
    drawerDetailView.classList.add("hidden");
    requestAnimationFrame(() => {
      drawerBackdrop.classList.add("open");
      drawerShell.classList.add("open");
    });
  }

  function closeDrawer() {
    if (drawerState === "closed") return;
    drawerState = "closed";
    if (simRafId) {
      cancelAnimationFrame(simRafId);
      simRafId = null;
    }
    scroller.classList.remove("locked");
    btnChapters.classList.remove("is-close");
    if (targetProgress < 0.075) btnChapters.classList.add("is-hidden");
    drawerBackdrop.classList.remove("open");
    drawerShell.classList.remove("open");
    setTimeout(() => {
      if (drawerState === "closed") {
        drawerBackdrop.classList.add("hidden");
        drawerShell.classList.add("hidden");
      }
    }, 420);
  }

  function openDetailDrawer(idx) {
    activeDetailIdx = Math.max(0, Math.min(CHAPTERS.length - 1, idx));
    drawerState = "detail";
    scroller.classList.add("locked");
    btnChapters.classList.remove("is-hidden");
    btnChapters.classList.add("is-close");
    drawerBackdrop.classList.remove("hidden");
    drawerShell.classList.remove("hidden", "mode-menu");
    drawerShell.classList.add("mode-detail");
    drawerMenuView.classList.add("hidden");
    drawerDetailView.classList.remove("hidden");
    renderChapterDetail(activeDetailIdx);
    detailRightPane.scrollTop = 0;
    requestAnimationFrame(() => {
      drawerBackdrop.classList.add("open");
      drawerShell.classList.add("open");
    });
  }

  btnChapters.addEventListener("click", () => {
    if (drawerState === "closed") openMenuDrawer();
    else closeDrawer();
  });
  drawerBackdrop.addEventListener("click", closeDrawer);
  $("#btnBackTimeline").addEventListener("click", closeDrawer);
  $("#btnNextChapter").addEventListener("click", () => {
    const nextIdx = (activeDetailIdx + 1) % CHAPTERS.length;
    scrollToProgress(CHAPTERS[nextIdx].scrollStop);
    openDetailDrawer(nextIdx);
  });

  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    if (e.key === "Escape") {
      closeDrawer();
      return;
    }
    if (e.key.toLowerCase() === "f") {
      e.preventDefault();
      $("#btnFullscreen").click();
      return;
    }
    if (drawerState !== "closed") return;

    const stops = [0, ...CHAPTERS.map((c) => c.scrollStop), 1.0];
    if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      const next = stops.find((s) => s > targetProgress + 0.03) ?? 1.0;
      scrollToProgress(next);
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      const prev = [...stops].reverse().find((s) => s < targetProgress - 0.03) ?? 0;
      scrollToProgress(prev);
    } else if (e.key === "Enter" && targetProgress >= 0.08 && targetProgress <= 0.90) {
      e.preventDefault();
      openDetailDrawer(currentChapterIdx);
    }
  });

  /* ---------- Renderizado Dinámico de los 6 Capítulos en el Split-Pane ---------- */
  function renderChapterDetail(idx) {
    if (simRafId) {
      cancelAnimationFrame(simRafId);
      simRafId = null;
    }
    const ch = CHAPTERS[idx];
    const headerBadges = `
      <div class="detail-badges">
        <span class="badge-dark mono-12">${ch.badgeDark}</span>
        <span class="badge-cyan mono-12">${ch.badgeLight}</span>
      </div>
      <h2>${ch.title}</h2>
    `;

    if (idx === 0) {
      detailLeftPane.innerHTML = `
        <div class="sat-stage">
          <img src="media/sat_sea_of_japan.jpg" alt="Imagen satelital del Mar de Japón" />
          <div class="sat-reticle">
            <div class="reticle-box"><i></i></div>
            <div class="sat-reticle-label mono-12">SEA OF JAPAN<br />JAMSTEC ROV TRENCH</div>
          </div>
          <div class="sat-footer-bar mono-10">
            <span>36.2048° N · 138.2529° E</span>
            <span>DEPTH RANGE: 180M – 3,800M</span>
          </div>
        </div>
      `;
      detailEditorialBody.innerHTML = `
        ${headerBadges}
        <h3>Limpiar el océano sin destruir la vida bentónica alrededor de los residuos.</h3>
        <p class="editorial-p">En profundidades donde la longitud de onda roja desaparece y los focos del ROV generan retrodispersión (<em>marine snow</em>), bolsas plásticas y redes fantasma flotan junto a corales y peces.</p>
        <div class="editorial-stat-grid">
          <div class="ed-stat-card"><strong>14M+</strong><span>Toneladas de plástico ingresan al océano cada año</span></div>
          <div class="ed-stat-card"><strong>~90%</strong><span>Operación ROV actual sigue siendo teleoperada</span></div>
          <div class="ed-stat-card"><strong>68.4%</strong><span>Área errónea en BBox sobre objetos diagonales</span></div>
        </div>
        <h3>Por qué Bounding Boxes fallan frente a YOLO11-seg</h3>
        <p class="editorial-p">Arrastra el divisor central para comparar un detector rectangular tradicional frente a máscaras poligonales exactas con halo de exclusión biológica:</p>
        <div class="ed-compare-box">
          <div class="ed-compare-layer">
            <svg viewBox="0 0 960 440">
              <rect width="960" height="440" fill="#031322" />
              <path d="M0,380 Q240,350 480,382 T960,368 L960,440 L0,440 Z" fill="#071f33" />
              <path d="M510,380 C495,330 470,295 485,255 C500,235 518,265 524,295 C532,240 558,210 572,245 C585,280 562,315 568,340 C584,295 612,280 622,310 C630,335 604,365 595,382 Z" fill="#134e4a" stroke="#1f7a6e" stroke-width="2" />
              <path d="M250,150 L295,128 L465,245 L498,288 L452,318 L412,292 L245,176 Z" fill="#9fb6c3" opacity="0.85" />
              <rect x="235" y="122" width="318" height="205" fill="rgba(255,71,105,0.16)" stroke="#ff4769" stroke-width="3" stroke-dasharray="8 6" />
              <text x="90" y="106" fill="#ff4769" font-family="DM Mono" font-size="15">BBOX DEBRIS 0.89 · 68.4% RUIDO EN CORAL</text>
              <text x="115" y="362" fill="#ff4769" font-family="DM Mono" font-size="14">UNSAFE GRASP: PINZA INTERSECA CORAL</text>
            </svg>
          </div>
          <div class="ed-compare-layer ed-compare-after" id="edCompareAfter">
            <svg viewBox="0 0 960 440">
              <rect width="960" height="440" fill="#031322" />
              <path d="M0,380 Q240,350 480,382 T960,368 L960,440 L0,440 Z" fill="#071f33" />
              <path d="M510,380 C495,330 470,295 485,255 C500,235 518,265 524,295 C532,240 558,210 572,245 C585,280 562,315 568,340 C584,295 612,280 622,310 C630,335 604,365 595,382 Z" fill="rgba(0,229,160,0.38)" stroke="#00e5a0" stroke-width="2.5" />
              <path d="M466,386 C452,318 456,222 548,206 C618,202 648,292 612,386 Z" fill="none" stroke="#00e5a0" stroke-width="1.5" stroke-dasharray="5 5" />
              <path d="M250,150 L295,128 L465,245 L498,288 L452,318 L412,292 L245,176 Z" fill="rgba(144,224,239,0.42)" stroke="#90e0ef" stroke-width="2.8" />
              <circle cx="332" cy="196" r="18" fill="none" stroke="#90e0ef" stroke-width="2" />
              <circle cx="332" cy="196" r="4" fill="#00e5a0" />
              <text x="515" y="106" fill="#90e0ef" font-family="DM Mono" font-size="15">MASK 0.94 · CENTROIDE (332, 196)</text>
              <text x="515" y="405" fill="#00e5a0" font-family="DM Mono" font-size="14">SAFE GRASP VECTOR · 0.0% DAÑO BIOLÓGICO</text>
            </svg>
          </div>
          <div class="ed-compare-handle" id="edCompareHandle"><span class="ed-compare-knob">◄►</span></div>
          <input id="edCompareRange" class="ed-compare-range" type="range" min="8" max="92" value="50" aria-label="Comparador Bounding Box vs Segmentación" />
        </div>
      `;
      const range = $("#edCompareRange", detailEditorialBody);
      const after = $("#edCompareAfter", detailEditorialBody);
      const handle = $("#edCompareHandle", detailEditorialBody);
      range.addEventListener("input", () => {
        after.style.clipPath = `inset(0 0 0 ${range.value}%)`;
        handle.style.left = `${range.value}%`;
      });
    } else if (idx === 1) {
      detailLeftPane.innerHTML = `
        <div class="sat-stage">
          <img src="media/rov_underwater.jpg" alt="ROV submarino iluminando residuos plásticos y coral" />
          <div class="sat-reticle" style="top: 66%; left: 62%;">
            <div class="reticle-box"><i></i></div>
            <div class="sat-reticle-label mono-12">POLYGON GROUND TRUTH<br />FLEXIBLE POLYMER vs CORAL</div>
          </div>
          <div class="sat-footer-bar mono-10">
            <span>SOURCE: TRASHCAN 1.0 (J-EDI)</span>
            <span>7,212 REAL RGB FRAMES</span>
          </div>
        </div>
      `;
      detailEditorialBody.innerHTML = `
        ${headerBadges}
        <h3>Consolidación de 22 categorías marinas en 4 clases operativas accionables.</h3>
        <p class="editorial-p">En lugar de dispersar el modelo en subclases escasas, <code>src/dataset_utils.py</code> convierte las anotaciones poligonales COCO de la Universidad de Minnesota y JAMSTEC al formato normalizado <code>YOLO-seg [0, 1]</code> agrupado por acción robótica:</p>
        <div class="ed-tax-grid">
          <div class="ed-tax-card">
            <span class="mono-10">CLASE 00 · #90E0EF</span>
            <h4>debris_flexible_polymer</h4>
            <p>Bolsas, botellas, redes fantasma, cuerdas y textiles (<code>trash_bag</code>, <code>trash_bottle</code>, <code>trash_net</code>, <code>trash_rope</code>). Prioridad máxima de agarre suave.</p>
          </div>
          <div class="ed-tax-card" style="border-top-color:#ffb703;">
            <span class="mono-10">CLASE 01 · #FFB703</span>
            <h4>debris_rigid_other</h4>
            <p>Latas, tuberías, contenedores y chatarra metálica sumergida (<code>trash_can</code>, <code>trash_pipe</code>, <code>trash_wreckage</code>). Ajuste de torque en pinza.</p>
          </div>
          <div class="ed-tax-card" style="border-top-color:#00b880;">
            <span class="mono-10">CLASE 02 · #00E5A0</span>
            <h4>protected_marine_life</h4>
            <p>Peces, cangrejos, estrellas de mar, corales y flora (<code>animal_*</code>, <code>plant</code>). Activa el perímetro de bio-exclusión que bloquea la pinza.</p>
          </div>
          <div class="ed-tax-card" style="border-top-color:#8b5cf6;">
            <span class="mono-10">CLASE 03 · #8B5CF6</span>
            <h4>rov_hardware</h4>
            <p>Partes visibles del propio manipulador o chasis del ROV en cámara (<code>rov</code>). Evita auto-detección errónea como residuo.</p>
          </div>
        </div>
      `;
    } else if (idx === 2) {
      detailLeftPane.innerHTML = `
        <div class="stage-dark-console">
          <div class="stage-dark-header">
            <span class="mono-12" style="color:var(--cyan);">INTERACTIVE TENSOR FLOW · CLICK ANY NODE</span>
            <button id="btnToggleArchFlow" class="dark-mini-btn" type="button">PAUSAR FLUJO</button>
          </div>
          <svg id="archSvg" viewBox="0 0 820 380" class="arch-svg">
            <path id="pathMain" d="M78,190 L195,190 L315,190 L435,190" fill="none" stroke="rgba(144,224,239,0.32)" stroke-width="3" />
            <path id="pathDet" d="M435,190 C485,190 495,98 555,98 L695,98 L738,175" fill="none" stroke="rgba(255,116,56,0.38)" stroke-width="3" />
            <path id="pathProto" d="M435,190 C485,190 495,282 555,282 L695,282 L738,205" fill="none" stroke="rgba(0,229,160,0.38)" stroke-width="3" />
            <g id="archPulses"></g>
            <g class="arch-node active" data-node="input"><rect x="20" y="150" width="110" height="80" rx="10" /><text x="75" y="182">INPUT</text><text class="sub" x="75" y="204">640×640×3</text></g>
            <g class="arch-node" data-node="backbone"><rect x="150" y="150" width="115" height="80" rx="10" /><text x="207" y="182">BACKBONE</text><text class="sub" x="207" y="204">C3k2 + Conv</text></g>
            <g class="arch-node" data-node="attention"><rect x="285" y="150" width="115" height="80" rx="10" /><text x="342" y="182">SPPF + C2PSA</text><text class="sub" x="342" y="204">Atención Espacial</text></g>
            <g class="arch-node" data-node="neck"><rect x="420" y="150" width="95" height="80" rx="10" /><text x="467" y="182">NECK</text><text class="sub" x="467" y="204">PANet FPN</text></g>
            <g class="arch-node" data-node="dethead"><rect x="545" y="54" width="140" height="86" rx="10" /><text x="615" y="88">DETECT HEAD</text><text class="sub" x="615" y="108">Box+Cls+k=32</text><text class="sub" x="615" y="124">Coeffs c</text></g>
            <g class="arch-node" data-node="protonet"><rect x="545" y="240" width="140" height="86" rx="10" /><text x="615" y="274">PROTONET</text><text class="sub" x="615" y="294">32 Prototipos P</text><text class="sub" x="615" y="310">160×160</text></g>
            <g class="arch-node" data-node="assembly"><rect x="705" y="142" width="102" height="96" rx="10" /><text x="756" y="176">MASK</text><text class="sub" x="756" y="196">σ(P · cᵀ)</text><text class="sub" x="756" y="216">+ ROV HUD</text></g>
          </svg>
        </div>
      `;
      detailEditorialBody.innerHTML = `
        ${headerBadges}
        <h3>Arquitectura single-shot de segmentación por prototipos y coeficientes lineales.</h3>
        <p class="editorial-p">A diferencia de arquitecturas pesadas en dos etapas (como Mask R-CNN o SAM 2), <strong>YOLO11n-seg</strong> predice cajas, clases y máscaras en un solo pase hacia adelante sobre GPU o edge embebido.</p>
        <div class="ed-inspector-card">
          <span id="inspTag" class="mono-10">${ARCH_NODES.input.tag}</span>
          <h4 id="inspTitle">${ARCH_NODES.input.title}</h4>
          <p id="inspDesc" class="editorial-p" style="margin-bottom:0;">${ARCH_NODES.input.desc}</p>
          <div class="ed-kv-row">
            <div class="ed-kv-box"><span class="mono-10">DIMENSIONES TENSOR</span><strong id="inspTensor">${ARCH_NODES.input.tensor}</strong></div>
            <div class="ed-kv-box"><span class="mono-10">OPERACIÓN CLAVE</span><strong id="inspFormula">${ARCH_NODES.input.formula}</strong></div>
          </div>
        </div>
        <p class="editorial-p"><strong>Función de pérdida multi-tarea:</strong> <code>L = λ_box·L_CIoU+DFL + λ_seg·L_BCE(Mask) + λ_cls·L_BCE</code>, evaluando la pérdida de máscara pixel a pixel dentro del área de cada bounding box.</p>
      `;
      initArchDiagramInteractive();
    } else if (idx === 3) {
      const isVerified = activeMetrics.status === "verified";
      detailLeftPane.innerHTML = `
        <div class="stage-dark-console">
          <div class="stage-dark-header">
            <span class="mono-12" style="color:var(--cyan);">COLAB GPU T4 · PIPELINE DE FINE-TUNING</span>
            <button id="btnReplayTerm" class="dark-mini-btn" type="button">Reproducir Log</button>
          </div>
          <div class="dark-term-box">
            <div class="dark-term-bar mono-10">
              <span>notebooks/abyssal_ai_finetuning_colab.ipynb</span>
              <span style="color:${isVerified ? "var(--emerald)" : "var(--amber)"};">${isVerified ? "VERIFIED" : "PREVIEW"}</span>
            </div>
            <pre id="colabTermLog" class="dark-term-pre"></pre>
          </div>
        </div>
      `;
      const s = activeMetrics.summary || {};
      detailEditorialBody.innerHTML = `
        ${headerBadges}
        <h3>Validación cuantitativa sobre máscaras vs. cajas y exportación a ONNX.</h3>
        <p class="editorial-p">Estado actual del archivo <code>docs/media/metrics_summary.json</code>: <strong>${isVerified ? "COLAB VERIFIED RUN (Pesos reales cargados)" : "PREVIEW DATA (Ejecuta el notebook en Colab para poblar tus pesos reales)"}</strong>.</p>
        <div class="editorial-stat-grid">
          <div class="ed-stat-card"><strong>${((s.map50_mask || 0) * 100).toFixed(1)}%</strong><span>mAP@50 (Mask)</span></div>
          <div class="ed-stat-card"><strong>${((s.map50_95_mask || 0) * 100).toFixed(1)}%</strong><span>mAP@50-95 (Mask)</span></div>
          <div class="ed-stat-card"><strong>${(s.inference_ms_t4 || 9.4).toFixed(1)} ms</strong><span>Latencia GPU T4</span></div>
        </div>
        <div class="ed-chart-wrap">
          <div class="ed-chart-head">
            <strong id="chartTitle" class="mono-12">Evolución mAP por Época (Mask vs Box)</strong>
            <div style="display:flex; gap:6px;">
              <button class="ed-tab-btn ${activeChartMode === "map" ? "active" : ""}" data-chart="map" type="button">mAP@50 / 50-95</button>
              <button class="ed-tab-btn ${activeChartMode === "loss" ? "active" : ""}" data-chart="loss" type="button">Loss Convergencia</button>
            </div>
          </div>
          <canvas id="metricsChart" width="620" height="240"></canvas>
        </div>
      `;
      playColabTerminal();
      drawMetricsChart();
      $("#btnReplayTerm", detailLeftPane).addEventListener("click", playColabTerminal);
      $$(".ed-tab-btn", detailEditorialBody).forEach((btn) => {
        btn.addEventListener("click", () => {
          $$(".ed-tab-btn", detailEditorialBody).forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          activeChartMode = btn.dataset.chart || "map";
          $("#chartTitle", detailEditorialBody).textContent = activeChartMode === "map"
            ? "Evolución mAP por Época (Mask vs Box)"
            : "Convergencia de Pérdidas (Seg & Box Loss)";
          drawMetricsChart();
        });
      });
    } else if (idx === 4) {
      detailLeftPane.innerHTML = `
        <div class="stage-dark-console">
          <div class="stage-dark-header">
            <span id="demoSourceBadge" class="mono-10" style="color:var(--cyan);">${usingRealVideo ? "CLIP PRE-RENDERIZADO COLAB (REAL)" : "SIMULADOR INTERACTIVO ROV 60 FPS"}</span>
            <label class="dark-mini-btn" style="cursor:pointer;">
              <span>Cargar Media Colab</span>
              <input id="bundleFileInput" type="file" multiple accept=".mp4,.json" hidden />
            </label>
          </div>
          <div class="rov-visor-box">
            <canvas id="rovSimCanvas" width="760" height="475"></canvas>
            <div id="videoDualWrap" class="video-dual-wrap hidden">
              <video id="vidRaw" muted loop playsinline></video>
              <video id="vidSeg" muted loop playsinline></video>
              <div id="videoSplitDivider" class="video-split-divider hidden"></div>
            </div>
          </div>
          <div class="stage-dark-header" id="visorModePills">
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="dark-mini-btn ${visorMode === "raw" ? "active" : ""}" data-mode="raw" type="button">RAW FEED</button>
              <button class="dark-mini-btn ${visorMode === "masks" ? "active" : ""}" data-mode="masks" type="button">MASKS</button>
              <button class="dark-mini-btn ${visorMode === "split" ? "active" : ""}" data-mode="split" type="button">SPLIT</button>
              <button class="dark-mini-btn ${visorMode === "hud" ? "active" : ""}" data-mode="hud" type="button">HUD + BIO</button>
            </div>
            <button id="btnVisorPlay" class="dark-mini-btn" type="button">${visorPlaying ? "Pausar" : "Reanudar"}</button>
          </div>
        </div>
      `;
      detailEditorialBody.innerHTML = `
        ${headerBadges}
        <h3>Consola de visión en vivo con protocolo automático de bio-exclusión.</h3>
        <p class="editorial-p">Cada máscara segmentada calcula área real en píxeles, centroide de agarre y distancia mínima hacia fauna protegida. Cuando un pez cruza el umbral (&lt; 45 px), el estado cambia en tiempo real a <strong>BIO_EXCLUSION_HOLD</strong>.</p>
        <div id="telStatusBox" class="ed-tel-status">
          <span class="mono-12">PROTOCOLO DE PINZA ROV</span>
          <strong id="telGraspStatus">SAFE_GRASP</strong>
        </div>
        <div class="editorial-stat-grid">
          <div class="ed-stat-card"><strong id="telFps">60.0</strong><span>FPS Visor</span></div>
          <div class="ed-stat-card"><strong id="telWastePct">59.2%</strong><span>Ruido BBox Evitado</span></div>
          <div class="ed-stat-card"><strong id="telBioDist">142 px</strong><span>Distancia Mín. Fauna</span></div>
        </div>
        <div class="ed-kv-row" style="margin-bottom:2rem;">
          <div class="ed-kv-box"><span class="mono-10">ÁREA RESIDUO / LATENCIA</span><strong id="telAreaLat">8.4% · 9.4 ms</strong></div>
          <div class="ed-kv-box"><span class="mono-10">CENTROIDE OBJETIVO</span><strong id="telCentroid">(340, 210)</strong></div>
        </div>
        <span class="mono-10" style="color:#4f7288;">INSTANCIAS ACTIVAS EN FRAME</span>
        <div id="telInstancesList" class="ed-inst-list"></div>
      `;
      bindLiveVisorControls();
      startVisorLoop();
    } else {
      detailLeftPane.innerHTML = `
        <div class="sat-stage">
          <img src="media/sat_sea_of_japan.jpg" alt="Proyección de despliegue embebido en el Pacífico" />
          <div class="sat-reticle" style="top: 38%; left: 54%;">
            <div class="reticle-box"><i></i></div>
            <div class="sat-reticle-label mono-12">EDGE DEPLOYMENT TARGET<br />JETSON ORIN NANO · FP16</div>
          </div>
          <div class="sat-footer-bar mono-10">
            <span>EXPORT: ONNX / TENSORRT</span>
            <span>3D STEREO + BYTETRACK</span>
          </div>
        </div>
      `;
      detailEditorialBody.innerHTML = `
        ${headerBadges}
        <h3>Conclusiones técnicas, limitaciones reales y escalamiento a hardware embebido.</h3>
        <p class="editorial-p"><strong>Hallazgos clave:</strong> Consolidar las clases de TrashCan 1.0 en 4 categorías operativas permite conectar la salida de YOLO11-seg directamente al controlador de la pinza, evitando más de un 55–68% de solapamiento sobre fondo y corales.</p>
        <p class="editorial-p"><strong>Limitaciones físicas:</strong> En aguas con alta turbidez, retrodispersión LED (<em>backscatter</em>) o pérdida cromática severa, los bordes de plásticos translúcidos pierden contraste y la distancia actual opera en plano 2D de imagen.</p>
        <div class="ed-tax-grid">
          <div class="ed-tax-card">
            <span class="mono-10">ROADMAP 01</span>
            <h4>TensorRT FP16 Embebido</h4>
            <p>Despliegue del archivo <code>best.onnx</code> cuantizado en <strong>NVIDIA Jetson Orin Nano</strong> a bordo de ROVs reales de bajo consumo.</p>
          </div>
          <div class="ed-tax-card" style="border-top-color:#00b880;">
            <span class="mono-10">ROADMAP 02</span>
            <h4>Estéreo 3D + ByteTrack</h4>
            <p>Proyección de máscaras sobre mapa de disparidad estéreo (X, Y, Z) y persistencia de ID frente a corrientes marinas.</p>
          </div>
        </div>
      `;
    }
  }

  /* ---------- Funciones Interactivas Dentro del Drawer ---------- */
  function initArchDiagramInteractive() {
    const svg = $("#archSvg", detailLeftPane);
    const pulseLayer = $("#archPulses", svg);
    const NS = "http://www.w3.org/2000/svg";
    const routes = [
      { el: $("#pathMain", svg), color: "#90e0ef", speed: 0.25 },
      { el: $("#pathDet", svg), color: "#ff7438", speed: 0.2 },
      { el: $("#pathProto", svg), color: "#00e5a0", speed: 0.2 },
    ];
    let running = true;
    let lastTs = 0;
    let spawnAcc = 0;
    let pulses = [];

    $$(".arch-node", svg).forEach((node) => {
      node.addEventListener("click", () => {
        const key = node.dataset.node;
        const info = ARCH_NODES[key];
        if (!info) return;
        $$(".arch-node", svg).forEach((n) => n.classList.toggle("active", n.dataset.node === key));
        $("#inspTag", detailEditorialBody).textContent = info.tag;
        $("#inspTitle", detailEditorialBody).textContent = info.title;
        $("#inspDesc", detailEditorialBody).textContent = info.desc;
        $("#inspTensor", detailEditorialBody).textContent = info.tensor;
        $("#inspFormula", detailEditorialBody).textContent = info.formula;
      });
    });

    $("#btnToggleArchFlow", detailLeftPane).addEventListener("click", (e) => {
      running = !running;
      e.currentTarget.textContent = running ? "PAUSAR FLUJO" : "REANUDAR FLUJO";
    });

    function step(ts) {
      if (drawerState !== "detail" || activeDetailIdx !== 2) return;
      const dt = Math.min(50, ts - (lastTs || ts));
      lastTs = ts;
      if (running) {
        spawnAcc += dt;
        if (spawnAcc > 900) {
          spawnAcc = 0;
          routes.forEach((r) => {
            const c = document.createElementNS(NS, "circle");
            c.setAttribute("r", "4.5");
            c.setAttribute("fill", r.color);
            pulseLayer.appendChild(c);
            pulses.push({ el: r.el, len: r.el.getTotalLength(), d: 0, speed: r.speed, c });
          });
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
      simRafId = requestAnimationFrame(step);
    }
    simRafId = requestAnimationFrame(step);
  }

  async function playColabTerminal() {
    const token = ++termToken;
    const pre = $("#colabTermLog", detailLeftPane);
    if (!pre) return;
    pre.innerHTML = "";
    const lines = [
      { cls: "t-cmd", text: "$ nvidia-smi --query-gpu=name,memory.total --format=csv,noheader" },
      { cls: "t-ok", text: "Tesla T4, 15360 MiB  |  CUDA 12.x Ready" },
      { cls: "t-cmd", text: "$ curl -L ... -o dataset.zip  # TrashCan 1.0 (553 MB)" },
      { cls: "", text: "Mapeando 22 clases JAMSTEC → 4 clases operativas ROV..." },
      { cls: "t-ok", text: "Dataset validado: 6,065 train imgs / 1,147 val imgs · 0 errores" },
      { cls: "t-cmd", text: "$ yolo segment train model=yolo11n-seg.pt data=data.yaml epochs=50 imgsz=640" },
      { cls: "", text: "Epoch 1/50   box_loss: 1.980  seg_loss: 2.840  mAP50(M): 0.270" },
      { cls: "", text: "Epoch 25/50  box_loss: 1.030  seg_loss: 1.120  mAP50(M): 0.700" },
      { cls: "t-ok", text: "Epoch 46/50  box_loss: 0.820  seg_loss: 0.830  mAP50(M): 0.742  mAP50-95(M): 0.518" },
      { cls: "t-cmd", text: "$ yolo export model=best.pt format=onnx simplify=True" },
      { cls: "t-ok", text: "Exportado: abyssal_web_bundle.zip (best.pt + metrics + rov_segmented.mp4)" },
    ];
    for (const item of lines) {
      if (token !== termToken || drawerState !== "detail" || activeDetailIdx !== 3) return;
      const sp = document.createElement("span");
      if (item.cls) sp.className = item.cls;
      sp.textContent = item.text + "\n";
      pre.appendChild(sp);
      pre.scrollTop = pre.scrollHeight;
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  function drawMetricsChart() {
    const canvas = $("#metricsChart", detailEditorialBody);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const epochs = activeMetrics.epochs || [];
    if (epochs.length < 2) return;

    const padL = 48;
    const padR = 20;
    const padT = 24;
    const padB = 30;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const series = activeChartMode === "map"
      ? [
          { key: "map50_mask", label: "mAP@50 Mask", color: "#0077b6" },
          { key: "map50_95_mask", label: "mAP@50-95 Mask", color: "#00a878" },
          { key: "map50_95_box", label: "mAP@50-95 Box", color: "#e85d04" },
        ]
      : [
          { key: "train_seg_loss", label: "Train Seg Loss", color: "#0077b6" },
          { key: "val_seg_loss", label: "Val Seg Loss", color: "#d90429" },
          { key: "train_box_loss", label: "Train Box Loss", color: "#e85d04" },
        ];

    const maxY = activeChartMode === "map"
      ? 1.0
      : Math.max(3.0, ...epochs.flatMap((e) => series.map((s) => Number(e[s.key] || 0))));

    ctx.strokeStyle = "rgba(0, 38, 62, 0.12)";
    ctx.lineWidth = 1;
    ctx.font = "11px 'DM Mono', monospace";
    ctx.fillStyle = "#365970";

    for (let i = 0; i <= 4; i++) {
      const y = padT + (plotH * i) / 4;
      const val = maxY * (1 - i / 4);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      ctx.fillText(val.toFixed(activeChartMode === "map" ? 2 : 1), 6, y + 4);
    }

    const minEp = epochs[0].epoch;
    const maxEp = epochs[epochs.length - 1].epoch;

    series.forEach((s, sIdx) => {
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.6;
      epochs.forEach((ep, idx) => {
        const x = padL + ((ep.epoch - minEp) / Math.max(1, maxEp - minEp)) * plotW;
        const y = padT + (1 - Number(ep[s.key] || 0) / maxY) * plotH;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const lx = padL + sIdx * 168;
      ctx.fillStyle = s.color;
      ctx.fillRect(lx, 6, 12, 4);
      ctx.fillStyle = "#00263e";
      ctx.fillText(s.label, lx + 18, 12);
    });

    ctx.fillStyle = "#365970";
    ctx.fillText(`Época ${minEp}`, padL, h - 8);
    ctx.fillText(`Época ${maxEp}`, w - padR - 58, h - 8);
  }

  /* ---------- Live ROV Vision Console (Ch 05) ---------- */
  function bindLiveVisorControls() {
    $$("#visorModePills [data-mode]", detailLeftPane).forEach((btn) => {
      btn.addEventListener("click", () => {
        $$("#visorModePills [data-mode]", detailLeftPane).forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        visorMode = btn.dataset.mode || "hud";
        syncRealVideoMode();
      });
    });

    $("#btnVisorPlay", detailLeftPane).addEventListener("click", (e) => {
      visorPlaying = !visorPlaying;
      e.currentTarget.textContent = visorPlaying ? "Pausar" : "Reanudar";
      if (usingRealVideo) {
        const vidRaw = $("#vidRaw", detailLeftPane);
        const vidSeg = $("#vidSeg", detailLeftPane);
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

    $("#bundleFileInput", detailLeftPane).addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      let rUrl = null;
      let sUrl = null;
      let tData = null;
      for (const file of files) {
        const lower = file.name.toLowerCase();
        if (lower.includes("metrics") && lower.endsWith(".json")) {
          try { activeMetrics = JSON.parse(await file.text()); } catch (_) {}
        } else if (lower.includes("telemetry") && lower.endsWith(".json")) {
          try { tData = JSON.parse(await file.text()); } catch (_) {}
        } else if (lower.includes("raw") && lower.endsWith(".mp4")) {
          rUrl = URL.createObjectURL(file);
        } else if (lower.endsWith(".mp4")) {
          sUrl = URL.createObjectURL(file);
        }
      }
      if (sUrl || rUrl) {
        realRawUrl = rUrl || sUrl;
        realSegUrl = sUrl || rUrl;
        realTelemetryFrames = tData?.frames || null;
        usingRealVideo = true;
        mountRealVideoElements();
      }
    });

    if (usingRealVideo && realSegUrl) mountRealVideoElements();
  }

  function syncRealVideoMode() {
    if (!usingRealVideo) return;
    const vidRaw = $("#vidRaw", detailLeftPane);
    const vidSeg = $("#vidSeg", detailLeftPane);
    const div = $("#videoSplitDivider", detailLeftPane);
    if (!vidRaw || !vidSeg) return;
    if (visorMode === "raw") {
      vidRaw.style.opacity = "1";
      vidSeg.style.opacity = "0";
      vidSeg.style.clipPath = "none";
      div.classList.add("hidden");
    } else if (visorMode === "split") {
      vidRaw.style.opacity = "1";
      vidSeg.style.opacity = "1";
      vidSeg.style.clipPath = "inset(0 0 0 50%)";
      div.classList.remove("hidden");
    } else {
      vidRaw.style.opacity = "0";
      vidSeg.style.opacity = "1";
      vidSeg.style.clipPath = "none";
      div.classList.add("hidden");
    }
  }

  function mountRealVideoElements() {
    const wrap = $("#videoDualWrap", detailLeftPane);
    const canvas = $("#rovSimCanvas", detailLeftPane);
    const vidRaw = $("#vidRaw", detailLeftPane);
    const vidSeg = $("#vidSeg", detailLeftPane);
    if (!wrap || !vidRaw || !vidSeg) return;
    vidRaw.src = realRawUrl;
    vidSeg.src = realSegUrl;
    wrap.classList.remove("hidden");
    canvas.classList.add("hidden");
    $("#demoSourceBadge", detailLeftPane).textContent = "CLIP PRE-RENDERIZADO COLAB (REAL)";
    syncRealVideoMode();
    if (visorPlaying) {
      vidRaw.play().catch(() => {});
      vidSeg.play().catch(() => {});
    }
  }

  function polyCenter(pts) {
    let sx = 0, sy = 0;
    for (const [x, y] of pts) { sx += x; sy += y; }
    return [sx / pts.length, sy / pts.length];
  }

  function minDistPts(a, b) {
    let best = Infinity;
    for (const [ax, ay] of a) for (const [bx, by] of b) {
      const d = Math.hypot(ax - bx, ay - by);
      if (d < best) best = d;
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

  function updateEditorialTelemetry(tel) {
    const statusBox = $("#telStatusBox", detailEditorialBody);
    const statusEl = $("#telGraspStatus", detailEditorialBody);
    if (!statusBox || !statusEl) return;
    const isHold = tel.grasp_status === "BIO_EXCLUSION_HOLD";
    statusBox.classList.toggle("hold", isHold);
    statusEl.textContent = tel.grasp_status;
    $("#telFps", detailEditorialBody).textContent = Number(tel.fps || 60).toFixed(1);
    $("#telWastePct", detailEditorialBody).textContent = `${Number(tel.avg_bbox_waste_pct || 0).toFixed(1)}%`;
    $("#telBioDist", detailEditorialBody).textContent = tel.min_bio_distance_px !== null ? `${Number(tel.min_bio_distance_px).toFixed(0)} px` : "CLEAR";
    $("#telAreaLat", detailEditorialBody).textContent = `${Number(tel.debris_coverage_pct || 0).toFixed(2)}% · ${Number(tel.inference_ms || 9.4).toFixed(1)} ms`;
    const tgt = tel.primary_target;
    $("#telCentroid", detailEditorialBody).textContent = tgt ? `(${Math.round(tgt.centroid[0])}, ${Math.round(tgt.centroid[1])})` : "--";

    const listEl = $("#telInstancesList", detailEditorialBody);
    listEl.innerHTML = "";
    const barColors = { 0: "#0077b6", 1: "#e85d04", 2: "#00a878", 3: "#6c3fc5" };
    (tel.instances || []).forEach((inst) => {
      const pct = Math.round((inst.confidence || 0.9) * 100);
      const row = document.createElement("div");
      row.className = "ed-inst-row";
      row.innerHTML = `
        <div class="ed-inst-top"><span>${inst.class_name}</span><strong>${pct}%</strong></div>
        <div class="ed-inst-bar"><i style="width:${pct}%; background:${barColors[inst.class_id] || "#00263e"}"></i></div>
      `;
      listEl.appendChild(row);
    });
  }

  function startVisorLoop() {
    const canvas = $("#rovSimCanvas", detailLeftPane);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const classHex = { 0: "#90e0ef", 1: "#ffb703", 2: "#00e5a0", 3: "#8b5cf6" };

    function frame() {
      if (drawerState !== "detail" || activeDetailIdx !== 4) return;
      if (usingRealVideo) {
        const vidSeg = $("#vidSeg", detailLeftPane);
        if (realTelemetryFrames && realTelemetryFrames.length > 0 && vidSeg?.duration) {
          const r = vidSeg.currentTime / Math.max(0.1, vidSeg.duration);
          updateEditorialTelemetry(realTelemetryFrames[Math.min(realTelemetryFrames.length - 1, Math.floor(r * realTelemetryFrames.length))]);
        }
        simRafId = requestAnimationFrame(frame);
        return;
      }

      if (visorPlaying) simTick += 1;
      const t = simTick * 0.032;
      const w = canvas.width;
      const h = canvas.height;
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#082947");
      grad.addColorStop(0.6, "#041629");
      grad.addColorStop(1, "#020b15");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (let b = 0; b < 3; b++) {
        const shift = Math.sin(t * 0.7 + b) * 28;
        ctx.fillStyle = "rgba(144, 224, 239, 0.05)";
        ctx.beginPath();
        ctx.moveTo(140 + b * 210 + shift, 0);
        ctx.lineTo(220 + b * 210 + shift, 0);
        ctx.lineTo(310 + b * 210 + shift, h);
        ctx.lineTo(90 + b * 210 + shift, h);
        ctx.closePath();
        ctx.fill();
      }

      const bob = Math.sin(t) * 14;
      const bottlePoly = [[250, 165 + bob], [292, 145 + bob], [395, 215 + bob], [418, 248 + bob], [378, 275 + bob], [268, 202 + bob]];
      const netPoly = [[155, 280 - bob * 0.5], [215, 264 - bob * 0.5], [252, 308 - bob * 0.5], [218, 352 - bob * 0.5], [148, 330 - bob * 0.5]];
      const rigidPoly = [[560, 366], [620, 360], [632, 396], [556, 398]];
      const coralPoly = [[485, 415], [498, 342], [525, 328], [548, 355], [562, 415]];
      const fishX = 70 + ((t * 0.24) % 1) * (w - 140);
      const fishY = 215 + Math.sin(t * 1.9) * 18;
      const fishPoly = [[fishX - 36, fishY - 14], [fishX - 15, fishY - 2], [fishX + 18, fishY - 18], [fishX + 42, fishY], [fishX + 18, fishY + 18], [fishX - 15, fishY + 2], [fishX - 36, fishY + 14]];

      const objects = [
        { poly: bottlePoly, classId: 0, fill: "rgba(195,222,235,0.68)", stroke: "#d9eef8" },
        { poly: netPoly, classId: 0, fill: "rgba(162,190,204,0.55)", stroke: "#b7d3e0" },
        { poly: rigidPoly, classId: 1, fill: "rgba(110,126,144,0.85)", stroke: "#98adc4" },
        { poly: coralPoly, classId: 2, fill: "rgba(26,105,92,0.9)", stroke: "#289c88" },
        { poly: fishPoly, classId: 2, fill: "rgba(68,176,214,0.92)", stroke: "#9ce6ff" },
      ];

      for (const obj of objects) {
        ctx.beginPath();
        obj.poly.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.closePath();
        ctx.fillStyle = obj.fill;
        ctx.fill();
        ctx.strokeStyle = obj.stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const debrisArea = polyArea(bottlePoly) + polyArea(netPoly) + polyArea(rigidPoly);
      const minBioDist = Math.min(minDistPts(fishPoly, bottlePoly), minDistPts(coralPoly, bottlePoly));
      const graspStatus = minBioDist < 58 ? "BIO_EXCLUSION_HOLD" : "SAFE_GRASP";
      const bottleCenter = polyCenter(bottlePoly);

      if (visorMode !== "raw") {
        ctx.save();
        if (visorMode === "split") {
          ctx.beginPath();
          ctx.rect(w * 0.5, 0, w * 0.5, h);
          ctx.clip();
        }
        for (const obj of objects) {
          const hex = classHex[obj.classId];
          ctx.beginPath();
          obj.poly.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
          ctx.closePath();
          ctx.fillStyle = `${hex}44`;
          ctx.fill();
          ctx.strokeStyle = hex;
          ctx.lineWidth = 2.4;
          ctx.stroke();
          if (visorMode === "hud" && obj.classId === 2) {
            const [cx, cy] = polyCenter(obj.poly);
            ctx.beginPath();
            ctx.setLineDash([5, 4]);
            ctx.arc(cx, cy, 48, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(0, 229, 160, 0.78)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
        if (visorMode === "hud") {
          const [tx, ty] = bottleCenter;
          ctx.strokeStyle = graspStatus === "BIO_EXCLUSION_HOLD" ? "#ff4769" : "#90e0ef";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(tx, ty, 18, 0, Math.PI * 2);
          ctx.moveTo(tx - 26, ty); ctx.lineTo(tx + 26, ty);
          ctx.moveTo(tx, ty - 26); ctx.lineTo(tx, ty + 26);
          ctx.stroke();
        }
        ctx.restore();
        if (visorMode === "split") {
          ctx.strokeStyle = "#90e0ef";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(w * 0.5, 0);
          ctx.lineTo(w * 0.5, h);
          ctx.stroke();
        }
      }

      if (simTick <= 1 || simTick % 4 === 0) {
        updateEditorialTelemetry({
          fps: 60.0,
          inference_ms: 9.4,
          debris_coverage_pct: (debrisArea / (w * h)) * 100,
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
      simRafId = requestAnimationFrame(frame);
    }
    simTick = 0;
    frame();
  }

  /* ---------- Motor 3D Three.js WebGL (Globo Terra + Océano con Sun-Glint + Buque + Islas) ---------- */
  function buildProceduralEarthCanvas() {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#02182d");
    grad.addColorStop(0.5, "#052545");
    grad.addColorStop(1, "#021426");
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 512);
    g.fillStyle = "#2d4c3e";
    [[220, 180, 95, 65], [300, 320, 60, 95], [530, 175, 130, 75], [560, 295, 70, 90], [740, 210, 120, 75], [840, 360, 65, 45]].forEach(([x, y, rx, ry]) => {
      g.beginPath();
      g.ellipse(x, y, rx, ry, 0.25, 0, Math.PI * 2);
      g.fill();
    });
    return c;
  }

  function buildCloudCanvasTexture() {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const g = c.getContext("2d");
    g.clearRect(0, 0, 512, 256);
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const r = 12 + Math.random() * 38;
      const rad = g.createRadialGradient(x, y, 2, x, y, r);
      rad.addColorStop(0, "rgba(220, 240, 255, 0.22)");
      rad.addColorStop(1, "rgba(220, 240, 255, 0)");
      g.fillStyle = rad;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    return c;
  }

  function buildWakeCanvasTexture() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 512;
    const g = c.getContext("2d");
    g.clearRect(0, 0, 256, 512);
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, "rgba(230, 248, 255, 0.72)");
    grad.addColorStop(0.35, "rgba(180, 232, 250, 0.36)");
    grad.addColorStop(1.0, "rgba(144, 224, 239, 0.0)");
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(116, 0);
    g.lineTo(140, 0);
    g.lineTo(246, 512);
    g.lineTo(10, 512);
    g.closePath();
    g.fill();
    for (let i = 0; i < 160; i++) {
      const t = Math.random();
      const spread = 12 + t * 105;
      const x = 128 + (Math.random() - 0.5) * 2 * spread;
      const y = t * 490;
      g.fillStyle = `rgba(255, 255, 255, ${(1 - t) * 0.42})`;
      g.beginPath();
      g.arc(x, y, 1.5 + Math.random() * 5, 0, Math.PI * 2);
      g.fill();
    }
    return c;
  }

  function initWebGLWorld() {
    const canvas = $("#webglCanvas");
    if (typeof THREE === "undefined") {
      initFallback2D();
      return;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch (_) {
      initFallback2D();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000d15, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000d15, 0.012);

    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 220);
    camera.position.set(0, 0, 6.85);

    const hemiLight = new THREE.HemisphereLight(0xbbeeff, 0x05182e, 1.35);
    scene.add(hemiLight);
    const sunLight = new THREE.DirectionalLight(0xeef8ff, 2.35);
    sunLight.position.set(12, 16, 14);
    scene.add(sunLight);

    /* ----- ESCENA 1: GLOBO TERRAQUEO 3D + ATMÓSFERA FRESNEL + BALIZAS ----- */
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const fallbackTex = new THREE.CanvasTexture(buildProceduralEarthCanvas());
    const earthMat = new THREE.MeshStandardMaterial({
      map: fallbackTex,
      roughness: 0.72,
      metalness: 0.12,
    });
    const loader = new THREE.TextureLoader();
    loader.load("media/earth_albedo.jpg", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      earthMat.map = tex;
      earthMat.needsUpdate = true;
    });

    const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(2.35, 64, 64), earthMat);
    globeGroup.add(earthMesh);

    const cloudTex = new THREE.CanvasTexture(buildCloudCanvasTexture());
    const cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.39, 48, 48),
      new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.45, depthWrite: false })
    );
    globeGroup.add(cloudMesh);

    const atmoMat = new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Color(0x90e0ef) } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float rim = clamp(dot(-vNormal, vView), 0.0, 1.0);
          float alpha = pow(rim, 3.6) * 0.55;
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    globeGroup.add(new THREE.Mesh(new THREE.SphereGeometry(2.68, 64, 64), atmoMat));

    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x90e0ef, transparent: true, opacity: 0.65 });
    for (let i = 0; i < 8; i++) {
      const phi = (0.35 + (i % 4) * 0.24) * Math.PI;
      const theta = (0.4 + i * 0.58) * Math.PI;
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      );
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.014, 0.52, 8), beaconMat);
      beam.position.copy(dir.clone().multiplyScalar(2.55));
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      globeGroup.add(beam);
    }

    /* ----- ESCENA 2: OCÉANO ANIMADO SUN-GLINT + BUQUE DE INVESTIGACIÓN + ISLAS ----- */
    const oceanGroup = new THREE.Group();
    scene.add(oceanGroup);

    const oceanUniforms = {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.25, 0.72, 0.65).normalize() },
      uDeepColor: { value: new THREE.Color(0x001324) },
      uMidColor: { value: new THREE.Color(0x043256) },
    };

    const oceanShaderMat = new THREE.ShaderMaterial({
      uniforms: oceanUniforms,
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float w1 = sin(pos.x * 0.45 + uTime * 1.1) * 0.16;
          float w2 = cos(pos.y * 0.38 - uTime * 0.9) * 0.14;
          pos.z += w1 + w2;
          vec4 wp = modelMatrix * vec4(pos, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uSunDir;
        uniform vec3 uDeepColor;
        uniform vec3 uMidColor;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }
        void main() {
          vec2 p = vWorldPos.xz * 1.15;
          float n1 = noise(p * 0.6 + vec2(uTime * 0.2, uTime * 0.15));
          float n2 = noise(p * 1.8 - vec2(uTime * 0.28, -uTime * 0.18));
          float n3 = noise(p * 5.2 + vec2(-uTime * 0.35, uTime * 0.45));
          float dx = (noise(p * 3.8 + vec2(0.08, uTime * 0.22)) - noise(p * 3.8 - vec2(0.08, -uTime * 0.22))) * 3.1;
          float dz = (noise(p * 3.8 + vec2(uTime * 0.22, 0.08)) - noise(p * 3.8 - vec2(-uTime * 0.22, 0.08))) * 3.1;
          vec3 N = normalize(vec3(dx, 1.0, dz));
          vec3 V = normalize(cameraPosition - vWorldPos);
          vec3 H = normalize(uSunDir + V);
          float spec = pow(max(dot(N, H), 0.0), 145.0) * 2.8;
          float sparkle = smoothstep(0.62, 0.94, n3) * pow(max(dot(N, H), 0.0), 34.0) * 1.5;
          vec3 base = mix(uDeepColor, uMidColor, n1 * 0.65 + n2 * 0.35);
          vec3 col = base + vec3(0.85, 0.96, 1.0) * (spec + sparkle);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const oceanPlane = new THREE.Mesh(new THREE.PlaneGeometry(140, 140, 110, 110), oceanShaderMat);
    oceanPlane.rotation.x = -Math.PI / 2;
    oceanGroup.add(oceanPlane);

    /* Buque de investigación OceanXplorer / Abyssal */
    const vesselGroup = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x0e253b, roughness: 0.45, metalness: 0.3 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xeaf4fa, roughness: 0.4, metalness: 0.15 });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x1c3a54, roughness: 0.6 });
    const heliMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });

    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 3.2), hullMat);
    hull.position.y = 0.08;
    vesselGroup.add(hull);

    const bow = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.95, 4), hullMat);
    bow.rotation.x = -Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.position.set(0, 0.1, -2.0);
    vesselGroup.add(bow);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.08, 2.85), deckMat);
    deck.position.set(0, 0.26, -0.1);
    vesselGroup.add(deck);

    const heliRing = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.28, 24), heliMat);
    heliRing.rotation.x = -Math.PI / 2;
    heliRing.position.set(0, 0.31, -1.05);
    vesselGroup.add(heliRing);

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.42, 1.05), whiteMat);
    bridge.position.set(0, 0.5, -0.15);
    vesselGroup.add(bridge);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.55, 8), whiteMat);
    mast.position.set(0, 0.92, -0.15);
    vesselGroup.add(mast);

    const craneLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.08), whiteMat);
    craneLeft.position.set(-0.34, 0.48, 1.32);
    craneLeft.rotation.x = 0.32;
    vesselGroup.add(craneLeft);

    const craneRight = craneLeft.clone();
    craneRight.position.x = 0.34;
    vesselGroup.add(craneRight);

    const wakeTex = new THREE.CanvasTexture(buildWakeCanvasTexture());
    const wakeMat = new THREE.MeshBasicMaterial({ map: wakeTex, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide });
    const wakeMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 6.2), wakeMat);
    wakeMesh.rotation.x = -Math.PI / 2;
    wakeMesh.position.set(0, 0.06, 4.4);
    vesselGroup.add(wakeMesh);

    oceanGroup.add(vesselGroup);

    /* Islas rocosas multi-cumbre y espuma costera */
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x363e42, roughness: 0.94, flatShading: true });
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x2c4236, roughness: 0.92, flatShading: true });
    const foamMat = new THREE.MeshBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
    const islandSpecs = [
      [-6.5, -6, 1.8],
      [7.2, -16, 2.2],
      [-5.8, -26, 1.9],
      [6.4, -36, 2.3],
    ];
    const foamRings = [];
    islandSpecs.forEach(([ix, iz, sc]) => {
      const cluster = new THREE.Group();
      cluster.position.set(ix, -0.2, iz);
      [
        [0, 0, sc, 1.5, 0.48, 1.15, rockMat],
        [sc * 0.6, sc * 0.2, sc * 0.72, 1.2, 0.45, 0.9, mossMat],
        [-sc * 0.55, -sc * 0.1, sc * 0.65, 1.1, 0.52, 1.0, rockMat],
      ].forEach(([ox, oz, r, sx, sy, sz, mat]) => {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), mat);
        rock.scale.set(sx, sy, sz);
        rock.position.set(ox, 0, oz);
        cluster.add(rock);
      });
      oceanGroup.add(cluster);

      const foam = new THREE.Mesh(new THREE.RingGeometry(sc * 1.28, sc * 1.5, 40), foamMat);
      foam.rotation.x = -Math.PI / 2;
      foam.position.set(ix, 0.05, iz);
      oceanGroup.add(foam);
      foamRings.push(foam);
    });

    /* Gaviotas 3D con alas en V */
    const gullMat = new THREE.MeshBasicMaterial({ color: 0xf4fbff, side: THREE.DoubleSide });
    const gulls = [];
    for (let i = 0; i < 6; i++) {
      const gull = new THREE.Group();
      const wingL = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.045), gullMat);
      wingL.rotation.x = -Math.PI / 2;
      wingL.rotation.z = 0.28;
      wingL.position.x = -0.07;
      const wingR = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.045), gullMat);
      wingR.rotation.x = -Math.PI / 2;
      wingR.rotation.z = -0.28;
      wingR.position.x = 0.07;
      gull.add(wingL, wingR);
      gull.position.set((i - 2.5) * 1.1, 3.0 + (i % 2) * 0.4, -4 - i * 2);
      oceanGroup.add(gull);
      gulls.push({ mesh: gull, wingL, wingR, phase: i * 1.1 });
    }

    /* Loop de renderizado */
    const clock = new THREE.Clock();
    function animate() {
      const t = clock.getElapsedTime();
      smoothProgress += (targetProgress - smoothProgress) * 0.085;
      updateStageOverlays(smoothProgress);
      animateWaveIcon(t * 1000);

      const showGlobe = smoothProgress < 0.085 || smoothProgress > 0.905;
      globeGroup.visible = showGlobe;
      oceanGroup.visible = !showGlobe;

      if (showGlobe) {
        earthMesh.rotation.y = t * 0.055 + smoothProgress * 2.2;
        cloudMesh.rotation.y = t * 0.072;
        globeGroup.rotation.x = 0.22 + mouse.ny * 0.08;
        globeGroup.rotation.y = -0.75 + mouse.nx * 0.12;
        const zoom = smoothProgress < 0.085
          ? 6.85 - (smoothProgress / 0.085) * 3.35
          : 6.85 - ((1 - smoothProgress) / 0.095) * 3.25;
        camera.position.set(mouse.nx * 0.32, -mouse.ny * 0.22, zoom);
        camera.lookAt(0, 0, 0);
      } else {
        oceanUniforms.uTime.value = t;
        const seaT = Math.min(1, Math.max(0, (smoothProgress - 0.085) / 0.82));
        const shipZ = -seaT * 36;
        const shipX = Math.sin(seaT * Math.PI * 2.4) * 2.6;
        vesselGroup.position.set(shipX, 0.04 + Math.sin(t * 1.4) * 0.04, shipZ);
        vesselGroup.rotation.y = Math.cos(seaT * Math.PI * 2.4) * -0.25;
        vesselGroup.rotation.z = Math.sin(t * 1.1) * 0.035;
        wakeMat.opacity = 0.62 + Math.sin(t * 3.5) * 0.12;

        oceanPlane.position.z = shipZ - 12;
        camera.position.set(shipX + 1.8 + mouse.nx * 0.8, 7.6 - mouse.ny * 0.5, shipZ + 6.4);
        camera.lookAt(shipX - 0.6, 0.2, shipZ - 1.6);

        gulls.forEach((g) => {
          g.mesh.position.x = shipX - 1.8 + Math.cos(t * 0.8 + g.phase) * 2.8;
          g.mesh.position.z = shipZ - 1.5 + Math.sin(t * 0.8 + g.phase) * 2.4;
          g.mesh.position.y = 3.0 + Math.sin(t * 2.2 + g.phase) * 0.25;
          const flap = Math.sin(t * 7.5 + g.phase) * 0.35;
          g.wingL.rotation.y = flap;
          g.wingR.rotation.y = -flap;
        });

        foamRings.forEach((f, idx) => {
          const s = 1 + Math.sin(t * 1.6 + idx) * 0.045;
          f.scale.set(s, s, 1);
        });
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    setTimeout(() => preloader.classList.add("done"), 650);
    requestAnimationFrame(animate);
  }

  function initFallback2D() {
    const c = $("#fallback2dCanvas");
    c.classList.remove("hidden");
    const ctx = c.getContext("2d");
    function resize() { c.width = window.innerWidth; c.height = window.innerHeight; }
    resize();
    window.addEventListener("resize", resize);
    function loop(ts) {
      smoothProgress += (targetProgress - smoothProgress) * 0.085;
      updateStageOverlays(smoothProgress);
      animateWaveIcon(ts);
      const grad = ctx.createLinearGradient(0, 0, 0, c.height);
      grad.addColorStop(0, "#000d15");
      grad.addColorStop(1, "#042642");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, c.width, c.height);
      requestAnimationFrame(loop);
    }
    setTimeout(() => preloader.classList.add("done"), 450);
    requestAnimationFrame(loop);
  }

  /* ---------- Mouse Tracking & Auto-Probe Assets HTTP ---------- */
  document.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
    mouse.ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
  });

  async function probeRemoteAssets() {
    if (location.protocol === "file:") return;
    try {
      const mRes = await fetch("media/metrics_summary.json", { cache: "no-store" });
      if (mRes.ok) activeMetrics = await mRes.json();
    } catch (_) {}
    try {
      const segCheck = await fetch("media/rov_segmented.mp4", { method: "HEAD" });
      if (segCheck.ok) {
        let tData = null;
        try {
          const tRes = await fetch("media/telemetry_frames.json", { cache: "no-store" });
          if (tRes.ok) tData = await tRes.json();
        } catch (_) {}
        const rawCheck = await fetch("media/rov_raw.mp4", { method: "HEAD" }).catch(() => ({ ok: false }));
        realRawUrl = rawCheck.ok ? "media/rov_raw.mp4" : "media/rov_segmented.mp4";
        realSegUrl = "media/rov_segmented.mp4";
        realTelemetryFrames = tData?.frames || null;
        usingRealVideo = true;
      }
    } catch (_) {}
  }

  /* ---------- Bootstrap ---------- */
  buildTimelineDotsAndMenu();
  probeRemoteAssets();
  updateStageOverlays(0);
  initWebGLWorld();
})();
