"""Inferencia en video con YOLO11-seg y telemetría táctica para ROV submarino."""

from __future__ import annotations

import argparse
import json
import math
import time
from pathlib import Path
from typing import Any, Sequence

import cv2
import numpy as np

CLASS_NAMES: dict[int, str] = {
    0: "debris_flexible_polymer",
    1: "debris_rigid_other",
    2: "protected_marine_life",
    3: "rov_hardware",
}

# Paleta BGR sincronizada con el HUD web de ABYSSAL AI
CLASS_COLORS_BGR: dict[int, tuple[int, int, int]] = {
    0: (255, 240, 0),    # #00F0FF Cian neón (polímeros / plásticos / redes)
    1: (3, 183, 255),    # #FFB703 Ámbar (metales / residuos rígidos)
    2: (157, 255, 0),    # #00FF9D Esmeralda (fauna y corales protegidos)
    3: (246, 92, 139),   # #8B5CF6 Violeta (hardware del ROV)
}

DEBRIS_CLASSES: set[int] = {0, 1}
BIO_CLASS: int = 2


def _to_polygon_array(poly: Sequence[Sequence[float]] | np.ndarray) -> np.ndarray:
    """Normaliza un polígono a arreglo NumPy float32 con forma (N, 2)."""
    arr = np.asarray(poly, dtype=np.float32)
    if arr.ndim == 3:
        arr = arr.reshape(-1, 2)
    return arr


def _polygon_centroid(pts: np.ndarray) -> tuple[float, float]:
    """Calcula el centroide de un polígono mediante momentos de OpenCV."""
    if len(pts) < 3:
        return (float(pts[:, 0].mean()), float(pts[:, 1].mean()))
    moments = cv2.moments(pts.reshape(-1, 1, 2))
    if abs(moments["m00"]) > 1e-6:
        return (float(moments["m10"] / moments["m00"]), float(moments["m01"] / moments["m00"]))
    return (float(pts[:, 0].mean()), float(pts[:, 1].mean()))


def _min_polygon_distance(pts_a: np.ndarray, pts_b: np.ndarray) -> float:
    """Distancia euclidiana mínima entre vértices de dos polígonos en píxeles."""
    if len(pts_a) == 0 or len(pts_b) == 0:
        return float("inf")
    diff = pts_a[:, None, :] - pts_b[None, :, :]
    dists = np.hypot(diff[..., 0], diff[..., 1])
    return float(dists.min())


def compute_mask_telemetry(
    polygons: Sequence[Sequence[Sequence[float]] | np.ndarray],
    class_ids: Sequence[int],
    confidences: Sequence[float],
    frame_shape: tuple[int, ...],
    bio_margin_px: float = 45.0,
) -> dict[str, Any]:
    """Calcula telemetría por cuadro desde máscaras de instancia y distancia biológica."""
    height, width = int(frame_shape[0]), int(frame_shape[1])
    frame_area = float(max(1, height * width))

    instances: list[dict[str, Any]] = []
    debris_polys: list[np.ndarray] = []
    bio_polys: list[np.ndarray] = []
    debris_area_total = 0.0
    protected_area_total = 0.0
    bbox_wastes: list[float] = []
    primary_target: dict[str, Any] | None = None

    for idx, (raw_poly, cls_id, conf) in enumerate(zip(polygons, class_ids, confidences)):
        pts = _to_polygon_array(raw_poly)
        if len(pts) < 3:
            continue

        mask_area = float(cv2.contourArea(pts.reshape(-1, 1, 2)))
        cx, cy = _polygon_centroid(pts)
        x_min, y_min = pts[:, 0].min(), pts[:, 1].min()
        x_max, y_max = pts[:, 0].max(), pts[:, 1].max()
        bbox_area = float(max(1.0, (x_max - x_min) * (y_max - y_min)))
        bbox_waste_pct = max(0.0, min(100.0, (1.0 - (mask_area / bbox_area)) * 100.0))
        coverage_pct = (mask_area / frame_area) * 100.0

        cls_int = int(cls_id)
        conf_f = float(conf)
        instance_info = {
            "id": idx,
            "class_id": cls_int,
            "class_name": CLASS_NAMES.get(cls_int, f"class_{cls_int}"),
            "confidence": round(conf_f, 4),
            "area_px": round(mask_area, 1),
            "coverage_pct": round(coverage_pct, 3),
            "bbox_waste_pct": round(bbox_waste_pct, 2),
            "centroid": [round(cx, 1), round(cy, 1)],
            "bbox": [round(float(x_min), 1), round(float(y_min), 1), round(float(x_max), 1), round(float(y_max), 1)],
        }
        instances.append(instance_info)

        if cls_int in DEBRIS_CLASSES:
            debris_polys.append(pts)
            debris_area_total += mask_area
            bbox_wastes.append(bbox_waste_pct)
            if primary_target is None or (mask_area * conf_f) > (
                primary_target["area_px"] * primary_target["confidence"]
            ):
                primary_target = instance_info
        elif cls_int == BIO_CLASS:
            bio_polys.append(pts)
            protected_area_total += mask_area

    min_bio_dist: float | None = None
    if debris_polys and bio_polys:
        best_dist = float("inf")
        for d_pts in debris_polys:
            for b_pts in bio_polys:
                dist = _min_polygon_distance(d_pts, b_pts)
                if dist < best_dist:
                    best_dist = dist
        if math.isfinite(best_dist):
            min_bio_dist = round(best_dist, 1)

    if not debris_polys:
        grasp_status = "SCANNING"
    elif min_bio_dist is not None and min_bio_dist < bio_margin_px:
        grasp_status = "BIO_EXCLUSION_HOLD"
    else:
        grasp_status = "SAFE_GRASP"

    return {
        "instance_count": len(instances),
        "debris_count": len(debris_polys),
        "protected_count": len(bio_polys),
        "debris_coverage_pct": round((debris_area_total / frame_area) * 100.0, 3),
        "protected_coverage_pct": round((protected_area_total / frame_area) * 100.0, 3),
        "avg_bbox_waste_pct": round(float(np.mean(bbox_wastes)) if bbox_wastes else 0.0, 2),
        "min_bio_distance_px": min_bio_dist,
        "bio_margin_px": bio_margin_px,
        "grasp_status": grasp_status,
        "primary_target": primary_target,
        "instances": instances,
    }


def _draw_crosshair(img: np.ndarray, cx: int, cy: int, color: tuple[int, int, int]) -> None:
    """Dibuja una retícula de agarre ROV sobre el centroide del residuo objetivo."""
    cv2.circle(img, (cx, cy), 14, color, 1, cv2.LINE_AA)
    cv2.circle(img, (cx, cy), 3, color, -1, cv2.LINE_AA)
    cv2.line(img, (cx - 22, cy), (cx - 7, cy), color, 1, cv2.LINE_AA)
    cv2.line(img, (cx + 7, cy), (cx + 22, cy), color, 1, cv2.LINE_AA)
    cv2.line(img, (cx, cy - 22), (cx, cy - 7), color, 1, cv2.LINE_AA)
    cv2.line(img, (cx, cy + 7), (cx, cy + 22), color, 1, cv2.LINE_AA)


def render_rov_hud(
    frame: np.ndarray,
    polygons: Sequence[Sequence[Sequence[float]] | np.ndarray],
    class_ids: Sequence[int],
    confidences: Sequence[float],
    telemetry: dict[str, Any],
    fps: float,
    mode: str = "hud",
) -> np.ndarray:
    """Renderiza máscaras poligonales y HUD táctico ROV sobre un frame OpenCV."""
    if mode == "raw":
        return frame.copy()

    canvas = frame.copy()
    overlay = frame.copy()

    for raw_poly, cls_id in zip(polygons, class_ids):
        pts = _to_polygon_array(raw_poly).astype(np.int32)
        if len(pts) < 3:
            continue
        color = CLASS_COLORS_BGR.get(int(cls_id), (220, 220, 220))
        cv2.fillPoly(overlay, [pts], color)

    cv2.addWeighted(overlay, 0.34, canvas, 0.66, 0.0, dst=canvas)

    for idx, (raw_poly, cls_id, conf) in enumerate(zip(polygons, class_ids, confidences)):
        pts = _to_polygon_array(raw_poly).astype(np.int32)
        if len(pts) < 3:
            continue
        cls_int = int(cls_id)
        color = CLASS_COLORS_BGR.get(cls_int, (220, 220, 220))
        cv2.polylines(canvas, [pts], isClosed=True, color=color, thickness=2, lineType=cv2.LINE_AA)

        if cls_int == BIO_CLASS:
            x, y, bw, bh = cv2.boundingRect(pts)
            cv2.rectangle(
                canvas,
                (max(0, x - 6), max(0, y - 6)),
                (x + bw + 6, y + bh + 6),
                (157, 255, 0),
                1,
                cv2.LINE_AA,
            )

        if mode == "hud":
            anchor = pts[np.argmin(pts[:, 1])]
            label = f"{CLASS_NAMES.get(cls_int, cls_int)} {conf * 100:.0f}%"
            tx, ty = int(anchor[0]), max(28, int(anchor[1]) - 8)
            cv2.putText(
                canvas,
                label,
                (tx, ty),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.42,
                color,
                1,
                cv2.LINE_AA,
            )

    if mode != "hud":
        return canvas

    target = telemetry.get("primary_target")
    status = telemetry.get("grasp_status", "SCANNING")
    if target is not None:
        tcx, tcy = int(target["centroid"][0]), int(target["centroid"][1])
        reticle_color = (60, 90, 255) if status == "BIO_EXCLUSION_HOLD" else (255, 240, 0)
        _draw_crosshair(canvas, tcx, tcy, reticle_color)

    h, w = canvas.shape[:2]
    hud_bar = canvas.copy()
    cv2.rectangle(hud_bar, (0, 0), (w, 34), (10, 14, 24), -1)
    cv2.rectangle(hud_bar, (0, h - 30), (w, h), (10, 14, 24), -1)
    cv2.addWeighted(hud_bar, 0.72, canvas, 0.28, 0.0, dst=canvas)

    status_color = (
        (60, 90, 255)
        if status == "BIO_EXCLUSION_HOLD"
        else (157, 255, 0)
        if status == "SAFE_GRASP"
        else (220, 220, 220)
    )
    cv2.putText(
        canvas,
        f"ABYSSAL // YOLO11-SEG   FPS: {fps:.1f}",
        (12, 22),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (255, 240, 0),
        1,
        cv2.LINE_AA,
    )
    cv2.putText(
        canvas,
        status,
        (max(240, w - 210), 22),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.52,
        status_color,
        2,
        cv2.LINE_AA,
    )

    bio_dist = telemetry.get("min_bio_distance_px")
    dist_txt = f"{bio_dist:.1f}px" if bio_dist is not None else "CLEAR"
    footer = (
        f"DEBRIS: {telemetry['debris_coverage_pct']:.2f}%  |  "
        f"BBOX WASTE AVOIDED: {telemetry['avg_bbox_waste_pct']:.1f}%  |  "
        f"BIO-DIST: {dist_txt}"
    )
    cv2.putText(
        canvas,
        footer,
        (12, h - 10),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.44,
        (225, 235, 245),
        1,
        cv2.LINE_AA,
    )
    return canvas


def process_video_with_yolo(
    weights_path: str | Path,
    input_video: str | Path,
    output_segmented: str | Path,
    output_raw: str | Path | None = None,
    output_telemetry_json: str | Path | None = None,
    conf: float = 0.35,
    imgsz: int = 640,
    max_frames: int | None = None,
    bio_margin_px: float = 45.0,
) -> dict[str, Any]:
    """Ejecuta segmentación de instancias frame a frame con YOLO y exporta video + telemetría."""
    try:
        from ultralytics import YOLO
    except ImportError as exc:
        raise RuntimeError(
            "Ultralytics no está instalado en este entorno local. "
            "Ejecuta el notebook en Google Colab o instala requirements.txt para inferencia real."
        ) from exc

    cap = cv2.VideoCapture(str(input_video))
    if not cap.isOpened():
        raise FileNotFoundError(f"No se pudo abrir el video de entrada: {input_video}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")

    seg_path = Path(output_segmented)
    seg_path.parent.mkdir(parents=True, exist_ok=True)
    seg_writer = cv2.VideoWriter(str(seg_path), fourcc, fps, (width, height))

    raw_writer = None
    if output_raw is not None:
        raw_path = Path(output_raw)
        raw_path.parent.mkdir(parents=True, exist_ok=True)
        raw_writer = cv2.VideoWriter(str(raw_path), fourcc, fps, (width, height))

    model = YOLO(str(weights_path))
    frames_telemetry: list[dict[str, Any]] = []
    frame_idx = 0

    try:
        while True:
            ok, frame = cap.read()
            if not ok or (max_frames is not None and frame_idx >= max_frames):
                break

            t0 = time.perf_counter()
            preds = model.predict(frame, conf=conf, imgsz=imgsz, verbose=False)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            inst_fps = 1000.0 / max(1e-3, elapsed_ms)

            result = preds[0]
            polygons: list[np.ndarray] = []
            class_ids: list[int] = []
            confs: list[float] = []

            if result.masks is not None and result.boxes is not None:
                polygons = [np.asarray(p, dtype=np.float32) for p in result.masks.xy]
                class_ids = [int(c) for c in result.boxes.cls.tolist()]
                confs = [float(s) for s in result.boxes.conf.tolist()]

            telemetry = compute_mask_telemetry(
                polygons=polygons,
                class_ids=class_ids,
                confidences=confs,
                frame_shape=frame.shape,
                bio_margin_px=bio_margin_px,
            )
            telemetry["frame_idx"] = frame_idx
            telemetry["timestamp_s"] = round(frame_idx / fps, 3)
            telemetry["inference_ms"] = round(elapsed_ms, 2)
            telemetry["fps"] = round(inst_fps, 1)
            frames_telemetry.append(telemetry)

            hud_frame = render_rov_hud(
                frame=frame,
                polygons=polygons,
                class_ids=class_ids,
                confidences=confs,
                telemetry=telemetry,
                fps=inst_fps,
                mode="hud",
            )
            seg_writer.write(hud_frame)
            if raw_writer is not None:
                raw_writer.write(frame)

            frame_idx += 1
    finally:
        cap.release()
        seg_writer.release()
        if raw_writer is not None:
            raw_writer.release()

    summary = {
        "source_video": str(input_video),
        "weights": str(weights_path),
        "fps": round(fps, 2),
        "resolution": [width, height],
        "total_frames": frame_idx,
        "frames": frames_telemetry,
    }
    if output_telemetry_json is not None:
        json_path = Path(output_telemetry_json)
        json_path.parent.mkdir(parents=True, exist_ok=True)
        json_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    return summary


def _build_underwater_backdrop(width: int, height: int, frame_idx: int, rng: np.random.Generator) -> np.ndarray:
    """Genera un fondo submarino sintético animado para verificación local sin GPU."""
    y_grad = np.linspace(0.0, 1.0, height, dtype=np.float32)[:, None]
    r = (8 + 10 * (1.0 - y_grad)).astype(np.uint8)
    g = (32 + 44 * (1.0 - y_grad)).astype(np.uint8)
    b = (52 + 78 * (1.0 - y_grad)).astype(np.uint8)
    frame = np.repeat(np.dstack([b, g, r]), width, axis=1)

    for beam in range(3):
        shift = int(math.sin(frame_idx * 0.05 + beam * 1.4) * 35)
        x0 = 130 + beam * 185 + shift
        pts = np.array([[x0 - 40, 0], [x0 + 40, 0], [x0 + 95, height], [x0 - 15, height]], dtype=np.int32)
        beam_layer = frame.copy()
        cv2.fillPoly(beam_layer, [pts], (125, 95, 35))
        cv2.addWeighted(beam_layer, 0.14, frame, 0.86, 0.0, dst=frame)

    for _ in range(35):
        px = int(rng.integers(0, width))
        py = int((rng.integers(0, height) + frame_idx * 1.5) % height)
        cv2.circle(frame, (px, py), 1, (190, 210, 200), -1)

    seabed_pts = np.array(
        [[0, height - 48], [180, height - 56], [420, height - 42], [width, height - 52], [width, height], [0, height]],
        dtype=np.int32,
    )
    cv2.fillPoly(frame, [seabed_pts], (38, 46, 36))
    return frame


def generate_synthetic_verification_demo(
    output_dir: str | Path,
    num_frames: int = 90,
    fps: int = 30,
) -> dict[str, Any]:
    """Genera un clip submarino sintético para validar el pipeline de máscaras y HUD en local."""
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    width, height = 640, 360
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")

    raw_path = out / "synthetic_raw.mp4"
    seg_path = out / "synthetic_segmented.mp4"
    json_path = out / "synthetic_telemetry.json"

    raw_writer = cv2.VideoWriter(str(raw_path), fourcc, float(fps), (width, height))
    seg_writer = cv2.VideoWriter(str(seg_path), fourcc, float(fps), (width, height))

    frames_telemetry: list[dict[str, Any]] = []
    observed_statuses: set[str] = set()

    try:
        for i in range(num_frames):
            rng = np.random.default_rng(seed=100 + i // 3)
            frame = _build_underwater_backdrop(width, height, i, rng)

            # Botella / red plástica ondulante en diagonal (demuestra ahorro frente a bounding box)
            bob_y = math.sin(i * 0.09) * 12.0
            bottle_poly = np.array(
                [
                    [235, 130 + bob_y],
                    [265, 118 + bob_y],
                    [345, 165 + bob_y],
                    [362, 195 + bob_y],
                    [332, 218 + bob_y],
                    [248, 162 + bob_y],
                ],
                dtype=np.float32,
            )
            cv2.fillPoly(frame, [bottle_poly.astype(np.int32)], (215, 225, 210))
            cv2.polylines(frame, [bottle_poly.astype(np.int32)], True, (245, 250, 240), 1)

            # Residuo rígido pequeño en el fondo
            can_poly = np.array([[470, 285], [512, 282], [518, 312], [468, 314]], dtype=np.float32)
            cv2.fillPoly(frame, [can_poly.astype(np.int32)], (95, 115, 145))

            # Pez nadando: lejos al inicio/final (SAFE_GRASP) y cerca en mitad (BIO_EXCLUSION_HOLD)
            fish_x = 90.0 + (i / max(1, num_frames - 1)) * 450.0
            fish_y = 175.0 + math.sin(i * 0.14) * 16.0
            fish_poly = np.array(
                [
                    [fish_x - 32, fish_y - 12],
                    [fish_x - 14, fish_y],
                    [fish_x + 14, fish_y - 16],
                    [fish_x + 36, fish_y],
                    [fish_x + 14, fish_y + 16],
                    [fish_x - 14, fish_y],
                    [fish_x - 32, fish_y + 12],
                ],
                dtype=np.float32,
            )
            cv2.fillPoly(frame, [fish_poly.astype(np.int32)], (70, 175, 220))

            polygons = [bottle_poly, can_poly, fish_poly]
            class_ids = [0, 1, 2]
            confs = [0.92, 0.87, 0.94]

            telemetry = compute_mask_telemetry(
                polygons=polygons,
                class_ids=class_ids,
                confidences=confs,
                frame_shape=frame.shape,
                bio_margin_px=45.0,
            )
            telemetry["frame_idx"] = i
            telemetry["timestamp_s"] = round(i / float(fps), 3)
            telemetry["fps"] = 34.2
            observed_statuses.add(telemetry["grasp_status"])
            frames_telemetry.append(telemetry)

            hud_frame = render_rov_hud(
                frame=frame,
                polygons=polygons,
                class_ids=class_ids,
                confidences=confs,
                telemetry=telemetry,
                fps=34.2,
                mode="hud",
            )
            raw_writer.write(frame)
            seg_writer.write(hud_frame)
    finally:
        raw_writer.release()
        seg_writer.release()

    summary = {
        "mode": "synthetic_verification",
        "fps": fps,
        "resolution": [width, height],
        "total_frames": num_frames,
        "observed_statuses": sorted(observed_statuses),
        "frames": frames_telemetry,
    }
    json_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return summary


def _build_cli() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Inferencia en video YOLO11-seg y generación de demo sintética para ABYSSAL AI."
    )
    parser.add_argument("--weights", type=str, help="Ruta a pesos best.pt entrenados en Colab.")
    parser.add_argument("--source", type=str, help="Video de entrada (.mp4) o índice de cámara.")
    parser.add_argument("--out-seg", type=str, default="rov_segmented.mp4", help="Video segmentado salida.")
    parser.add_argument("--out-raw", type=str, default=None, help="Copia opcional raw sincronizada.")
    parser.add_argument("--out-json", type=str, default="telemetry_frames.json", help="JSON de telemetría.")
    parser.add_argument("--conf", type=float, default=0.35, help="Umbral de confianza.")
    parser.add_argument("--imgsz", type=int, default=640, help="Resolución de inferencia.")
    parser.add_argument("--max-frames", type=int, default=None, help="Máximo de frames a procesar.")
    parser.add_argument(
        "--synthetic-test",
        type=str,
        default=None,
        help="Genera un demo sintético en el directorio indicado para verificar pipeline local.",
    )
    return parser


def main() -> None:
    parser = _build_cli()
    args = parser.parse_args()

    if args.synthetic_test:
        result = generate_synthetic_verification_demo(args.synthetic_test)
        print(
            json.dumps(
                {
                    "total_frames": result["total_frames"],
                    "observed_statuses": result["observed_statuses"],
                    "output_dir": args.synthetic_test,
                },
                indent=2,
            )
        )
        return

    if not args.weights or not args.source:
        parser.error("Debes pasar --weights y --source, o bien usar --synthetic-test <dir>.")

    summary = process_video_with_yolo(
        weights_path=args.weights,
        input_video=args.source,
        output_segmented=args.out_seg,
        output_raw=args.out_raw,
        output_telemetry_json=args.out_json,
        conf=args.conf,
        imgsz=args.imgsz,
        max_frames=args.max_frames,
    )
    print(f"Procesados {summary['total_frames']} frames -> {args.out_seg}")


if __name__ == "__main__":
    main()
