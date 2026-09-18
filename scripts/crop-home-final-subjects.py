#!/usr/bin/env python3
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/qa-home-final/candidates"
OUT.mkdir(parents=True, exist_ok=True)


def save_crop(im: Image.Image, box, dest: Path):
    x, y, w, h = box
    x = max(0, min(im.width - w, x))
    y = max(0, min(im.height - h, y))
    im.crop((x, y, x + w, y + h)).save(dest, "JPEG", quality=90, optimize=True)
    print(f"crop {dest.name} {w}x{h} @ {x},{y}")


def around(cx, cy, w, h, img_w, img_h, ax=0.32, ay=0.55):
    x = int(cx - w * ax)
    y = int(cy - h * ay)
    x = max(0, min(img_w - w, x))
    y = max(0, min(img_h - h, y))
    return x, y, w, h


jobs = [
    (
        OUT / "velocity-run-01-full.jpg",
        "velocity-run-tight-01.jpg",
        (371, 547, 688, 492),
        (800, 450),
        0.28,
        0.58,
    ),
    (
        OUT / "velocity-run-01-full.jpg",
        "velocity-run-tight-02.jpg",
        (371, 547, 688, 492),
        (640, 360),
        0.3,
        0.6,
    ),
    (
        OUT / "velocity-run-01.jpg",
        "velocity-run-tight-03.jpg",
        (380, 540, 689, 491),
        (720, 405),
        0.26,
        0.56,
    ),
    (
        OUT / "velocity-run-03.jpg",
        "velocity-run-tight-04.jpg",
        (260, 560, 500, 500),
        (720, 405),
        0.22,
        0.62,
    ),
    (
        OUT / "velocity-run-05-full.jpg",
        "velocity-run-tight-05.jpg",
        (250, 540, 500, 480),
        (720, 405),
        0.22,
        0.58,
    ),
    (
        ROOT / "docs/qa-home-art/candidates/swarm-protocol-01-density.jpg",
        "swarm-protocol-tight-01.jpg",
        (980, 430, 980, 430),
        (800, 450),
        0.58,
        0.48,
    ),
    (
        ROOT / "docs/qa-home-art/candidates/swarm-protocol-01-density.jpg",
        "swarm-protocol-tight-02.jpg",
        (1000, 440, 1000, 440),
        (720, 405),
        0.62,
        0.5,
    ),
    (
        ROOT / "docs/qa-home-art/candidates/knockout-circuit-03-signal-jump.jpg",
        "knockout-circuit-tight-01.jpg",
        (220, 480, 360, 480),
        (800, 450),
        0.24,
        0.52,
    ),
]

for src, name, pts, size, ax, ay in jobs:
    if not src.exists():
        print("missing", src)
        continue
    im = Image.open(src).convert("RGB")
    cx = (pts[0] + pts[2]) / 2
    cy = (pts[1] + pts[3]) / 2
    box = around(cx, cy, size[0], size[1], im.width, im.height, ax, ay)
    save_crop(im, box, OUT / name)
