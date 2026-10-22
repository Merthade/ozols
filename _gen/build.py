#!/usr/bin/env python3
"""Build ozols.dev's index.html from index.template.html + apps.json.

Rating counts come from Holocron's app-metrics snapshot (all storefronts summed),
so re-run this after a refresh to update the chips:

    python3 _gen/build.py

_gen/ is not deployed: GitHub Pages runs Jekyll here, which skips underscore folders.
"""
import datetime
import html
import json
import re
from pathlib import Path

GEN = Path(__file__).resolve().parent
ROOT = GEN.parent
RATINGS = Path.home() / "Documents/Holocron/tools/app-metrics/data/ratings.json"
DOWNLOADS = Path.home() / "Documents/Holocron/tools/app-metrics/data/asc.json"  # ASC first-time downloads per day
MIN_RATINGS = 10  # below this a chip reads weaker than no chip
GET_GLYPH = ('<svg class="get-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5v10.5m0 0-4.25-4.25M12 14l4.25-4.25'
             'M4.75 15.5v2.25a2.75 2.75 0 0 0 2.75 2.75h9a2.75 2.75 0 0 0 2.75-2.75V15.5"/></svg>')
STORE = "https://apps.apple.com/app/apple-store/id{id}?pt=2187944&amp;ct=OzolsDev_Home&amp;mt=8"

esc = html.escape


def ratings():
    try:
        data = json.loads(RATINGS.read_text())
    except (OSError, ValueError) as e:
        print(f"WARNING: no ratings ({e}); chips left out")
        return {}
    latest = max(data)
    print(f"ratings: snapshot {latest}")
    return data[latest]


def downloads_total():
    days = json.loads(DOWNLOADS.read_text())["days"]
    total = sum(v.get("dl", 0) for apps in days.values() for v in apps.values())
    print(f"downloads: {total} first-time, through {max(days)}")
    return total, max(days)


def stats(rated):
    total, through = downloads_total()
    count = sum(r["count"] for r in rated.values() if r.get("count"))
    avg = sum(r["avg"] * r["count"] for r in rated.values() if r.get("count")) / count
    print(f"ratings: {count} at {avg:.2f}")
    floor = total // 100 * 100
    month = datetime.date.fromisoformat(through).strftime("%B %Y")
    return f'''            <section class="stats-wrap" aria-label="App totals">
                <div class="stats">
                    <div><strong>{floor:,}+</strong><span>downloads</span></div>
                    <div><strong>{count}</strong><span>App Store ratings</span></div>
                    <div><strong>{avg:.1f}<span class="star" aria-hidden="true">★</span></strong><span>average rating</span></div>
                </div>
                <p class="stats-note">Across all my apps, as of {month}.</p>
            </section>'''


def chip(r):
    if not r or not r.get("count") or r["count"] < MIN_RATINGS:
        return ""
    return (f'<span class="rating"><span class="stars" aria-hidden="true">★</span>'
            f'{r["avg"]:.1f} · {r["count"]} ratings</span>')


def icon(a, size, lazy=True):
    return (f'<img class="app-icon" src="/assets/apps/{a["slug"]}-icon.png" alt="" '
            f'width="{size}" height="{size}"' + (' loading="lazy">' if lazy else '>'))


def shot(a, i, lazy=True):
    return (f'<img src="/assets/apps/{a["shots"][i]}" alt="{esc(a["shot_alt"][i])}" '
            f'width="640" height="1284"' + (' loading="lazy">' if lazy else '>'))


def read_more(a):
    return (f'<a class="read-more" href="{a["site"]}" data-ph="app_card_click" data-app="{a["slug"]}" '
            f'data-target="site" aria-label="Read more about {esc(a["name"])}">Read more</a>')


def featured(a, r):
    shots = "\n".join(f"                    {shot(a, i, lazy=False)}" for i in range(len(a["shots"])))
    return f'''                <h2 class="section-title" id="featured-title">Featured app</h2>
                <article class="featured">
                    <div>
                        <div class="app-head">{icon(a, 64, lazy=False)}<h3 class="app-name">{esc(a["name"])}</h3></div>
                        <p class="tagline">{esc(a["tagline"])}</p>
                        <p class="blurb">{esc(a["blurb"])}</p>
                        <div class="featured-actions">
                            <a class="badge-link" href="{STORE.format(id=a["id"])}" data-ph="app_card_click" data-app="{a["slug"]}" data-target="store" aria-label="Download {esc(a["name"])} on the App Store"><img src="/assets/appstore-badge.svg" alt="Download on the App Store" width="144" height="48"></a>
                            {read_more(a)}
                        </div>
                    </div>
                    <div class="shots">
{shots}
                    </div>
                </article>'''


def card(a, r, today):
    tag = ""
    if a.get("coming_soon"):
        tag = '<span class="ribbon ribbon-soon">SOON</span>'
    elif a.get("new_until") and today <= datetime.date.fromisoformat(a["new_until"]):
        tag = '<span class="ribbon ribbon-new">NEW</span>'
    if a.get("coming_soon"):
        action = '<span class="soon">Not on the App Store yet</span>'
    else:
        action = (f'<a class="get" href="{STORE.format(id=a["id"])}" data-ph="app_card_click" '
                  f'data-app="{a["slug"]}" data-target="store" '
                  f'aria-label="Download {esc(a["name"])} on the App Store">{GET_GLYPH}Download</a>')
    rating = f"\n                        {chip(r)}" if chip(r) else ""
    return f'''                    <article class="card{" has-ribbon" if tag else ""}">{tag}
                        <div class="app-head">{icon(a, 52)}<h3 class="app-name">{esc(a["name"])}</h3></div>
                        <p class="tagline">{esc(a["tagline"])}</p>{rating}
                        <div class="shot">{shot(a, 0)}</div>
                        <div class="card-actions">{action}{read_more(a)}</div>
                    </article>'''


def social(s):
    svg = (GEN / "social" / f'{s["key"]}.svg').read_text()
    svg = re.sub(r"<title>.*?</title>", "", svg).replace("<svg ", '<svg aria-hidden="true" ', 1)
    return (f'                    <a href="{s["url"]}" rel="me noopener" target="_blank" data-ph="social_click" '
            f'data-platform="{s["key"]}">{svg}<span><strong>{esc(s["label"])}</strong>'
            f'<small>{esc(s["handle"])}</small></span></a>')


def blog():
    posts = json.loads((ROOT / "blog/posts.json").read_text())["posts"]
    posts = sorted(posts, key=lambda p: p["date"], reverse=True)[:3]
    out = []
    for p in posts:
        d = datetime.date.fromisoformat(p["date"])
        out.append(f'''                <a class="post" href="{p["url"]}">
                    <time datetime="{p["date"]}">{d.strftime("%-d %B %Y")}</time>
                    <h3>{esc(p["title"])}</h3>
                    <p>{esc(p["excerpt"])}</p>
                </a>''')
    return "\n".join(out)


def support(a):
    return (f'                    <li><span class="who"><img src="/assets/apps/{a["slug"]}-icon.png" alt="" width="28" height="28" loading="lazy">{esc(a["name"])}</span>'
            f'<span class="links"><a class="site" href="{a["site"]}">{a["site"].split("//")[1]}</a>'
            f'<a href="{a["support"]}">Support</a><a href="{a["privacy"]}">Privacy</a><a href="{a["terms"]}">Terms</a></span></li>')


def jsonld(apps):
    items = [a for a in apps if a.get("id")]
    data = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Person",
                "@id": "https://ozols.dev/#person",
                "name": "Emils Ozols",
                "url": "https://ozols.dev/",
                "jobTitle": "Indie iOS developer",
                "image": "https://ozols.dev/assets/avatar.jpg",
                "sameAs": [s["url"] for s in CONFIG["social"]],
            },
            {
                "@type": "ItemList",
                "name": "iOS apps by Emils Ozols",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": i + 1,
                        "item": {
                            "@type": "SoftwareApplication",
                            "name": a["name"],
                            "operatingSystem": "iOS",
                            "applicationCategory": a["category"],
                            "description": a["tagline"],
                            "url": f'https://apps.apple.com/app/id{a["id"]}',
                            "author": {"@id": "https://ozols.dev/#person"},
                        },
                    }
                    for i, a in enumerate(items)
                ],
            },
        ],
    }
    return json.dumps(data, indent=2, ensure_ascii=False)


CONFIG = json.loads((GEN / "apps.json").read_text())


def main():
    apps = CONFIG["apps"]
    rated = ratings()
    today = datetime.date.today()
    feat = next(a for a in apps if a["slug"] == CONFIG["featured"])
    rest = [a for a in apps if a is not feat]
    live = [a["name"] for a in apps if not a.get("coming_soon")]
    description = ("Small iOS apps by Emils Ozols, an indie developer: "
                   + ", ".join(live[:-1]) + " and " + live[-1] + ".")
    out = (GEN / "index.template.html").read_text()
    for key, val in {
        "DESCRIPTION": esc(description),
        "JSONLD": jsonld(apps),
        "STATS": stats(rated),
        "FEATURED": featured(feat, rated.get(feat["slug"])),
        "GRID": "\n".join(card(a, rated.get(a["slug"]), today) for a in rest),
        "SOCIAL": "\n".join(social(s) for s in CONFIG["social"]),
        "BLOG": blog(),
        "SUPPORT": "\n".join(support(a) for a in apps),
        "YEAR": str(today.year),
    }.items():
        out = out.replace("{{" + key + "}}", val)
    left = re.findall(r"\{\{[A-Z]+\}\}", out)
    if left:
        raise SystemExit(f"unfilled placeholders: {left}")
    if "—" in out or "–" in out:
        raise SystemExit("em or en dash in the output; brand bans them")
    (ROOT / "index.html").write_text(out)
    print(f"wrote index.html ({len(out):,} bytes)")


if __name__ == "__main__":
    main()
