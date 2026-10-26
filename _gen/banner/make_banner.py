"""X (Twitter) header for @ozolsdev: one screenshot per app, left to right in ship order,
each phone over a soft glow of its app's colour, the site's glass O top-left.

python3 _gen/banner/make_banner.py   -> _gen/banner/ozols-x-banner.png (1500x500)

Layout rules (X header): 1500x500; the profile photo covers the bottom-left, so the
phones start at x~380 and only the logo sits on the left, above the photo. Phones bleed
off the bottom edge so a top/bottom crop on phones never cuts anything that matters.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
W, H = 1500, 500
SS = 2  # supersample

# ship order, with the app colour behind each phone (same colours as the site icon)
APPS = [
    ("remi", "remi-shot.webp", (0, 122, 255)),
    ("rise", "rise-shot-2.webp", (212, 136, 42)),
    ("alarm", "alarm-shot-1.webp", (124, 185, 136)),
    ("scooch", "scooch-shot.webp", (77, 158, 255)),
    ("charactersheet", "charactersheet-shot.webp", (42, 99, 214)),
    ("choru", "choru-shot.webp", (135, 87, 209)),
]

PHONE_H = 392
STEP = 182               # x distance between phone centres (phones overlap a little)
FIRST_CX = 478
TOPS = [92, 70, 50, 50, 70, 92]  # gentle arc, centre phones highest


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def background():
    w, h = W * SS, H * SS
    base = Image.new("RGB", (w, h), (246, 246, 242))
    glow = Image.new("RGB", (w, h), (246, 246, 242))
    d = ImageDraw.Draw(glow)
    for i, (_, _, col) in enumerate(APPS):
        cx = (FIRST_CX + i * STEP) * SS
        r = 230 * SS
        d.ellipse((cx - r, h * .15 - r * .2, cx + r, h * .15 + r * 1.8), fill=lerp(col, (255, 255, 255), .35))
    # the glass O's colours also wash the left side, lightly
    d.ellipse((-260 * SS, -200 * SS, 420 * SS, 420 * SS), fill=lerp((124, 185, 136), (255, 255, 255), .45))
    glow = glow.filter(ImageFilter.GaussianBlur(120 * SS))
    return Image.blend(base, glow, .85).convert("RGBA")


def phone(name, file):
    im = Image.open(ROOT / "assets/apps" / file).convert("RGBA")
    ph = PHONE_H * SS
    return im.resize((round(im.width * ph / im.height), ph), Image.LANCZOS)


def shadow_for(ph):
    a = ph.split()[3].point(lambda v: int(v * .32))
    pad = 60 * SS
    sh = Image.new("L", (ph.width + 2 * pad, ph.height + 2 * pad), 0)
    sh.paste(a, (pad, pad))
    sh = sh.filter(ImageFilter.GaussianBlur(18 * SS))
    out = Image.new("RGBA", sh.size, (12, 14, 28, 0))
    out.putalpha(sh)
    return out, pad


def main():
    img = background()
    phones = [phone(n, f) for n, f, _ in APPS]
    # draw outer phones first so the centre ones sit on top
    order = sorted(range(len(APPS)), key=lambda i: -abs(i - (len(APPS) - 1) / 2))
    for i in order:
        ph = phones[i]
        x = (FIRST_CX + i * STEP) * SS - ph.width // 2
        y = TOPS[i] * SS
        sh, pad = shadow_for(ph)
        img.paste(sh, (x - pad, y - pad + 14 * SS), sh)
        img.paste(ph, (x, y), ph)
    # site icon, top-left, above where X puts the profile photo
    logo = Image.open(ROOT / "_gen/logo/ozols-icon-1024.png").convert("RGBA").resize((150 * SS, 150 * SS), Image.LANCZOS)
    lsh, lpad = shadow_for(logo)
    img.paste(lsh, (70 * SS - lpad, 60 * SS - lpad + 10 * SS), lsh)
    img.paste(logo, (70 * SS, 60 * SS), logo)
    out = img.resize((W, H), Image.LANCZOS).convert("RGB")
    out.save(HERE / "ozols-x-banner.png", optimize=True)
    print("wrote", HERE / "ozols-x-banner.png")


if __name__ == "__main__":
    main()
