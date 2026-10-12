"""Compone la grafica finale per gli store a partire da store/.raw e public/icon.svg.

Uso: python3 store/tools/compose.py   (dopo screenshots.py)

Produce in store/graphics/:
  icon-1024.png                         icona App Store (senza trasparenza)
  icon-512.png                          icona Google Play
  feature-graphic-1024x500.png          immagine in evidenza Google Play
  screenshots/<lingua>/<dispositivo>-N.png
"""
import glob
import os
import pathlib

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "store" / ".raw"
OUT = ROOT / "store" / "graphics"
CHROME = os.environ.get("CHROME", "/opt/google/chrome/chrome")

SERIF = sorted(glob.glob(str(ROOT / "node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff2")))[0]
SERIF_I = sorted(glob.glob(str(ROOT / "node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-400-italic.woff2")))[0]

INK = "#1a1a1a"
OCRA = "#c08a3e"
CREAM = "#f6f1e8"

FONTS = f"""
@font-face {{ font-family: Serif; src: url(file://{SERIF}); font-weight: 600; }}
@font-face {{ font-family: Serif; src: url(file://{SERIF_I}); font-style: italic; font-weight: 400; }}
* {{ margin: 0; box-sizing: border-box; }}
html, body {{ width: 100%; height: 100%; }}
"""

# Il simbolo: "S" bianca su quadrato scuro con segnalibro ocra (come public/icon.svg).
def mark(size, radius=0, pad=0.0):
    s = size
    return f"""
<svg width="{s}" height="{s}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="{radius}" fill="{INK}"/>
  <g transform="translate({256*pad},{256*pad}) scale({1-pad})">
    <text x="248" y="368" text-anchor="middle" font-family="Inter" font-weight="800" font-size="320" fill="#fff">S</text>
    <path d="M368 48h64v136l-32-27-32 27z" fill="{OCRA}"/>
  </g>
</svg>"""


CAPTIONS = {
    "it": {
        "note": ("Appunti e Bibbia", "nella stessa pagina"),
        "verse": ("Un versetto", "in pochi secondi"),
        "list": ("Ogni predica", "al suo posto"),
        "dark": ("Tema scuro", "per il culto serale"),
    },
    "en": {
        "note": ("Notes and Scripture", "on the same page"),
        "verse": ("Any verse", "in seconds"),
        "list": ("Every sermon", "in its place"),
        "dark": ("Dark mode", "for evening services"),
    },
}

# dispositivo: (dimensione finale, sequenza di (schermata grezza, didascalia))
SETS = {
    "iphone": ((1320, 2868), [("note-light", "note"), ("verse-light", "verse"), ("list-light", "list"), ("note-dark", "dark")]),
    "android": ((1080, 2160), [("note-light", "note"), ("verse-light", "verse"), ("list-light", "list"), ("note-dark", "dark")]),
    "ipad": ((2064, 2752), [("note-light", "note"), ("verse-light", "verse"), ("note-dark", "dark")]),
}


def slide_html(w, h, raw, title, sub, dark):
    bg = INK if dark else CREAM
    fg = "#ffffff" if dark else INK
    shot_w = int(w * (0.80 if w < h * 0.6 else 0.84))
    top = int(h * 0.055)
    fs = int(w * (0.085 if w < 1500 else 0.06))
    return f"""<html><head><style>{FONTS}
body {{ background: {bg}; color: {fg}; font-family: Inter, sans-serif; overflow: hidden; }}
.cap {{ text-align: center; padding-top: {top}px; }}
h1 {{ font-family: Serif; font-weight: 600; font-size: {fs}px; line-height: 1.08; letter-spacing: -0.01em; }}
h2 {{ font-family: Serif; font-style: italic; font-weight: 400; font-size: {fs}px; line-height: 1.08; color: {OCRA}; }}
.shot {{ position: absolute; left: 50%; transform: translateX(-50%); top: {int(h*0.215)}px; width: {shot_w}px;
        border-radius: {int(w*0.055)}px; overflow: hidden;
        box-shadow: 0 {int(w*0.02)}px {int(w*0.06)}px rgba(0,0,0,{0.5 if dark else 0.18}),
                    0 0 0 {max(2, int(w*0.004))}px {'#3a3a38' if dark else '#e4dccd'}; }}
.shot img {{ display: block; width: 100%; }}
</style></head><body>
<div class="cap"><h1>{title}</h1><h2>{sub}</h2></div>
<div class="shot"><img src="file://{raw}"></div>
</body></html>"""


def render(page, html, w, h, path):
    page.set_viewport_size({"width": w, "height": h})
    tmp = ROOT / "store" / ".tmp" / "page.html"
    os.makedirs(tmp.parent, exist_ok=True)
    tmp.write_text(html, encoding="utf-8")
    page.goto(f"file://{tmp}")
    page.wait_for_timeout(300)
    page.evaluate("document.fonts.ready")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    page.screenshot(path=path, omit_background=False)


def main():
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=CHROME)
        page = b.new_page(device_scale_factor=1)

        # Icone (quadrate, senza angoli arrotondati: li applicano gli store)
        for size, name in ((1024, "icon-1024.png"), (512, "icon-512.png")):
            render(page, f"<html><head><style>{FONTS}</style></head><body>{mark(size)}</body></html>",
                   size, size, str(OUT / name))

        # Immagine in evidenza Google Play 1024x500
        feat = f"""<html><head><style>{FONTS}
body {{ background: {INK}; color: #fff; font-family: Inter; display: flex; align-items: center; padding: 0 80px; gap: 56px; }}
.t h1 {{ font-family: Serif; font-weight: 600; font-size: 76px; line-height: 1; }}
.t p {{ font-family: Serif; font-style: italic; font-size: 34px; color: {OCRA}; margin-top: 14px; }}
.t small {{ display: block; margin-top: 22px; font-size: 20px; color: #b9b4aa; letter-spacing: 0.02em; }}
</style></head><body>{mark(220, radius=50, pad=0.0)}
<div class="t"><h1>Scribae</h1><p>Appunti con la Bibbia integrata</p><small>Italiano · English · Українська</small></div></body></html>"""
        render(page, feat, 1024, 500, str(OUT / "feature-graphic-1024x500.png"))

        # Schermate con didascalia
        for lang, caps in CAPTIONS.items():
            for device, ((w, h), seq) in SETS.items():
                for i, (raw, cap) in enumerate(seq, 1):
                    title, sub = caps[cap]
                    html = slide_html(w, h, RAW / f"{device}-{raw}.png", title, sub, raw.endswith("dark"))
                    render(page, html, w, h, str(OUT / "screenshots" / lang / f"{device}-{i}.png"))
        b.close()


if __name__ == "__main__":
    main()
