#!/usr/bin/env python3
"""Pixel-art sprite sheet generator for Poke Ball Park.

Every sprite in the game is defined here as ASCII pixel art and written to
PNG sprite sheets in assets/sprites/.  Run:  python3 tools/build_sprites.py

Sheets produced
  body.png    - shared player body animation frames (placeholder colours
                recoloured at runtime per species/team)
  heads.png   - one 16x16 head per Pokemon species (front facing)
  misc.png    - ball, bat, bases, glove, catcher, umpire, icons
  font.png    - 5x7 bitmap font
  sprites.json- metadata (frame names, head indices, anchors, palette ids)
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "sprites")
sys.path.insert(0, os.path.join(ROOT, "tools"))

from sprite_body import BODY_FRAMES, BODY_CELL  # noqa: E402
from sprite_heads import HEADS, HEAD_SIZE  # noqa: E402
from sprite_misc import MISC, FONT  # noqa: E402

# Placeholder colours for the body template.  The runtime looks these exact
# RGB values up and swaps them for species / team colours.
BODY_PALETTE = {
    "S": (255, 0, 255),     # species main colour (arms, legs, hands)
    "s": (200, 0, 200),     # species shade
    "J": (0, 255, 0),       # jersey main
    "j": (0, 180, 0),       # jersey shade / stripe
    "P": (236, 236, 236),   # pants
    "p": (170, 170, 180),   # pants shade
    "G": (170, 100, 40),    # glove
    "g": (110, 60, 20),     # glove shade
    "B": (222, 184, 110),   # bat
    "b": (150, 110, 60),    # bat shade
    "K": (24, 24, 32),      # black / shoes / outline
    "W": (255, 255, 255),   # white (ball)
    "R": (220, 40, 40),     # red (ball stitching)
}

# Default head palette; species override any letter.
HEAD_DEFAULT = {
    "K": (24, 24, 32),
    "W": (255, 255, 255),
    "E": (255, 255, 255),   # eye highlight
    "R": (230, 60, 60),     # cheeks / red bits
    "P": (255, 160, 190),   # pink
    "O": (255, 140, 40),    # orange
    "Y": (250, 220, 70),    # yellow
    "N": (230, 200, 150),   # cream / tan
    "T": (255, 230, 170),   # light tan
    "G": (120, 200, 90),    # green
    "U": (90, 130, 230),    # blue
    "D": (70, 70, 80),      # dark grey
    "L": (200, 200, 210),   # light grey
    "M": (140, 70, 160),    # purple
    "X": (120, 60, 20),     # brown
}


def parse(rows):
    rows = [r for r in rows.strip("\n").split("\n")]
    w = max(len(r) for r in rows)
    rows = [r.ljust(w, ".") for r in rows]
    return rows, w, len(rows)


def blit(img, rows, palette, ox, oy, outline=None):
    """Draw ASCII rows into img at (ox,oy).  Unknown letters are errors."""
    px = img.load()
    h = len(rows)
    w = len(rows[0])
    for y in range(h):
        for x in range(w):
            c = rows[y][x]
            if c == ".":
                continue
            if c not in palette:
                raise SystemExit(f"unknown palette letter {c!r} in sprite")
            px[ox + x, oy + y] = palette[c] + (255,)
    if outline:
        # Auto-outline: transparent pixels touching a filled one become outline.
        for y in range(-1, h + 1):
            for x in range(-1, w + 1):
                tx, ty = ox + x, oy + y
                if not (0 <= tx < img.width and 0 <= ty < img.height):
                    continue
                if px[tx, ty][3] != 0:
                    continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    sx, sy = x + dx, y + dy
                    if 0 <= sx < w and 0 <= sy < h and rows[sy][sx] != ".":
                        px[tx, ty] = outline + (255,)
                        break


def build_body():
    names = list(BODY_FRAMES.keys())
    cw, ch = BODY_CELL
    img = Image.new("RGBA", (cw * len(names), ch), (0, 0, 0, 0))
    meta = {}
    for i, name in enumerate(names):
        fr = BODY_FRAMES[name]
        rows, w, h = parse(fr["art"])
        if w > cw - 2 or h > ch - 2:
            raise SystemExit(f"body frame {name} is {w}x{h}, exceeds cell {cw}x{ch}")
        # Centre horizontally, align feet to the cell bottom (1px spare for the outline).
        ox = (cw - w) // 2
        oy = ch - h - 1
        blit(img, rows, BODY_PALETTE, i * cw + ox, oy, outline=BODY_PALETTE["K"])
        hx, hy = fr["head"]  # head centre x / head bottom y, in art coords
        meta[name] = {
            "index": i,
            "headX": ox + hx,          # x of head centre within cell
            "headY": oy + hy,          # y where the head's bottom row sits
            "flipHead": fr.get("flipHead", False),
            "backHead": fr.get("backHead", False),
        }
    img.save(os.path.join(OUT, "body.png"))
    return {"cell": [cw, ch], "frames": meta}


def build_heads():
    n = len(HEADS)
    cols = 9
    rows_n = (n + cols - 1) // cols
    img = Image.new("RGBA", (cols * HEAD_SIZE, rows_n * HEAD_SIZE), (0, 0, 0, 0))
    meta = {}
    for i, (name, spec) in enumerate(HEADS.items()):
        rows, w, h = parse(spec["art"])
        if w != HEAD_SIZE or h != HEAD_SIZE:
            raise SystemExit(f"head {name} is {w}x{h}, must be {HEAD_SIZE}x{HEAD_SIZE}")
        pal = dict(HEAD_DEFAULT)
        pal.update({k: tuple(v) for k, v in spec["palette"].items()})
        pal["A"] = tuple(spec["palette"]["A"])
        cx, cy = (i % cols) * HEAD_SIZE, (i // cols) * HEAD_SIZE
        blit(img, rows, pal, cx, cy)
        meta[name] = {
            "index": i,
            "primary": list(pal["A"]),
            "shade": list(pal.get("a", tuple(max(0, c - 60) for c in pal["A"]))),
        }
    img.save(os.path.join(OUT, "heads.png"))
    return {"size": HEAD_SIZE, "cols": cols, "heads": meta}


def build_misc():
    # Pack sprites left-to-right in rows by name; simple shelf packing.
    items = []
    for name, spec in MISC.items():
        rows, w, h = parse(spec["art"])
        items.append((name, rows, w, h, spec))
    sheet_w = 256
    x = y = 0
    shelf_h = 0
    placed = {}
    for name, rows, w, h, spec in items:
        if x + w + 2 > sheet_w:
            x = 0
            y += shelf_h + 1
            shelf_h = 0
        placed[name] = (x + 1, y + 1, w, h)
        x += w + 2
        shelf_h = max(shelf_h, h + 2)
    sheet_h = y + shelf_h + 1
    img = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))
    meta = {}
    for name, rows, w, h, spec in items:
        px, py, _, _ = placed[name]
        pal = dict(HEAD_DEFAULT)
        pal.update(BODY_PALETTE)
        pal.update({k: tuple(v) for k, v in spec.get("palette", {}).items()})
        blit(img, rows, pal, px, py, outline=(BODY_PALETTE["K"] if spec.get("outline") else None))
        ox, oy = (px - 1, py - 1) if spec.get("outline") else (px, py)
        ow, oh = (w + 2, h + 2) if spec.get("outline") else (w, h)
        meta[name] = {"x": ox, "y": oy, "w": ow, "h": oh}
    img.save(os.path.join(OUT, "misc.png"))
    return meta


def build_font():
    chars = list(FONT.keys())
    gw, gh = 5, 7
    img = Image.new("RGBA", (len(chars) * (gw + 1), gh), (0, 0, 0, 0))
    order = ""
    for i, ch in enumerate(chars):
        rows, w, h = parse(FONT[ch])
        if w != gw or h != gh:
            raise SystemExit(f"font glyph {ch!r} is {w}x{h}")
        blit(img, rows, {"#": (255, 255, 255)}, i * (gw + 1), 0)
        order += ch
    img.save(os.path.join(OUT, "font.png"))
    return {"chars": order, "w": gw, "h": gh, "stride": gw + 1}


def main():
    os.makedirs(OUT, exist_ok=True)
    meta = {
        "body": build_body(),
        "heads": build_heads(),
        "misc": build_misc(),
        "font": build_font(),
        "bodyPalette": {k: list(v) for k, v in BODY_PALETTE.items()},
    }
    with open(os.path.join(OUT, "sprites.json"), "w") as f:
        json.dump(meta, f, indent=1)
    print(f"wrote {len(BODY_FRAMES)} body frames, {len(HEADS)} heads, {len(MISC)} misc sprites, {len(FONT)} glyphs")


if __name__ == "__main__":
    main()
