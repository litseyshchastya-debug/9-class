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
import json
import pathlib
import re
import shutil
import sys

import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
OUT = ROOT / "storinky"
sys.path.insert(0, str(TOOLS / "ide"))
from startery import STARTERY, STARTER_FROM_SKETCH, PISOCHNYTSIA  # noqa: E402

PJS_CDN = "https://cdn.jsdelivr.net/npm/processing-js@1.6.6/processing.min.js"

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


RUNNABLE = re.compile(r"\bsize\s*\(|\bvoid\s+setup\s*\(")


CLASS_DEF = re.compile(r"^class\s+(\w+)[^{]*\{", re.M)


def class_sources(text):
    """Класи з фрагментів коду уроку та зі скетчів курсу: назва → (код класу, кількість параметрів конструктора)."""
    found = {}
    sources = [m.group(1) for m in FENCE.finditer(text)]
    sources += [f["code"] for e in EXAMPLES for f in e["files"]]
    for src in sources:
        for m in CLASS_DEF.finditer(src):
            name = m.group(1)
            if name in found:
                continue
            depth, i = 0, m.end() - 1
            while i < len(src):
                depth += {"{": 1, "}": -1}.get(src[i], 0)
                if depth == 0:
                    break
                i += 1
            body = src[m.start():i + 1]
            ctor = re.search(rf"\b{name}\s*\(([^)]*)\)\s*\{{", body[len(m.group(0)):])
            argc = len([a for a in ctor.group(1).split(",") if a.strip()]) if ctor else 0
            found[name] = (body + "\n", argc)
    return found


def call_argc(args):
    depth, n, cur = 0, 0, ""
    for ch in args:
        depth += {"(": 1, ")": -1}.get(ch, 0)
        if ch == "," and depth == 0:
            n += 1
        cur += ch
    return n + 1 if cur.strip() else 0


def runnable_tabs(code, lesson_text):
    """Фрагмент можна запустити, якщо він має size()/setup() і всі класи, які він створює, відомі.
    Відсутні класи додаються окремими вкладками (як у Processing)."""
    if not RUNNABLE.search(code):
        return None
    tabs = [["Pryklad", code]]
    defined = set(m.group(1) for m in CLASS_DEF.finditer(code))
    known = class_sources(lesson_text)
    for m in re.finditer(r"\bnew\s+([A-Z]\w*)\s*\(((?:[^()]|\([^()]*\))*)\)", code):
        name, args = m.group(1), m.group(2)
        if name in defined or name in ("ArrayList", "PVector", "IntList", "FloatList", "StringList", "HashMap"):
            continue
        if name not in known or known[name][1] != call_argc(args):
            return None
        tabs.append([name, known[name][0]])
        defined.add(name)
    return tabs


def md_to_html(text, root, snippets=None):
    blocks = []

    def stash(m):
        code = m.group(1)
        block = code_block(code)
        tabs = runnable_tabs(code, text) if snippets is not None else None
        if tabs:
            snippets.append(tabs)
            block += (f'<button class="try" type="button" data-try="{len(snippets) - 1}">'
                      "▶ Спробувати в онлайн-середовищі</button>")
        blocks.append(block)
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
PDE_CSS = read(TOOLS / "ide" / "pde.css")
PDE_JS = read(TOOLS / "ide" / "pde.js")


def all_examples():
    ex = []
    for d in sorted((ROOT / "skechi").glob("L*_*")):
        main = d / f"{d.name}.pde"
        files = [main] + sorted(p for p in d.glob("*.pde") if p != main)
        ex.append({"lesson": int(d.name[1:3]), "name": d.name,
                   "files": [{"name": p.name, "code": read(p)} for p in files]})
    return ex


EXAMPLES = all_examples()


def json_script(id_, data):
    return (f'<script type="application/json" id="{id_}">'
            + json.dumps(data, ensure_ascii=False).replace("</", "<\\/") + "</script>")


def ide_block(key, tabs, intro, heading="Практикум в онлайн-середовищі Processing"):
    """Розділ з онлайн-середовищем Processing і скрипт його запуску."""
    section = (f'<section class="pde-section" id="praktykum"><h2>{heading}</h2>'
               f"<p>{intro}</p><div id=\"pde\"></div></section>")
    js = (PDE_JS + """
(function () {
  var data = JSON.parse(document.getElementById('pde-data').textContent);
  var ide = PDE.mount('#pde', {
    key: data.key, tabs: data.tabs, examples: data.examples, courseRef: 'dovidnyk.html',
    pjs: ['ide/processing.min.js', '""" + PJS_CDN + """']
  });
  var snippets = data.snippets || [];
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-try], [data-open-ex]');
    if (!t) return;
    if (t.hasAttribute('data-try')) { ide.loadCode(snippets[+t.getAttribute('data-try')], 'Pryklad'); return; }
    var name = t.getAttribute('data-open-ex');
    data.examples.forEach(function (ex) { if (ex.name === name) ide.loadExample(ex); });
    document.getElementById('praktykum').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();""")
    return section, js


def ide_data(key, tabs, snippets=None):
    return json_script("pde-data", {"key": key, "tabs": [{"name": n, "code": c} for n, c in tabs],
                                    "examples": EXAMPLES, "snippets": snippets or []})


IDE_INTRO = ("Виконуйте завдання уроку просто тут: пишіть код, натискайте ▶ і дивіться результат у вікні скетчу. "
             "Код зберігається в цьому браузері автоматично. Меню «Приклади» відкриває скетчі курсу, "
             "«Файл → Завантажити як .pde» допоможе перенести роботу в настільний Processing.")
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
                 + link(f"{root}storinky/seredovyshche.html", "ide", "Онлайн-середовище Processing")
                 + link(f"{root}storinky/dovidnyk.html", "dovidnyk", "Довідник і словник термінів")
                 + f'<li><a href="{root}test/processing_test.html" target="_blank" rel="noopener">Підсумковий тест ↗</a></li>'
                 + "</ol></div>")
    return "".join(parts)


def head(title, description, extra_css=""):
    return (f"<title>{html.escape(title)}</title>\n"
            '<meta name="claude:viewport-fit-sides" content="cover">\n'
            f'<meta name="description" content="{html.escape(description)}">\n'
            f"{FONTS}\n<style>\n{CSS}{extra_css}</style>")


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
                         f'<div class="files"><h3>{s["name"]}</h3>'
                         f'<button class="try" type="button" data-open-ex="{s["name"]}">▶ Відкрити в онлайн-середовищі</button>'
                         f'{files}</div></div>')
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

    snippets = []
    doc_html = md_to_html(l["md"], root, snippets)
    if l["n"] in STARTER_FROM_SKETCH:
        ex = next(e for e in EXAMPLES if e["name"] == STARTER_FROM_SKETCH[l["n"]])
        tabs = [(f["name"][:-4], f["code"]) for f in ex["files"]]
    else:
        tabs = STARTERY[l["n"]]
    ide_html, ide_js = ide_block(f"urok-{l['n']:02d}", tabs, IDE_INTRO)
    main_html = (f'<p class="crumbs"><a href="{root}index.html">Програма</a> / {"Уроки" if l["n"] == 16 else "Урок"} {l["label"]} з 17'
                 ' · <a href="#praktykum">до практикуму ↓</a></p>'
                 f'<article><div class="doc">{doc_html}</div>{ide_html}{sk_html}</article>'
                 f'<nav class="pager" aria-label="Попередній і наступний урок">{p}{nx}</nav>'
                 + ide_data(f"urok-{l['n']:02d}", tabs, snippets))
    title = f'{"Уроки" if l["n"] == 16 else "Урок"} {l["label"]}. {l["short"]}'
    return full_page(head(title, f"{COURSE}: {l['title']}", PDE_CSS), body(root, f"urok-{l['n']}", main_html, ide_js))


def ide_page():
    root = "../"
    ide_html, ide_js = ide_block("pisochnytsia", PISOCHNYTSIA,
                                 "Пісочниця для будь-яких експериментів. Усі скетчі курсу — у меню «Приклади», "
                                 "гарячі клавіші — у меню «Довідка».", "Пісочниця")
    main_html = (f'<p class="crumbs"><a href="{root}index.html">Програма</a> / Онлайн-середовище</p>'
                 f'<article><div class="doc"><h1>Онлайн-середовище Processing</h1>'
                 "<p>Навчальна копія середовища Processing, що працює просто в браузері: на комп'ютері, планшеті й телефоні. "
                 "Тут є вкладки, консоль, приклади, вибір кольору, збереження кадрів і файли для <code>loadImage()</code>.</p></div>"
                 f"{ide_html}</article>" + ide_data("pisochnytsia", PISOCHNYTSIA))
    return full_page(head("Онлайн-середовище Processing", "Навчальне середовище Processing у браузері", PDE_CSS),
                     body(root, "ide", main_html, ide_js))


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
      <p><a href="storinky/seredovyshche.html">Відкрити онлайн-середовище Processing →</a></p>
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
(OUT / "seredovyshche.html").write_text(ide_page(), encoding="utf-8")
(OUT / "ide").mkdir(exist_ok=True)
shutil.copy(TOOLS / "ide" / "processing.min.js", OUT / "ide" / "processing.min.js")
shutil.copy(TOOLS / "ide" / "LICENSE-processing-js.txt", OUT / "ide" / "LICENSE-processing-js.txt")
h, b = index_parts()
(ROOT / "index.html").write_text(full_page(h, b), encoding="utf-8")

# Необов'язково: версія головної без обгортки <html>/<head> для публікації як Artifact
if len(sys.argv) > 2 and sys.argv[1] == "--artifact":
    pathlib.Path(sys.argv[2]).write_text(h + "\n" + b + "\n", encoding="utf-8")

print(f"Зібрано: index.html, {len(lessons)} сторінок уроків, довідник і онлайн-середовище у {OUT.relative_to(ROOT)}/")
