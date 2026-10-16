"""Збирає вебверсію курсу: окрема HTML-сторінка для кожного уроку.

Запуск із кореня репозиторію:
    pip install markdown
    python3 tools/zibraty_sait.py

Результат:
    index.html              — головна: програма курсу і картки уроків
    storinky/urok-01.html … — по одній сторінці на урок
    storinky/dovidnyk.html  — довідник
Сторінки самодостатні: стилі, підсвічування коду і знімки скетчів вбудовані,
тож вони працюють без інтернету, на комп'ютері й на телефоні.
"""
import base64
import html
import pathlib
import re
import sys

import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
OUT = ROOT / "storinky"

COURSE = "Креативне програмування в Processing"
MODULES = [
    ("Модуль 1. Малюємо кодом", 1, 4),
    ("Модуль 2. Рух і взаємодія", 5, 9),
    ("Модуль 3. Організація коду", 10, 12),
    ("Модуль 4. Математика і медіа", 13, 15),
    ("Модуль 5. Проєкт", 16, 16),
]


def read(path):
    return path.read_text(encoding="utf-8")


# ---------- Підсвічування коду Processing ----------
KW = set("if else for while do return new class void true false null this extends break continue switch case default public private static final import".split())
TYPES = set("int float boolean char String color PImage PFont PVector ArrayList double long byte".split())
BUILTIN = set("""size background fill noFill stroke noStroke strokeWeight strokeCap point line rect ellipse circle triangle quad arc
beginShape vertex endShape rectMode ellipseMode colorMode println print random randomSeed noise map constrain dist abs sqrt
pow min max round sin cos radians degrees translate rotate scale pushMatrix popMatrix image loadImage tint noTint filter
loadPixels updatePixels text textSize textAlign textFont createFont textWidth millis second minute hour frameRate saveFrame
save noLoop loop redraw red green blue setup draw mousePressed keyPressed mouseReleased mouseDragged smooth createImage get""".split())
TOKEN = re.compile(r'(//[^\n]*|/\*.*?\*/)|("(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])\')|(#[0-9A-Fa-f]{6}\b|\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)', re.S)


def highlight(src):
    out, last = [], 0
    for m in TOKEN.finditer(src):
        out.append(html.escape(src[last:m.start()], quote=False))
        t = m.group(0)
        if m.group(1): cls = "t-com"
        elif m.group(2): cls = "t-str"
        elif m.group(3): cls = "t-num"
        elif t in KW: cls = "t-kw"
        elif t in TYPES: cls = "t-type"
        elif t in BUILTIN or re.fullmatch(r"[A-Z][A-Z_]+", t): cls = "t-fn"
        else: cls = None
        esc = html.escape(t, quote=False)
        out.append(f'<span class="{cls}">{esc}</span>' if cls else esc)
        last = m.end()
    out.append(html.escape(src[last:], quote=False))
    return "".join(out)


def code_block(src):
    return ('<pre class="code"><button class="copy" type="button">Копіювати</button><code>'
            + highlight(src.rstrip("\n")) + "</code></pre>")


# ---------- Markdown → HTML ----------
FENCE = re.compile(r"^```[\w-]*\n(.*?)^```\s*$", re.S | re.M)


def md_to_html(text, root):
    blocks = []

    def stash(m):
        blocks.append(code_block(m.group(1)))
        return f"\n\nCODEBLOCK{len(blocks) - 1}\n\n"

    text = FENCE.sub(stash, text)
    out = markdown.markdown(text, extensions=["tables", "sane_lists"])
    out = re.sub(r"<p>CODEBLOCK(\d+)</p>", lambda m: blocks[int(m.group(1))], out)
    out = out.replace("\\|", "|")
    out = out.replace("<table>", '<div class="tbl"><table>').replace("</table>", "</table></div>")

    def fix_link(m):
        href = m.group(1)
        n = re.search(r"uroky/(\d+)-[\w-]+\.md", href)
        if n:
            href = f"{root}storinky/urok-{int(n.group(1)):02d}.html"
        elif href.endswith("dovidnyk.md"):
            href = f"{root}storinky/dovidnyk.html"
        elif href.endswith("README.md"):
            href = f"{root}index.html"
        elif not href.startswith(("http", "#")):
            href = root + href
        ext = href.startswith("http") or href.endswith("processing_test.html")
        return f'<a href="{href}"' + (' target="_blank" rel="noopener"' if ext else "") + ">"

    return re.sub(r'<a href="([^"]*)">', fix_link, out)


# ---------- Дані курсу ----------
lessons = []
for f in sorted((ROOT / "uroky").glob("*.md")):
    text = read(f)
    n = int(re.match(r"(\d+)", f.name).group(1))
    title = text.splitlines()[0].lstrip("# ").strip()
    short = re.sub(r"^Урок(и)? [\d–]+\.\s*", "", title)
    lessons.append({"n": n, "title": title, "short": short, "md": text,
                    "label": "16–17" if n == 16 else str(n)})


def sketches_for(n):
    res = []
    for d in sorted((ROOT / "skechi").glob(f"L{n:02d}_*")):
        main = d / f"{d.name}.pde"
        files = [main] + sorted(p for p in d.glob("*.pde") if p != main)
        img = ROOT / "znimky" / f"{d.name}.jpg"
        res.append({"name": d.name, "files": [(p.name, read(p)) for p in files],
                    "img": "data:image/jpeg;base64," + base64.b64encode(img.read_bytes()).decode() if img.exists() else ""})
    return res


CSS = read(TOOLS / "stil.css")
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700'
         '&family=Golos+Text:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap">')
COPY_JS = """document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('.copy');
  if (!b) return;
  var code = b.parentNode.querySelector('code');
  function done(t) { b.textContent = t; setTimeout(function () { b.textContent = 'Копіювати'; }, 1500); }
  function selectIt() { var r = document.createRange(); r.selectNodeContents(code); var s = getSelection(); s.removeAllRanges(); s.addRange(r); done('Виділено'); }
  try { navigator.clipboard.writeText(code.innerText).then(function () { done('Скопійовано'); }, selectIt); } catch (err) { selectIt(); }
});"""


def toc(root, current):
    def link(href, key, body, solo=False):
        cur = ' aria-current="page"' if key == current else ""
        return f'<li><a href="{href}"{cur}>{body}</a></li>'

    parts = ['<div class="solo"><ol>' + link(f"{root}index.html", "home", "Програма курсу") + "</ol></div>"]
    for title, a, b in MODULES:
        items = "".join(
            link(f"{root}storinky/urok-{l['n']:02d}.html", f"urok-{l['n']}",
                 f'<span class="n">{l["label"]}</span><span>{html.escape(l["short"])}</span>')
            for l in lessons if a <= l["n"] <= b)
        parts.append(f"<div><h4>{title}</h4><ol>{items}</ol></div>")
    parts.append('<div class="solo"><h4>Матеріали</h4><ol>'
                 + link(f"{root}storinky/dovidnyk.html", "dovidnyk", "Довідник і словник термінів")
                 + f'<li><a href="{root}test/processing_test.html" target="_blank" rel="noopener">Підсумковий тест ↗</a></li>'
                 + "</ol></div>")
    return "".join(parts)


def head(title, description):
    return (f"<title>{html.escape(title)}</title>\n"
            '<meta name="claude:viewport-fit-sides" content="cover">\n'
            f'<meta name="description" content="{html.escape(description)}">\n'
            f"{FONTS}\n<style>\n{CSS}</style>")


def body(root, current, main_html, extra_js=""):
    brand = (f'<a class="brand" href="{root}index.html"><b>{COURSE}</b>'
             "<span>Курс для 9 класу · 17 уроків</span></a>")
    t = toc(root, current)
    return f"""<div class="shell">
  <aside class="side">{brand}<nav class="toc" aria-label="Зміст курсу">{t}</nav></aside>
  <main>
    <div class="mobile-nav">{brand}<details><summary>Зміст курсу</summary><nav class="toc" aria-label="Зміст курсу">{t}</nav></details></div>
{main_html}
  </main>
</div>
<script>
{COPY_JS}
{extra_js}
</script>"""


def full_page(head_html, body_html):
    return ('<!DOCTYPE html>\n<html lang="uk">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            f"{head_html}\n</head>\n<body>\n{body_html}\n</body>\n</html>\n")


# ---------- Сторінка уроку ----------
def lesson_page(l, prev, nxt):
    root = "../"
    sk_html = ""
    sks = sketches_for(l["n"])
    if sks:
        items = []
        for s in sks:
            files = "".join(
                f'<details{" open" if i == 0 else ""}><summary>{name} · {code.count(chr(10)) + 1} рядків</summary>{code_block(code)}</details>'
                for i, (name, code) in enumerate(s["files"]))
            img = f'<img src="{s["img"]}" alt="Результат роботи скетчу {s["name"]}" loading="lazy">' if s["img"] else ""
            items.append(f'<div class="sk"><figure>{img}<figcaption>Знімок вікна програми</figcaption></figure>'
                         f'<div class="files"><h3>{s["name"]}</h3>{files}</div></div>')
        sk_html = ('<section class="sketches"><h2>Скетчі уроку</h2><p>Скопіюйте код у новий скетч Processing або '
                   'відкрийте файл із папки <code>skechi/</code> репозиторію. Збережіть скетч під тією самою назвою, '
                   'а класи покладіть в окремі вкладки.</p>' + "".join(items) + "</section>")

    if prev:
        p = f'<a href="urok-{prev["n"]:02d}.html"><small>← Урок {prev["label"]}</small>{html.escape(prev["short"])}</a>'
    else:
        p = f'<a href="{root}index.html"><small>← Програма</small>Програма курсу</a>'
    if nxt:
        word = "Уроки" if nxt["n"] == 16 else "Урок"
        nx = f'<a class="next" href="urok-{nxt["n"]:02d}.html"><small>{word} {nxt["label"]} →</small>{html.escape(nxt["short"])}</a>'
    else:
        nx = f'<a class="next" href="{root}test/processing_test.html" target="_blank" rel="noopener"><small>Далі →</small>Підсумковий тест</a>'

    main_html = (f'<p class="crumbs"><a href="{root}index.html">Програма</a> / {"Уроки" if l["n"] == 16 else "Урок"} {l["label"]} з 17</p>'
                 f'<article><div class="doc">{md_to_html(l["md"], root)}</div>{sk_html}</article>'
                 f'<nav class="pager" aria-label="Попередній і наступний урок">{p}{nx}</nav>')
    title = f'{"Уроки" if l["n"] == 16 else "Урок"} {l["label"]}. {l["short"]}'
    return full_page(head(title, f"{COURSE}: {l['title']}"), body(root, f"urok-{l['n']}", main_html))


def dovidnyk_page():
    root = "../"
    main_html = (f'<p class="crumbs"><a href="{root}index.html">Програма</a> / Довідник</p>'
                 f'<article><div class="doc">{md_to_html(read(ROOT / "dovidnyk.md"), root)}</div></article>'
                 f'<nav class="pager"><a href="{root}index.html"><small>← Програма</small>Програма курсу</a>'
                 f'<a class="next" href="urok-01.html"><small>Урок 1 →</small>Знайомство з Processing</a></nav>')
    return full_page(head("Довідник Processing", "Шпаргалка з функцій Processing і словник термінів"),
                     body(root, "dovidnyk", main_html))


def sketch_word(k):
    if k == 0:
        return "творчий проєкт"
    return f"{k} скетч" if k == 1 else f"{k} скетчі"


def index_parts():
    root = ""
    cards = []
    for title, a, b in MODULES:
        items = "".join(
            f'<li><a href="storinky/urok-{l["n"]:02d}.html"><span class="n">{"Уроки" if l["n"] == 16 else "Урок"} {l["label"]}</span>'
            f'<span class="t">{html.escape(l["short"])}</span>'
            f'<span class="m">{sketch_word(len(sketches_for(l["n"])))}</span></a></li>'
            for l in lessons if a <= l["n"] <= b)
        cards.append(f'<h2 class="mod-title">{title}</h2><ul class="cards">{items}</ul>')
    main_html = f"""<section class="hero">
      <h1>Малюємо, анімуємо й граємо кодом</h1>
      <p>Курс програмування мовою Processing для учнів, які вже знають основи. Складено за посібниками Різа та Фрая і Шиффмана: від пікселя до власної гри чи генеративного постера.</p>
      <div class="stage">
        <canvas id="grid" width="900" height="230" aria-label="Система координат Processing: наведіть курсор, щоб побачити mouseX і mouseY"></canvas>
        <div class="readout" id="readout">mouseX = 160 · mouseY = 90</div>
      </div>
      <div class="stats"><span><b>16</b> уроків + проєкт</span><span><b>25</b> скетчів</span><span><b>25</b> питань у тесті</span><span>оцінювання за <b>12</b>-бальною шкалою</span></div>
    </section>
    {"".join(cards)}
    <article><div class="doc">{md_to_html(read(ROOT / "README.md"), root)}</div></article>
    <nav class="pager"><span></span><a class="next" href="storinky/urok-01.html"><small>Почати →</small>Урок 1. Знайомство з Processing</a></nav>"""
    return (head("Processing у 9 класі", f"{COURSE}: програма курсу для 9 класу"),
            body(root, "home", main_html, read(TOOLS / "polotno.js")))


OUT.mkdir(exist_ok=True)
for i, l in enumerate(lessons):
    prev = lessons[i - 1] if i > 0 else None
    nxt = lessons[i + 1] if i + 1 < len(lessons) else None
    (OUT / f"urok-{l['n']:02d}.html").write_text(lesson_page(l, prev, nxt), encoding="utf-8")
(OUT / "dovidnyk.html").write_text(dovidnyk_page(), encoding="utf-8")
h, b = index_parts()
(ROOT / "index.html").write_text(full_page(h, b), encoding="utf-8")

# Необов'язково: версія головної без обгортки <html>/<head> для публікації як Artifact
if len(sys.argv) > 2 and sys.argv[1] == "--artifact":
    pathlib.Path(sys.argv[2]).write_text(h + "\n" + b + "\n", encoding="utf-8")

print(f"Зібрано: index.html, {len(lessons)} сторінок уроків і довідник у {OUT.relative_to(ROOT)}/")
