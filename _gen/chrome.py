"""Shared header and footer markup for ozols.dev subpages (blog, legal pages).

restyle_page() swaps a page's own chrome for the homepage's: links /assets/site.css,
puts the site header and footer around the body, and applies the PostHog opt-outs.
"""
import re

ICON_TAGS = """<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="icon" type="image/png" sizes="96x96" href="/assets/favicon-96.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">"""

HEADER = '''<header class="top">
    <a class="wordmark" href="/">Ozols<span>.</span>Dev</a>
    <nav class="nav" aria-label="Sections">
        <a href="/#apps">Apps</a>
        <a href="/blog/">Blog</a>
        <a href="/#support">Support</a>
    </nav>
</header>'''

FOOTER = '''<footer class="site-footer">
    <div class="row">
        <span>© 2026 Emils Ozols</span>
        <a href="mailto:emils@ozols.dev">emils@ozols.dev</a>
        <a href="/blog/feed.xml">RSS</a>
    </div>
    <p>Apple, iPhone and App Store are trademarks of Apple Inc., registered in the U.S. and other countries and regions.</p>
</footer>'''

POSTHOG_OLD = re.compile(r"posthog\.init\('(phc_\w+)', \{\s*api_host: 'https://eu\.i\.posthog\.com',\s*person_profiles: 'anonymous',\s*persistence: 'memory'\s*\}\);\s*posthog\.register\(\{ app_name: 'ozols_web' \}\);")
POSTHOG_NEW = '''if (!/^(localhost|127\\.0\\.0\\.1)$/.test(location.hostname)) {
      posthog.init('\\1', {
        api_host: 'https://eu.i.posthog.com',
        person_profiles: 'anonymous',
        persistence: 'memory',
        capture_dead_clicks: false,
        capture_performance: false,
        enable_heatmaps: false,
        disable_surveys: true
      });
      posthog.register({ app_name: 'ozols_web' });
    }'''


def head_dashes(s):
    """Em/en dashes in <head> (titles, meta) become hyphens; body prose is left alone."""
    i = s.index('</head>')
    return s[:i].replace(' — ', ' - ').replace(' – ', ' - ') + s[i:]


def posthog(s):
    s, n = POSTHOG_OLD.subn(POSTHOG_NEW, s)
    return s, n
