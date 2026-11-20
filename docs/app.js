(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Métricas de respaldo offline (datos reales verificados de Colab T4) ---------- */
  const FALLBACK_METRICS = {
    status: "verified",
    model: "yolo11n-seg.pt",
    dataset: "TrashCan 1.0 (Operational 4-Class)",
    total_epochs: 50,
    best_epoch: 49,
    summary: {
      map50_mask: 0.5206,
      map50_95_mask: 0.3131,
      map50_box: 0.5387,
      map50_95_box: 0.381,
      precision_mask: 0.781,
      recall_mask: 0.4891,
      final_train_seg_loss: 1.4992,
      inference_ms_t4: 3.21,
    },
    epochs: [
      { epoch: 1, train_box_loss: 1.2796, train_seg_loss: 2.6558, val_seg_loss: 2.847, map50_box: 0.2144, map50_95_box: 0.1212, map50_mask: 0.2064, map50_95_mask: 0.1095 },
      { epoch: 5, train_box_loss: 1.2833, train_seg_loss: 2.5286, val_seg_loss: 2.6467, map50_box: 0.2932, map50_95_box: 0.171, map50_mask: 0.2785, map50_95_mask: 0.1429 },
      { epoch: 10, train_box_loss: 1.1381, train_seg_loss: 2.2231, val_seg_loss: 2.4453, map50_box: 0.3727, map50_95_box: 0.2287, map50_mask: 0.3541, map50_95_mask: 0.1863 },
      { epoch: 15, train_box_loss: 1.0767, train_seg_loss: 2.0829, val_seg_loss: 2.5234, map50_box: 0.4324, map50_95_box: 0.2728, map50_mask: 0.4049, map50_95_mask: 0.2138 },
      { epoch: 20, train_box_loss: 1.0099, train_seg_loss: 1.9853, val_seg_loss: 2.1626, map50_box: 0.4932, map50_95_box: 0.322, map50_mask: 0.4719, map50_95_mask: 0.2607 },
      { epoch: 25, train_box_loss: 0.947, train_seg_loss: 1.8662, val_seg_loss: 2.0849, map50_box: 0.4995, map50_95_box: 0.3373, map50_mask: 0.4789, map50_95_mask: 0.2745 },
      { epoch: 30, train_box_loss: 0.9211, train_seg_loss: 1.7716, val_seg_loss: 2.0571, map50_box: 0.5296, map50_95_box: 0.3603, map50_mask: 0.5024, map50_95_mask: 0.2893 },
      { epoch: 35, train_box_loss: 0.8662, train_seg_loss: 1.6804, val_seg_loss: 1.9978, map50_box: 0.5325, map50_95_box: 0.3719, map50_mask: 0.5148, map50_95_mask: 0.3025 },
      { epoch: 40, train_box_loss: 0.8378, train_seg_loss: 1.659, val_seg_loss: 1.9742, map50_box: 0.5414, map50_95_box: 0.3793, map50_mask: 0.5227, map50_95_mask: 0.3103 },
      { epoch: 45, train_box_loss: 0.7952, train_seg_loss: 1.5185, val_seg_loss: 1.9868, map50_box: 0.5362, map50_95_box: 0.379, map50_mask: 0.5166, map50_95_mask: 0.3098 },
      { epoch: 49, train_box_loss: 0.7894, train_seg_loss: 1.5163, val_seg_loss: 1.9798, map50_box: 0.5387, map50_95_box: 0.381, map50_mask: 0.5206, map50_95_mask: 0.3131 },
      { epoch: 50, train_box_loss: 0.7804, train_seg_loss: 1.4992, val_seg_loss: 1.9761, map50_box: 0.5397, map50_95_box: 0.3823, map50_mask: 0.5203, map50_95_mask: 0.3125 },
    ],
  };

  const PER_CLASS_VAL_METRICS = [
    { name: "rov_hardware", color: "#8b5cf6", instances: 1271, p: 0.906, r: 0.652, map50: 0.670, map5095: 0.515 },
    { name: "debris_rigid_other", color: "#ffb703", instances: 1114, p: 0.819, r: 0.614, map50: 0.651, map5095: 0.357 },
    { name: "protected_marine_life", color: "#00b880", instances: 786, p: 0.620, r: 0.449, map50: 0.471, map5095: 0.204 },
    { name: "debris_flexible_polymer", color: "#0077b6", instances: 875, p: 0.747, r: 0.267, map50: 0.288, map5095: 0.175 },
  ];

  const ULTRALYTICS_PLOTS = {
    confusion: {
      label: "Matriz Confusión",
      src: "media/confusion_matrix_normalized.png",
      alt: "Matriz de confusión normalizada de validación YOLO11n-seg",
      caption: "Matriz normalizada sobre el split val (1,147 imágenes): muestra baja confusión cruzada entre residuos sólidos y fauna marina; la mayor pérdida proviene de falsos negativos hacia el fondo marino en plásticos translúcidos.",
    },
    pr: {
      label: "Curva PR",
      src: "media/MaskPR_curve.png",
      alt: "Curva Precision-Recall de máscaras YOLO11n-seg",
      caption: "Curva Precisión-Recall de segmentación de instancias (mAP@50 global = 0.521): rov_hardware (0.670) y debris_rigid_other (0.651) lideran en separabilidad frente a polímeros flexibles.",
    },
    f1: {
      label: "Curva F1",
      src: "media/MaskF1_curve.png",
      alt: "Curva F1 vs Confianza de máscaras YOLO11n-seg",
      caption: "Curva F1 frente a umbral de confianza: fundamenta el punto operativo equilibrado alrededor de conf = 0.25–0.35 usado por el visor del ROV.",
    },
    results: {
      label: "Resumen 50 Épocas",
      src: "media/results.png",
      alt: "Gráficas oficiales de entrenamiento y validación Ultralytics en 50 épocas",
      caption: "Panel oficial de Ultralytics tras 50 épocas en GPU Tesla T4: descenso sostenido de box_loss, seg_loss y cls_loss sin sobreajuste severo, alcanzando mejor checkpoint en la época 49.",
    },
  };

  const CHAPTERS = [
    {
      id: 1,
      code: "CAPÍTULO 01",
      tag: "LA CRISIS OCEÁNICA",
      title: "Más Allá de las Cajas en Aguas Profundas",
      heroHeadline: "Más Allá de las Cajas<br />en Aguas Profundas",
      excerpt: "Las cajas rectangulares capturan hasta 68% de coral vivo y fondo marino. La segmentación pixel a pixel habilita agarre seguro.",
      badgeDark: "MAR DE JAPÓN · PROFUNDIDAD ROV",
      badgeLight: "PROBLEMÁTICA",
      thumb: "media/thumb_01.jpg",
      bgPhoto: "media/bg_crisis_coral.jpg",
      sceneType: "photo_sonar",
      scrollStop: 0.145,
    },
    {
      id: 2,
      code: "CAPÍTULO 02",
      tag: "DATASET TRASHCAN 1.0",
      title: "7,212 Fotogramas Reales de ROV",
      heroHeadline: "7,212 Fotogramas<br />Reales de ROV",
      excerpt: "Datos reales de JAMSTEC y la Universidad de Minnesota: 22 categorías marinas consolidadas en 4 clases operativas.",
      badgeDark: "ARCHIVO JAMSTEC J-EDI",
      badgeLight: "PIPELINE DE DATOS",
      thumb: "media/thumb_02.jpg",
      bgPhoto: "media/rov_underwater.jpg",
      sceneType: "photo_polygons",
      scrollStop: 0.285,
    },
    {
      id: 3,
      code: "CAPÍTULO 03",
      tag: "ARQUITECTURA YOLO11-SEG",
      title: "Fusión Dual de Detección y Prototipos",
      heroHeadline: "Fusión Dual de<br />Detección y Prototipos",
      excerpt: "Backbone C3k2, atención espacial C2PSA y síntesis lineal de 32 máscaras prototipo en un solo pase.",
      badgeDark: "ULTRALYTICS YOLO11N-SEG",
      badgeLight: "ARQUITECTURA NEURONAL",
      thumb: "media/thumb_03.jpg",
      bgPhoto: null,
      sceneType: "neural_3d",
      scrollStop: 0.425,
    },
    {
      id: 4,
      code: "CAPÍTULO 04",
      tag: "ENTRENAMIENTO EN COLAB T4",
      title: "Fine-Tuning en la Nube y Métricas Reales",
      heroHeadline: "Fine-Tuning en la Nube<br />y Métricas Reales",
      excerpt: "Entrenamiento automatizado en GPU T4 sin sobrecargar equipos locales, evaluando mAP@50-95 (Máscara vs Caja) y exportación ONNX.",
      badgeDark: "GOOGLE COLAB · GPU T4",
      badgeLight: "EVALUACIÓN",
      thumb: "media/thumb_04.jpg",
      bgPhoto: null,
      sceneType: "loss_3d",
      scrollStop: 0.565,
    },
    {
      id: 5,
      code: "CAPÍTULO 05",
      tag: "CONSOLA ROV EN VIVO",
      title: "Segmentación en Video y Bio-Exclusión",
      heroHeadline: "Segmentación en Video<br />y Bio-Exclusión",
      excerpt: "Consola interactiva de inferencia: compara video original vs. máscaras y bloquea la pinza ante fauna cercana.",
      badgeDark: "VISTA ROV + CLIPS COLAB",
      badgeLight: "DEMO FUNCIONAL",
      thumb: "media/thumb_05.jpg",
      bgPhoto: "media/demo_rov_frame.jpg",
      sceneType: "photo_sonar",
      scrollStop: 0.705,
    },
    {
      id: 6,
      code: "CAPÍTULO 06",
      tag: "ESCALABILIDAD Y FUTURO",
      title: "Del Notebook a Vehículos Submarinos Reales",
      heroHeadline: "Del Notebook a Vehículos<br />Submarinos Reales",
      excerpt: "Limitaciones ópticas bajo turbidez extrema y hoja de ruta hacia TensorRT FP16 en Jetson Orin Nano, visión estéreo 3D y ByteTrack.",
      badgeDark: "HOJA DE RUTA EDGE",
      badgeLight: "CONCLUSIONES",
      thumb: "media/thumb_06.jpg",
      bgPhoto: "media/ocean_footer.jpg",
      sceneType: "photo_rings",
      scrollStop: 0.845,
    },
  ];

  const ARCH_NODES = {
    input: {
      tag: "NODO 01 · ENTRADA DE VIDEO",
      title: "Fotograma Submarino RGB (640×640×3)",
      desc: "Normalización de cada cuadro proveniente de la cámara del ROV. Durante el fine-tuning en Colab se aplican aumentos HSV y mosaico para robustez ante turbidez y cambios de luz LED.",
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
      desc: "Combina semántica profunda (qué es el objeto) con resolución espacial fina (dónde termina el borde exacto del plástico frente al coral).",
      tensor: "Pirámide P3 / P4 / P5 fusionada",
      formula: "Agregación Top-Down + Bottom-Up",
    },
    dethead: {
      tag: "NODO 05A · RAMA DE DETECCIÓN",
      title: "Cabezal Desacoplado + Coeficientes",
      desc: "Predice por cada instancia candidata la caja (BBox), probabilidad de clase (4 clases operativas) y un vector de k=32 coeficientes lineales de máscara.",
      tensor: "Caja [4] + Clases [4] + Coefs c [32]",
      formula: "CIoU + DFL + Clasificación BCE",
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
      desc: "Multiplica prototipos P por coeficientes c de cada instancia, aplica sigmoide, recorta a la caja y calcula área real, centroide y distancia mínima a fauna protegida.",
      tensor: "Máscara Final: [N_inst, H, W]",
      formula: "Mask_i = σ(P · c_iᵀ) > 0.5 | Recorte(BBox)",
    },
  };

  /* ---------- Estado Global ---------- */
  let activeMetrics = FALLBACK_METRICS;
  let activeChartMode = "map";
  let activePlotKey = "confusion";
  let currentChapterIdx = 0;
  let drawerState = "closed";
  let activeDetailIdx = 0;

  let smoothProgress = 0;
  let targetProgress = 0;
  const mouse = { x: 0, y: 0, nx: 0, ny: 0 };

  let hasRealVideoAssets = false;
  let usingRealVideo = false;
  let realRawUrl = null;
  let realSegUrl = null;
  let realTelemetryFrames = null;
  let lastTelemetryIdx = -1;
  let visorMode = "hud";
  let visorPlaying = true;
  let simTick = 0;
  let simRafId = null;
  let termToken = 0;

  const demoFrameImg = new Image();
  demoFrameImg.src = "media/demo_rov_frame.jpg";

  /* ---------- Elementos DOM ---------- */
  const preloader = $("#preloader");
  const photoStage = $("#photoStage");
  const photoBackdrop = $("#photoBackdrop");
  const scroller = $("#scroller");
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

  /* ---------- Audio Ambiental Opcional ---------- */
  let audioCtx = null;
  let audioOn = false;
  let gainNode = null;
  const waveBack = $("#waveBack");
  const waveFront = $("#waveFront");

  function toggleAudio() {
    audioOn = !audioOn;
    $("#audioLabel").textContent = audioOn ? "AUDIO ACTIVO" : "AUDIO APAGADO";
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
    const duration = 660;
    function step(now) {
      const k = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - k, 3);
      scroller.scrollTop = startY + (endY - startY) * ease;
      targetProgress = scroller.scrollTop / maxScroll;
      if (k < 1) scrollAnimId = requestAnimationFrame(step);
      else scrollAnimId = null;
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

  let activePhotoSrc = "";

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
      const ch = CHAPTERS[idx];

      if (idx !== currentChapterIdx || chIdxLabel.textContent !== ch.code) {
        currentChapterIdx = idx;
        chIdxLabel.textContent = ch.code;
        chLocationLabel.textContent = ch.tag;
        chTitle.innerHTML = ch.heroHeadline;
        chExcerpt.textContent = ch.excerpt;
        $$(".timeline-dot-btn", timelineChapterDots).forEach((d, i) => d.classList.toggle("active", i === idx));
        $$(".menu-chapter-row", chaptersMenuList).forEach((r, i) => r.classList.toggle("current", i === idx));
      }

      if (ch.bgPhoto) {
        if (activePhotoSrc !== ch.bgPhoto) {
          activePhotoSrc = ch.bgPhoto;
          photoBackdrop.src = ch.bgPhoto;
        }
        photoStage.classList.add("active");
        photoBackdrop.style.transform = `scale(1.06) translate(${(-mouse.nx * 14).toFixed(1)}px, ${(-mouse.ny * 10).toFixed(1)}px)`;
      } else {
        photoStage.classList.remove("active");
      }
    } else {
      photoStage.classList.remove("active");
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

  /* ---------- Drawer Flotante Compartido ---------- */
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

  /* ---------- Renderizado de los 6 Capítulos en el Split-Pane ---------- */
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
            <div class="sat-reticle-label mono-12">MAR DE JAPÓN<br />FOSA DE OPERACIÓN ROV</div>
          </div>
          <div class="sat-footer-bar mono-10">
            <span>36.2048° N · 138.2529° E</span>
            <span>RANGO PROFUNDIDAD: 180M – 3,800M</span>
          </div>
        </div>
      `;
      detailEditorialBody.innerHTML = `
        ${headerBadges}
        <h3>Limpiar el océano sin destruir la vida bentónica alrededor de los residuos.</h3>
        <p class="editorial-p">En profundidades donde la longitud de onda roja desaparece y los focos del ROV generan retrodispersión (<em>nieve marina</em>), bolsas plásticas y redes fantasma flotan junto a corales y peces.</p>
        <div class="editorial-stat-grid">
          <div class="ed-stat-card"><strong>14M+</strong><span>Toneladas de plástico ingresan al océano al año</span></div>
          <div class="ed-stat-card"><strong>~90%</strong><span>Operación ROV actual sigue siendo teleoperada</span></div>
          <div class="ed-stat-card"><strong>68.4%</strong><span>Área errónea de caja sobre objetos diagonales</span></div>
        </div>
        <h3>Comparador real: Caja Rectangular vs. YOLO11-seg</h3>
        <p class="editorial-p">Arrastra el divisor sobre la fotografía real de inspección submarina para comparar cómo una caja rectangular invade el coral frente al contorno exacto de nuestra máscara poligonal:</p>
        <div class="ed-compare-box">
          <div class="ed-compare-layer">
            <svg viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">
              <image href="media/rov_underwater.jpg" width="1280" height="720" />
              <rect x="0" y="0" width="1280" height="720" fill="rgba(0,10,20,0.22)" />
              <rect x="740" y="472" width="166" height="154" fill="rgba(255,71,105,0.24)" stroke="#ff4769" stroke-width="5" stroke-dasharray="14 10" />
              <rect x="850" y="380" width="154" height="122" fill="rgba(255,183,3,0.18)" stroke="#ffb703" stroke-width="4" stroke-dasharray="10 8" />
              <rect x="520" y="62" width="490" height="44" rx="8" fill="rgba(0,13,21,0.86)" />
              <text x="538" y="91" fill="#ff4769" font-family="DM Mono" font-size="22" font-weight="500">CAJA 0.89 · CUBRE 68.4% DE CORAL VIVO</text>
              <rect x="650" y="646" width="520" height="42" rx="8" fill="rgba(0,13,21,0.86)" />
              <text x="668" y="674" fill="#ff4769" font-family="DM Mono" font-size="20">AGARRE INSEGURO · RIESGO DE COLISIÓN</text>
            </svg>
          </div>
          <div class="ed-compare-layer ed-compare-after" id="edCompareAfter">
            <svg viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">
              <image href="media/rov_underwater.jpg" width="1280" height="720" />
              <polygon points="84,185 495,180 515,320 420,468 135,442 80,295" fill="rgba(139,92,246,0.24)" stroke="#8b5cf6" stroke-width="4" />
              <polygon points="846,534 862,448 920,418 982,456 992,554 926,574" fill="rgba(0,229,160,0.34)" stroke="#00e5a0" stroke-width="4.5" />
              <ellipse cx="918" cy="498" rx="108" ry="104" fill="none" stroke="#00e5a0" stroke-width="2.5" stroke-dasharray="9 7" />
              <polygon points="758,522 792,482 848,494 888,554 860,616 798,608 752,554" fill="rgba(144,224,239,0.42)" stroke="#90e0ef" stroke-width="5" />
              <polygon points="886,422 924,386 986,412 968,468 914,458" fill="rgba(144,224,239,0.38)" stroke="#90e0ef" stroke-width="4" />
              <circle cx="812" cy="548" r="22" fill="none" stroke="#90e0ef" stroke-width="3.5" />
              <circle cx="812" cy="548" r="5" fill="#00e5a0" />
              <rect x="650" y="62" width="530" height="44" rx="8" fill="rgba(0,13,21,0.88)" />
              <text x="668" y="91" fill="#90e0ef" font-family="DM Mono" font-size="22" font-weight="500">MÁSCARA 0.94 · CENTROIDE SEGURO (812, 548)</text>
              <rect x="680" y="646" width="500" height="42" rx="8" fill="rgba(0,13,21,0.88)" />
              <text x="698" y="674" fill="#00e5a0" font-family="DM Mono" font-size="20">AGARRE SEGURO · 0.0% DAÑO EN CORAL</text>
            </svg>
          </div>
          <div class="ed-compare-handle" id="edCompareHandle"><span class="ed-compare-knob">◄►</span></div>
          <input id="edCompareRange" class="ed-compare-range" type="range" min="8" max="92" value="50" aria-label="Comparador Caja vs Segmentación" />
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
          <div class="sat-reticle" style="top: 68%; left: 64%;">
            <div class="reticle-box"><i></i></div>
            <div class="sat-reticle-label mono-12">POLÍGONOS GROUND TRUTH<br />POLÍMERO FLEXIBLE vs CORAL</div>
          </div>
          <div class="sat-footer-bar mono-10">
            <span>TRAIN: 6,065 IMGS (13,962 POLÍGONOS)</span>
            <span>VAL: 1,147 IMGS (4,050 POLÍGONOS)</span>
          </div>
        </div>
      `;
      detailEditorialBody.innerHTML = `
        ${headerBadges}
        <h3>Consolidación de 22 categorías marinas en 4 clases operativas accionables.</h3>
        <p class="editorial-p">En lugar de dispersar el modelo en subclases escasas, nuestra conversión COCO → <code>YOLO-seg [0, 1]</code> procesó exactamente <strong>6,065 imágenes de entrenamiento</strong> (13,962 polígonos) y <strong>1,147 imágenes de validación</strong> (4,050 polígonos) agrupados por acción robótica:</p>
        <div class="ed-tax-grid">
          <div class="ed-tax-card">
            <span class="mono-10">CLASE 00 · 2,098 TRAIN / 875 VAL</span>
            <h4>debris_flexible_polymer</h4>
            <p>Bolsas, botellas, redes fantasma, cuerdas y textiles (<code>trash_bag</code>, <code>trash_bottle</code>, <code>trash_net</code>, <code>trash_rope</code>). Prioridad máxima de agarre suave.</p>
          </div>
          <div class="ed-tax-card" style="border-top-color:#ffb703;">
            <span class="mono-10">CLASE 01 · 4,531 TRAIN / 1,114 VAL</span>
            <h4>debris_rigid_other</h4>
            <p>Latas, tuberías, contenedores y chatarra metálica sumergida (<code>trash_can</code>, <code>trash_pipe</code>, <code>trash_wreckage</code>). Ajuste de torque en pinza.</p>
          </div>
          <div class="ed-tax-card" style="border-top-color:#00b880;">
            <span class="mono-10">CLASE 02 · 2,739 TRAIN / 786 VAL</span>
            <h4>protected_marine_life</h4>
            <p>Peces, cangrejos, estrellas de mar, corales y flora (<code>animal_*</code>, <code>plant</code>). Activa el perímetro de bio-exclusión que bloquea la pinza.</p>
          </div>
          <div class="ed-tax-card" style="border-top-color:#8b5cf6;">
            <span class="mono-10">CLASE 03 · 4,594 TRAIN / 1,275 VAL</span>
            <h4>rov_hardware</h4>
            <p>Partes visibles del propio manipulador o chasis del ROV en cámara (<code>rov</code>). Evita auto-detección errónea como residuo.</p>
          </div>
        </div>
      `;
    } else if (idx === 2) {
      detailLeftPane.innerHTML = `
        <div class="stage-dark-console">
          <div class="stage-dark-header">
            <span class="mono-12" style="color:var(--cyan);">FLUJO INTERACTIVO DE TENSORES · PULSA UN NODO</span>
            <button id="btnToggleArchFlow" class="dark-mini-btn" type="button">PAUSAR FLUJO</button>
          </div>
          <svg id="archSvg" viewBox="0 0 820 380" class="arch-svg">
            <path id="pathMain" d="M78,190 L195,190 L315,190 L435,190" fill="none" stroke="rgba(144,224,239,0.32)" stroke-width="3" />
            <path id="pathDet" d="M435,190 C485,190 495,98 555,98 L695,98 L738,175" fill="none" stroke="rgba(255,116,56,0.38)" stroke-width="3" />
            <path id="pathProto" d="M435,190 C485,190 495,282 555,282 L695,282 L738,205" fill="none" stroke="rgba(0,229,160,0.38)" stroke-width="3" />
            <g id="archPulses"></g>
            <g class="arch-node active" data-node="input"><rect x="20" y="150" width="110" height="80" rx="10" /><text x="75" y="182">ENTRADA</text><text class="sub" x="75" y="204">640×640×3</text></g>
            <g class="arch-node" data-node="backbone"><rect x="150" y="150" width="115" height="80" rx="10" /><text x="207" y="182">BACKBONE</text><text class="sub" x="207" y="204">C3k2 + Conv</text></g>
            <g class="arch-node" data-node="attention"><rect x="285" y="150" width="115" height="80" rx="10" /><text x="342" y="182">SPPF + C2PSA</text><text class="sub" x="342" y="204">Atención Espacial</text></g>
            <g class="arch-node" data-node="neck"><rect x="420" y="150" width="95" height="80" rx="10" /><text x="467" y="182">NECK</text><text class="sub" x="467" y="204">PANet FPN</text></g>
            <g class="arch-node" data-node="dethead"><rect x="545" y="54" width="140" height="86" rx="10" /><text x="615" y="88">DETECCIÓN</text><text class="sub" x="615" y="108">Caja+Cls+k=32</text><text class="sub" x="615" y="124">Coefs c</text></g>
            <g class="arch-node" data-node="protonet"><rect x="545" y="240" width="140" height="86" rx="10" /><text x="615" y="274">PROTONET</text><text class="sub" x="615" y="294">32 Prototipos P</text><text class="sub" x="615" y="310">160×160</text></g>
            <g class="arch-node" data-node="assembly"><rect x="705" y="142" width="102" height="96" rx="10" /><text x="756" y="176">MÁSCARA</text><text class="sub" x="756" y="196">σ(P · cᵀ)</text><text class="sub" x="756" y="216">+ HUD ROV</text></g>
          </svg>
        </div>
      `;
      detailEditorialBody.innerHTML = `
        ${headerBadges}
        <h3>Arquitectura de una sola etapa por prototipos y coeficientes lineales.</h3>
        <p class="editorial-p">A diferencia de modelos pesados en dos etapas (como Mask R-CNN o SAM 2), <strong>YOLO11n-seg</strong> predice cajas, clases y máscaras en un solo pase sobre GPU o hardware embebido.</p>
        <div class="ed-inspector-card">
          <span id="inspTag" class="mono-10">${ARCH_NODES.input.tag}</span>
          <h4 id="inspTitle">${ARCH_NODES.input.title}</h4>
          <p id="inspDesc" class="editorial-p" style="margin-bottom:0;">${ARCH_NODES.input.desc}</p>
          <div class="ed-kv-row">
            <div class="ed-kv-box"><span class="mono-10">DIMENSIONES TENSOR</span><strong id="inspTensor">${ARCH_NODES.input.tensor}</strong></div>
            <div class="ed-kv-box"><span class="mono-10">OPERACIÓN CLAVE</span><strong id="inspFormula">${ARCH_NODES.input.formula}</strong></div>
          </div>
        </div>
        <p class="editorial-p"><strong>Función de pérdida multi-tarea:</strong> <code>L = λ_box·L_CIoU+DFL + λ_seg·L_BCE(Mask) + λ_cls·L_BCE</code>, evaluando la pérdida de máscara pixel a pixel dentro del área de cada caja.</p>
      `;
      initArchDiagramInteractive();
    } else if (idx === 3) {
      const isVerified = activeMetrics.status === "verified";
      const s = activeMetrics.summary || {};
      const bestEpoch = activeMetrics.best_epoch || 49;
      const plotCfg = ULTRALYTICS_PLOTS[activePlotKey] || ULTRALYTICS_PLOTS.confusion;
      const plotTabsHtml = Object.entries(ULTRALYTICS_PLOTS).map(([k, v]) => `
        <button class="ed-tab-btn ${activePlotKey === k ? "active" : ""}" data-plot="${k}" type="button">${v.label}</button>
      `).join("");
      const classRowsHtml = PER_CLASS_VAL_METRICS.map((c) => `
        <tr>
          <td><span class="ed-class-name"><i class="ed-class-dot" style="background:${c.color};"></i>${c.name}</span></td>
          <td class="num">${c.instances.toLocaleString("en-US")}</td>
          <td class="num">${(c.p * 100).toFixed(1)}%</td>
          <td class="num">${(c.r * 100).toFixed(1)}%</td>
          <td class="num"><strong>${(c.map50 * 100).toFixed(1)}%</strong></td>
          <td class="num">${(c.map5095 * 100).toFixed(1)}%</td>
        </tr>
      `).join("");

      detailLeftPane.innerHTML = `
        <div class="stage-dark-console">
          <div class="stage-dark-header">
            <span class="mono-12" style="color:var(--cyan);">COLAB GPU T4 · PIPELINE DE FINE-TUNING</span>
            <button id="btnReplayTerm" class="dark-mini-btn" type="button">Reproducir Log</button>
          </div>
          <div class="dark-term-box">
            <div class="dark-term-bar mono-10">
              <span>notebooks/abyssal_ai_finetuning_colab.ipynb</span>
              <span style="color:${isVerified ? "var(--emerald)" : "var(--amber)"};">${isVerified ? "VERIFICADO" : "VISTA PREVIA"}</span>
            </div>
            <pre id="colabTermLog" class="dark-term-pre"></pre>
          </div>
        </div>
      `;
      detailEditorialBody.innerHTML = `
        ${headerBadges}
        <h3>Validación cuantitativa sobre máscaras vs. cajas y exportación a ONNX.</h3>
        <p class="editorial-p">Estado de <code>docs/media/metrics_summary.json</code>: <strong>${isVerified ? `CORRIDA VERIFICADA DE COLAB (Mejor época ${bestEpoch}/${activeMetrics.total_epochs || 50} · Tesla T4)` : "DATOS DE VISTA PREVIA"}</strong>. Modelo compacto <code>YOLO11n-seg</code> de 114 capas, 2.85M parámetros y 9.7 GFLOPs entrenado sobre 7,212 fotogramas reales.</p>
        <div class="editorial-stat-grid cols-4">
          <div class="ed-stat-card"><strong>${((s.map50_mask || 0) * 100).toFixed(1)}%</strong><span>mAP@50 Máscara</span></div>
          <div class="ed-stat-card"><strong>${((s.map50_95_mask || 0) * 100).toFixed(1)}%</strong><span>mAP@50-95 Máscara</span></div>
          <div class="ed-stat-card"><strong>${((s.precision_mask || 0) * 100).toFixed(1)}%</strong><span>Precisión Máscara</span></div>
          <div class="ed-stat-card"><strong>${Number(s.inference_ms_t4 || 3.21).toFixed(1)} ms</strong><span>Inferencia GPU T4</span></div>
        </div>
        <div class="ed-chart-wrap">
          <div class="ed-chart-head">
            <strong id="chartTitle" class="mono-12">Evolución mAP por Época (Máscara vs Caja)</strong>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="ed-tab-btn ${activeChartMode === "map" ? "active" : ""}" data-chart="map" type="button">mAP@50 / 50-95</button>
              <button class="ed-tab-btn ${activeChartMode === "loss" ? "active" : ""}" data-chart="loss" type="button">Convergencia Pérdidas</button>
            </div>
          </div>
          <canvas id="metricsChart" width="620" height="240"></canvas>
        </div>
        <div class="ed-class-table-wrap">
          <div class="ed-section-head">
            <strong class="mono-12">Desglose Real por Clase (Split Val · 1,147 imgs · 4,046 instancias)</strong>
            <span class="mono-10" style="color:#4f7288;">MÁSCARA RECALL GLOBAL: ${((s.recall_mask || 0) * 100).toFixed(1)}%</span>
          </div>
          <table class="ed-class-table">
            <thead>
              <tr>
                <th>Clase Operativa</th>
                <th class="num">Inst.</th>
                <th class="num">Precisión</th>
                <th class="num">Recall</th>
                <th class="num">mAP@50</th>
                <th class="num">mAP@50-95</th>
              </tr>
            </thead>
            <tbody>${classRowsHtml}</tbody>
          </table>
          <div class="ed-note-box">
            <strong>Lectura técnica real:</strong> La precisión elevada (<strong>78.1%</strong> global; <strong>81.9%</strong> en chatarra rígida y <strong>74.7%</strong> en polímeros flexibles) evita disparos o agarres falsos de la pinza ROV. El recall menor en bolsas y plásticos translúcidos (<strong>26.7%</strong>) refleja el desafío físico real de bajo contraste y turbidez en TrashCan 1.0.
          </div>
        </div>
        <div class="ed-plots-wrap">
          <div class="ed-section-head">
            <strong class="mono-12">Evidencia Oficial de Ultralytics (Colab T4)</strong>
            <div class="ed-plots-tabs">${plotTabsHtml}</div>
          </div>
          <div class="ed-plot-frame">
            <img id="ultralyticsPlotImg" src="${plotCfg.src}" alt="${plotCfg.alt}" />
          </div>
          <p id="ultralyticsPlotCaption" class="ed-plot-caption">${plotCfg.caption}</p>
        </div>
      `;
      playColabTerminal();
      drawMetricsChart();
      $("#btnReplayTerm", detailLeftPane).addEventListener("click", playColabTerminal);
      $$(".ed-tab-btn[data-chart]", detailEditorialBody).forEach((btn) => {
        btn.addEventListener("click", () => {
          $$(".ed-tab-btn[data-chart]", detailEditorialBody).forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          activeChartMode = btn.dataset.chart || "map";
          $("#chartTitle", detailEditorialBody).textContent = activeChartMode === "map"
            ? "Evolución mAP por Época (Máscara vs Caja)"
            : "Convergencia de Pérdidas (Segmentación y Caja)";
          drawMetricsChart();
        });
      });
      $$(".ed-tab-btn[data-plot]", detailEditorialBody).forEach((btn) => {
        btn.addEventListener("click", () => {
          const k = btn.dataset.plot || "confusion";
          const nextPlot = ULTRALYTICS_PLOTS[k];
          if (!nextPlot) return;
          activePlotKey = k;
          $$(".ed-tab-btn[data-plot]", detailEditorialBody).forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          $("#ultralyticsPlotImg", detailEditorialBody).src = nextPlot.src;
          $("#ultralyticsPlotImg", detailEditorialBody).alt = nextPlot.alt;
          $("#ultralyticsPlotCaption", detailEditorialBody).textContent = nextPlot.caption;
        });
      });
    } else if (idx === 4) {
      detailLeftPane.innerHTML = `
        <div class="stage-dark-console">
          <div class="stage-dark-header">
            <span id="demoSourceBadge" class="mono-10" style="color:var(--cyan);">${usingRealVideo ? "VIDEO REAL COLAB · YOLO11N-SEG (480×270)" : "SIMULADOR FOTOGRÁFICO · BIO-EXCLUSIÓN < 45 PX"}</span>
            <div class="source-toggle-group">
              <button id="btnSrcReal" class="dark-mini-btn ${usingRealVideo ? "active" : ""}" type="button" ${hasRealVideoAssets ? "" : "disabled"}>VIDEO REAL COLAB</button>
              <button id="btnSrcSim" class="dark-mini-btn ${!usingRealVideo ? "active" : ""}" type="button">SIMULADOR BIO-EXCLUSIÓN</button>
              <label class="dark-mini-btn" style="cursor:pointer;">
                <span>Cargar Media</span>
                <input id="bundleFileInput" type="file" multiple accept=".mp4,.json" hidden />
              </label>
            </div>
          </div>
          <div class="rov-visor-box">
            <canvas id="rovSimCanvas" width="768" height="432"></canvas>
            <div id="videoDualWrap" class="video-dual-wrap hidden">
              <video id="vidRaw" muted loop playsinline preload="auto"></video>
              <video id="vidSeg" muted loop playsinline preload="auto"></video>
              <div id="videoSplitDivider" class="video-split-divider hidden"></div>
            </div>
          </div>
          <div class="stage-dark-header" id="visorModePills">
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="dark-mini-btn ${visorMode === "raw" ? "active" : ""}" data-mode="raw" type="button">ORIGINAL</button>
              <button class="dark-mini-btn ${visorMode === "masks" ? "active" : ""}" data-mode="masks" type="button">MÁSCARAS</button>
              <button class="dark-mini-btn ${visorMode === "split" ? "active" : ""}" data-mode="split" type="button">DIVIDIDO</button>
              <button class="dark-mini-btn ${visorMode === "hud" ? "active" : ""}" data-mode="hud" type="button">HUD + BIO</button>
            </div>
            <button id="btnVisorPlay" class="dark-mini-btn" type="button">${visorPlaying ? "Pausar" : "Reanudar"}</button>
          </div>
        </div>
      `;
      detailEditorialBody.innerHTML = `
        ${headerBadges}
        <h3>Consola de visión en vivo con protocolo automático de bio-exclusión.</h3>
        <p class="editorial-p">En <strong>VIDEO REAL COLAB</strong> se reproduce la secuencia real de validación JAMSTEC (180 fotogramas) inferida con nuestros pesos <code>best.pt</code>. Cambia a <strong>SIMULADOR BIO-EXCLUSIÓN</strong> para probar el disparo en tiempo real del bloqueo (<code>&lt; 45 px</code>) cuando un pez se acerca al residuo.</p>
        <div id="telStatusBox" class="ed-tel-status">
          <span class="mono-12">PROTOCOLO DE PINZA ROV</span>
          <strong id="telGraspStatus">AGARRE SEGURO</strong>
        </div>
        <div class="editorial-stat-grid">
          <div class="ed-stat-card"><strong id="telFps">77.5</strong><span>FPS Inferencia</span></div>
          <div class="ed-stat-card"><strong id="telWastePct">40.9%</strong><span>Ruido BBox Evitado</span></div>
          <div class="ed-stat-card"><strong id="telBioDist">DESPEJADO</strong><span>Distancia Mín. Fauna</span></div>
        </div>
        <div class="ed-kv-row" style="margin-bottom:2rem;">
          <div class="ed-kv-box"><span class="mono-10">ÁREA RESIDUO / LATENCIA</span><strong id="telAreaLat">0.57% · 12.9 ms</strong></div>
          <div class="ed-kv-box"><span class="mono-10">CENTROIDE OBJETIVO</span><strong id="telCentroid">(272, 91)</strong></div>
        </div>
        <span class="mono-10" style="color:#4f7288;">INSTANCIAS ACTIVAS EN CUADRO</span>
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
            <div class="sat-reticle-label mono-12">DESPLIEGUE EN EL BORDE<br />JETSON ORIN NANO · FP16</div>
          </div>
          <div class="sat-footer-bar mono-10">
            <span>EXPORTACIÓN: ONNX / TENSORRT</span>
            <span>ESTÉREO 3D + BYTETRACK</span>
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
            <span class="mono-10">HOJA DE RUTA 01</span>
            <h4>TensorRT FP16 Embebido</h4>
            <p>Despliegue del archivo <code>best.onnx</code> cuantizado en <strong>NVIDIA Jetson Orin Nano</strong> a bordo de ROVs reales de bajo consumo.</p>
          </div>
          <div class="ed-tax-card" style="border-top-color:#00b880;">
            <span class="mono-10">HOJA DE RUTA 02</span>
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
      { cls: "t-ok", text: "Tesla T4, 14913 MiB  |  Ultralytics 8.4.216  |  CUDA Lista" },
      { cls: "t-cmd", text: "$ curl -L ... -o dataset.zip  # TrashCan 1.0 (553 MB)" },
      { cls: "", text: "Mapeando categorías JAMSTEC → 4 clases operativas ROV..." },
      { cls: "t-ok", text: "Dataset validado: 6,065 imgs train (13,962 pol.) / 1,147 imgs val (4,050 pol.)" },
      { cls: "t-cmd", text: "$ yolo segment train model=yolo11n-seg.pt data=data.yaml epochs=50 imgsz=640" },
      { cls: "", text: "YOLO11n-seg summary: 114 layers, 2,850,196 parameters, 9.7 GFLOPs" },
      { cls: "", text: "Época  1/50  box_loss: 1.280  seg_loss: 2.656  mAP50(M): 0.206" },
      { cls: "", text: "Época 25/50  box_loss: 0.947  seg_loss: 1.866  mAP50(M): 0.479" },
      { cls: "t-ok", text: "Época 49/50  box_loss: 0.789  seg_loss: 1.516  mAP50(M): 0.521  mAP50-95(M): 0.313" },
      { cls: "t-ok", text: "Val best.pt  P(M): 0.781 | R(M): 0.489 | Speed T4: 3.21 ms/frame" },
      { cls: "t-cmd", text: "$ yolo export model=best.pt format=onnx opset=18 simplify=True" },
      { cls: "t-ok", text: "Exportado: best.pt (5.7 MB) + best.onnx (11.1 MB) + rov_segmented.mp4 (180 frames)" },
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
          { key: "map50_mask", label: "mAP@50 Máscara", color: "#0077b6" },
          { key: "map50_95_mask", label: "mAP@50-95 Máscara", color: "#00a878" },
          { key: "map50_95_box", label: "mAP@50-95 Caja", color: "#e85d04" },
        ]
      : [
          { key: "train_seg_loss", label: "Pérdida Máscara (Train)", color: "#0077b6" },
          { key: "val_seg_loss", label: "Pérdida Máscara (Val)", color: "#d90429" },
          { key: "train_box_loss", label: "Pérdida Caja (Train)", color: "#e85d04" },
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

      const lx = padL + sIdx * 172;
      ctx.fillStyle = s.color;
      ctx.fillRect(lx, 6, 12, 4);
      ctx.fillStyle = "#00263e";
      ctx.fillText(s.label, lx + 18, 12);
    });

    ctx.fillStyle = "#365970";
    ctx.fillText(`Época ${minEp}`, padL, h - 8);
    ctx.fillText(`Época ${maxEp}`, w - padR - 58, h - 8);
  }

  /* ---------- Consola ROV en Vivo (Capítulo 05) Video Real Colab + Simulador Bio-Exclusión ---------- */
  function switchVisorSource(useReal) {
    if (useReal && (!hasRealVideoAssets || !realSegUrl)) return;
    usingRealVideo = Boolean(useReal);
    lastTelemetryIdx = -1;
    const btnReal = $("#btnSrcReal", detailLeftPane);
    const btnSim = $("#btnSrcSim", detailLeftPane);
    if (btnReal) {
      btnReal.disabled = !hasRealVideoAssets;
      btnReal.classList.toggle("active", usingRealVideo);
    }
    if (btnSim) btnSim.classList.toggle("active", !usingRealVideo);

    const wrap = $("#videoDualWrap", detailLeftPane);
    const canvas = $("#rovSimCanvas", detailLeftPane);
    const vidRaw = $("#vidRaw", detailLeftPane);
    const vidSeg = $("#vidSeg", detailLeftPane);
    const badge = $("#demoSourceBadge", detailLeftPane);

    if (usingRealVideo) {
      mountRealVideoElements();
    } else {
      if (vidRaw) vidRaw.pause();
      if (vidSeg) vidSeg.pause();
      if (wrap) wrap.classList.add("hidden");
      if (canvas) canvas.classList.remove("hidden");
      if (badge) badge.textContent = "SIMULADOR FOTOGRÁFICO · BIO-EXCLUSIÓN < 45 PX";
      simTick = 0;
    }
  }

  function bindLiveVisorControls() {
    $$("#visorModePills [data-mode]", detailLeftPane).forEach((btn) => {
      btn.addEventListener("click", () => {
        $$("#visorModePills [data-mode]", detailLeftPane).forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        visorMode = btn.dataset.mode || "hud";
        syncRealVideoMode();
      });
    });

    $("#btnSrcReal", detailLeftPane)?.addEventListener("click", () => switchVisorSource(true));
    $("#btnSrcSim", detailLeftPane)?.addEventListener("click", () => switchVisorSource(false));

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
        realTelemetryFrames = tData?.frames || realTelemetryFrames;
        hasRealVideoAssets = true;
        switchVisorSource(true);
      }
    });

    if (usingRealVideo && hasRealVideoAssets && realSegUrl) mountRealVideoElements();
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
    if (vidRaw.getAttribute("src") !== realRawUrl) vidRaw.setAttribute("src", realRawUrl);
    if (vidSeg.getAttribute("src") !== realSegUrl) vidSeg.setAttribute("src", realSegUrl);
    wrap.classList.remove("hidden");
    canvas.classList.add("hidden");
    $("#demoSourceBadge", detailLeftPane).textContent = "VIDEO REAL COLAB · YOLO11N-SEG (480×270)";
    const btnReal = $("#btnSrcReal", detailLeftPane);
    const btnSim = $("#btnSrcSim", detailLeftPane);
    if (btnReal) { btnReal.disabled = false; btnReal.classList.add("active"); }
    if (btnSim) btnSim.classList.remove("active");
    syncRealVideoMode();
    if (realTelemetryFrames && realTelemetryFrames.length > 0 && lastTelemetryIdx < 0) {
      lastTelemetryIdx = 0;
      updateEditorialTelemetry(realTelemetryFrames[0]);
    }
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
    const isHold = tel.grasp_status === "BIO_EXCLUSION_HOLD" || tel.grasp_status === "BLOQUEO BIO-EXCLUSIÓN";
    const isScanning = tel.grasp_status === "SCANNING";
    statusBox.classList.remove("hold", "scanning");
    if (isHold) {
      statusBox.classList.add("hold");
      statusEl.textContent = "BLOQUEO BIO-EXCLUSIÓN";
    } else if (isScanning) {
      statusBox.classList.add("scanning");
      statusEl.textContent = "ESCANEANDO ESCENA";
    } else {
      statusEl.textContent = "AGARRE SEGURO";
    }
    $("#telFps", detailEditorialBody).textContent = Number(tel.fps || 60).toFixed(1);
    $("#telWastePct", detailEditorialBody).textContent = `${Number(tel.avg_bbox_waste_pct || 0).toFixed(1)}%`;
    $("#telBioDist", detailEditorialBody).textContent = tel.min_bio_distance_px !== null ? `${Number(tel.min_bio_distance_px).toFixed(0)} px` : "DESPEJADO";
    $("#telAreaLat", detailEditorialBody).textContent = `${Number(tel.debris_coverage_pct || 0).toFixed(2)}% · ${Number(tel.inference_ms || 9.4).toFixed(1)} ms`;
    const tgt = tel.primary_target;
    $("#telCentroid", detailEditorialBody).textContent = tgt ? `(${Math.round(tgt.centroid[0])}, ${Math.round(tgt.centroid[1])})` : "--";

    const listEl = $("#telInstancesList", detailEditorialBody);
    listEl.innerHTML = "";
    const barColors = { 0: "#0077b6", 1: "#e85d04", 2: "#00a878", 3: "#6c3fc5" };
    const insts = tel.instances || [];
    if (insts.length === 0) {
      const emptyRow = document.createElement("div");
      emptyRow.className = "ed-inst-row";
      emptyRow.textContent = "Sin instancias sobre el umbral en este cuadro";
      listEl.appendChild(emptyRow);
      return;
    }
    insts.forEach((inst) => {
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

  /* Máscaras calibradas sobre las coordenadas reales de media/demo_rov_frame.jpg */
  const REAL_PHOTO_POLYS = {
    bottle: {
      classId: 0,
      label: "debris_flexible_polymer (botella)",
      conf: 0.94,
      norm: [[0.394, 0.296], [0.411, 0.309], [0.404, 0.340], [0.409, 0.376], [0.391, 0.455], [0.369, 0.514], [0.349, 0.526], [0.327, 0.506], [0.327, 0.480], [0.349, 0.402], [0.376, 0.336], [0.388, 0.312]],
    },
    bag: {
      classId: 0,
      label: "debris_flexible_polymer (bolsa)",
      conf: 0.91,
      norm: [[0.354, 0.616], [0.368, 0.608], [0.383, 0.630], [0.404, 0.668], [0.414, 0.720], [0.414, 0.805], [0.372, 0.836], [0.338, 0.880], [0.320, 0.880], [0.296, 0.818], [0.283, 0.735], [0.284, 0.688], [0.312, 0.678], [0.342, 0.658]],
    },
    can: {
      classId: 1,
      label: "debris_rigid_other (lata)",
      conf: 0.88,
      norm: [[0.642, 0.806], [0.682, 0.814], [0.715, 0.892], [0.713, 0.946], [0.682, 0.962], [0.654, 0.944], [0.631, 0.865], [0.632, 0.822]],
    },
    coral: {
      classId: 2,
      label: "protected_marine_life (coral)",
      conf: 0.93,
      norm: [[0.613, 0.380], [0.634, 0.315], [0.682, 0.295], [0.735, 0.308], [0.768, 0.365], [0.764, 0.438], [0.732, 0.478], [0.695, 0.502], [0.655, 0.495], [0.625, 0.448]],
    },
    fishStatic: {
      classId: 2,
      label: "protected_marine_life (pez)",
      conf: 0.96,
      norm: [[0.726, 0.432], [0.745, 0.412], [0.766, 0.416], [0.782, 0.435], [0.774, 0.456], [0.752, 0.460], [0.732, 0.450]],
    },
  };

  function startVisorLoop() {
    const canvas = $("#rovSimCanvas", detailLeftPane);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const classHex = { 0: "#90e0ef", 1: "#ffb703", 2: "#00e5a0", 3: "#8b5cf6" };
    const marineSnow = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.8 + Math.random() * 1.4,
      vy: 0.0005 + Math.random() * 0.001,
    }));

    function frame() {
      if (drawerState !== "detail" || activeDetailIdx !== 4) return;
      if (usingRealVideo) {
        const vidRaw = $("#vidRaw", detailLeftPane);
        const vidSeg = $("#vidSeg", detailLeftPane);
        if (vidRaw && vidSeg && !vidSeg.paused && Math.abs(vidRaw.currentTime - vidSeg.currentTime) > 0.12) {
          vidRaw.currentTime = vidSeg.currentTime;
        }
        if (realTelemetryFrames && realTelemetryFrames.length > 0 && vidSeg?.duration) {
          const r = vidSeg.currentTime / Math.max(0.1, vidSeg.duration);
          const fIdx = Math.min(realTelemetryFrames.length - 1, Math.floor(r * realTelemetryFrames.length));
          if (fIdx !== lastTelemetryIdx) {
            lastTelemetryIdx = fIdx;
            updateEditorialTelemetry(realTelemetryFrames[fIdx]);
          }
        }
        simRafId = requestAnimationFrame(frame);
        return;
      }

      if (visorPlaying) simTick += 1;
      const t = simTick * 0.028;
      const w = canvas.width;
      const h = canvas.height;

      /* Deriva orgánica suave de cámara ROV sobre la fotografía submarina real */
      const panX = Math.sin(t * 0.55) * 9;
      const panY = Math.cos(t * 0.42) * 6;
      const scale = 1.04;
      const drawW = w * scale;
      const drawH = h * scale;
      const ox = (w - drawW) * 0.5 + panX;
      const oy = (h - drawH) * 0.5 + panY;

      if (demoFrameImg.complete && demoFrameImg.naturalWidth > 0) {
        ctx.drawImage(demoFrameImg, ox, oy, drawW, drawH);
      } else {
        ctx.fillStyle = "#031626";
        ctx.fillRect(0, 0, w, h);
      }

      /* Partículas de nieve marina */
      ctx.fillStyle = "rgba(210, 240, 255, 0.36)";
      marineSnow.forEach((p) => {
        if (visorPlaying) {
          p.y -= p.vy;
          if (p.y < 0) p.y = 1;
        }
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      const toPx = (normPts) => normPts.map(([nx, ny]) => [ox + nx * drawW, oy + ny * drawH]);
      const bottlePoly = toPx(REAL_PHOTO_POLYS.bottle.norm);
      const bagPoly = toPx(REAL_PHOTO_POLYS.bag.norm);
      const canPoly = toPx(REAL_PHOTO_POLYS.can.norm);
      const coralPoly = toPx(REAL_PHOTO_POLYS.coral.norm);
      const fishPoly = toPx(REAL_PHOTO_POLYS.fishStatic.norm);

      /* Pez dinámico nadando suavemente frente al coral hacia la botella para demostrar bloqueo de bio-exclusión */
      const swimPhase = 0.5 + 0.5 * Math.sin(t * 0.72);
      const swimX = ox + (0.28 + swimPhase * 0.44) * drawW;
      const swimY = oy + (0.41 + Math.sin(t * 1.4) * 0.03) * drawH;
      const swimPoly = [
        [swimX - 18, swimY - 6],
        [swimX - 5, swimY - 9],
        [swimX + 12, swimY - 3],
        [swimX + 20, swimY - 8],
        [swimX + 20, swimY + 8],
        [swimX + 12, swimY + 3],
        [swimX - 5, swimY + 9],
        [swimX - 18, swimY + 6],
      ];

      ctx.save();
      ctx.beginPath();
      swimPoly.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = "rgba(24, 90, 122, 0.78)";
      ctx.fill();
      ctx.restore();

      const objects = [
        { poly: bottlePoly, classId: 0 },
        { poly: bagPoly, classId: 0 },
        { poly: canPoly, classId: 1 },
        { poly: coralPoly, classId: 2 },
        { poly: fishPoly, classId: 2 },
        { poly: swimPoly, classId: 2 },
      ];

      const debrisArea = polyArea(bottlePoly) + polyArea(bagPoly) + polyArea(canPoly);
      const minBioDist = Math.min(
        minDistPts(swimPoly, bottlePoly),
        minDistPts(coralPoly, bottlePoly),
        minDistPts(fishPoly, canPoly)
      );
      const isHold = minBioDist < 45;
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
          ctx.fillStyle = `${hex}38`;
          ctx.fill();
          ctx.strokeStyle = hex;
          ctx.lineWidth = 2.2;
          ctx.stroke();

          if (visorMode === "hud" && obj.classId === 2) {
            const [cx, cy] = polyCenter(obj.poly);
            ctx.beginPath();
            ctx.setLineDash([5, 4]);
            ctx.arc(cx, cy, obj.poly === coralPoly ? 68 : 34, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(0, 229, 160, 0.78)";
            ctx.lineWidth = 1.4;
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        if (visorMode === "hud") {
          /* Haz suave de escaneo horizontal */
          const scanY = ((t * 58) % (h - 30)) + 15;
          const scanGrad = ctx.createLinearGradient(0, scanY - 12, 0, scanY + 12);
          scanGrad.addColorStop(0, "rgba(144,224,239,0)");
          scanGrad.addColorStop(0.5, "rgba(144,224,239,0.18)");
          scanGrad.addColorStop(1, "rgba(144,224,239,0)");
          ctx.fillStyle = scanGrad;
          ctx.fillRect(0, scanY - 12, w, 24);

          const [tx, ty] = bottleCenter;
          ctx.strokeStyle = isHold ? "#ff4769" : "#90e0ef";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(tx, ty, 19, 0, Math.PI * 2);
          ctx.moveTo(tx - 28, ty); ctx.lineTo(tx + 28, ty);
          ctx.moveTo(tx, ty - 28); ctx.lineTo(tx, ty + 28);
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
          avg_bbox_waste_pct: 58.6,
          min_bio_distance_px: minBioDist,
          grasp_status: isHold ? "BIO_EXCLUSION_HOLD" : "SAFE_GRASP",
          primary_target: { centroid: bottleCenter },
          instances: [
            { class_id: 0, class_name: REAL_PHOTO_POLYS.bottle.label, confidence: 0.94 },
            { class_id: 0, class_name: REAL_PHOTO_POLYS.bag.label, confidence: 0.91 },
            { class_id: 1, class_name: REAL_PHOTO_POLYS.can.label, confidence: 0.88 },
            { class_id: 2, class_name: REAL_PHOTO_POLYS.coral.label, confidence: 0.93 },
            { class_id: 2, class_name: REAL_PHOTO_POLYS.fishStatic.label, confidence: 0.96 },
          ],
        });
      }
      simRafId = requestAnimationFrame(frame);
    }
    simTick = 0;
    frame();
  }

  /* ---------- Motor 3D Three.js Temático por Diapositiva ---------- */
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

  function buildCircleSpriteTexture() {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const g = c.getContext("2d");
    const rad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    rad.addColorStop(0, "rgba(255,255,255,1)");
    rad.addColorStop(0.45, "rgba(144,224,239,0.55)");
    rad.addColorStop(1, "rgba(144,224,239,0)");
    g.fillStyle = rad;
    g.fillRect(0, 0, 64, 64);
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
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (_) {
      initFallback2D();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000d15, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 180);
    camera.position.set(0, 0, 6.85);

    scene.add(new THREE.HemisphereLight(0xbbeeff, 0x05182e, 1.35));
    const sunLight = new THREE.DirectionalLight(0xeef8ff, 2.35);
    sunLight.position.set(12, 16, 14);
    scene.add(sunLight);

    /* ----- 1. GLOBO TERRÁQUEO 3D (Inicio & Cierre) ----- */
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const fallbackTex = new THREE.CanvasTexture(buildProceduralEarthCanvas());
    const earthMat = new THREE.MeshStandardMaterial({ map: fallbackTex, roughness: 0.72, metalness: 0.12 });
    new THREE.TextureLoader().load("media/earth_albedo.jpg", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      earthMat.map = tex;
      earthMat.needsUpdate = true;
    });

    const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(2.35, 64, 64), earthMat);
    globeGroup.add(earthMesh);

    const cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.39, 48, 48),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(buildCloudCanvasTexture()), transparent: true, opacity: 0.45, depthWrite: false })
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
      const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.014, 0.52, 8), beaconMat);
      beam.position.copy(dir.clone().multiplyScalar(2.55));
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      globeGroup.add(beam);
    }

    /* ----- 2. RED NEURONAL & PIRÁMIDE DE TENSORES 3D (Capítulo 03: Arquitectura YOLO11-seg) ----- */
    const neuralGroup = new THREE.Group();
    scene.add(neuralGroup);

    const layerSpecs = [
      { pos: [-4.6, 0.2, 0.0], size: [1.8, 2.2], color: 0x90e0ef },
      { pos: [-2.6, 0.2, -0.3], size: [1.5, 1.85], color: 0x90e0ef },
      { pos: [-0.8, 0.2, -0.1], size: [1.2, 1.5], color: 0x90e0ef },
      { pos: [1.0, 0.2, 0.1], size: [1.0, 1.25], color: 0x90e0ef },
      { pos: [2.8, 1.25, 0.2], size: [1.1, 0.95], color: 0xff7438 },
      { pos: [2.8, -0.95, 0.2], size: [1.25, 1.05], color: 0x00e5a0 },
      { pos: [4.7, 0.2, 0.4], size: [1.5, 1.75], color: 0x90e0ef },
    ];

    const layerAnchors = [];
    layerSpecs.forEach(({ pos, size, color }) => {
      const planeGeo = new THREE.PlaneGeometry(size[0], size[1], 4, 4);
      const card = new THREE.Mesh(
        planeGeo,
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.14, side: THREE.DoubleSide })
      );
      card.position.set(pos[0], pos[1], pos[2]);
      card.rotation.y = -0.36;
      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(planeGeo),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.72 })
      );
      card.add(wire);
      neuralGroup.add(card);
      layerAnchors.push(new THREE.Vector3(pos[0], pos[1], pos[2]));
    });

    const neuralLinks = [
      [0, 1, 0x90e0ef], [1, 2, 0x90e0ef], [2, 3, 0x90e0ef],
      [3, 4, 0xff7438], [4, 6, 0xff7438],
      [3, 5, 0x00e5a0], [5, 6, 0x00e5a0],
    ];
    const neuralPulses = [];
    neuralLinks.forEach(([a, b, col]) => {
      const pts = [layerAnchors[a], layerAnchors[b]];
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.42 })
      );
      neuralGroup.add(line);
      const photon = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), new THREE.MeshBasicMaterial({ color: col }));
      neuralGroup.add(photon);
      neuralPulses.push({ a: layerAnchors[a], b: layerAnchors[b], mesh: photon, offset: Math.random() });
    });

    /* ----- 3. PAISAJE DE DESCENSO DE GRADIENTE 3D (Capítulo 04: Entrenamiento y Loss) ----- */
    const lossGroup = new THREE.Group();
    scene.add(lossGroup);

    const lossHeight = (x, z) => {
      const r2 = (x * x + z * z) * 0.085;
      return -2.2 * Math.exp(-r2) + 0.48 * Math.sin(x * 0.75) * Math.cos(z * 0.75) + 0.18 * Math.cos(x * 1.4 - z);
    };

    const lossGeo = new THREE.PlaneGeometry(20, 20, 64, 64);
    lossGeo.rotateX(-Math.PI / 2);
    const posAttr = lossGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      posAttr.setY(i, lossHeight(x, z));
    }
    lossGeo.computeVertexNormals();

    const lossWire = new THREE.Mesh(
      lossGeo,
      new THREE.MeshBasicMaterial({ color: 0x90e0ef, wireframe: true, transparent: true, opacity: 0.28 })
    );
    lossGroup.add(lossWire);

    const lossSurface = new THREE.Mesh(
      lossGeo,
      new THREE.MeshStandardMaterial({ color: 0x04263f, roughness: 0.65, metalness: 0.25, transparent: true, opacity: 0.78 })
    );
    lossGroup.add(lossSurface);

    const descentPts = [];
    for (let i = 0; i <= 40; i++) {
      const s = i / 40;
      const ang = (1 - s) * 3.8;
      const rad = (1 - s) * 5.2;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      descentPts.push(new THREE.Vector3(x, lossHeight(x, z) + 0.1, z));
    }
    const descentCurve = new THREE.CatmullRomCurve3(descentPts);
    const descentTube = new THREE.Mesh(
      new THREE.TubeGeometry(descentCurve, 64, 0.045, 8, false),
      new THREE.MeshBasicMaterial({ color: 0xff7438 })
    );
    lossGroup.add(descentTube);

    const optimizerBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xff7438 })
    );
    lossGroup.add(optimizerBall);

    /* ----- 4. PARTÍCULAS SUBMARINAS, ESCÁNER & ANILLOS DE SONAR (Capítulos sobre fotografía) ----- */
    const fxGroup = new THREE.Group();
    scene.add(fxGroup);

    const snowCount = 190;
    const snowPositions = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount; i++) {
      snowPositions[i * 3] = (Math.random() - 0.5) * 18;
      snowPositions[i * 3 + 1] = (Math.random() - 0.5) * 11;
      snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPositions, 3));
    const snowPoints = new THREE.Points(
      snowGeo,
      new THREE.PointsMaterial({
        map: new THREE.CanvasTexture(buildCircleSpriteTexture()),
        size: 0.14,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    fxGroup.add(snowPoints);

    const sonarSweep = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 0.045),
      new THREE.MeshBasicMaterial({ color: 0x90e0ef, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending })
    );
    fxGroup.add(sonarSweep);

    const polyRingsGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.75 + i * 0.45, 0.78 + i * 0.45, i % 2 === 0 ? 6 : 4),
        new THREE.MeshBasicMaterial({ color: i === 2 ? 0x00e5a0 : 0x90e0ef, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
      );
      ring.position.set(1.5 + (i - 1.5) * 0.6, (i % 2 - 0.5) * 0.9, -i * 0.4);
      polyRingsGroup.add(ring);
    }
    fxGroup.add(polyRingsGroup);

    const sonarPulseGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const sr = new THREE.Mesh(
        new THREE.RingGeometry(1.1, 1.15, 64),
        new THREE.MeshBasicMaterial({ color: 0x90e0ef, transparent: true, opacity: 0.38, side: THREE.DoubleSide })
      );
      sonarPulseGroup.add(sr);
    }
    fxGroup.add(sonarPulseGroup);

    /* ----- Loop Principal ----- */
    const clock = new THREE.Clock();
    function animate() {
      const t = clock.getElapsedTime();
      smoothProgress += (targetProgress - smoothProgress) * 0.085;
      updateStageOverlays(smoothProgress);
      animateWaveIcon(t * 1000);

      const showGlobe = smoothProgress < 0.085 || smoothProgress > 0.905;
      const ch = CHAPTERS[currentChapterIdx] || CHAPTERS[0];
      const sceneType = showGlobe ? "globe" : ch.sceneType;

      globeGroup.visible = sceneType === "globe";
      neuralGroup.visible = sceneType === "neural_3d";
      lossGroup.visible = sceneType === "loss_3d";
      fxGroup.visible = !globeGroup.visible && !neuralGroup.visible && !lossGroup.visible;

      if (globeGroup.visible) {
        earthMesh.rotation.y = t * 0.055 + smoothProgress * 2.2;
        cloudMesh.rotation.y = t * 0.072;
        globeGroup.rotation.x = 0.22 + mouse.ny * 0.08;
        globeGroup.rotation.y = -0.75 + mouse.nx * 0.12;
        const zoom = smoothProgress < 0.085
          ? 6.85 - (smoothProgress / 0.085) * 3.1
          : 6.85 - ((1 - smoothProgress) / 0.095) * 3.0;
        camera.position.set(mouse.nx * 0.32, -mouse.ny * 0.22, zoom);
        camera.lookAt(0, 0, 0);
      } else if (neuralGroup.visible) {
        neuralGroup.rotation.y = -0.12 + mouse.nx * 0.16 + Math.sin(t * 0.4) * 0.05;
        neuralGroup.rotation.x = 0.06 - mouse.ny * 0.1;
        camera.position.set(mouse.nx * 0.4, 0.3 - mouse.ny * 0.3, 8.8);
        camera.lookAt(0.2, 0.2, 0);
        neuralPulses.forEach((p) => {
          const u = (t * 0.55 + p.offset) % 1;
          p.mesh.position.lerpVectors(p.a, p.b, u);
        });
      } else if (lossGroup.visible) {
        lossGroup.rotation.y = t * 0.12 + mouse.nx * 0.25;
        camera.position.set(0.8 + mouse.nx * 0.5, 4.8 - mouse.ny * 0.6, 10.6);
        camera.lookAt(0, -0.6, 0);
        const u = (t * 0.18) % 1;
        optimizerBall.position.copy(descentCurve.getPointAt(u));
      } else {
        camera.position.set(mouse.nx * 0.35, -mouse.ny * 0.25, 7.5);
        camera.lookAt(0, 0, 0);

        const attr = snowGeo.attributes.position;
        for (let i = 0; i < snowCount; i++) {
          let y = attr.getY(i) + 0.008;
          if (y > 5.5) y = -5.5;
          attr.setY(i, y);
        }
        attr.needsUpdate = true;

        sonarSweep.visible = sceneType === "photo_sonar";
        if (sonarSweep.visible) {
          sonarSweep.position.y = Math.sin(t * 0.85) * 3.4;
        }
        polyRingsGroup.visible = sceneType === "photo_polygons";
        if (polyRingsGroup.visible) {
          polyRingsGroup.children.forEach((r, idx) => {
            r.rotation.z = t * (0.18 + idx * 0.07) * (idx % 2 === 0 ? 1 : -1);
          });
        }
        sonarPulseGroup.visible = sceneType === "photo_rings";
        if (sonarPulseGroup.visible) {
          sonarPulseGroup.children.forEach((sr, idx) => {
            const p = (t * 0.35 + idx * 0.25) % 1;
            const sc = 0.4 + p * 3.8;
            sr.scale.set(sc, sc, 1);
            sr.material.opacity = (1 - p) * 0.42;
          });
        }
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    setTimeout(() => preloader.classList.add("done"), 620);
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
      ctx.clearRect(0, 0, c.width, c.height);
      requestAnimationFrame(loop);
    }
    setTimeout(() => preloader.classList.add("done"), 450);
    requestAnimationFrame(loop);
  }

  /* ---------- Mouse & Auto-Carga HTTP ---------- */
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
      if (mRes.ok) {
        activeMetrics = await mRes.json();
        if (drawerState === "detail" && activeDetailIdx === 3) drawMetricsChart();
      }
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
        hasRealVideoAssets = true;
        usingRealVideo = true;
        if (drawerState === "detail" && activeDetailIdx === 4) switchVisorSource(true);
      }
    } catch (_) {}
  }

  /* ---------- Inicio ---------- */
  buildTimelineDotsAndMenu();
  probeRemoteAssets();
  updateStageOverlays(0);
  initWebGLWorld();
})();
