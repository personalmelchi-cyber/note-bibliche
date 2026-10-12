"""Cattura le schermate grezze dell'app per gli store.

Uso (dalla cartella del progetto):
    VITE_STORE_ONLY=1 npx vite build --outDir store/.preview
    npx vite preview --outDir store/.preview --port 4173 &
    python3 store/tools/screenshots.py

Riempie l'app con note di esempio (testi biblici di pubblico dominio) e salva
PNG in store/.raw/<dispositivo>-<schermata>-<tema>.png
"""
import json
import os
import time

from playwright.sync_api import sync_playwright

URL = "http://localhost:4173/"
OUT = os.path.join(os.path.dirname(__file__), "..", ".raw")
CHROME = os.environ.get("CHROME", "/opt/google/chrome/chrome")

DEVICES = {
    # nome: (larghezza CSS, altezza CSS, scala, user agent mobile?)
    "iphone": (440, 956, 3, True),     # 1320 x 2868 (iPhone 6.9")
    "ipad": (1032, 1376, 2, True),     # 2064 x 2752 (iPad 13")
    "android": (360, 720, 3, True),    # 1080 x 2160 (Google Play)
}

H = 3600_000
now = int(time.time() * 1000)


def uid(i):
    return f"b{i:04d}"


def p(*paras):
    return "".join(f"<p>{x}</p>" for x in paras)


PSALM = {
    "human": "Salmi 23:1-3",
    "version": "Diodati",
    "bg": "beige",
    "verses": [
        {"n": 1, "t": "Salmo di Davide IL Signore è il mio pastore: nulla mi mancherà."},
        {"n": 2, "t": "Egli mi fa giacere in paschi erbosi, Mi guida lungo le acque chete."},
        {"n": 3, "t": "Egli mi ristora l’anima; Egli mi conduce per sentieri di giustizia, Per amor del suo Nome."},
    ],
}

JOHN = {
    "human": "John 3:16-17",
    "version": "KJV",
    "bg": "olive",
    "verses": [
        {"n": 16, "t": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."},
        {"n": 17, "t": "For God sent not his Son into the world to condemn the world; but that the world through him might be saved."},
    ],
}


def text(i, html):
    return {"id": uid(i), "type": "text", "text": "", "html": html}


NOTES = [
    {
        "id": 1,
        "title": "Culto di domenica – Il buon pastore",
        "updatedAt": now - 2 * H,
        "blocks": [
            text(1, p("Tema: la cura di Dio nelle stagioni difficili.",
                      "<b>Punto 1</b> – Il Signore è il <i>mio</i> pastore: è una relazione personale, non un'idea.")),
            {"id": uid(2), "type": "verse", "verse": PSALM},
            text(3, "<ul><li>Riposo: Dio sa quando fermarci</li><li>Guida: un passo alla volta</li>"
                    "<li>Ristoro: anche l'anima ha bisogno di cura</li></ul>"
                    + p("Domanda per la settimana: dove ho bisogno di lasciarmi guidare?")),
        ],
    },
    {
        "id": 2,
        "title": "Sermon notes – God's love",
        "updatedAt": now - 26 * H,
        "blocks": [
            text(4, p("Guest speaker. Main idea: love that gives first.")),
            {"id": uid(5), "type": "verse", "verse": JOHN},
            text(6, p("Not condemnation but rescue. Share this with the youth group on Friday.")),
        ],
    },
    {"id": 3, "title": "Studio biblico – Romani 8", "updatedAt": now - 3 * 24 * H,
     "blocks": [text(7, p("Nessuna condanna. Lo Spirito intercede per noi."))]},
    {"id": 4, "title": "Preghiera del mattino", "updatedAt": now - 4 * 24 * H,
     "blocks": [text(8, p("Ringraziare per la famiglia, pregare per il viaggio di sabato."))]},
    {"id": 5, "title": "Gruppo giovani – Davide e Golia", "updatedAt": now - 9 * 24 * H,
     "blocks": [text(9, p("Il coraggio nasce dalla fiducia, non dalla forza."))]},
    {"id": 6, "title": "Conferenza – appunti", "updatedAt": now - 15 * 24 * H,
     "blocks": [text(10, p("Tre parole chiave: fedeltà, servizio, gioia."))]},
    {"id": 7, "title": "Lettura: Vangelo di Marco", "updatedAt": now - 21 * 24 * H,
     "blocks": [text(11, p("Capitoli 1-4. Gesù chiama, guarisce, insegna."))]},
]


def shoot(browser, device, theme):
    w, h, scale, mobile = DEVICES[device]
    ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=scale,
                              is_mobile=mobile, has_touch=True, color_scheme=theme, locale="it-IT")
    ctx.add_init_script(
        "localStorage.setItem('note-bibliche-v1', %s);"
        "localStorage.setItem('note-bibliche-translation', 'DIODATI');"
        "localStorage.setItem('note-bibliche-sidebar', 'open');" % json.dumps(json.dumps(NOTES))
    )
    page = ctx.new_page()
    page.goto(URL)
    page.wait_for_timeout(1200)
    page.evaluate("document.fonts.ready")
    wide = w >= 700

    def save(name):
        page.wait_for_timeout(700)
        page.screenshot(path=os.path.join(OUT, f"{device}-{name}-{theme}.png"))

    if not wide:
        save("list")
    page.get_by_text("Culto di domenica", exact=False).first.click()
    page.wait_for_timeout(500)
    page.evaluate("document.activeElement && document.activeElement.blur()")
    save("note")
    page.get_by_text("Versetto", exact=True).first.click()
    save("verse")
    ctx.close()


def main():
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=CHROME, args=["--font-render-hinting=none"])
        for device in DEVICES:
            for theme in ("light", "dark"):
                shoot(browser, device, theme)
        browser.close()


if __name__ == "__main__":
    main()
