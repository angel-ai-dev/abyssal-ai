"""Utilidades de descarga, conversión COCO → YOLO-seg y validación para TrashCan 1.0."""

from __future__ import annotations

import argparse
import json
import os
import shutil
from collections import Counter
from pathlib import Path
from typing import Any

TRASHCAN_ZIP_URL = (
    "https://conservancy.umn.edu/bitstream/handle/11299/214865/"
    "dataset.zip?sequence=12&isAllowed=y"
)

OPERATIONAL_CLASS_NAMES: dict[int, str] = {
    0: "debris_flexible_polymer",
    1: "debris_rigid_other",
    2: "protected_marine_life",
    3: "rov_hardware",
}

FLEXIBLE_POLYMER_KEYWORDS: tuple[str, ...] = (
    "plastic",
    "bag",
    "bottle",
    "net",
    "rope",
    "wrapper",
    "cup",
    "tarp",
    "rubber",
    "fabric",
    "cloth",
    "fishing",
    "foam",
)

BIO_EXACT_NAMES: set[str] = {
    "bio",
    "coral",
    "fish",
    "crab",
    "starfish",
    "eel",
    "shells",
}

VALID_IMAGE_EXTS: set[str] = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def map_trashcan_category(cat_name: str) -> int | None:
    """Mapea una categoría original de TrashCan 1.0 a la taxonomía operativa de 4 clases."""
    name = cat_name.strip().lower()
    if not name:
        return None
    if name == "rov" or name.startswith("rov"):
        return 3
    if name.startswith("animal") or name.startswith("plant") or name in BIO_EXACT_NAMES:
        return 2
    if any(keyword in name for keyword in FLEXIBLE_POLYMER_KEYWORDS):
        return 0
    if name.startswith("trash") or name.startswith("debris"):
        return 1
    return None


def _normalize_polygon(coords: list[float], width: int, height: int) -> list[float] | None:
    """Normaliza coordenadas [x1, y1, ...] a rango [0, 1] y descarta polígonos degenerados."""
    if width <= 0 or height <= 0 or len(coords) < 6 or len(coords) % 2 != 0:
        return None

    normalized: list[float] = []
    xs: list[float] = []
    ys: list[float] = []
    for idx in range(0, len(coords), 2):
        nx = min(1.0, max(0.0, float(coords[idx]) / float(width)))
        ny = min(1.0, max(0.0, float(coords[idx + 1]) / float(height)))
        normalized.extend((nx, ny))
        xs.append(nx)
        ys.append(ny)

    if (max(xs) - min(xs)) <= 1e-6 or (max(ys) - min(ys)) <= 1e-6:
        return None
    return normalized


def _resolve_image_path(images_src_dir: Path, file_name: str) -> Path | None:
    """Localiza una imagen COCO dentro del directorio fuente con fallback por nombre base."""
    direct = images_src_dir / file_name
    if direct.is_file():
        return direct
    basename_candidate = images_src_dir / Path(file_name).name
    if basename_candidate.is_file():
        return basename_candidate
    return None


def _read_image_size(image_path: Path) -> tuple[int, int]:
    """Lee ancho y alto de una imagen usando PIL u OpenCV como respaldo."""
    try:
        from PIL import Image

        with Image.open(image_path) as img:
            return img.size
    except Exception:
        import cv2

        frame = cv2.imread(str(image_path))
        if frame is None:
            return (0, 0)
        h, w = frame.shape[:2]
        return (w, h)


def _extract_polygon_rings(segmentation: Any) -> list[list[float]]:
    """Extrae anillos poligonales desde el campo COCO segmentation (ignora RLE dicts)."""
    if not isinstance(segmentation, list) or not segmentation:
        return []
    if all(isinstance(v, (int, float)) for v in segmentation):
        return [list(segmentation)]
    return [list(ring) for ring in segmentation if isinstance(ring, list)]


def convert_trashcan_coco_to_yolo_seg(
    coco_json_path: str | Path,
    images_src_dir: str | Path,
    out_images_dir: str | Path,
    out_labels_dir: str | Path,
    operational_taxonomy: bool = True,
    copy_images: bool = True,
) -> dict[str, Any]:
    """Convierte anotaciones COCO de TrashCan 1.0 a archivos de polígonos YOLO-seg."""
    coco_path = Path(coco_json_path)
    src_dir = Path(images_src_dir)
    dst_images = Path(out_images_dir)
    dst_labels = Path(out_labels_dir)
    dst_images.mkdir(parents=True, exist_ok=True)
    dst_labels.mkdir(parents=True, exist_ok=True)

    with coco_path.open("r", encoding="utf-8") as fh:
        coco = json.load(fh)

    categories = sorted(coco.get("categories", []), key=lambda item: int(item["id"]))
    cat_id_to_target: dict[int, int] = {}
    orig_to_op_map: dict[str, str] = {}
    unmapped_categories: list[str] = []

    for raw_idx, cat in enumerate(categories):
        orig_id = int(cat["id"])
        cat_name = str(cat.get("name", ""))
        if operational_taxonomy:
            target_id = map_trashcan_category(cat_name)
            if target_id is None:
                unmapped_categories.append(cat_name)
                continue
            cat_id_to_target[orig_id] = target_id
            orig_to_op_map[cat_name] = OPERATIONAL_CLASS_NAMES[target_id]
        else:
            cat_id_to_target[orig_id] = raw_idx
            orig_to_op_map[cat_name] = cat_name

    anns_by_image: dict[int, list[dict[str, Any]]] = {}
    for ann in coco.get("annotations", []):
        img_id = int(ann["image_id"])
        anns_by_image.setdefault(img_id, []).append(ann)

    class_counts: Counter[int] = Counter()
    written_images = 0
    background_images = 0
    total_polygons = 0
    skipped_annotations = 0
    missing_images = 0

    images = coco.get("images", [])
    for img_info in images:
        img_id = int(img_info["id"])
        file_name = str(img_info["file_name"])
        src_img_path = _resolve_image_path(src_dir, file_name)
        if src_img_path is None:
            missing_images += 1
            continue

        width = int(img_info.get("width") or 0)
        height = int(img_info.get("height") or 0)
        if width <= 0 or height <= 0:
            width, height = _read_image_size(src_img_path)

        label_lines: list[str] = []
        for ann in anns_by_image.get(img_id, []):
            orig_cat_id = int(ann.get("category_id", -1))
            if orig_cat_id not in cat_id_to_target:
                skipped_annotations += 1
                continue

            rings = _extract_polygon_rings(ann.get("segmentation"))
            if not rings:
                skipped_annotations += 1
                continue

            target_cls = cat_id_to_target[orig_cat_id]
            wrote_ring = False
            for ring in rings:
                norm = _normalize_polygon(ring, width, height)
                if norm is None:
                    continue
                coords_str = " ".join(f"{val:.6f}" for val in norm)
                label_lines.append(f"{target_cls} {coords_str}")
                class_counts[target_cls] += 1
                total_polygons += 1
                wrote_ring = True

            if not wrote_ring:
                skipped_annotations += 1

        dest_img_name = src_img_path.name
        dest_img_path = dst_images / dest_img_name
        dest_lbl_path = dst_labels / f"{src_img_path.stem}.txt"

        if copy_images:
            if src_img_path.resolve() != dest_img_path.resolve():
                shutil.copy2(src_img_path, dest_img_path)
        elif not dest_img_path.exists():
            try:
                os.symlink(src_img_path.resolve(), dest_img_path)
            except OSError:
                shutil.copy2(src_img_path, dest_img_path)

        dest_lbl_path.write_text("\n".join(label_lines), encoding="utf-8")
        written_images += 1
        if not label_lines:
            background_images += 1

    return {
        "total_images": len(images),
        "written_images": written_images,
        "background_images": background_images,
        "missing_images": missing_images,
        "total_polygons": total_polygons,
        "skipped_annotations": skipped_annotations,
        "class_counts": {str(k): v for k, v in sorted(class_counts.items())},
        "original_to_operational_map": orig_to_op_map,
        "unmapped_categories": unmapped_categories,
    }


def validate_yolo_seg_dataset(
    dataset_root: str | Path,
    expected_num_classes: int = 4,
) -> dict[str, Any]:
    """Valida integridad de pares imagen/etiqueta y polígonos normalizados en [0, 1]."""
    root = Path(dataset_root)
    errors: list[str] = []
    splits_summary: dict[str, dict[str, int]] = {}

    for split in ("train", "val"):
        img_dir = root / "images" / split
        lbl_dir = root / "labels" / split
        if not img_dir.is_dir() or not lbl_dir.is_dir():
            errors.append(f"Falta directorio requerido para split '{split}': {img_dir} o {lbl_dir}")
            continue

        img_stems = {
            p.stem: p
            for p in img_dir.iterdir()
            if p.is_file() and p.suffix.lower() in VALID_IMAGE_EXTS
        }
        lbl_stems = {
            p.stem: p
            for p in lbl_dir.iterdir()
            if p.is_file() and p.suffix.lower() == ".txt"
        }

        missing_labels = sorted(set(img_stems) - set(lbl_stems))
        orphan_labels = sorted(set(lbl_stems) - set(img_stems))
        if missing_labels:
            errors.append(f"[{split}] Imágenes sin etiqueta (.txt): {missing_labels[:5]}")
        if orphan_labels:
            errors.append(f"[{split}] Etiquetas sin imagen: {orphan_labels[:5]}")

        polygon_count = 0
        for stem, lbl_path in lbl_stems.items():
            for line_num, raw_line in enumerate(
                lbl_path.read_text(encoding="utf-8").splitlines(), start=1
            ):
                stripped = raw_line.strip()
                if not stripped:
                    continue
                tokens = stripped.split()
                if len(tokens) < 7 or (len(tokens) - 1) % 2 != 0:
                    errors.append(
                        f"[{split}] {lbl_path.name}:{line_num} tokens inválidos ({len(tokens)})"
                    )
                    continue
                try:
                    cls_id = int(tokens[0])
                except ValueError:
                    errors.append(f"[{split}] {lbl_path.name}:{line_num} clase no entera '{tokens[0]}'")
                    continue
                if cls_id < 0 or cls_id >= expected_num_classes:
                    errors.append(
                        f"[{split}] {lbl_path.name}:{line_num} clase fuera de rango: {cls_id}"
                    )
                    continue

                coords_ok = True
                for val_str in tokens[1:]:
                    try:
                        val = float(val_str)
                    except ValueError:
                        coords_ok = False
                        break
                    if val < 0.0 or val > 1.0:
                        coords_ok = False
                        break
                if not coords_ok:
                    errors.append(
                        f"[{split}] {lbl_path.name}:{line_num} coordenadas fuera de [0, 1]"
                    )
                    continue
                polygon_count += 1

        splits_summary[split] = {
            "images": len(img_stems),
            "labels": len(lbl_stems),
            "polygons": polygon_count,
        }

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "splits": splits_summary,
    }


def _build_cli() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Conversión COCO → YOLO-seg y validación de dataset para ABYSSAL AI."
    )
    parser.add_argument("--coco-json", type=str, help="Ruta al archivo COCO JSON de TrashCan.")
    parser.add_argument("--images-dir", type=str, help="Directorio de imágenes origen.")
    parser.add_argument("--out-dir", type=str, help="Raíz destino del dataset YOLO.")
    parser.add_argument(
        "--split",
        type=str,
        default="train",
        choices=("train", "val"),
        help="Subcarpeta destino dentro de images/ y labels/.",
    )
    parser.add_argument(
        "--raw-taxonomy",
        action="store_true",
        help="Mantiene las clases originales sin agrupar a las 4 clases operativas.",
    )
    parser.add_argument(
        "--validate",
        type=str,
        help="Valida un dataset YOLO-seg ya generado en la ruta indicada.",
    )
    return parser


def main() -> None:
    parser = _build_cli()
    args = parser.parse_args()

    if args.coco_json:
        if not args.images_dir or not args.out_dir:
            parser.error("--coco-json requiere --images-dir y --out-dir.")
        out_root = Path(args.out_dir)
        summary = convert_trashcan_coco_to_yolo_seg(
            coco_json_path=args.coco_json,
            images_src_dir=args.images_dir,
            out_images_dir=out_root / "images" / args.split,
            out_labels_dir=out_root / "labels" / args.split,
            operational_taxonomy=not args.raw_taxonomy,
        )
        print(json.dumps(summary, indent=2, ensure_ascii=False))

    if args.validate:
        report = validate_yolo_seg_dataset(
            args.validate,
            expected_num_classes=22 if args.raw_taxonomy else 4,
        )
        print(json.dumps(report, indent=2, ensure_ascii=False))
        if not report["valid"]:
            raise SystemExit(1)


if __name__ == "__main__":
    main()
