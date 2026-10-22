"""ozols.dev liquid-glass logo variants, drawn with Pillow at 1024 px (no fonts: glyphs are geometric).

python3 _gen/logo/make_logo.py   (see __main__ for options)
"""
import sys, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops

S = 1024
OUT = Path(".")


def squircle_mask(size, n=5.0, pad=0):
    m = Image.new("L", (size, size), 0)
    px = m.load()
    r = size / 2 - pad
    c = size / 2
    for y in range(size):
        dy = abs((y + 0.5 - c) / r)
        if dy >= 1:
            continue
        span = (1 - dy ** n) ** (1 / n) * r
        x0, x1 = int(round(c - span)), int(round(c + span))
        for x in range(max(0, x0), min(size, x1)):
            px[x, y] = 255
    return m


def circle_mask(size, pad=0):
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).ellipse((pad, pad, size - pad, size - pad), fill=255)
    return m


def blob(img, xy, r, color, alpha):
    layer = Image.new("RGBA", img.size, color + (0,))
    a = Image.new("L", img.size, 0)
    ImageDraw.Draw(a).ellipse((xy[0] - r, xy[1] - r, xy[0] + r, xy[1] + r), fill=int(255 * alpha))
    a = a.filter(ImageFilter.GaussianBlur(r * 0.55))
    layer.putalpha(a)
    return Image.alpha_composite(img, layer)


def background(theme="blue"):
    # diagonal base: deep blue -> violet, then soft blobs in the site palette
    base = Image.new("RGBA", (S, S))
    top, bot = (36, 58, 196), (112, 76, 222)
    d = ImageDraw.Draw(base)
    for i in range(S * 2):
        t = i / (S * 2)
        col = tuple(int(top[k] + (bot[k] - top[k]) * t) for k in range(3)) + (255,)
        d.line([(i, 0), (0, i)], fill=col, width=2)
    base = blob(base, (820, 210), 330, (196, 181, 253), .85)   # lilac top-right
    base = blob(base, (760, 860), 360, (251, 176, 59), .80)    # amber bottom-right
    base = blob(base, (170, 260), 300, (79, 140, 255), .75)    # bright blue top-left
    base = blob(base, (230, 880), 260, (236, 112, 196), .45)   # pink hint bottom-left
    return base


APP_COLORS = {
    "alarm": (124, 185, 136),   # #7CB988 Alarm Clock Planner AccentColor
    "scooch": (77, 158, 255),   # #4D9EFF Scooch "Blue" theme accent
    "choru": (135, 87, 209),    # #8757D1 Choru AccentColor
    "rise": (212, 136, 42),     # #D4882A Rise accent (widgets, site)
    "remi": (0, 122, 255),      # #007AFF iOS system blue
}


def portfolio_background():
    """Area = current app focus: Alarm ~50% (top-left), Scooch 20% top-right, Choru 20% bottom-left,
    Rise 5% + Remi 5% sharing the bottom-right corner. Regions are corner triangles, then blurred together."""
    c = APP_COLORS
    img = Image.new("RGB", (S, S), c["alarm"])
    d = ImageDraw.Draw(img)
    # blue hugs the top-right corner and runs down the right edge, purple hugs the bottom-left and
    # runs along the bottom, both sweeping toward the bottom-right where Rise and Remi share the corner;
    # green keeps the top-left half and spreads down and right between them
    shapes = {
        "scooch": [(.56, 0), (1, 0), (1, .64), (.86, .58)],
        "choru": [(0, .56), (0, 1), (.64, 1), (.58, .86)],
        "rise": [(1, .64), (1, 1), (.76, .76), (.86, .58)],
        "remi": [(.64, 1), (1, 1), (.76, .76), (.58, .86)],
    }
    def area(pts):
        return abs(sum(pts[i][0] * pts[i - 1][1] - pts[i - 1][0] * pts[i][1] for i in range(len(pts)))) / 2
    for k, pts in shapes.items():
        d.polygon([(x * S, y * S) for x, y in pts], fill=c[k])
    AREAS = {k: round(area(v), 3) for k, v in shapes.items()}
    print("areas", AREAS, "alarm", round(1 - sum(AREAS.values()), 3))
    img = img.filter(ImageFilter.GaussianBlur(100))
    return img.convert("RGBA")


SHIP_ORDER = [  # clockwise, in the order the apps shipped, with the share of the icon each gets
    ("remi", (0, 122, 255), .05),          # 2026-02-26, iOS system blue
    ("rise", (212, 136, 42), .05),         # 2026-03-31
    ("alarm", (124, 185, 136), .45),       # 2026-05-29
    ("scooch", (77, 158, 255), .15),       # 2026-08-19, "Blue" theme accent
    ("charactersheet", (42, 99, 214), .15),  # 2026-10-19, site accent-strong #2A63D6
    ("choru", (135, 87, 209), .15),        # next
]


def clockwise_background(center_deg=315, blend=.035, n=256):
    """Each app gets an angular wedge around the centre whose AREA share of the square is exact
    (wedge edges are area quantiles by angle). Alarm's wedge is centred on center_deg
    (clockwise from 12 o'clock; 315 = top-left). Neighbours blend over +-blend of a turn, and the
    middle softens into a blurred mix so the hole of the O shows no pinwheel point.
    Computed at n px (pure Python), then upscaled: the field is soft anyway."""
    import bisect
    shares = [w for _, _, w in SHIP_ORDER]
    cols = [c for _, c, _ in SHIP_ORDER]
    ai = [k for k, _, _ in SHIP_ORDER].index("alarm")
    angs = []
    for y in range(n):
        for x in range(n):
            dx, dy = x + .5 - n / 2, y + .5 - n / 2
            angs.append(math.degrees(math.atan2(dx, -dy)) % 360)
    order = sorted(angs)
    N = len(order)
    f_center = bisect.bisect_left(order, center_deg % 360) / N
    alarm_mid = sum(shares[:ai]) + shares[ai] / 2
    bounds = [0]
    for w in shares:
        bounds.append(bounds[-1] + w)
    def smooth(v):
        v = min(1, max(0, v))
        return v * v * (3 - 2 * v)
    img = Image.new("RGB", (n, n))
    px = img.load()
    counts = [0] * len(shares)
    for i, a in enumerate(angs):
        t = (bisect.bisect_left(order, a) / N - f_center + alarm_mid) % 1.0
        ws = []
        for j in range(len(shares)):
            lo, hi = bounds[j], bounds[j + 1]
            d_lo = ((t - lo + .5) % 1.0) - .5
            d_hi = ((hi - t + .5) % 1.0) - .5
            ws.append(smooth(.5 + d_lo / (2 * blend)) * smooth(.5 + d_hi / (2 * blend)))
        tot = sum(ws) or 1
        counts[max(range(len(ws)), key=lambda j: ws[j])] += 1
        px[i % n, i // n] = tuple(int(sum(ws[j] * cols[j][c] for j in range(len(ws))) / tot) for c in range(3))
    print("areas", {SHIP_ORDER[j][0]: round(counts[j] / N, 3) for j in range(len(shares))})
    soft = img.filter(ImageFilter.GaussianBlur(n * .09))
    k = Image.new("L", (n, n))
    kp = k.load()
    for y in range(n):
        for x in range(n):
            r = math.hypot(x + .5 - n / 2, y + .5 - n / 2) / (n / 2)
            kp[x, y] = int(255 * min(1, max(0, 1 - (r - .18) / .42)))
    img = Image.composite(soft, img, k).resize((S, S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(18))
    return img.convert("RGBA")


def variant_clockwise(shape="squircle", **kw):
    bg = clockwise_background()
    m = ring_mask(512, 512, 372, 206)
    return finish(glass(bg, m, **kw), shape)


def variant_portfolio(shape="squircle", **kw):
    bg = portfolio_background()
    m = ring_mask(512, 512, 372, 206)
    return finish(glass(bg, m, **kw), shape)


def ring_mask(cx, cy, R, r):
    m = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(m)
    d.ellipse((cx - R, cy - R, cx + R, cy + R), fill=255)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=0)
    return m


def stroke_mask(points, w):
    m = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(m)
    d.line(points, fill=255, width=w, joint="curve")
    for p in (points[0], points[-1]):
        d.ellipse((p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2), fill=255)
    for p in points[1:-1]:
        d.ellipse((p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2), fill=255)
    return m


def glass(bg, mask, depth=1.0, tint=(255, 255, 255), amount=.16, sheen_max=70):
    """Liquid-glass glyph over bg: frosted fill, lit rim, inner shadow, specular, soft drop shadow."""
    out = bg.copy()
    # drop shadow
    sh = mask.filter(ImageFilter.GaussianBlur(26))
    sh = ImageChops.offset(sh, 0, 22).point(lambda v: int(v * .38 * depth))
    out = Image.alpha_composite(out, Image.merge("RGBA", (*[Image.new("L", (S, S), 10)] * 3, sh)))
    # frosted fill: blurred + lightened background, slightly refracted (offset)
    # lens: the background behind the glyph, magnified and lightly blurred, so colour bends through it
    lens = bg.resize((int(S * 1.12), int(S * 1.12)), Image.LANCZOS)
    o = int(S * .06)
    lens = lens.crop((o, o, o + S, o + S)).filter(ImageFilter.GaussianBlur(14))
    from PIL import ImageEnhance
    lens = ImageEnhance.Color(lens).enhance(1.25)
    frost = Image.blend(lens, Image.new("RGBA", (S, S), tint + (255,)), amount)
    fill_a = mask
    out = Image.composite(frost, out, fill_a)
    # vertical sheen inside glyph: lighter at top
    sheen = Image.new("L", (S, S))
    sd = ImageDraw.Draw(sheen)
    for y in range(S):
        sd.line([(0, y), (S, y)], fill=int(sheen_max * max(0, 1 - y / (S * .55))))
    sheen = ImageChops.multiply(sheen, mask)
    out = Image.alpha_composite(out, Image.merge("RGBA", (*[Image.new("L", (S, S), 255)] * 3, sheen)))
    # inner shadow bottom-right
    inner = ImageChops.subtract(mask, ImageChops.offset(mask, -10, -14)).filter(ImageFilter.GaussianBlur(9))
    inner = ImageChops.multiply(inner, mask).point(lambda v: int(v * .32))
    out = Image.alpha_composite(out, Image.merge("RGBA", (*[Image.new("L", (S, S), 30)] * 3, inner)))
    # lit rim top-left
    rim = ImageChops.subtract(mask, ImageChops.offset(mask, 9, 11)).filter(ImageFilter.GaussianBlur(3))
    rim = ImageChops.multiply(rim, mask).point(lambda v: min(255, int(v * 1.6)))
    # light caught on the far edge too
    rim2 = ImageChops.subtract(mask, ImageChops.offset(mask, -6, -8)).filter(ImageFilter.GaussianBlur(3))
    rim2 = ImageChops.multiply(rim2, mask).point(lambda v: int(v * .7))
    rim = ImageChops.lighter(rim, rim2)
    out = Image.alpha_composite(out, Image.merge("RGBA", (*[Image.new("L", (S, S), 255)] * 3, rim)))
    # thin outer edge so it separates from bright blobs
    edge = ImageChops.subtract(mask, mask.filter(ImageFilter.MinFilter(5))).point(lambda v: int(v * .6))
    out = Image.alpha_composite(out, Image.merge("RGBA", (*[Image.new("L", (S, S), 255)] * 3, edge)))
    return out


def finish(img, shape):
    if shape == "square":  # full bleed, opaque: iOS masks touch icons itself
        return img
    m = squircle_mask(S) if shape == "squircle" else circle_mask(S)
    img.putalpha(m)
    return img


def variant_o(shape="squircle"):
    bg = background()
    m = ring_mask(512, 512, 318, 178)
    return finish(glass(bg, m), shape)


def variant_o_big(shape="squircle", **kw):
    bg = background()
    m = ring_mask(512, 512, 372, 206)
    return finish(glass(bg, m, **kw), shape)


def variant_oz(shape="squircle"):
    bg = background()
    o = ring_mask(372, 512, 238, 128)
    w = 92
    z = stroke_mask([(642, 400), (812, 400), (642, 624), (812, 624)], w)
    m = ImageChops.lighter(o, z)
    return finish(glass(bg, m), shape)


def export_site_icons(root):
    """The shipped ozols.dev icon: frosted O on the clockwise ship-order gradient (2026-10-23)."""
    root = Path(root)
    kw = dict(tint=(255, 255, 255), amount=.62, sheen_max=60)
    rounded = variant_clockwise("squircle", **kw)
    square = variant_clockwise("square", **kw)
    rounded.save(GEN_LOGO / "ozols-icon-1024.png")
    sizes = [16, 32, 48]
    ico = [rounded.resize((n, n), Image.LANCZOS) for n in sizes]
    ico[-1].save(root / "favicon.ico", sizes=[(n, n) for n in sizes], append_images=ico[:-1])
    rounded.resize((96, 96), Image.LANCZOS).save(root / "assets/favicon-96.png", optimize=True)
    rounded.resize((192, 192), Image.LANCZOS).save(root / "assets/icon-192.png", optimize=True)
    square.convert("RGB").resize((180, 180), Image.LANCZOS).save(root / "apple-touch-icon.png", optimize=True)
    print("exported icons to", root)


GEN_LOGO = Path(__file__).resolve().parent

if __name__ == "__main__":
    # python3 _gen/logo/make_logo.py            -> writes the shipped icons into the site root
    # python3 _gen/logo/make_logo.py --sheet DIR -> comparison sheet of the variants in DIR
    if len(sys.argv) > 2 and sys.argv[1] == "--sheet":
        OUT = Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
    else:
        export_site_icons(GEN_LOGO.parent.parent)
        sys.exit(0)
    variants = {
        "P4-clockwise-frosted": variant_clockwise(tint=(255, 255, 255), amount=.62, sheen_max=60),
    }
    for k, im in variants.items():
        im.save(OUT / f"{k}.png")

    # contact sheet: big view + favicon sizes on light and dark, plus a Google-result mock (circle crop at 28 px)
    W, H = 1500, 330 * len(variants) + 20
    sheet = Image.new("RGB", (W, H), (250, 250, 247))
    d = ImageDraw.Draw(sheet)
    y = 20
    for k, im in variants.items():
        sheet.paste(im.resize((300, 300), Image.LANCZOS), (20, y), im.resize((300, 300), Image.LANCZOS))
        x = 360
        for bgc in ((236, 236, 230), (24, 24, 29)):
            d.rectangle((x - 10, y + 40, x + 330, y + 260), fill=bgc)
            xx = x
            for sz in (64, 48, 32, 16):
                small = im.resize((sz, sz), Image.LANCZOS)
                sheet.paste(small, (xx, y + 150 - sz // 2), small)
                xx += sz + 24
            x += 380
        # google mock: 28 px in a circle on white row
        gx = 1130
        d.rounded_rectangle((gx, y + 110, gx + 340, y + 190), 12, fill=(255, 255, 255), outline=(225, 225, 225))
        g = im.resize((28, 28), Image.LANCZOS)
        cm = Image.new("L", (28, 28), 0); ImageDraw.Draw(cm).ellipse((0, 0, 27, 27), fill=255)
        a = ImageChops.multiply(g.split()[3], cm); g.putalpha(a)
        d.ellipse((gx + 14, y + 132, gx + 50, y + 168), fill=(241, 243, 244))
        sheet.paste(g, (gx + 18, y + 136), g)
        d.text((gx + 62, y + 132), "Ozols.Dev", fill=(32, 33, 36))
        d.text((gx + 62, y + 150), "https://ozols.dev", fill=(77, 81, 86))
        d.text((20, y + 302), k, fill=(90, 90, 100))
        y += 330
    sheet.save(OUT / "sheet.png")
    print("ok", OUT)
