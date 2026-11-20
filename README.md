# ABYSSAL AI — Segmentación Submarina en Tiempo Real para ROVs Autónomos

- **Presentación Web (Live Pitch):** https://angel-ai-dev.github.io/abyssal-ai/
- **Abrir Notebook Ejecutado en Google Colab:** https://colab.research.google.com/github/angel-ai-dev/abyssal-ai/blob/main/notebooks/abyssal_ai_finetuning_colab.ipynb
- **Pesos Entrenados (`best.pt` + `best.onnx` · Release):** https://github.com/angel-ai-dev/abyssal-ai/releases/tag/v1.0-weights

> **Proyecto Final de Inteligencia Artificial — Línea 2: Visión Artificial (Segmentación en Video con YOLO)**  
> **Integrantes:** Samuel · Fabián · Ángel

**ABYSSAL AI** implementa un sistema de **segmentación de instancias en video** basado en **YOLO11n-seg** y entrenado mediante *fine-tuning* en Google Colab (GPU Tesla T4, 50 épocas) sobre el dataset real **TrashCan 1.0** (JAMSTEC / Universidad de Minnesota) para permitir que vehículos submarinos no tripulados (**ROVs**) identifiquen residuos plásticos y metálicos con precisión de píxel, evitando colisiones con fauna y corales mediante un protocolo automático de **exclusión biológica**.

---

## 1. ¿Por qué Segmentación de Instancias y no Bounding Boxes?

En entornos marinos reales, bolsas plásticas, redes fantasma y residuos flotan en ángulos diagonales junto a corales y peces. Un *bounding box* rectangular captura hasta **>65% de fondo o ecosistema protegido**, provocando agarres imprecisos o daños ambientales.

Mediante máscaras poligonales (`YOLO11-seg`), **ABYSSAL AI** calcula cuadro a cuadro:
- El **área exacta en píxeles** de cada residuo frente a su *bounding box* equivalente (`avg_bbox_waste_pct`, con promedios reales de `40.9%` y picos de `85.9%` sobre la secuencia de validación ROV).
- El **centroide seguro** de agarre para el brazo manipulador del ROV.
- La **distancia mínima en píxeles** hacia fauna o flora protegida (`SAFE_GRASP`, `SCANNING` y `BIO_EXCLUSION_HOLD`).

---

## 2. Taxonomía Operativa (4 Clases) y Split Real

Las categorías originales de **TrashCan 1.0** se consolidan en `configs/trashcan_seg.yaml`, generando **6,065 imágenes en Train (13,962 polígonos)** y **1,147 imágenes en Val (4,050 polígonos / 4,046 instancias evaluadas)**:

| ID | Clase Operativa | Origen en TrashCan 1.0 | Instancias Train / Val | Función en el ROV |
| :---: | :--- | :--- | :---: | :--- |
| `0` | `debris_flexible_polymer` | `trash_bag`, `trash_bottle`, `trash_net`, `trash_rope`, `trash_tarp`, `trash_wrapper`, `trash_cup` | `2,098` / `875` | Prioridad máxima de agarre suave |
| `1` | `debris_rigid_other` | `trash_can`, `trash_container`, `trash_pipe`, `trash_wreckage`, `trash_unknown_instance` | `4,531` / `1,114` | Recolección con ajuste de torque |
| `2` | `protected_marine_life` | `animal_fish`, `animal_crab`, `animal_starfish`, `animal_eel`, `animal_shells`, `plant` | `2,739` / `786` | Dispara halo de exclusión biológica |
| `3` | `rov_hardware` | `rov` | `4,594` / `1,275` | Auto-enmascarado del propio brazo ROV |

---

## 3. Resultados Reales del Fine-Tuning (Google Colab GPU T4 — 50 Épocas)

Entrenamiento ejecutado en **Google Colab (`Tesla T4 · 14913 MiB`)** con `Ultralytics 8.4.216` sobre `yolo11n-seg.pt` (**114 capas · 2,850,196 parámetros · 9.7 GFLOPs**), alcanzando el mejor checkpoint en la **época 49 / 50**:

| Métrica Global (Best Epoch 49) | Valor Verificado |
| :--- | :---: |
| **`mAP@50` (Máscara)** | **52.1%** (`0.5206`) |
| **`mAP@50-95` (Máscara)** | **31.3%** (`0.3131`) |
| **`Precisión` (Máscara)** | **78.1%** (`0.7810`) |
| **`Recall` (Máscara)** | **48.9%** (`0.4891`) |
| **`mAP@50` (Caja)** | **53.9%** (`0.5387`) |
| **`mAP@50-95` (Caja)** | **38.1%** (`0.3810`) |
| **Latencia de inferencia GPU T4** | **3.21 ms / frame** (~311 FPS teóricos GPU) |
| **Exportación ONNX** | `best.onnx` (`11.15 MB`, opset 18 simplificado) |

### Desglose de Segmentación por Clase (`val`, 1,147 imágenes · 4,046 instancias)

| Clase Operativa | Instancias Val | Precisión (Mask) | Recall (Mask) | `mAP@50` (Mask) | `mAP@50-95` (Mask) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `rov_hardware` | 1,271 | 90.6% | 65.2% | **67.0%** | 51.5% |
| `debris_rigid_other` | 1,114 | 81.9% | 61.4% | **65.1%** | 35.7% |
| `protected_marine_life` | 786 | 62.0% | 44.9% | **47.1%** | 20.4% |
| `debris_flexible_polymer` | 875 | 74.7% | 26.7% | **28.8%** | 17.5% |

> **Lectura técnica:** La precisión alta (`78.1%` global; `74.7%` en polímeros flexibles) minimiza agarres falsos de la pinza ROV, mientras el menor recall en plásticos translúcidos (`26.7%`) refleja el reto óptico real de turbidez y bajo contraste bajo iluminación submarina.

---

## 4. Estructura del Repositorio

```text
abyssal-ai/
├── README.md
├── PITCH_GUIDE.md                         # Guion cronometrado (8 min) y defensa técnica
├── requirements.txt                       # Dependencias Python para inferencia y utilidades
├── configs/
│   └── trashcan_seg.yaml                  # Configuración de clases YOLO-seg
├── notebooks/
│   └── abyssal_ai_finetuning_colab.ipynb  # Notebook ejecutado en Google Colab GPU T4
├── src/
│   ├── dataset_utils.py                   # Conversión COCO → YOLO-seg y validación
│   ├── video_inference.py                 # Inferencia en video con HUD y telemetría JSON
│   └── export_web_bundle.py               # Exportación de metrics_summary.json desde runs/
└── docs/                                  # Presentación Web interactiva (GitHub Pages)
    ├── index.html
    ├── styles.css
    ├── app.js
    └── media/
        ├── metrics_summary.json           # Métricas verificadas de 50 épocas
        ├── telemetry_frames.json          # Telemetría cuadro a cuadro (180 frames)
        ├── rov_raw.mp4                    # Secuencia real JAMSTEC sin overlay (480×270)
        ├── rov_segmented.mp4              # Inferencia real best.pt + HUD (480×270)
        ├── confusion_matrix_normalized.png
        ├── MaskPR_curve.png
        ├── MaskF1_curve.png
        └── results.png
```

---

## 5. Flujo Reproducible en Google Colab (Ya Ejecutado e Integrado)

El repositorio ya incluye el notebook ejecutado y todos los artefactos de salida integrados en `docs/media/` (`status: "verified"`), además de los pesos **`best.pt`** (`5.75 MB`) y **`best.onnx`** (`11.15 MB`) publicados en el [Release v1.0-weights](https://github.com/angel-ai-dev/abyssal-ai/releases/tag/v1.0-weights).

Para re-ejecutar o re-entrenar desde cero en **Google Colab con GPU T4**:

1. Abre `notebooks/abyssal_ai_finetuning_colab.ipynb` en [Google Colab](https://colab.research.google.com/).
2. Activa la GPU en **Entorno de ejecución → Cambiar tipo de entorno de ejecución → GPU (T4)**.
3. Ejecuta las celdas en orden para descargar `TrashCan 1.0`, convertir las máscaras COCO a **YOLO-seg**, entrenar `yolo11n-seg.pt` por 50 épocas (`imgsz=640`, `cos_lr=True`), exportar a ONNX y generar `abyssal_web_bundle.zip`.

---

## 5. Uso Local de los Scripts (Opcional)

### Instalación de dependencias
```bash
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Validación de conversión COCO → YOLO-seg
```bash
python -m src.dataset_utils \
  --coco-json path/to/instances_train_trashcan.json \
  --images-dir path/to/train \
  --out-dir datasets/trashcan_yolo \
  --split train

python -m src.dataset_utils --validate datasets/trashcan_yolo
```

### Inferencia en video con pesos entrenados (`best.pt`)
```bash
python -m src.video_inference \
  --weights path/to/best.pt \
  --source path/to/video_submarino.mp4 \
  --out-seg docs/media/rov_segmented.mp4 \
  --out-raw docs/media/rov_raw.mp4 \
  --out-json docs/media/telemetry_frames.json
```

### Prueba sintética local (sin GPU ni pesos externos)
```bash
python -m src.video_inference --synthetic-test tmp_demo
```

---

## 6. Despliegue de la Presentación Web en GitHub Pages

1. Sube el repositorio a GitHub (`main`).
2. Ve a **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Selecciona la rama `main` y la carpeta **`/docs`**, luego guarda.
4. En menos de 1 minuto tendrás la URL pública lista para presentar directamente desde el navegador (pulsa `F` para pantalla completa, `←`/`→` para navegar y `G` para abrir el mapa de diapositivas).
