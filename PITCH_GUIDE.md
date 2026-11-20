# Guía de Pitch (8:00 Minutos) — ABYSSAL AI

> **Formato:** Experiencia Web 3D + Paneles Editoriales en `docs/index.html` (`←`/`→` = Navegar línea temporal, `Enter` = Abrir detalle de capítulo, `Esc` = Cerrar panel, `F` = Pantalla completa)  
> **Duración total objetivo:** 7:45 – 8:00 minutos (máximo permitido: 8:00 min)

---

## Distribución de Tiempos (6 Capítulos + Inicio + Cierre)

| Bloque | Tiempo | Escena en Web | Expositor | Foco Principal |
| :---: | :---: | :--- | :--- | :--- |
| **1** | `0:00 – 2:15` (2m 15s) | **Globo 3D Inicio → Capítulo 01** | **Samuel** | Gancho inicial, problemática marina y comparador Caja vs. Máscara |
| **2** | `2:15 – 4:15` (2m 00s) | **Capítulo 02 + Capítulo 04 (izq)** | **Fabián** | Dataset `TrashCan 1.0`, taxonomía en 4 clases y flujo en Google Colab |
| **3** | `4:15 – 7:15` (3m 00s) | **Capítulo 03 + Capítulo 04 (der) + Capítulo 05** | **Ángel** | Arquitectura `YOLO11-seg`, función de pérdida, métricas y demo ROV |
| **4** | `7:15 – 8:00` (0m 45s) | **Capítulo 06 → Globo 3D Cierre** | **Fabián / Cierre conjunto** | Limitaciones reales, despliegue Edge (`Jetson Orin`) y cierre |

---

## Guion Detallado por Bloque

### Bloque 1: Contexto, Problemática y Por Qué Segmentar (`0:00 – 2:15`) — **Samuel**
- **Inicio (`0:00 – 0:30` · Globo 3D):**
  - *Apertura:* "Cada año ingresan más de 14 millones de toneladas de plástico al océano, y gran parte termina en fondos marinos donde ningún buzo llega. Hoy existen ROVs submarinos, pero cerca del 90% siguen operando manualmente."
  - *Acción:* Clic en **`INICIAR EXPERIENCIA`** para entrar a la línea temporal marina.
- **Capítulo 01 (`0:30 – 2:15` · *Más Allá de las Cajas en Aguas Profundas*):**
  - *Acción:* Clic en **`VER CAPÍTULO`** para abrir el *drawer* editorial.
  - Explica los retos de atenuación óptica submarina y la geometría irregular de plásticos y redes fantasma.
  - Arrastra el **comparador Antes/Después** dentro del panel derecho:
    - "Un detector rectangular tradicional abarca hasta 68.4% de coral vivo y fondo marino. Con **segmentación de instancias (`YOLO11-seg`)**, abrazamos el contorno exacto en píxeles, creamos un halo de exclusión sobre el coral y calculamos un punto de agarre seguro."

---

### Bloque 2: Datos, Taxonomía y Pipeline en Colab (`2:15 – 4:15`) — **Fabián**
- **Capítulo 02 (`2:15 – 3:30` · *7,212 Fotogramas Reales de ROV*):**
  - *Acción:* Clic en **`SIGUIENTE CAPÍTULO`** desde el banner *Seguir Explorando*.
  - Explica la fuente real: **`TrashCan 1.0`** (Universidad de Minnesota + JAMSTEC, imágenes reales de ROVs en el Mar de Japón).
  - Detalla la consolidación de categorías originales en **4 clases operativas** (`debris_flexible_polymer`, `debris_rigid_other`, `protected_marine_life`, `rov_hardware`) con split verificado de **6,065 imágenes Train (13,962 polígonos)** y **1,147 imágenes Val (4,050 polígonos)**, enfocado a decisiones directas de la pinza robótica.
- **Capítulo 04 — Panel Izquierdo (`3:30 – 4:15` · *Fine-Tuning en la Nube y Métricas Reales*):**
  - *Acción:* Avanza al Capítulo 04 y muestra la terminal verificada de **Google Colab GPU T4**.
  - Explica cómo el notebook descarga automáticamente `TrashCan 1.0`, convierte máscaras COCO a polígonos normalizados `[0, 1]`, valida los splits y ejecuta *fine-tuning* de `yolo11n-seg.pt` (`2.85M` parámetros, `9.7 GFLOPs`) durante 50 épocas sobre GPU Tesla T4, exportando `best.pt` y `best.onnx` sin exigir hardware local.

---

### Bloque 3: Profundización Técnica y Demo Funcional (`4:15 – 7:15`) — **Ángel**
- **Capítulo 03 (`4:15 – 5:20` · *Fusión Dual de Detección y Prototipos*):**
  - Haz clic en `SPPF + C2PSA`, `DETECT HEAD`, `PROTONET` y `MÁSCARA` en el diagrama interactivo izquierdo mientras observan el inspector técnico derecho:
    - **Backbone (`C3k2`) + `C2PSA`:** Extracción multi-escala (`P3, P4, P5`) con atención espacial para separar plásticos translúcidos del sedimento.
    - **Rama dual estilo YOLACT:** El *Detection Head* predice caja (`CIoU + DFL`), clase (`BCE`) y $k = 32$ coeficientes lineales $c$, mientras **ProtoNet** genera $32$ mapas prototipo espaciales $P$ de $160 \times 160$.
    - **Síntesis y pérdida:** $\text{Mask}_i = \sigma(P \cdot c_i^T)$ recortada al BBox, entrenada con pérdida multi-tarea $\mathcal{L}_{CIoU+DFL} + \mathcal{L}_{BCE(\text{Mask})} + \mathcal{L}_{BCE(\text{Cls})}$.
- **Capítulo 04 — Panel Derecho (`5:20 – 5:55`):**
  - Destaca las cifras reales verificadas en la mejor época (**49 / 50**): **`52.1% mAP@50 (Máscara)`**, **`31.3% mAP@50-95 (Máscara)`**, **`78.1% Precisión`** y **`3.21 ms / frame`** en GPU T4.
  - Alterna entre `mAP@50 / 50-95` y `Convergencia Pérdidas`, muestra el desglose real por clase (`67.0% rov_hardware`, `65.1% debris_rigid_other`, `47.1% protected_marine_life`, `28.8% debris_flexible_polymer`) y recorre las pestañas de **Evidencia Oficial de Ultralytics** (`Matriz Confusión`, `Curva PR`, `Curva F1`, `Resumen 50 Épocas`).
- **Capítulo 05 (`5:55 – 7:15` · *Segmentación en Video y Bio-Exclusión*):**
  - *Coreografía recomendada en vivo:*
    1. Inicia automáticamente en **`VIDEO REAL COLAB`** (secuencia real JAMSTEC de 180 cuadros procesada por `best.pt`): cambia entre `ORIGINAL`, `MÁSCARAS` y `DIVIDIDO` mostrando cómo las máscaras reales evitan en promedio `40.9%` (hasta `85.9%`) de ruido de *bounding box*, alternando en vivo entre **`AGARRE SEGURO`** y **`ESCANEANDO ESCENA`** según `telemetry_frames.json`.
    2. Haz clic en **`SIMULADOR BIO-EXCLUSIÓN`** para demostrar en vivo el disparo automático hacia **`BLOQUEO BIO-EXCLUSIÓN`** cuando un pez entra dentro del radio de seguridad (`< 45 px`).

---

### Bloque 4: Conclusiones y Roadmap (`7:15 – 8:00`) — **Fabián / Cierre Conjunto**
- **Capítulo 06 → Globo 3D Cierre (`7:15 – 8:00`):**
  - Resume resultados clave, limitaciones físicas (turbidez, *backscatter*, bajo contraste en plásticos translúcidos, distancia 2D en píxeles) y escalabilidad a hardware embebido (`ONNX / TensorRT FP16` en **NVIDIA Jetson Orin Nano**, cámara estéreo 3D y *tracking* con ByteTrack).
  - Cierra el panel para volver al globo 3D final (`Explora el Repositorio`) mostrando el enlace vivo a GitHub, Colab y pesos descargables.

---

## Hoja de Defensa Rápida (Preguntas del Profesor)

- **¿Por qué `debris_flexible_polymer` tiene 74.7% de precisión pero 26.7% de recall?**  
  Porque bolsas plásticas, cuerdas finas y plásticos translúcidos pierden contraste de borde bajo turbidez profunda y retrodispersión LED en TrashCan 1.0. Tener alta precisión (`74.7%` en polímeros y `78.1%` global) garantiza que el ROV no dispare agarres falsos sobre corales, mientras que el recall puede elevarse en iteraciones futuras con preprocesamiento de *dehazing* submarino, resolución `imgsz=960` o escalando a `yolo11s-seg`.
- **¿Por qué consolidaron las clases de TrashCan en 4 clases operativas?**  
  Porque varias subclases comparten la misma acción física de agarre y algunas tienen pocas muestras; consolidar en `debris_flexible_polymer`, `debris_rigid_other`, `protected_marine_life` y `rov_hardware` reduce el desbalanceo y traduce la salida de la red en decisiones directas de manipulación segura.
- **¿Cómo funciona la función de pérdida en `YOLO11-seg`?**  
  Suma $\mathcal{L}_{CIoU} + \mathcal{L}_{DFL}$ para caja, $\mathcal{L}_{BCE}$ para clasificación y $\mathcal{L}_{BCE\_Mask}$ pixel a pixel dentro del área del *bounding box* comparando $\sigma(P \cdot c^T)$ contra el *ground-truth*.
- **¿Por qué `YOLO11n-seg` y no SAM 2 en un ROV?**  
  SAM 2 destaca en segmentación *zero-shot*, pero su costo computacional dificulta operar en tiempo real (>30 FPS) sobre cómputo embebido de bajo consumo. `YOLO11n-seg` resuelve detección y máscara en un solo pase con exportación directa a TensorRT.
- **¿Qué limita la distancia de bio-exclusión actual?**  
  Actualmente opera en píxeles 2D sobre el plano de imagen; con una cámara estéreo calibrada se proyecta la máscara sobre el mapa de disparidad para obtener distancia métrica 3D $(X, Y, Z)$.
