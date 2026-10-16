"""Збирає весь курс в одну сторінку index.html.

Запуск із кореня репозиторію:  python3 tools/zibraty_sait.py
Береться: README.md, dovidnyk.md, uroky/*.md, skechi/*/*.pde, znimky/*.jpg
"""
import base64
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent


def read(path):
    return path.read_text(encoding="utf-8")


lessons = []
for f in sorted((ROOT / "uroky").glob("*.md")):
    text = read(f)
    n = int(re.match(r"(\d+)", f.name).group(1))
    title = text.splitlines()[0].lstrip("# ").strip()
    lessons.append({"n": n, "title": title, "md": text})

sketches = []
for d in sorted(p for p in (ROOT / "skechi").iterdir() if p.is_dir()):
    main = d / f"{d.name}.pde"
    files = [main] + sorted(p for p in d.glob("*.pde") if p != main)
    img = ROOT / "znimky" / f"{d.name}.jpg"
    sketches.append({
        "name": d.name,
        "files": [{"name": p.name, "code": read(p)} for p in files],
        "img": "data:image/jpeg;base64," + base64.b64encode(img.read_bytes()).decode() if img.exists() else "",
    })

data = {
    "readme": read(ROOT / "README.md"),
    "dovidnyk": read(ROOT / "dovidnyk.md"),
    "lessons": lessons,
    "sketches": sketches,
}
payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
template = read(ROOT / "tools" / "sait_shablon.html")
(ROOT / "index.html").write_text(template.replace("/*COURSE_DATA*/", payload), encoding="utf-8")
print(f"index.html: {len(lessons)} уроків, {len(sketches)} скетчів")
