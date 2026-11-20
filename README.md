# ABYSSAL AI — Segmentación Submarina en Tiempo Real para ROVs Autónomos

- **Presentación Web (Live Pitch):** https://angel-ai-dev.github.io/abyssal-ai/
- **Abrir Notebook en Google Colab (1-Click):** https://colab.research.google.com/github/angel-ai-dev/abyssal-ai/blob/main/notebooks/abyssal_ai_finetuning_colab.ipynb

> **Proyecto Final de Inteligencia Artificial — Línea 2: Visión Artificial (Segmentación en Video con YOLO)**  
> **Integrantes:** Samuel · Fabián · Ángel

**ABYSSAL AI** implementa un sistema de **segmentación de instancias en video** basado en **YOLO11-seg** y entrenado mediante *fine-tuning* sobre el dataset real **TrashCan 1.0** (JAMSTEC / Universidad de Minnesota) para permitir que vehículos submarinos no tripulados (**ROVs**) identifiquen residuos plásticos y metálicos con precisión de píxel, evitando colisiones con fauna y corales mediante un protocolo automático de **exclusión biológica**.

---

## 1. ¿Por qué Segmentación de Instancias y no Bounding Boxes?

En entornos marinos reales, bolsas plásticas, redes fantasma y residuos flotan en ángulos diagonales junto a corales y peces. Un *bounding box* rectangular captura hasta **>65% de fondo o ecosistema protegido**, provocando agarres imprecisos o daños ambientales.

Mediante máscaras poligonales (`YOLO11-seg`), **ABYSSAL AI** calcula cuadro a cuadro:
- El **área exacta en píxeles** de cada residuo frente a su *bounding box* equivalente (`avg_bbox_waste_pct`).
- El **centroide seguro** de agarre para el brazo manipulador del ROV.
- La **distancia mínima en píxeles** hacia fauna o flora protegida (`SAFE_GRASP` vs. `BIO_EXCLUSION_HOLD`).

---

## 2. Taxonomía Operativa (4 Clases)

Las 22/16 categorías originales de **TrashCan 1.0** se consolidan en `configs/trashcan_seg.yaml`:

| ID | Clase Operativa | Origen en TrashCan 1.0 | Función en el ROV |
| :---: | :--- | :--- | :--- |
| `0` | `debris_flexible_polymer` | `trash_bag`, `trash_bottle`, `trash_net`, `trash_rope`, `trash_tarp`, `trash_wrapper`, `trash_cup` | Prioridad máxima de recolección |
| `1` | `debris_rigid_other` | `trash_can`, `trash_container`, `trash_pipe`, `trash_wreckage`, `trash_unknown_instance` | Recolección con ajuste de torque |
| `2` | `protected_marine_life` | `animal_fish`, `animal_crab`, `animal_starfish`, `animal_eel`, `animal_shells`, `plant` | Dispara halo de exclusión biológica |
| `3` | `rov_hardware` | `rov` | Auto-enmascarado del propio brazo ROV |

---

## 3. Estructura del Repositorio

```text
abyssal-ai/
├── README.md
├── PITCH_GUIDE.md                         # Guion cronometrado (8 min) y defensa técnica
├── requirements.txt                       # Dependencias Python para inferencia y utilidades
├── configs/
│   └── trashcan_seg.yaml                  # Configuración de clases YOLO-seg
├── notebooks/
│   └── abyssal_ai_finetuning_colab.ipynb  # Notebook maestro para Google Colab (GPU T4)
├── src/
│   ├── dataset_utils.py                   # Conversión COCO → YOLO-seg y validación
│   ├── video_inference.py                 # Inferencia en video con HUD y telemetría JSON
│   └── export_web_bundle.py               # Exportación de metrics_summary.json desde runs/
└── docs/                                  # Presentación Web interactiva (GitHub Pages)
    ├── index.html
    ├── styles.css
    ├── app.js
    └── media/
        └── metrics_summary.json
```

---

## 4. Flujo Completo en Google Colab (Recomendado para Entrenamiento)

El entrenamiento está diseñado para ejecutarse íntegramente en **Google Colab con GPU T4** (sin sobrecargar equipos locales):

1. Sube `notebooks/abyssal_ai_finetuning_colab.ipynb` a [Google Colab](https://colab.research.google.com/).
2. Activa la GPU en **Entorno de ejecución → Cambiar tipo de entorno de ejecución → GPU (T4)**.
3. Ejecuta las celdas en orden:
   - Descarga automática de `TrashCan 1.0` desde el repositorio oficial de la Universidad de Minnesota.
   - Conversión de máscaras poligonales COCO a formato **YOLO-seg** y análisis exploratorio (EDA).
   - *Fine-tuning* de `yolo11n-seg.pt` durante 50 épocas (`imgsz=640`, `cos_lr=True`).
   - Evaluación (`mAP@50`, `mAP@50-95` Box/Mask), exportación a **ONNX** y generación del video pre-renderizado (`rov_raw.mp4`, `rov_segmented.mp4`, `telemetry_frames.json`).
4. Descarga el archivo `abyssal_web_bundle.zip` al final del Notebook, extráelo y copia su contenido (`metrics_summary.json`, `telemetry_frames.json`, `rov_raw.mp4`, `rov_segmented.json/mp4`, gráficas PNG) dentro de `docs/media/`.
5. La presentación web actualizará automáticamente el indicador a **`COLAB VERIFIED RUN`** y reproducirá los videos reales sincronizados con su telemetría cuadro por cuadro.

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
