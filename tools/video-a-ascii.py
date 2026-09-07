#!/usr/bin/env python3
"""Muestrea un video a una grilla ASCII+color. El mp4 no entra al sitio.

Origen del recorte por defecto: archive.org/details/JacquesLacan
(Jacques Lacan, La Psychanalyse Réinventée, 2001), plano ~00:00:58.

    python3 tools/video-a-ascii.py tmp/lacan-clase.mp4
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parents[1]
W, H = 392, 140
FPS = 6
PALETTE_N = 12
RAMP_ASCII = " .:-=+*#%@"
RAMP_BLOCK = " ░▒▓█"
RAMP = RAMP_ASCII + RAMP_BLOCK
CONTRAST = 1.95
GAMMA = 0.78


def extraer(src: Path, dest: Path) -> list[Path]:
    dest.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(src),
            "-vf", (
                f"fps={FPS},"
                "scale=660:492:flags=lanczos,"
                "eq=contrast=1.35:gamma=0.9,"
                "unsharp=5:5:1.5:5:5:0.0"
            ),
            str(dest / "f%03d.png"),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return sorted(dest.glob("f*.png"))


def luma(r: float, g: float, b: float) -> float:
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0


def gamma(v: float) -> float:
    return max(0.0, min(1.0, v ** GAMMA))


def glifo(l: float, contrast: float) -> str:
    d = 1.0 - l
    extremo = d > 0.7 or d < 0.22 or contrast > 0.11
    ramp = RAMP_ASCII if extremo else RAMP_BLOCK
    i = min(len(ramp) - 1, int(round(d * (len(ramp) - 1))))
    return ramp[i]


def celdas(img: Image.Image) -> list[tuple[str, tuple[int, int, int]]]:
    from PIL import ImageFilter
    img = ImageOps.autocontrast(img, cutoff=3)
    img = ImageEnhance.Contrast(img).enhance(CONTRAST)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.8, percent=180, threshold=2))
    rgb = img.convert("RGB")
    sw, sh = rgb.size
    cw, ch = sw / W, sh / H
    pix = rgb.load()
    out = []
    for y in range(H):
        y0, y1 = int(y * ch), max(int((y + 1) * ch), int(y * ch) + 1)
        for x in range(W):
            x0, x1 = int(x * cw), max(int((x + 1) * cw), int(x * cw) + 1)
            rs = gs = bs = 0
            mn, mx = 1.0, 0.0
            n = 0
            for yy in range(y0, min(y1, sh)):
                for xx in range(x0, min(x1, sw)):
                    r, g, b = pix[xx, yy]
                    rs += r
                    gs += g
                    bs += b
                    lv = luma(r, g, b)
                    if lv < mn:
                        mn = lv
                    if lv > mx:
                        mx = lv
                    n += 1
            if not n:
                out.append((" ", (0, 0, 0)))
                continue
            r, g, b = rs // n, gs // n, bs // n
            l = gamma(0.7 * luma(r, g, b) + 0.3 * mn)
            out.append((glifo(l, mx - mn), (r, g, b)))
    return out


def kmeans(colors: list[tuple[int, int, int]], k: int, rounds: int = 8) -> list[tuple[int, int, int]]:
    if not colors:
        return [(0, 0, 0)] * k
    step = max(1, len(colors) // k)
    cents = [colors[i * step] for i in range(k)]
    for _ in range(rounds):
        buckets = [[] for _ in range(k)]
        for c in colors:
            i = min(range(k), key=lambda j: dist2(c, cents[j]))
            buckets[i].append(c)
        for i, bucket in enumerate(buckets):
            if bucket:
                cents[i] = (
                    sum(p[0] for p in bucket) // len(bucket),
                    sum(p[1] for p in bucket) // len(bucket),
                    sum(p[2] for p in bucket) // len(bucket),
                )
    seen = []
    for c in cents:
        if c not in seen:
            seen.append(c)
    while len(seen) < k:
        seen.append(seen[-1] if seen else (0, 0, 0))
    return seen[:k]


def dist2(a, b) -> int:
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2


def hex_of(c) -> str:
    return "#{:02x}{:02x}{:02x}".format(*c)


def rle(indices: list[tuple[int, int]]) -> str:
    if not indices:
        return ""
    parts = []
    run_c, run_p = indices[0]
    n = 1
    for c, p in indices[1:]:
        if c == run_c and p == run_p and n < 99:
            n += 1
            continue
        parts.append(f"{n:02d}{run_c:x}{run_p:x}")
        run_c, run_p = c, p
        n = 1
    parts.append(f"{n:02d}{run_c:x}{run_p:x}")
    return "".join(parts)


def hornear(src: Path, dest: Path) -> dict:
    tmp = Path(tempfile.mkdtemp(prefix="ascii-"))
    try:
        paths = extraer(src, tmp)
        frames_cells = [celdas(Image.open(p)) for p in paths]
        samples = [cell[1] for frame in frames_cells for cell in frame]
        # subsample for k-means
        stride = max(1, len(samples) // 4000)
        palette = kmeans(samples[::stride], PALETTE_N)
        ramp_index = {ch: i for i, ch in enumerate(RAMP)}
        packed = []
        for frame in frames_cells:
            idxs = []
            for ch, rgb in frame:
                ci = ramp_index[ch]
                pi = min(range(PALETTE_N), key=lambda j: dist2(rgb, palette[j]))
                idxs.append((ci, pi))
            counts = {}
            for pair in idxs:
                counts[pair] = counts.get(pair, 0) + 1
            top = max(counts.values()) if counts else 0
            if idxs and top / len(idxs) > 0.92:
                continue
            packed.append(rle(idxs))
        if not packed:
            raise SystemExit("ningún fotograma quedó con figura")
        data = {
            "w": W,
            "h": H,
            "fps": FPS,
            "ramp": RAMP,
            "palette": [hex_of(c) for c in palette],
            "origen": "archive.org/details/JacquesLacan",
            "frames": packed,
        }
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
        return data
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "tmp" / "lacan-clase.mp4"
    dest = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "assets" / "clase" / "frames.json"
    if not src.exists():
        sys.exit(f"no está el máster: {src}")
    data = hornear(src, dest)
    size = dest.stat().st_size
    print(f"{dest}  {size} bytes  {len(data['frames'])} frames  {data['w']}x{data['h']}")
    if size > 1400 * 1024:
        sys.exit(f"pasa el techo de 1400 KB: {size}")


if __name__ == "__main__":
    main()
