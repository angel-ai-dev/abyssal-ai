# Guía de Pitch (8:00 Minutos) — ABYSSAL AI

> **Formato:** Presentación web interactiva en `docs/index.html` (`F` = Pantalla completa, `←`/`→` = Navegar, `G` = Índice)  
> **Duración total objetivo:** 7:45 – 8:00 minutos (máximo permitido: 8:00 min)

---

## Distribución de Tiempos

| Bloque | Tiempo | Diapositivas | Expositor | Foco Principal |
| :---: | :---: | :---: | :--- | :--- |
| **1** | `0:00 – 2:15` (2m 15s) | Slides **01, 02, 03** | **Samuel** | Gancho inicial, problemática marina real y comparación visual BBox vs. Máscara |
| **2** | `2:15 – 4:15` (2m 00s) | Slides **04, 06 (izq)** | **Fabián** | Dataset `TrashCan 1.0`, taxonomía operativa de 4 clases y flujo en Google Colab |
| **3** | `4:15 – 7:15` (3m 00s) | Slides **05, 06 (der), 07** | **Giraldo** | Arquitectura `YOLO11-seg`, función de pérdida, métricas y demo funcional en vivo |
| **4** | `7:15 – 8:00` (0m 45s) | Slide **08** | **Fabián / Cierre conjunto** | Conclusiones, limitaciones físicas y roadmap en edge (`Jetson Orin`) |

---

## Guion Detallado por Bloque

### Bloque 1: Contexto, Problemática y Por Qué Segmentar (`0:00 – 2:15`) — **Samuel**
- **Slide 01 (`0:00 – 0:30` · 0 m):**
  - *Apertura:* "Cada año llegan más de 14 millones de toneladas de plástico al océano, y gran parte termina en el fondo marino donde ningún buzo llega. Hoy existen vehículos submarinos no tripulados (ROVs), pero casi el 90% siguen dependiendo de pilotos humanos."
  - *Click en `INICIAR INMERSIÓN →`.*
- **Slide 02 (`0:30 – 1:20` · 180 m):**
  - Explica los 3 retos del océano en pantalla: atenuación de luz roja y turbidez (`PRB-01`), plásticos deformables que cambian de forma (`PRB-02`) y el riesgo real de dañar fauna o corales (`PRB-03`).
- **Slide 03 (`1:20 – 2:15` · 450 m):**
  - *Acción en pantalla:* Arrastra lentamente el deslizador central de izquierda a derecha.
  - *Mensaje clave:* "Si usamos un detector tradicional por cajas rectangulares, una botella inclinada junto a un coral genera un rectángulo donde más del 65% es agua y coral vivo. Con **segmentación de instancias (`YOLO11-seg`)**, abrazamos el contorno exacto del residuo en píxeles, creamos un halo de exclusión sobre el coral y calculamos un punto de agarre 100% seguro."

---

### Bloque 2: Datos, Taxonomía y Pipeline de Entrenamiento (`2:15 – 4:15`) — **Fabián**
- **Slide 04 (`2:15 – 3:30` · 1,100 m):**
  - Explica la fuente: **`TrashCan 1.0`** (Universidad de Minnesota y agencia japonesa JAMSTEC), compuesto por **7,212 imágenes reales** capturadas por ROVs en el Mar de Japón.
  - Arrastra brevemente el carrusel horizontal para mostrar las **4 clases operativas** consolidadas (`debris_flexible_polymer`, `debris_rigid_other`, `protected_marine_life`, `rov_hardware`) y explica cómo este mapeo simplifica la decisión física de la pinza robótica y evita auto-detecciones del brazo del ROV.
- **Slide 06 — Izquierda (`3:30 – 4:15` · 2,600 m):** *(Nota: puedes mencionar el flujo desde Slide 04 antes de ceder el paso técnico o hacer transición directa al Colab terminal).*
  - "Para no depender de etiquetado manual ni de hardware local limitado, automatizamos todo el pipeline en Google Colab (GPU T4): descarga oficial, conversión de polígonos COCO a coordenadas normalizadas `[0, 1]` de YOLO-seg, validación de splits y *fine-tuning* de `yolo11n-seg.pt` durante 50 épocas."

---

### Bloque 3: Deep Dive Técnico y Demo Funcional (`4:15 – 7:15`) — **Giraldo**
- **Slide 05 (`4:15 – 5:20` · 1,850 m):**
  - Haz clic en `SPPF + C2PSA`, `DETECT HEAD`, `PROTONET HEAD` y `MASK` mientras el flujo de tensores recorre la red:
    - **Backbone (`C3k2`) + `C2PSA`:** Extracción multi-escala (`P3, P4, P5`) con atención espacial para separar plásticos translúcidos del sedimento.
    - **Rama dual estilo YOLACT:** Mientras el *Detection Head* predice caja (`CIoU + DFL`), clase (`BCE`) y un vector de $k = 32$ coeficientes lineales $c$, la rama paralela **ProtoNet** genera $32$ mapas prototipo espaciales $P$ de resolución $160 \times 160$.
    - **Síntesis:** La máscara de cada instancia se obtiene por combinación lineal y activación sigmoide recorte al BBox: $\text{Mask}_i = \sigma(P \cdot c_i^T)$.
- **Slide 06 — Derecha (`5:20 – 5:55` · 2,600 m):**
  - Alterna entre las pestañas `mAP@50 / 50-95` y `Loss Convergencia`.
  - Destaca el contraste entre `mAP@50 (Mask)` y el criterio estricto `mAP@50-95 (Mask)`, junto con la latencia en GPU T4 (~9–15 ms/frame, >60 FPS teóricos).
- **Slide 07 (`5:55 – 7:15` · 3,200 m):**
  - *Acción en vivo:* Muestra el visor en modo `RAW FEED`, pasa a `YOLO11-SEG MASKS`, luego `SPLIT COMPARE` y finaliza en `HUD + BIO-EXCLUSION`.
  - Señala en el panel derecho cómo:
    1. El cálculo geométrico de `cv2.contourArea` entrega el área exacta y el **porcentaje de ruido evitado frente al bounding box**.
    2. Cuando el pez se acerca a menos de `45 px` del plástico (`min_bio_distance_px`), el protocolo pasa automáticamente de **`SAFE_GRASP`** (cian) a **`BIO_EXCLUSION_HOLD`** (rojo/alerta) para frenar la pinza robótica.

---

### Bloque 4: Conclusiones y Roadmap (`7:15 – 8:00`) — **Fabián / Cierre Conjunto**
- **Slide 08 (`7:15 – 8:00` · 3,800 m):**
  - Resume en 3 puntos concretos:
    1. Logramos segmentación de instancias funcional orientada a manipulación segura, no solo clasificación visual.
    2. Limitaciones físicas honestas: retrodispersión (*backscatter*) por focos LED, turbidez y estimación 2D de distancia sin profundidad estéreo.
    3. Escalabilidad inmediata: exportación **ONNX / TensorRT FP16** para correr embebido en **NVIDIA Jetson Orin Nano**, cámara estéreo para coordenadas 3D $(X, Y, Z)$ y *tracking* con ByteTrack.

---

## Hoja de Defensa Rápida (Preguntas del Profesor)

- **¿Por qué consolidaron las 22 clases de TrashCan en 4 clases operativas?**  
  Porque varias subclases de residuos (`trash_snack_wrapper`, `trash_tarp`, etc.) tienen pocas muestras en `TrashCan 1.0` y comparten la misma acción física de agarre. Consolidar en `flexible_polymer`, `rigid_other`, `protected_marine_life` y `rov_hardware` reduce el desbalanceo y traduce la salida de red directamente en comandos seguros para el ROV.
- **¿Cómo funciona la función de pérdida en `YOLO11-seg`?**  
  Combina cuatro términos: $\mathcal{L}_{CIoU}$ + $\mathcal{L}_{DFL}$ (*Distribution Focal Loss*) para regresión de caja, $\mathcal{L}_{BCE}$ para clasificación multiclase, y $\mathcal{L}_{BCE\_Mask}$ calculada pixel a pixel dentro del área del *bounding box* comparando la máscara sintetizada $\sigma(P \cdot c^T)$ contra la máscara *ground-truth*.
- **¿Por qué usar `YOLO11n-seg` y no SAM 2 directamente en el ROV?**  
  SAM 2 ofrece excelente segmentación *zero-shot*, pero su costo computacional dificulta correr a >30 FPS en hardware embebido con bajo consumo energético. `YOLO11n-seg` realiza detección y segmentación en un único pase (*single-shot*) con latencia de milisegundos y exportación directa a TensorRT.
- **¿Qué limita la distancia de bio-exclusión actual?**  
  Actualmente mide distancia euclidiana en el plano 2D de la imagen (`px`). En un ROV real se proyectaría sobre la nube de puntos o mapa de disparidad de una cámara estéreo para medir distancia métrica real en centímetros.
