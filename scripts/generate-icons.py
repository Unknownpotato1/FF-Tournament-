#!/usr/bin/env python3
"""Generate PWA icons (192x192 and 512x512) for FF Tournament."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = "/home/z/my-project/public"
os.makedirs(OUT, exist_ok=True)

def make_icon(size: int, path: str):
    img = Image.new("RGBA", (size, size), (5, 5, 7, 255))
    draw = ImageDraw.Draw(img)

    # Background gradient (top-left green to bottom-right orange)
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            r = int(0 + (255 - 0) * t)
            g = int(255 + (107 - 255) * t)
            b = int(157 + (26 - 157) * t)
            img.putpixel((x, y), (r, g, b, 255))

    # Dark inner circle
    margin = int(size * 0.1)
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        fill=(12, 12, 18, 240),
    )

    # Draw "FF" text
    try:
        font_size = int(size * 0.4)
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    text = "FF"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2 - bbox[0]
    ty = (size - th) // 2 - bbox[1]
    draw.text((tx, ty), text, font=font, fill=(0, 255, 157, 255))

    # Crosshair accent (orange dot top-right)
    dot_r = int(size * 0.06)
    cx, cy = int(size * 0.78), int(size * 0.22)
    draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=(255, 107, 26, 255))

    img.save(path, "PNG", optimize=True)
    print(f"Saved {path} ({size}x{size})")

make_icon(192, f"{OUT}/icon-192.png")
make_icon(512, f"{OUT}/icon-512.png")

# OG image 1200x630
og = Image.new("RGBA", (1200, 630), (5, 5, 7, 255))
draw = ImageDraw.Draw(og)
for y in range(630):
    for x in range(1200):
        t = (x + y) / (1200 + 630)
        r = int(0 + (255 - 0) * t * 0.5)
        g = int(255 - (255 - 107) * t * 0.3)
        b = int(157 - (157 - 26) * t * 0.3)
        og.putpixel((x, y), (r, g, b, 200))
try:
    big_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 120)
    small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
except Exception:
    big_font = ImageFont.load_default()
    small_font = ImageFont.load_default()
draw.text((80, 220), "FF TOURNAMENT", font=big_font, fill=(0, 255, 157, 255))
draw.text((80, 360), "India's No.1 Free Fire Tournament Platform", font=small_font, fill=(255, 255, 255, 230))
draw.text((80, 430), "Compete. Win. Get Paid.", font=small_font, fill=(255, 107, 26, 255))
og.save(f"{OUT}/og-image.png", "PNG", optimize=True)
print(f"Saved {OUT}/og-image.png")

# Mobile screenshot 1080x1920
ss = Image.new("RGBA", (1080, 1920), (5, 5, 7, 255))
draw = ImageDraw.Draw(ss)
for y in range(1920):
    for x in range(1080):
        t = (x + y) / (1080 + 1920)
        r = int(0 + (255 - 0) * t * 0.3)
        g = int(255 - (255 - 107) * t * 0.3)
        b = int(157 - (157 - 26) * t * 0.3)
        ss.putpixel((x, y), (r, g, b, 180))
try:
    huge_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 180)
    mid_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
except Exception:
    huge_font = ImageFont.load_default()
    mid_font = ImageFont.load_default()
draw.text((120, 800), "FF", font=huge_font, fill=(255, 255, 255, 255))
draw.text((120, 1000), "TOURNAMENT", font=huge_font, fill=(0, 255, 157, 255))
draw.text((120, 1240), "India's No.1 Free Fire", font=mid_font, fill=(255, 255, 255, 230))
draw.text((120, 1320), "Tournament Platform", font=mid_font, fill=(255, 255, 255, 230))
draw.text((120, 1420), "Compete. Win. Get Paid.", font=mid_font, fill=(255, 107, 26, 255))
ss.save(f"{OUT}/screenshot-mobile.png", "PNG", optimize=True)
print(f"Saved {OUT}/screenshot-mobile.png")
