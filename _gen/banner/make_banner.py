"""X (Twitter) header for @ozolsdev: one screenshot per app, left to right in ship order,
each phone over a soft glow of its app's colour, the site's glass O top-left.

python3 _gen/banner/make_banner.py   -> _gen/banner/ozols-x-banner.png (1500x500)

Layout rules (X header): 1500x500; the profile photo covers the bottom-left, so the
phones start at x~380 and only the logo sits on the left, above the photo. Phones bleed
off the bottom edge so a top/bottom crop on phones never cuts anything that matters.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
W, H = 1500, 500
SS = 2  # supersample

# ship order, with the app colour behind each phone (same colours as the site icon)
APPS = [  # (slug, display name, screenshot relative to the repo root, colour)
    ("remi", "Remi", "assets/apps/remi-shot.webp", (0, 122, 255)),
    ("rise", "Rise", "_gen/banner/rise-home.webp", (212, 136, 42)),
    ("alarm", "Alarm Clock Planner", "assets/apps/alarm-shot-1.webp", (124, 185, 136)),
    ("scooch", "Scooch", "assets/apps/scooch-shot.webp", (77, 158, 255)),
    ("charactersheet", "CharacterSheet", "assets/apps/charactersheet-shot.webp", (42, 99, 214)),
    ("choru", "Choru", "assets/apps/choru-shot.webp", (135, 87, 209)),
]
FONT = "/System/Library/Fonts/HelveticaNeue.ttc"  # index 1 = Bold
TITLE = ["I make apps", "that I use", "myself"]  # Emil's words, 2026-10-26

PHONE_H = 392
STEP = 182               # x distance between phone centres (phones overlap a little)
FIRST_CX = 478
PHONE_TOP = 64  # one straight row


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def background():
    w, h = W * SS, H * SS
    base = Image.new("RGB", (w, h), (246, 246, 242))
    glow = Image.new("RGB", (w, h), (246, 246, 242))
    d = ImageDraw.Draw(glow)
    for i, (_, _, _, col) in enumerate(APPS):
        cx = (FIRST_CX + i * STEP) * SS
        r = 230 * SS
        d.ellipse((cx - r, h * .15 - r * .2, cx + r, h * .15 + r * 1.8), fill=lerp(col, (255, 255, 255), .35))
    # the glass O's colours also wash the left side, lightly
    d.ellipse((-260 * SS, -200 * SS, 420 * SS, 420 * SS), fill=lerp((124, 185, 136), (255, 255, 255), .45))
    glow = glow.filter(ImageFilter.GaussianBlur(120 * SS))
    return Image.blend(base, glow, .85).convert("RGBA")


def phone(file):
    im = Image.open(ROOT / file).convert("RGBA")
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


def badge(img, slug, name, cx, bottom):
    """Frosted card, app icon above the app name, sitting over the phone's tab bar."""
    font = ImageFont.truetype(FONT, 13 * SS, index=1)
    icon_px = 30 * SS
    w = 124 * SS  # same card for every app; a long name wraps onto a second line
    lines, line = [], ""
    for word in name.split():
        trial = (line + " " + word).strip()
        if font.getbbox(trial)[2] > w - 20 * SS and line:
            lines.append(line); line = word
        else:
            line = trial
    lines.append(line)
    line_h = 16 * SS
    h = icon_px + 18 * SS + 2 * line_h
    x0, y0 = int(cx - w / 2), int(bottom - h)
    box = (x0, y0, x0 + w, y0 + h)
    r = 15 * SS
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255)
    # shadow
    sh = Image.new("L", (w + 80 * SS, h + 80 * SS), 0)
    sh.paste(mask.point(lambda v: int(v * .28)), (40 * SS, 40 * SS))
    sh = sh.filter(ImageFilter.GaussianBlur(14 * SS))
    shadow = Image.new("RGBA", sh.size, (10, 12, 24, 0)); shadow.putalpha(sh)
    img.paste(shadow, (x0 - 40 * SS, y0 - 40 * SS + 8 * SS), shadow)
    # frosted glass: blur what is underneath, lighten it
    under = img.crop(box).filter(ImageFilter.GaussianBlur(16 * SS))
    frost = Image.blend(under, Image.new("RGBA", under.size, (255, 255, 255, 255)), .72)
    img.paste(frost, (x0, y0), mask)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(box, r, outline=(255, 255, 255, 230), width=2 * SS)
    icon = Image.open(ROOT / "assets/apps" / f"{slug}-icon.png").convert("RGBA").resize((icon_px, icon_px), Image.LANCZOS)
    # every icon gets the iOS corner radius, whether or not its PNG is already rounded
    im = Image.new("L", (icon_px * 4, icon_px * 4), 0)
    ImageDraw.Draw(im).rounded_rectangle((0, 0, icon_px * 4 - 1, icon_px * 4 - 1), int(icon_px * 4 * .225), fill=255)
    im = im.resize((icon_px, icon_px), Image.LANCZOS)
    from PIL import ImageChops
    icon.putalpha(ImageChops.multiply(icon.split()[3], im))
    img.paste(icon, (int(cx - icon_px / 2), y0 + 8 * SS), icon)
    text_top = y0 + 8 * SS + icon_px + 5 * SS + (2 - len(lines)) * line_h / 2
    for k, ln in enumerate(lines):
        d.text((cx, text_top + k * line_h), ln, font=font, fill=(22, 22, 26, 255), anchor="mt")


def main():
    img = background()
    phones = [phone(f) for _, _, f, _ in APPS]
    # draw outer phones first so the centre ones sit on top
    order = sorted(range(len(APPS)), key=lambda i: -abs(i - (len(APPS) - 1) / 2))
    for i in order:
        ph = phones[i]
        x = (FIRST_CX + i * STEP) * SS - ph.width // 2
        y = PHONE_TOP * SS
        sh, pad = shadow_for(ph)
        img.paste(sh, (x - pad, y - pad + 14 * SS), sh)
        img.paste(ph, (x, y), ph)
    # icon + name badge over each phone's tab bar, drawn last so no neighbour covers one
    for i, (slug, name, _, _) in enumerate(APPS):
        ph = phones[i]
        cx = (FIRST_CX + i * STEP) * SS
        badge(img, slug, name, cx, PHONE_TOP * SS + ph.height - 12 * SS)
    # site icon and title on the left, above where X puts the profile photo
    lx, ly, lsz = 56, 58, 64
    logo = Image.open(ROOT / "_gen/logo/ozols-icon-1024.png").convert("RGBA").resize((lsz * SS, lsz * SS), Image.LANCZOS)
    lsh, lpad = shadow_for(logo)
    img.paste(lsh, (lx * SS - lpad, ly * SS - lpad + 6 * SS), lsh)
    img.paste(logo, (lx * SS, ly * SS), logo)
    title = ImageFont.truetype(FONT, 40 * SS, index=1)
    d = ImageDraw.Draw(img)
    for k, ln in enumerate(TITLE):
        d.text((lx * SS, (ly + lsz + 22 + k * 46) * SS), ln, font=title, fill=(22, 22, 26, 255))
    out = img.resize((W, H), Image.LANCZOS).convert("RGB")
    out.save(HERE / "ozols-x-banner.png", optimize=True)
    print("wrote", HERE / "ozols-x-banner.png")


if __name__ == "__main__":
    main()
