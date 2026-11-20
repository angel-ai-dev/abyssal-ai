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
  - Detalla la consolidación de 22 clases originales en **4 clases operativas** (`debris_flexible_polymer`, `debris_rigid_other`, `protected_marine_life`, `rov_hardware`) y su utilidad directa en la toma de decisiones de la pinza robótica.
- **Capítulo 04 — Panel Izquierdo (`3:30 – 4:15` · *Fine-Tuning en la Nube y Métricas Reales*):**
  - *Acción:* Avanza al Capítulo 04 y muestra la terminal de **Google Colab GPU T4**.
  - Explica cómo el notebook descarga automáticamente `TrashCan 1.0`, convierte máscaras COCO a polígonos normalizados `[0, 1]`, valida los splits y ejecuta *fine-tuning* de `yolo11n-seg.pt` por 50 épocas sin exigir hardware local.

---

### Bloque 3: Profundización Técnica y Demo Funcional (`4:15 – 7:15`) — **Ángel**
- **Capítulo 03 (`4:15 – 5:20` · *Fusión Dual de Detección y Prototipos*):**
  - Haz clic en `SPPF + C2PSA`, `DETECT HEAD`, `PROTONET` y `MÁSCARA` en el diagrama interactivo izquierdo mientras observan el inspector técnico derecho:
    - **Backbone (`C3k2`) + `C2PSA`:** Extracción multi-escala (`P3, P4, P5`) con atención espacial para separar plásticos translúcidos del sedimento.
    - **Rama dual estilo YOLACT:** El *Detection Head* predice caja (`CIoU + DFL`), clase (`BCE`) y $k = 32$ coeficientes lineales $c$, mientras **ProtoNet** genera $32$ mapas prototipo espaciales $P$ de $160 \times 160$.
    - **Síntesis y pérdida:** $\text{Mask}_i = \sigma(P \cdot c_i^T)$ recortada al BBox, entrenada con pérdida multi-tarea $\mathcal{L}_{CIoU+DFL} + \mathcal{L}_{BCE(\text{Mask})} + \mathcal{L}_{BCE(\text{Cls})}$.
- **Capítulo 04 — Panel Derecho (`5:20 – 5:55`):**
  - Alterna entre `mAP@50 / 50-95` y `Convergencia Pérdidas` en la gráfica del panel editorial blanco, destacando la diferencia entre `mAP@50 (Máscara)` y `mAP@50-95 (Máscara)` + latencia en T4.
- **Capítulo 05 (`5:55 – 7:15` · *Segmentación en Video y Bio-Exclusión*):**
  - *Acción en vivo:* Cambia entre `ORIGINAL`, `MÁSCARAS`, `DIVIDIDO` y `HUD + BIO`.
  - Señala en la columna derecha cómo `cv2.contourArea` cuantifica el porcentaje de ruido evitado frente a cajas rectangulares y cómo el sistema pasa automáticamente de **`AGARRE SEGURO`** a **`BLOQUEO BIO-EXCLUSIÓN`** cuando un pez entra dentro del radio de seguridad (`< 45 px`).

---

### Bloque 4: Conclusiones y Roadmap (`7:15 – 8:00`) — **Fabián / Cierre Conjunto**
- **Capítulo 06 → Globo 3D Cierre (`7:15 – 8:00`):**
  - Resume resultados clave, limitaciones físicas (turbidez, *backscatter*, distancia 2D en píxeles) y escalabilidad a hardware embebido (`ONNX / TensorRT FP16` en **NVIDIA Jetson Orin Nano**, cámara estéreo 3D y *tracking* con ByteTrack).
  - Cierra el panel para volver al globo 3D final (`Explora el Repositorio`) mostrando el enlace vivo a GitHub y Colab.

---

## Hoja de Defensa Rápida (Preguntas del Profesor)

- **¿Por qué consolidaron las 22 clases de TrashCan en 4 clases operativas?**  
  Porque varias subclases comparten la misma acción física de agarre y algunas tienen pocas muestras; consolidar en `flexible_polymer`, `rigid_other`, `protected_marine_life` y `rov_hardware` reduce el desbalanceo y traduce la salida de la red en decisiones directas de manipulación segura.
- **¿Cómo funciona la función de pérdida en `YOLO11-seg`?**  
  Suma $\mathcal{L}_{CIoU} + \mathcal{L}_{DFL}$ para caja, $\mathcal{L}_{BCE}$ para clasificación y $\mathcal{L}_{BCE\_Mask}$ pixel a pixel dentro del área del *bounding box* comparando $\sigma(P \cdot c^T)$ contra el *ground-truth*.
- **¿Por qué `YOLO11n-seg` y no SAM 2 en un ROV?**  
  SAM 2 destaca en segmentación *zero-shot*, pero su costo computacional dificulta operar en tiempo real (>30 FPS) sobre cómputo embebido de bajo consumo. `YOLO11n-seg` resuelve detección y máscara en un solo pase con exportación directa a TensorRT.
- **¿Qué limita la distancia de bio-exclusión actual?**  
  Actualmente opera en píxeles 2D sobre el plano de imagen; con una cámara estéreo calibrada se proyecta la máscara sobre el mapa de disparidad para obtener distancia métrica 3D $(X, Y, Z)$.
