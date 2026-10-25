/* Онлайн-середовище Processing для курсу «Креативне програмування в Processing».
 * Код скетчу виконується бібліотекою Processing.js (MIT), яка перекладає Processing (Java) у JavaScript.
 * Щоб поведінка збігалася з настільним Processing, перед запуском середовище:
 *   — перевіряє дужки та пропущені крапки з комою (як PDE, а не як JavaScript);
 *   — емулює цілочисельне ділення int / int;
 *   — зупиняє «нескінченні» цикли;
 *   — підставляє файли з папки data для loadImage().
 */
(function () {
  'use strict';

  // ---------- Допоміжне ----------
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (html != null) e.innerHTML = html;
    return e;
  }
  var store = {
    get: function (k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || '');
  var MOD = IS_MAC ? '⌘' : 'Ctrl+';

  // ---------- Підсвічування ----------
  var KW = 'if else for while do return new class void true false null this extends break continue switch case default public private static final import super';
  var TYPES = 'int float boolean char String color PImage PFont PVector ArrayList IntList FloatList StringList HashMap double long byte';
  var BUILTIN = ('size background fill noFill stroke noStroke strokeWeight strokeCap strokeJoin point line rect ellipse circle square triangle quad arc ' +
    'beginShape vertex curveVertex bezierVertex endShape rectMode ellipseMode colorMode println print random randomSeed noise noiseSeed map constrain dist abs sqrt ' +
    'pow min max round floor ceil sin cos tan atan2 radians degrees lerp norm sq translate rotate rotateX rotateY rotateZ scale pushMatrix popMatrix push pop ' +
    'image imageMode loadImage tint noTint filter loadPixels updatePixels text textSize textAlign textFont createFont textWidth textLeading millis second minute hour day month year ' +
    'frameRate saveFrame save noLoop loop redraw red green blue alpha hue saturation brightness lerpColor setup draw mousePressed keyPressed mouseReleased ' +
    'mouseDragged mouseMoved mouseClicked keyReleased smooth noSmooth createImage get set cursor noCursor box sphere lights camera exit append').split(' ');
  function toSet(a) { var o = Object.create(null); (typeof a === 'string' ? a.split(' ') : a).forEach(function (w) { o[w] = 1; }); return o; }
  var kwSet = toSet(KW), tySet = toSet(TYPES), biSet = toSet(BUILTIN);
  var HL_RE = /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])'?)|(#[0-9A-Fa-f]{6}\b|\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/g;
  function highlight(src) {
    var out = '', last = 0, m;
    HL_RE.lastIndex = 0;
    while ((m = HL_RE.exec(src))) {
      out += esc(src.slice(last, m.index));
      var t = m[0], cls = null;
      if (m[1]) cls = 't-com';
      else if (m[2]) cls = 't-str';
      else if (m[3]) cls = 't-num';
      else if (kwSet[t]) cls = 't-kw';
      else if (tySet[t]) cls = 't-type';
      else if (biSet[t] || /^[A-Z][A-Z_]+$/.test(t)) cls = 't-fn';
      out += cls ? '<span class="' + cls + '">' + esc(t) + '</span>' : esc(t);
      last = HL_RE.lastIndex;
    }
    return out + esc(src.slice(last));
  }

  // ---------- Маскування рядків і коментарів (для аналізу коду) ----------
  // Повертає рядок тієї самої довжини, де вміст рядків/коментарів замінено пробілами (переноси рядків зберігаються).
  function mask(src) {
    return src.replace(/\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, function (s) {
      if (s[0] === '"' || s[0] === "'") return s[0] + s.slice(1, -1).replace(/[^\n]/g, ' ') + s[s.length - 1];
      return s.replace(/[^\n]/g, ' ');
    });
  }
  function lineOf(src, idx) { return src.slice(0, idx).split('\n').length; }

  // ---------- Перевірка синтаксису (як у PDE) ----------
  function checkBrackets(tab) {
    var m = mask(tab.code), stack = [], pairs = { ')': '(', ']': '[', '}': '{' };
    for (var i = 0; i < m.length; i++) {
      var c = m[i];
      if (c === '(' || c === '[' || c === '{') stack.push({ c: c, i: i });
      else if (c === ')' || c === ']' || c === '}') {
        var top = stack.pop();
        if (!top) return { line: lineOf(m, i), msg: 'Зайва дужка «' + c + '». Знайдіть, де її відкрито, або видаліть.' };
        if (top.c !== pairs[c]) return { line: lineOf(m, i), msg: 'Дужка «' + c + '» не відповідає відкритій «' + top.c + '» (рядок ' + lineOf(m, top.i) + ').' };
      }
    }
    if (stack.length) {
      var t = stack.pop();
      var close = { '(': ')', '[': ']', '{': '}' }[t.c];
      return { line: lineOf(m, t.i), msg: 'Дужку «' + t.c + '» не закрито. Додайте «' + close + '».' };
    }
    if (/"[^"\n]*$/m.test(tab.code.replace(/\/\/[^\n]*/g, '').replace(/"(?:\\.|[^"\\\n])*"/g, '""'))) {
      var lines = tab.code.split('\n');
      for (var k = 0; k < lines.length; k++) {
        var clean = lines[k].replace(/\/\/.*$/, '').replace(/"(?:\\.|[^"\\])*"/g, '');
        if (clean.indexOf('"') >= 0) return { line: k + 1, msg: 'Рядок тексту не закрито лапками «"».' };
      }
    }
    return null;
  }

  var STMT_START = /^(if|for|while|else|do|switch|case|default|try|catch|finally|class|void|public|private|static|abstract|interface|import|@)\b/;
  function checkSemicolons(tab) {
    var lines = mask(tab.code).split('\n');
    var depthParen = 0, braces = [], prevSig = '';
    for (var i = 0; i < lines.length; i++) {
      var raw = lines[i];
      var line = raw.trim();
      var before = depthParen;
      var inInitBefore = braces.length && braces[braces.length - 1] === 'init';
      for (var j = 0; j < raw.length; j++) {
        var ch = raw[j];
        if (ch === '(') depthParen++;
        else if (ch === ')') depthParen--;
        else if (ch === '{') braces.push(/[=\],{(]$/.test(prevSig) ? 'init' : 'block');   // «= {» — ініціалізатор масиву
        else if (ch === '}') braces.pop();
        if (!/\s/.test(ch)) prevSig = (prevSig + ch).slice(-3);
      }
      var inInit = braces.length && braces[braces.length - 1] === 'init';
      if (!line || before > 0 || depthParen > 0 || inInitBefore || inInit) continue;
      if (!/[\w)\]"'+\-]$/.test(line)) continue;            // рядок закінчується на ; { } , оператор тощо
      if (/(\+\+|--)$/.test(line) === false && /[+\-]$/.test(line)) continue; // перенос виразу після + або -
      if (STMT_START.test(line)) continue;                   // if (...), for (...), void f(), class …
      if (/^\}?\s*else\b/.test(line)) continue;
      if (/^[\w<>\[\],\s]+\([^;]*\)\s*$/.test(line) && !/=/.test(line)) {
        // може бути оголошення методу: «float area(float r)» з «{» у наступному рядку
        var nxt = nextLine(lines, i);
        if (nxt && nxt[0] === '{') continue;
        if (/^[A-Za-z_][\w<>\[\]]*\s+[A-Za-z_]\w*\s*\(/.test(line) && !nxt) continue;
      }
      var next = nextLine(lines, i);
      if (next === null) return { line: i + 1, msg: 'Схоже, пропущено «;» у кінці рядка ' + (i + 1) + '.' };
      if (/^[{.?:&|+\-*\/%=<>)\]]/.test(next)) continue;      // вираз продовжується
      if (/^(else|catch|finally)\b/.test(next)) continue;
      return { line: i + 1, msg: 'Схоже, пропущено «;» у кінці рядка ' + (i + 1) + '.' };
    }
    return null;
  }
  function nextLine(lines, i) {
    for (var k = i + 1; k < lines.length; k++) { var t = lines[k].trim(); if (t) return t; }
    return null;
  }

  // Попередження (програма запускається, але вчитель Java-синтаксису їх би підкреслив)
  function lint(tab) {
    var out = [], m = mask(tab.code).split('\n');
    m.forEach(function (line, i) {
      if (/\bint\s+\w+\s*=\s*random\s*\(/.test(line)) out.push({ line: i + 1, msg: 'random() повертає float. У Processing тут буде помилка: напишіть int(random(...)).' });
      if (/\bif\s*\((?:[^=!<>()]|\([^()]*\))*[^=!<>]=[^=](?:[^()]|\([^()]*\))*\)/.test(line)) out.push({ line: i + 1, msg: 'В умові стоїть «=» (присвоєння). Для порівняння потрібно «==».' });
    });
    return out;
  }

  // ---------- Перетворення коду перед запуском ----------
  var INT_SYSTEM = toSet('width height mouseX mouseY pmouseX pmouseY frameCount keyCode displayWidth displayHeight');
  var INT_FUNCS = toSet('int __pdeIdiv round floor ceil millis second minute hour day month year');
  // Імена, оголошені як int (змінні, масиви int[], параметри, функції, що повертають int)
  function intNames(m) {
    var names = Object.create(null), re = /\bint\s*(?:\[\s*\]\s*)?(?=[A-Za-z_])/g, x;
    while ((x = re.exec(m))) {
      var i = re.lastIndex, depth = 0;
      while (i < m.length) {
        var id = /^[A-Za-z_]\w*/.exec(m.slice(i));
        if (!id) break;
        names[id[0]] = 1;
        i += id[0].length;
        while (i < m.length) {               // до коми на нульовому рівні або кінця оголошення
          var c = m[i];
          if ('([{'.indexOf(c) >= 0) depth++;
          else if (')]}'.indexOf(c) >= 0) { if (depth === 0) break; depth--; }
          else if (depth === 0 && (c === ';' || c === ',')) break;
          i++;
        }
        if (m[i] !== ',') break;
        i++;
        while (/\s/.test(m[i] || '')) i++;
      }
    }
    return names;
  }
  function matchBack(m, j, open, close) {      // m[j] — закривна дужка; повертає індекс відкривної
    for (var d = 0; j >= 0; j--) { if (m[j] === close) d++; else if (m[j] === open && --d === 0) return j; }
    return -1;
  }
  function matchFwd(m, j, open, close) {
    for (var d = 0; j < m.length; j++) { if (m[j] === open) d++; else if (m[j] === close && --d === 0) return j; }
    return -1;
  }
  function groupIsInt(text, ints) {
    var re = /[A-Za-z_]\w*(?:\s*\()?|\d+\.\d*|\.\d+|\d+|\S/g, t;
    while ((t = re.exec(text))) {
      var w = t[0];
      if (/^\d+$/.test(w)) continue;
      if (/^[\d.]/.test(w)) return false;
      if (/^[A-Za-z_]/.test(w)) {
        var name = w.replace(/\s*\($/, '');
        if (/\($/.test(w)) { if (!INT_FUNCS[name] && !ints[name]) return false; continue; }
        if (name === 'length' || ints[name] || INT_SYSTEM[name]) continue;
        return false;
      }
      if ('+-*%/()[],'.indexOf(w) < 0) return false;
    }
    return true;
  }
  // Лівий операнд ділення: ланцюжок множників через * і % (a * b / c — ціле, як у Java)
  function leftExpr(m, i, ints) {
    var j = i - 1, isInt = true, s;
    for (;;) {
      while (j >= 0 && /\s/.test(m[j])) j--;
      if (j < 0) return null;
      var c = m[j];
      if (c === ')') {
        var g = matchBack(m, j, '(', ')'); if (g < 0) return null;
        var k = g; while (k > 0 && /\w/.test(m[k - 1])) k--;
        var fname = m.slice(k, g);
        if (fname) { if (/^(if|while|for|switch|return)$/.test(fname)) return null; isInt = isInt && !!(INT_FUNCS[fname] || ints[fname]); s = k; }
        else { isInt = isInt && groupIsInt(m.slice(g + 1, j), ints); s = g; }
      } else if (c === ']' || /\w/.test(c)) {
        var e = j;
        if (c === ']') { var b = matchBack(m, j, '[', ']'); if (b < 0) return null; e = b - 1; }
        var k2 = e; while (k2 >= 0 && /[\w.]/.test(m[k2])) k2--;
        var tok = m.slice(k2 + 1, e + 1);
        if (!tok) return null;
        if (/^\d+$/.test(tok)) { if (c === ']') return null; }
        else if (/^[\d.]/.test(tok)) isInt = false;
        else if (/\.length$/.test(tok) && c !== ']') { /* int */ }
        else if (tok.indexOf('.') >= 0) isInt = false;
        else if (!(ints[tok] || INT_SYSTEM[tok])) isInt = false;
        s = k2 + 1;
      } else return null;
      j = s - 1;
      while (j >= 0 && /\s/.test(m[j])) j--;
      if (j >= 0 && (m[j] === '*' || m[j] === '%') && m[j - 1] !== '/' && m[j + 1] !== '/') { j--; continue; }
      if (j >= 0 && (m[j] === '/' || m[j] === '.')) return null;   // a / b / c — спершу перетворюється ліве ділення
      if (j >= 0 && m[j] === ')') {                                 // (float) a / b — приведення типу: ділення дробове
        var cg = matchBack(m, j, '(', ')');
        if (cg >= 0 && /^\s*(float|double)\s*$/.test(m.slice(cg + 1, j))) return null;
      }
      return { s: s, isInt: isInt };
    }
  }
  function rightTerm(m, i, ints) {
    var j = i;
    while (j < m.length && /\s/.test(m[j])) j++;
    var st = j, isInt;
    if (m[j] === '-' || m[j] === '+') j++;
    if (m[j] === '(') {
      var e = matchFwd(m, j, '(', ')'); if (e < 0) return null;
      isInt = groupIsInt(m.slice(j + 1, e), ints); j = e + 1;
    } else {
      var id = /^(?:[A-Za-z_]\w*|\d+(?:\.\d*)?)/.exec(m.slice(j));
      if (!id) return null;
      var tok = id[0]; j += tok.length;
      if (m[j] === '(') {
        var e2 = matchFwd(m, j, '(', ')'); if (e2 < 0) return null;
        isInt = !!(INT_FUNCS[tok] || ints[tok]); j = e2 + 1;
      } else {
        if (/^\d+$/.test(tok)) isInt = true;
        else if (/^\d/.test(tok)) isInt = false;
        else isInt = !!(ints[tok] || INT_SYSTEM[tok]);
        if (m[j] === '[') { var e3 = matchFwd(m, j, '[', ']'); if (e3 < 0) return null; j = e3 + 1; }
        if (m.slice(j, j + 7) === '.length') { j += 7; isInt = true; }
      }
    }
    if (m[j] === '.' || m[j] === '(') return null;
    return { s: st, e: j, isInt: isInt };
  }
  // int / int → __pdeIdiv(a, b): ціле ділення як у Java (під час виконання ще раз перевіряється, що числа цілі)
  function rewriteIntDivision(code) {
    var ints = intNames(mask(code));
    for (var guard = 0; guard < 3000; guard++) {
      var m = mask(code), done = true;
      for (var i = 0; i < m.length; i++) {
        if (m[i] !== '/' || m[i + 1] === '=' || m[i + 1] === '/' || m[i + 1] === '*' || m[i - 1] === '/' || m[i - 1] === '*') continue;
        var L = leftExpr(m, i, ints); if (!L || !L.isInt) continue;
        var R = rightTerm(m, i + 1, ints); if (!R || !R.isInt) continue;
        code = code.slice(0, L.s) + '__pdeIdiv(' + code.slice(L.s, i).replace(/\s+$/, '') + ', ' + code.slice(R.s, R.e) + ')' + code.slice(R.e);
        done = false;
        break;
      }
      if (done) break;
    }
    return code;
  }
  // На початок тіла кожного циклу додаємо __pdeGuard() — він зупиняє скетч, якщо цикл «завис».
  function addLoopGuards(code) {
    var masked = mask(code), re = /\b(for|while)\s*\(/g, ins = [], m;
    while ((m = re.exec(masked))) {
      var i = re.lastIndex, depth = 1;
      while (i < masked.length && depth) { if (masked[i] === '(') depth++; else if (masked[i] === ')') depth--; i++; }
      var j = i; while (j < masked.length && /\s/.test(masked[j])) j++;
      if (masked[j] === '{') ins.push(j + 1);
    }
    for (var k = ins.length - 1; k >= 0; k--) code = code.slice(0, ins[k]) + ' __pdeGuard();' + code.slice(ins[k]);
    return code;
  }

  // ---------- Завантаження Processing.js ----------
  var pjsPromise = null;
  function loadPjs(srcs) {
    if (window.Processing) return Promise.resolve();
    if (pjsPromise) return pjsPromise;
    pjsPromise = new Promise(function (resolve, reject) {
      var i = 0;
      (function next() {
        if (i >= srcs.length) { pjsPromise = null; reject(new Error('load')); return; }
        var s = document.createElement('script');
        s.src = srcs[i++];
        if (/^https?:/.test(s.src)) s.crossOrigin = 'anonymous';
        s.onload = function () { window.Processing ? resolve() : next(); };
        s.onerror = next;
        document.head.appendChild(s);
      })();
    });
    return pjsPromise;
  }

  // ---------- Пояснення помилок українською ----------
  function explain(msg) {
    var m;
    if ((m = msg.match(/(\w+) is not defined/))) return 'Не знайдено змінну чи функцію «' + m[1] + '». Перевірте назву (регістр літер!) і чи оголошено її.';
    if ((m = msg.match(/([\w.$]+) is not a function/))) return '«' + m[1].replace(/^\$p\./, '') + '» — не функція або такої функції немає. Перевірте назву й кількість аргументів.';
    if (/Cannot read propert(y|ies) of (null|undefined)/.test(msg)) return 'Звернення до об’єкта, якого ще не створено (у Java — NullPointerException). Чи не забули ви new? Чи завантажено файл?';
    if (/Cannot set propert(y|ies) of (null|undefined)/.test(msg)) return 'Запис у неіснуючий об’єкт або елемент масиву (NullPointerException / вихід за межі масиву).';
    if (/__pdeLoop/.test(msg)) return 'Цикл виконується занадто довго — схоже на нескінченний цикл. Перевірте, чи змінюється змінна в умові while/for.';
    if (/Unexpected token|Unexpected identifier|missing \) after|Unexpected end/.test(msg)) return 'Синтаксична помилка: перевірте крапки з комою, дужки й лапки.';
    if (/Maximum call stack/.test(msg)) return 'Функція викликає сама себе без кінця (нескінченна рекурсія). Додайте умову зупинки.';
    return 'Помилка під час виконання: ' + msg;
  }

  // ---------- Середовище ----------
  function PDE(root, opts) {
    this.root = root;
    this.opts = opts;
    this.key = 'pde:' + opts.key;
    this.initial = JSON.parse(JSON.stringify(opts.tabs));
    var saved = store.get(this.key);
    this.state = saved && saved.tabs && saved.tabs.length ? saved : { tabs: JSON.parse(JSON.stringify(opts.tabs)), files: {} };
    if (!this.state.files) this.state.files = {};
    this.active = 0;
    this.fontSize = 0;
    this.inst = null;
    this.prevState = null;
    this.build();
    this.selectTab(0);
    this.status(saved ? 'Відновлено ваш збережений код. Натисніть ▶, щоб запустити.' : 'Готово. Натисніть ▶ (або ' + MOD + 'R), щоб запустити скетч.');
  }

  PDE.prototype.build = function () {
    var self = this, r = this.root;
    r.classList.add('pde');
    r.innerHTML = '';
    // меню
    var bar = el('div', { class: 'pde-menubar', role: 'menubar' });
    var menus = [
      ['Файл', [
        ['Новий скетч', 'newSketch'], ['Відкрити .pde…', 'openFile'], ['sep'],
        ['Зберегти', 'save', MOD + 'S'], ['Завантажити як .pde', 'download'], ['Копіювати весь код', 'copyAll'], ['sep'],
        ['Повернути початковий код уроку', 'reset']
      ]],
      ['Редагування', [
        ['Скасувати', 'undo', MOD + 'Z'], ['Повторити', 'redo', IS_MAC ? '⇧⌘Z' : 'Ctrl+Y'], ['sep'],
        ['Виділити все', 'selectAll', MOD + 'A'], ['Коментувати / розкоментувати', 'comment', MOD + '/'],
        ['Збільшити відступ', 'indent', 'Tab'], ['Зменшити відступ', 'outdent', '⇧Tab'], ['sep'],
        ['Більший шрифт', 'fontUp'], ['Менший шрифт', 'fontDown']
      ]],
      ['Скетч', [
        ['Запустити', 'run', MOD + 'R'], ['Презентувати (на весь екран)', 'present', IS_MAC ? '⇧⌘R' : 'Ctrl+Shift+R'], ['Зупинити', 'stop'], ['sep'],
        ['Нова вкладка', 'addTab'], ['Перейменувати вкладку', 'renameTab'], ['Видалити вкладку', 'deleteTab'], ['sep'],
        ['Додати файл (зображення) у data…', 'addFile']
      ]],
      ['Інструменти', [
        ['Автоформатування', 'format', MOD + 'T'], ['Вибір кольору…', 'colorPicker'], ['Зберегти кадр', 'saveFrame']
      ]],
      ['Приклади', 'examples'],
      ['Довідка', [
        ['Знайти слово в довіднику Processing', 'reference'], ['Довідник курсу', 'courseRef'], ['sep'],
        ['Гарячі клавіші', 'keys'], ['Про онлайн-середовище', 'about']
      ]]
    ];
    menus.forEach(function (m) {
      var wrap = el('div', { class: 'pde-menu' });
      var btn = el('button', { type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false', text: m[0] });
      var list = el('ul', { class: 'pde-menu-list', role: 'menu', hidden: '' });
      if (m[1] === 'examples') self.fillExamples(list);
      else m[1].forEach(function (it) {
        var li = el('li');
        if (it[0] === 'sep') { li.className = 'sep'; li.setAttribute('role', 'separator'); }
        else {
          var b = el('button', { type: 'button', role: 'menuitem', 'data-cmd': it[1] }, esc(it[0]) + (it[2] ? '<kbd>' + esc(it[2]) + '</kbd>' : ''));
          li.appendChild(b);
        }
        list.appendChild(li);
      });
      btn.addEventListener('click', function (e) { e.stopPropagation(); self.toggleMenu(wrap); });
      wrap.appendChild(btn); wrap.appendChild(list); bar.appendChild(wrap);
    });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cmd]');
      if (b) { self.closeMenus(); self.cmd(b.getAttribute('data-cmd'), b); }
    });
    document.addEventListener('click', function (e) { if (!r.contains(e.target)) self.closeMenus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') self.closeMenus(); });
    r.appendChild(bar);

    // панель інструментів
    var tb = el('div', { class: 'pde-toolbar' });
    tb.innerHTML = '<button type="button" class="pde-btn-round run" title="Запустити (' + MOD + 'R)" aria-label="Запустити"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg></button>' +
      '<button type="button" class="pde-btn-round stop" title="Зупинити" aria-label="Зупинити"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="3.5" width="9" height="9" rx="1" fill="currentColor"/></svg></button>' +
      '<span class="pde-sketchname"></span><span class="pde-mode" title="Код виконується в браузері за допомогою Processing.js">Java · онлайн</span>';
    tb.querySelector('.run').addEventListener('click', function () { self.run(); });
    tb.querySelector('.stop').addEventListener('click', function () { self.stop(); });
    r.appendChild(tb);
    this.nameEl = tb.querySelector('.pde-sketchname');

    this.tabsEl = el('div', { class: 'pde-tabs', role: 'tablist' });
    r.appendChild(this.tabsEl);
    this.filesEl = el('div', { class: 'pde-files', hidden: '' });
    r.appendChild(this.filesEl);

    // редактор
    var ed = el('div', { class: 'pde-editor' });
    this.gutter = el('pre', { class: 'pde-gutter', 'aria-hidden': 'true' });
    var code = el('div', { class: 'pde-code' });
    this.hl = el('pre', { class: 'pde-hl', 'aria-hidden': 'true' });
    this.input = el('textarea', { class: 'pde-input', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', wrap: 'off', 'aria-label': 'Редактор коду Processing', id: 'pde-input-' + this.opts.key });
    code.appendChild(this.hl); code.appendChild(this.input);
    ed.appendChild(this.gutter); ed.appendChild(code);
    r.appendChild(ed);
    this.input.addEventListener('input', function () { self.onEdit(); });
    this.input.addEventListener('scroll', function () { self.syncScroll(); });
    this.input.addEventListener('keydown', function (e) { self.onKey(e); });

    // рядок стану і консоль
    this.statusEl = el('div', { class: 'pde-status', role: 'status', 'aria-live': 'polite' }, '<span class="msg"></span>');
    r.appendChild(this.statusEl);
    var cw = el('div', { class: 'pde-console-wrap' });
    var ch = el('div', { class: 'pde-console-head' }, '<span>Консоль</span><button type="button">Очистити</button>');
    ch.querySelector('button').addEventListener('click', function () { self.consoleEl.innerHTML = ''; });
    this.consoleEl = el('pre', { class: 'pde-console', 'aria-live': 'polite' });
    cw.appendChild(ch); cw.appendChild(this.consoleEl);
    r.appendChild(cw);

    // вікно скетчу
    this.win = el('div', { class: 'pde-window' });
    this.win.innerHTML = '<div class="pde-window-bar"><span class="title">Вікно скетчу</span>' +
      '<button type="button" data-w="frame">Зберегти кадр</button><button type="button" data-w="present">На весь екран</button></div>' +
      '<div class="pde-stage"><p class="idle">Тут з’явиться вікно програми. Натисніть ▶ «Запустити».</p></div>' +
      '<div class="pde-window-foot"><span class="xy">mouseX: — · mouseY: —</span><span class="fps"></span><span>Клацніть на полотні, щоб керувати з клавіатури</span></div>';
    this.win.addEventListener('click', function (e) {
      var b = e.target.closest('[data-w]');
      if (!b) return;
      if (b.getAttribute('data-w') === 'frame') self.cmd('saveFrame'); else self.cmd('present');
    });
    r.parentNode.insertBefore(this.win, r.nextSibling);
    this.stage = this.win.querySelector('.pde-stage');
    this.xyEl = this.win.querySelector('.xy');
    this.fpsEl = this.win.querySelector('.fps');

    this.fileInput = el('input', { type: 'file', accept: '.pde,.txt,.java', hidden: '' });
    this.imgInput = el('input', { type: 'file', accept: 'image/*', hidden: '', multiple: '' });
    r.appendChild(this.fileInput); r.appendChild(this.imgInput);
    this.fileInput.addEventListener('change', function () { self.readPde(this.files[0]); this.value = ''; });
    this.imgInput.addEventListener('change', function () { self.readImages(this.files); this.value = ''; });
    this.renderFiles();
  };

  PDE.prototype.fillExamples = function (list) {
    var self = this, groups = {};
    (this.opts.examples || []).forEach(function (ex) { (groups[ex.lesson] = groups[ex.lesson] || []).push(ex); });
    Object.keys(groups).sort(function (a, b) { return a - b; }).forEach(function (n) {
      list.appendChild(el('li', { class: 'grp', text: 'Урок ' + n }));
      groups[n].forEach(function (ex) {
        var li = el('li');
        var b = el('button', { type: 'button', role: 'menuitem', text: ex.name });
        b.addEventListener('click', function () { self.closeMenus(); self.loadExample(ex); });
        li.appendChild(b); list.appendChild(li);
      });
    });
  };
  PDE.prototype.toggleMenu = function (wrap) {
    var list = wrap.querySelector('.pde-menu-list'), btn = wrap.querySelector('button');
    var open = list.hidden;
    this.closeMenus();
    if (open) { list.hidden = false; btn.setAttribute('aria-expanded', 'true'); var f = list.querySelector('button'); if (f) f.focus(); }
  };
  PDE.prototype.closeMenus = function () {
    this.root.querySelectorAll('.pde-menu-list').forEach(function (l) { l.hidden = true; });
    this.root.querySelectorAll('.pde-menu > button').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  };

  // ---------- Вкладки ----------
  PDE.prototype.renderTabs = function () {
    var self = this;
    this.tabsEl.innerHTML = '';
    this.state.tabs.forEach(function (t, i) {
      var tab = el('div', { class: 'pde-tab' + (i === self.active ? ' active' : ''), role: 'presentation' });
      var b = el('button', { type: 'button', role: 'tab', 'aria-selected': i === self.active ? 'true' : 'false', text: t.name, title: 'Двічі клацніть, щоб перейменувати' });
      b.addEventListener('click', function () { self.selectTab(i); });
      b.addEventListener('dblclick', function () { self.renameTab(i); });
      tab.appendChild(b);
      if (i > 0) {
        var x = el('button', { type: 'button', class: 'x', 'aria-label': 'Видалити вкладку ' + t.name, text: '×' });
        x.addEventListener('click', function () { self.deleteTab(i); });
        tab.appendChild(x);
      }
      self.tabsEl.appendChild(tab);
    });
    var add = el('button', { type: 'button', class: 'pde-addtab', title: 'Нова вкладка', 'aria-label': 'Нова вкладка', text: '+' });
    add.addEventListener('click', function () { self.addTab(); });
    this.tabsEl.appendChild(add);
    this.nameEl.textContent = this.state.tabs[0].name;
  };
  PDE.prototype.selectTab = function (i) {
    this.active = i;
    this.renderTabs();
    this.input.value = this.state.tabs[i].code;
    this.errLine = null;
    this.refresh();
    this.input.scrollTop = 0; this.input.scrollLeft = 0; this.syncScroll();
  };
  PDE.prototype.addTab = function () {
    var self = this;
    this.dialog('Нова вкладка', '<p>Назва вкладки — зазвичай назва класу, наприклад <code>Ball</code>.</p><div class="row"><input id="pde-tabname" type="text" value="Tab' + (this.state.tabs.length) + '" style="flex:1;padding:8px;font:inherit;border:1px solid var(--rule);border-radius:5px;background:var(--panel);color:var(--ink)"></div>',
      [['Скасувати'], ['Створити', function (d) {
        var n = self.cleanName(d.querySelector('#pde-tabname').value);
        if (!n) return false;
        self.state.tabs.push({ name: n, code: '// Вкладка ' + n + '\n' });
        self.save(true); self.selectTab(self.state.tabs.length - 1); self.input.focus();
      }, true]], '#pde-tabname');
  };
  PDE.prototype.cleanName = function (n) { n = (n || '').trim().replace(/\.pde$/, '').replace(/[^\w]/g, '_'); return /^[A-Za-z_]\w*$/.test(n) ? n : ''; };
  PDE.prototype.renameTab = function (i) {
    var self = this; if (i == null) i = this.active;
    var t = this.state.tabs[i];
    this.dialog('Перейменувати вкладку', '<p>Лише латинські літери, цифри та «_»; не з цифри.</p><div class="row"><input id="pde-tabname" type="text" value="' + esc(t.name) + '" style="flex:1;padding:8px;font:inherit;border:1px solid var(--rule);border-radius:5px;background:var(--panel);color:var(--ink)"></div>',
      [['Скасувати'], ['Перейменувати', function (d) {
        var n = self.cleanName(d.querySelector('#pde-tabname').value);
        if (!n) return false;
        t.name = n; self.save(true); self.renderTabs();
      }, true]], '#pde-tabname');
  };
  PDE.prototype.deleteTab = function (i) {
    var self = this; if (i == null) i = this.active;
    if (i === 0) { this.status('Головну вкладку видалити не можна.', true); return; }
    this.dialog('Видалити вкладку «' + esc(this.state.tabs[i].name) + '»?', '<p>Код цієї вкладки буде втрачено.</p>',
      [['Скасувати'], ['Видалити', function () { self.state.tabs.splice(i, 1); self.save(true); self.selectTab(0); }, true]]);
  };

  // ---------- Редактор ----------
  PDE.prototype.onEdit = function () {
    this.state.tabs[this.active].code = this.input.value;
    this.errLine = null;
    this.refresh();
    var self = this;
    clearTimeout(this.saveT);
    this.saveT = setTimeout(function () { self.save(true); }, 600);
  };
  PDE.prototype.refresh = function () {
    var v = this.input.value;
    this.hl.innerHTML = highlight(v) + '\n ';
    var n = v.split('\n').length, out = '';
    for (var i = 1; i <= n; i++) out += (i === this.errLine ? '<span class="err">' + i + '</span>' : i) + '\n';
    this.gutter.innerHTML = out + ' ';
    this.syncScroll();
  };
  PDE.prototype.syncScroll = function () {
    this.hl.scrollTop = this.input.scrollTop;
    this.hl.scrollLeft = this.input.scrollLeft;
    this.gutter.scrollTop = this.input.scrollTop;
  };
  PDE.prototype.insert = function (text, selStart, selEnd) {
    var ta = this.input;
    ta.focus();
    if (selStart != null) ta.setSelectionRange(selStart, selEnd);
    var ok = false;
    try { ok = document.execCommand('insertText', false, text); } catch (e) {}
    if (!ok) { ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end'); this.onEdit(); }
  };
  PDE.prototype.lineRange = function () {
    var ta = this.input, v = ta.value;
    var s = v.lastIndexOf('\n', ta.selectionStart - 1) + 1;
    var eIdx = ta.selectionEnd;
    if (eIdx > ta.selectionStart && v[eIdx - 1] === '\n') eIdx--;
    var e = v.indexOf('\n', eIdx); if (e < 0) e = v.length;
    return { s: s, e: e, text: v.slice(s, e) };
  };
  PDE.prototype.onKey = function (e) {
    var ta = this.input, mod = e.ctrlKey || e.metaKey;
    if (e.key === 'Escape') { this.tabEscape = true; return; }
    if (e.key === 'Tab' && !mod && !e.altKey) {
      if (this.tabEscape) { this.tabEscape = false; return; }   // Esc, потім Tab — вийти з редактора
      e.preventDefault();
      if (e.shiftKey) this.cmd('outdent');
      else if (ta.selectionStart !== ta.selectionEnd && ta.value.slice(ta.selectionStart, ta.selectionEnd).indexOf('\n') >= 0) this.cmd('indent');
      else this.insert('  ');
      return;
    }
    this.tabEscape = false;
    if (e.key === 'Enter' && !mod) {
      e.preventDefault();
      var v = ta.value, p = ta.selectionStart;
      var ls = v.lastIndexOf('\n', p - 1) + 1;
      var line = v.slice(ls, p);
      var indent = line.match(/^\s*/)[0];
      var before = v.slice(ls, p).trim(), after = v.slice(p, v.indexOf('\n', p) < 0 ? v.length : v.indexOf('\n', p)).trim();
      if (/\{$/.test(before)) {
        if (after[0] === '}') { this.insert('\n' + indent + '  \n' + indent); ta.setSelectionRange(p + indent.length + 3, p + indent.length + 3); return; }
        indent += '  ';
      }
      this.insert('\n' + indent);
      return;
    }
    if (e.key === '}' && !mod) {
      var v2 = ta.value, p2 = ta.selectionStart, ls2 = v2.lastIndexOf('\n', p2 - 1) + 1;
      if (/^\s+$/.test(v2.slice(ls2, p2))) {
        e.preventDefault();
        var ind = v2.slice(ls2, p2).replace(/ {1,2}$/, '');
        this.insert(ind + '}', ls2, p2);
        return;
      }
    }
    if (mod && !e.altKey) {
      var k = e.key.toLowerCase();
      if (k === 'r') { e.preventDefault(); if (e.shiftKey) this.cmd('present'); else this.run(); }
      else if (k === 's') { e.preventDefault(); this.cmd('save'); }
      else if (k === '/') { e.preventDefault(); this.cmd('comment'); }
      else if (k === 't') { e.preventDefault(); this.cmd('format'); }
    }
  };

  // ---------- Команди меню ----------
  PDE.prototype.cmd = function (c, src) {
    var self = this, ta = this.input;
    switch (c) {
      case 'run': return this.run();
      case 'stop': return this.stop();
      case 'present': return this.present();
      case 'save': this.save(); return;
      case 'newSketch':
        this.remember();
        this.state = { tabs: [{ name: 'sketch', code: 'void setup() {\n  size(400, 400);\n}\n\nvoid draw() {\n  background(255);\n  \n}\n' }], files: {} };
        this.save(true); this.renderFiles(); this.selectTab(0);
        this.status('Створено новий скетч.', false, true);
        return;
      case 'openFile': this.fileInput.click(); return;
      case 'addFile': this.imgInput.click(); return;
      case 'download': return this.download();
      case 'copyAll': return this.copyAll();
      case 'reset':
        this.dialog('Повернути початковий код?', '<p>Ваші зміни в усіх вкладках буде замінено кодом, з якого починається практикум цього уроку.</p>',
          [['Скасувати'], ['Повернути', function () {
            self.remember();
            self.state = { tabs: JSON.parse(JSON.stringify(self.initial)), files: {} };
            self.save(true); self.renderFiles(); self.selectTab(0);
            self.status('Початковий код повернуто.', false, true);
          }, true]]);
        return;
      case 'undo': ta.focus(); try { document.execCommand('undo'); } catch (e) {} return;
      case 'redo': ta.focus(); try { document.execCommand('redo'); } catch (e) {} return;
      case 'selectAll': ta.focus(); ta.select(); return;
      case 'comment': {
        var r = this.lineRange(), lines = r.text.split('\n');
        var all = lines.every(function (l) { return !l.trim() || /^\s*\/\//.test(l); });
        var out = lines.map(function (l) {
          if (!l.trim()) return l;
          return all ? l.replace(/^(\s*)\/\/ ?/, '$1') : l.replace(/^(\s*)/, '$1// ');
        }).join('\n');
        this.insert(out, r.s, r.e); ta.setSelectionRange(r.s, r.s + out.length);
        return;
      }
      case 'indent': case 'outdent': {
        var r2 = this.lineRange();
        var o2 = r2.text.split('\n').map(function (l) { return c === 'indent' ? '  ' + l : l.replace(/^ {1,2}/, ''); }).join('\n');
        this.insert(o2, r2.s, r2.e); ta.setSelectionRange(r2.s, r2.s + o2.length);
        return;
      }
      case 'fontUp': case 'fontDown':
        this.fontSize = Math.max(-3, Math.min(6, this.fontSize + (c === 'fontUp' ? 1 : -1)));
        var base = window.matchMedia('(max-width: 900px)').matches ? 16 : 14;
        [this.input, this.hl, this.gutter].forEach(function (x) { x.style.fontSize = (base + self.fontSize) + 'px'; x.style.lineHeight = Math.round((base + self.fontSize) * 1.45) + 'px'; });
        this.syncScroll();
        return;
      case 'format': {
        var depth = 0, res = [], m = mask(ta.value).split('\n'), raw = ta.value.split('\n');
        for (var i = 0; i < raw.length; i++) {
          var t = raw[i].trim(), mt = m[i].trim();
          var lead = (mt.match(/^[}\])]+/) || [''])[0].length;
          var d = Math.max(0, depth - lead);
          res.push(t ? new Array(d + 1).join('  ') + t : '');
          for (var j = 0; j < mt.length; j++) { if ('{(['.indexOf(mt[j]) >= 0) depth++; else if ('})]'.indexOf(mt[j]) >= 0) depth = Math.max(0, depth - 1); }
        }
        var txt = res.join('\n');
        if (txt !== ta.value) { this.insert(txt, 0, ta.value.length); ta.setSelectionRange(0, 0); ta.scrollTop = 0; this.syncScroll(); }
        this.status('Автоформатування виконано.');
        return;
      }
      case 'colorPicker': return this.colorPicker();
      case 'saveFrame': return this.saveFrame();
      case 'addTab': return this.addTab();
      case 'renameTab': return this.renameTab();
      case 'deleteTab': return this.deleteTab();
      case 'reference': return this.reference();
      case 'courseRef': window.open(this.opts.courseRef || 'dovidnyk.html', '_blank'); return;
      case 'keys':
        this.dialog('Гарячі клавіші', '<table>' + [
          [MOD + 'R', 'запустити скетч'], [IS_MAC ? '⇧⌘R' : 'Ctrl+Shift+R', 'презентувати на весь екран'], [MOD + 'S', 'зберегти (у браузері)'],
          [MOD + '/', 'закоментувати рядки'], [MOD + 'T', 'автоформатування'], ['Tab / Shift+Tab', 'відступ'],
          [MOD + 'Z / ' + (IS_MAC ? '⇧⌘Z' : 'Ctrl+Y'), 'скасувати / повторити'], ['Esc, потім Tab', 'вийти з редактора клавіатурою']
        ].map(function (r) { return '<tr><td><kbd>' + esc(r[0]) + '</kbd></td><td>' + r[1] + '</td></tr>'; }).join('') + '</table>', [['Закрити', null, true]]);
        return;
      case 'about':
        this.dialog('Про онлайн-середовище', '<p>Це навчальна копія середовища Processing. Код виконується прямо в браузері бібліотекою Processing.js, тож встановлювати нічого не потрібно.</p>' +
          '<ul><li>Код зберігається автоматично в цьому браузері для кожного уроку окремо.</li>' +
          '<li>Вкладки об’єднуються в одну програму, як у справжньому Processing.</li>' +
          '<li>Ділення цілих чисел (<code>7 / 2 = 3</code>) і пропущені <code>;</code> перевіряються так само, як у Processing.</li>' +
          '<li>Зображення для <code>loadImage()</code> додайте через «Скетч → Додати файл».</li>' +
          '<li>Відмінності від настільного Processing: немає бібліотек (Sound, Video); <code>saveFrame()</code> показує кадр у вікні замість запису у файл; текстові файли не читаються; не перевіряються типи змінних і вихід за межі масиву (у Processing це помилки).</li>' +
          '<li>Перевірене рішення запустіть у настільному Processing: «Файл → Завантажити як .pde» або «Копіювати весь код».</li></ul>', [['Зрозуміло', null, true]]);
        return;
    }
  };

  PDE.prototype.save = function (quiet) {
    var ok = store.set(this.key, this.state);
    if (!quiet) this.status(ok ? 'Збережено в цьому браузері.' : 'Не вдалося зберегти в браузері (приватний режим?). Скопіюйте код: «Файл → Копіювати весь код».', !ok);
  };
  PDE.prototype.remember = function () { this.prevState = JSON.parse(JSON.stringify(this.state)); };
  PDE.prototype.restorePrev = function () {
    if (!this.prevState) return;
    this.state = this.prevState; this.prevState = null;
    this.save(true); this.renderFiles(); this.selectTab(0);
    this.status('Ваш попередній код повернуто.');
  };
  PDE.prototype.loadExample = function (ex) {
    this.stop(true);
    this.remember();
    this.state = { tabs: ex.files.map(function (f) { return { name: f.name.replace(/\.pde$/, ''), code: f.code }; }), files: this.state.files || {} };
    this.save(true); this.selectTab(0);
    this.status('Відкрито приклад ' + ex.name + '. Натисніть ▶.', false, true);
  };
  PDE.prototype.loadCode = function (code, name) {
    this.stop(true);
    this.remember();
    var tabs = Array.isArray(code) ? code.map(function (t) { return { name: t[0], code: t[1] }; }) : [{ name: name || 'sketch', code: code }];
    this.state = { tabs: tabs, files: this.state.files || {} };
    this.save(true); this.selectTab(0);
    this.root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.status('Код прикладу перенесено в редактор. Змінюйте його й запускайте ▶.', false, true);
  };

  PDE.prototype.allCode = function () {
    return this.state.tabs.map(function (t, i) { return (i ? '// ===== Вкладка ' + t.name + ' =====\n' : '') + t.code; }).join('\n\n');
  };
  PDE.prototype.download = function () {
    var name = this.state.tabs[0].name + '.pde';
    try {
      var blob = new Blob([this.allCode()], { type: 'text/plain;charset=utf-8' });
      var a = el('a', { href: URL.createObjectURL(blob), download: name });
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) {}
    this.status('Файл ' + name + ' завантажено. Якщо завантаження заблоковане, скористайтеся «Копіювати весь код». Зберігайте скетч у папці з такою самою назвою.');
  };
  PDE.prototype.copyAll = function () {
    var self = this, text = this.allCode();
    function fallback() {
      self.dialog('Копіювати код', '<p>Виділіть текст нижче й скопіюйте (' + MOD + 'C).</p><textarea id="pde-copytext" readonly style="width:100%;height:220px;font:13px var(--f-mono);background:var(--code-bg);color:var(--ink);border:1px solid var(--rule);border-radius:5px;padding:8px">' + esc(text) + '</textarea>', [['Закрити', null, true]], '#pde-copytext');
      var t = document.getElementById('pde-copytext'); if (t) t.select();
    }
    try { navigator.clipboard.writeText(text).then(function () { self.status('Код усіх вкладок скопійовано. Вставте його в Processing.'); }, fallback); } catch (e) { fallback(); }
  };
  PDE.prototype.readPde = function (file) {
    if (!file) return;
    var self = this, fr = new FileReader();
    fr.onload = function () {
      self.remember();
      var name = self.cleanName(file.name.replace(/\.\w+$/, '')) || 'sketch';
      self.state.tabs = [{ name: name, code: String(fr.result) }];
      self.save(true); self.selectTab(0);
      self.status('Відкрито файл ' + file.name + '.', false, true);
    };
    fr.readAsText(file);
  };
  PDE.prototype.readImages = function (files) {
    var self = this;
    Array.prototype.forEach.call(files || [], function (file) {
      var fr = new FileReader();
      fr.onload = function () {
        self.state.files[file.name] = String(fr.result);
        if (!store.set(self.key, self.state)) {
          self.status('Файл ' + file.name + ' додано, але він завеликий, щоб зберегтися після перезавантаження сторінки.', true);
        } else self.status('Файл ' + file.name + ' додано в data. Використовуйте: loadImage("' + file.name + '")');
        self.renderFiles();
      };
      fr.readAsDataURL(file);
    });
  };
  PDE.prototype.renderFiles = function () {
    var self = this, names = Object.keys(this.state.files || {});
    this.filesEl.hidden = !names.length;
    this.filesEl.innerHTML = 'data/ ' + names.map(function (n) { return '<span class="f">' + esc(n) + ' <button type="button" data-del="' + esc(n) + '" aria-label="Видалити файл ' + esc(n) + '">×</button></span>'; }).join(' ');
    this.filesEl.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () { delete self.state.files[b.getAttribute('data-del')]; self.save(true); self.renderFiles(); });
    });
  };

  PDE.prototype.reference = function () {
    var ta = this.input, v = ta.value, p = ta.selectionStart;
    var s = p, e = p;
    while (s > 0 && /\w/.test(v[s - 1])) s--;
    while (e < v.length && /\w/.test(v[e])) e++;
    var w = v.slice(s, e);
    var url = 'https://processing.org/reference/';
    if (w) {
      if (kwSet[w] || tySet[w] || /^[A-Z_]+$/.test(w) || /^(mouseX|mouseY|pmouseX|pmouseY|width|height|frameCount|key|keyCode|mousePressed|keyPressed)$/.test(w) && v[e] !== '(') url += w + '.html';
      else url += w + '_.html';
    }
    this.dialog('Довідка Processing', w ? '<p>Слово під курсором: <code>' + esc(w) + '</code>. Довідка відкриється на сайті processing.org (англійською).</p>' : '<p>Поставте курсор на назву функції, наприклад <code>ellipse</code>, і повторіть. Або відкрийте весь довідник.</p>',
      [['Закрити'], ['<a class="btn" href="' + url + '" target="_blank" rel="noopener">Відкрити довідку ↗</a>']]);
  };

  PDE.prototype.colorPicker = function () {
    var self = this;
    var d = this.dialog('Вибір кольору', '<div class="row"><input id="pde-col" type="color" value="#2242d6"><div class="pde-swatch" id="pde-sw"></div><div id="pde-vals" style="font:14px var(--f-mono)"></div></div>' +
      '<p>Оберіть колір і вставте його в код у потрібному форматі.</p>',
      [['Закрити'], ['Вставити #hex', function (dd) { self.insertColor(dd, 'hex'); }], ['Вставити r, g, b', function (dd) { self.insertColor(dd, 'rgb'); }, true]]);
    var inp = d.querySelector('#pde-col');
    function upd() {
      var h = inp.value, r = parseInt(h.substr(1, 2), 16), g = parseInt(h.substr(3, 2), 16), b = parseInt(h.substr(5, 2), 16);
      d.querySelector('#pde-sw').style.background = h;
      var mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255, c = mx - mn, hh = 0;
      if (c) { var R = r / 255, G = g / 255, B = b / 255; hh = mx === R ? ((G - B) / c) % 6 : mx === G ? (B - R) / c + 2 : (R - G) / c + 4; hh = Math.round(hh * 60); if (hh < 0) hh += 360; }
      d.querySelector('#pde-vals').innerHTML = 'RGB: ' + r + ', ' + g + ', ' + b + '<br>HEX: ' + h.toUpperCase() + '<br>HSB: ' + hh + '°, ' + Math.round(mx ? c / mx * 100 : 0) + '%, ' + Math.round(mx * 100) + '%';
    }
    inp.addEventListener('input', upd); upd();
  };
  PDE.prototype.insertColor = function (d, fmt) {
    var h = d.querySelector('#pde-col').value;
    var t = fmt === 'hex' ? h.toUpperCase() : parseInt(h.substr(1, 2), 16) + ', ' + parseInt(h.substr(3, 2), 16) + ', ' + parseInt(h.substr(5, 2), 16);
    var ta = this.input;
    var self = this;
    setTimeout(function () { self.insert(t, ta.selectionStart, ta.selectionEnd); }, 0);
  };

  PDE.prototype.saveFrame = function () {
    var cv = this.stage.querySelector('canvas');
    if (!cv) { this.status('Спочатку запустіть скетч.', true); return; }
    var url;
    try { url = cv.toDataURL('image/png'); } catch (e) { this.status('Не вдалося зберегти кадр.', true); return; }
    this.showFrame(url, this.state.tabs[0].name + '-' + ('000' + (this.frameN = (this.frameN || 0) + 1)).slice(-4) + '.png');
  };
  PDE.prototype.showFrame = function (url, name) {
    this.dialog('Збережений кадр', '<img src="' + url + '" alt="Кадр скетчу"><p>Щоб зберегти: клацніть правою кнопкою (на телефоні — утримуйте палець) і виберіть «Зберегти зображення». Або натисніть «Завантажити».</p>',
      [['Закрити'], ['<a class="btn primary" href="' + url + '" download="' + esc(name) + '">Завантажити ' + esc(name) + '</a>']]);
  };

  // ---------- Діалоги ----------
  PDE.prototype.dialog = function (title, body, buttons, focusSel) {
    var ov = el('div', { class: 'pde-overlay' });
    var d = el('div', { class: 'pde-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': title.replace(/<[^>]+>/g, '') });
    d.innerHTML = '<h3>' + title + '</h3>' + body;
    var act = el('div', { class: 'actions' });
    var prevFocus = document.activeElement;
    function close() { ov.remove(); document.removeEventListener('keydown', onKey, true); if (prevFocus && prevFocus.focus) prevFocus.focus(); }
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') { var p = act.querySelector('.primary'); if (p) { e.preventDefault(); p.click(); } }
    }
    (buttons || []).forEach(function (b) {
      if (/^<a /.test(b[0])) { var wrap = el('span', null, b[0]); act.appendChild(wrap.firstChild); return; }
      var btn = el('button', { type: 'button', class: b[2] ? 'primary' : '', text: b[0] });
      btn.addEventListener('click', function () { if (b[1] && b[1](d) === false) return; close(); });
      act.appendChild(btn);
    });
    d.appendChild(act);
    ov.appendChild(d);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(ov);
    var f = focusSel ? d.querySelector(focusSel) : act.querySelector('.primary') || act.querySelector('button');
    if (f) { f.focus(); if (f.select) f.select(); }
    return d;
  };

  // ---------- Рядок стану і консоль ----------
  PDE.prototype.status = function (msg, isErr, canUndo) {
    var self = this;
    this.statusEl.classList.toggle('err', !!isErr);
    this.statusEl.innerHTML = '<span class="msg"></span>';
    this.statusEl.querySelector('.msg').textContent = msg;
    if (canUndo && this.prevState) {
      var b = el('button', { type: 'button', text: 'Повернути мій код' });
      b.addEventListener('click', function () { self.restorePrev(); });
      this.statusEl.appendChild(b);
    }
  };
  // Вивід у консоль збирається в буфер і показується раз на кадр — так println() у циклі не гальмує сторінку
  PDE.prototype.log = function (text, cls) {
    var self = this;
    this.logBuf = this.logBuf || [];
    var last = this.logBuf[this.logBuf.length - 1];
    if (last && last.cls === cls && last.text.length < 4000) last.text += text; else this.logBuf.push({ text: text, cls: cls });
    if (this.logBuf.length > 12) this.logBuf.shift();          // у буфері — не більше ~48 000 останніх символів
    if (!this.logPending) { this.logPending = true; (window.requestAnimationFrame || setTimeout)(function () { self.flushLog(); }); }
  };
  PDE.prototype.flushLog = function () {
    var c = this.consoleEl, buf = this.logBuf || [];
    this.logBuf = []; this.logPending = false;
    buf.forEach(function (b) { var s = el('span', b.cls ? { class: b.cls } : null); s.textContent = b.text; c.appendChild(s); });
    var total = c.textContent.length;
    while (c.firstChild && total > 50000) { total -= c.firstChild.textContent.length; c.removeChild(c.firstChild); }
    c.scrollTop = c.scrollHeight;
  };
  PDE.prototype.showError = function (tabIndex, line, msg) {
    if (tabIndex != null && tabIndex !== this.active) this.selectTab(tabIndex);
    this.errLine = line || null;
    this.refresh();
    if (line) {
      var lh = parseFloat(getComputedStyle(this.input).lineHeight) || 21;
      this.input.scrollTop = Math.max(0, (line - 4) * lh);
      this.syncScroll();
    }
    var where = (tabIndex != null ? 'Вкладка ' + this.state.tabs[tabIndex].name : '') + (line ? ', рядок ' + line : '');
    this.status((where ? where + ': ' : '') + msg, true);
    this.log((where ? '[' + where + '] ' : '') + msg + '\n', 'e');
  };

  // ---------- Запуск ----------
  PDE.prototype.stop = function (silent) {
    var inst = this.inst;
    this.inst = null;
    PDE.current = PDE.current === this ? null : PDE.current;
    this.root.classList.remove('running');
    cancelAnimationFrame(this.raf);
    if (inst) { try { inst.exit(); } catch (e) {} }
    if (this.blobUrls) { this.blobUrls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} }); this.blobUrls = null; }
    if (!silent && inst) this.status('Скетч зупинено.');
    this.fpsEl.textContent = '';
  };
  PDE.prototype.present = function () {
    var self = this;
    this.run().then(function () {
      var w = self.win;
      try {
        var p = w.requestFullscreen ? w.requestFullscreen() : (w.webkitRequestFullscreen ? w.webkitRequestFullscreen() : null);
        if (p && p.catch) p.catch(function () { self.status('Повноекранний режим недоступний у цьому браузері.'); });
      } catch (e) {}
    });
  };
  PDE.prototype.run = function () {
    var self = this;
    this.closeMenus();
    this.state.tabs[this.active].code = this.input.value;
    this.save(true);
    this.stop(true);
    this.errLine = null;
    this.refresh();
    this.consoleEl.innerHTML = '';
    this.logBuf = [];

    // 1. Перевірка синтаксису по вкладках
    for (var i = 0; i < this.state.tabs.length; i++) {
      var t = this.state.tabs[i];
      var err = checkBrackets(t) || checkSemicolons(t);
      if (err) { this.showError(i, err.line, err.msg); return Promise.resolve(); }
    }
    var warns = [];
    this.state.tabs.forEach(function (t, i) { lint(t).forEach(function (w) { warns.push('[' + t.name + ', рядок ' + w.line + '] ' + w.msg); }); });

    this.status('Завантаження…');
    return loadPjs(this.opts.pjs).then(function () {
      warns.forEach(function (w) { self.log('Увага: ' + w + '\n', 'w'); });
      self.start();
    }, function () {
      self.status('Не вдалося завантажити Processing.js. Перевірте підключення до інтернету.', true);
    });
  };
  PDE.prototype.start = function () {
    var self = this;
    var code = this.state.tabs.map(function (t) { return t.code; }).join('\n\n');

    // 2. Файли з папки data → тимчасові адреси
    var files = this.state.files || {}, preload = [];
    this.blobUrls = [];
    Object.keys(files).forEach(function (name) {
      try {
        var parts = files[name].split(','), mime = parts[0].replace(/^data:|;base64$/g, '');
        var bin = atob(parts[1]), arr = new Uint8Array(bin.length);
        for (var k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
        var url = URL.createObjectURL(new Blob([arr], { type: mime }));
        self.blobUrls.push(url);
        var re = new RegExp('"' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"', 'g');
        if (re.test(code)) { code = code.replace(re, '"' + url + '"'); preload.push(url); }
      } catch (e) {}
    });
    var missing = mask(code).match(/loadImage\s*\(\s*"[^"]*"/g);
    if (missing) {
      var raw = code.match(/loadImage\s*\(\s*"([^"]*)"/g) || [];
      raw.forEach(function (s) { var f = s.match(/"([^"]*)"/)[1]; if (!/^blob:|^https?:|^data:/.test(f)) self.log('Увага: файл «' + f + '» не додано в data (Скетч → Додати файл). Зображення не завантажиться.\n', 'w'); });
    }

    // 3. Перетворення: ціле ділення і захист циклів
    code = addLoopGuards(rewriteIntDivision(code));
    if (preload.length) code = '/* @pjs preload="' + preload.join(',') + '"; */\n' + code;

    // 4. Полотно
    this.stage.innerHTML = '';
    var cv = el('canvas', { tabindex: '0', 'aria-label': 'Вікно скетчу ' + this.state.tabs[0].name });
    this.stage.appendChild(cv);
    this.win.querySelector('.title').textContent = this.state.tabs[0].name;

    var errored = false;
    function fail(msg) {
      if (errored) return;
      errored = true;
      self.stop(true);
      self.showError(null, null, explain(msg));
    }
    Processing.logger = {
      println: function (m) { self.log((m === undefined ? '' : fmt(m)) + '\n'); },
      print: function (m) { self.log(fmt(m)); },
      log: function (m) { self.log(fmt(m) + '\n'); }
    };
    function fmt(m) {
      if (m === null) return 'null';
      if (typeof m === 'number') return String(Math.round(m * 1e6) / 1e6);
      if (m && m.toString && m.toString !== Object.prototype.toString) return String(m);
      return String(m);
    }

    // захист від зависань: лічильник ітерацій скидається щокадру
    // захист від зависань: якщо цикл триває понад 3 с без нового кадру, скетч зупиняється
    var guard = 0, frameStart = performance.now();
    window.__pdeGuard = function () {
      if ((++guard & 1023) === 0 && performance.now() - frameStart > 3000) { guard = 0; frameStart = performance.now(); throw new Error('__pdeLoop'); }
    };
    window.__pdeIdiv = function (a, b) {
      if (typeof a === 'number' && typeof b === 'number' && a % 1 === 0 && b % 1 === 0) {
        if (b === 0) throw new Error('Ділення на нуль (ArithmeticException: / by zero).');
        var q = a / b; return q < 0 ? Math.ceil(q) : Math.floor(q);
      }
      return a / b;
    };
    var frames = 0, lastT = performance.now();
    function tick(now) {
      guard = 0; frameStart = performance.now();
      if (!self.inst) return;
      frames++;
      if (now - lastT > 500) {
        self.fpsEl.textContent = 'кадрів/с: ' + Math.round(frames * 1000 / (now - lastT)) + ' · frameCount: ' + (self.inst.frameCount || 0);
        frames = 0; lastT = now;
      }
      self.raf = requestAnimationFrame(tick);
    }

    var sketch;
    try { sketch = Processing.compile(code); }
    catch (e) { fail(e && e.message ? e.message : String(e)); return; }
    var attach = sketch.attach;
    sketch.attach = function (p, scope) {
      p.saveFrame = function (file) {
        var n = (file || self.state.tabs[0].name + '-####.png').replace(/#+/, function (h) { return ('0000' + p.frameCount).slice(-h.length); });
        self.log('saveFrame(): кадр «' + n + '» показано у вікні «Збережений кадр».\n', 's');
        var url = p.externals.canvas.toDataURL('image/png');
        setTimeout(function () { self.showFrame(url, n); }, 0);
      };
      p.save = function (file) { p.saveFrame(file || 'image.png'); };
      p.link = function (url) { window.open(url, '_blank'); };
      // char у Java при склеюванні з рядком дає літеру: "key " + key → "key a" (а не код символу)
      var Ch = p.Character;
      if (Ch && Ch.prototype && !Ch.prototype.__pde && typeof Symbol !== 'undefined' && Symbol.toPrimitive) {
        Ch.prototype[Symbol.toPrimitive] = function (hint) { return hint === 'number' ? this.code : String.fromCharCode(this.code); };
        Ch.prototype.__pde = true;
      }
      var res = attach.call(this, p, scope);
      // Помилки у функціях скетчу перехоплюємо тут: так видно справжнє повідомлення,
      // навіть якщо бібліотеку завантажено з іншого сайту.
      ['setup', 'draw', 'mousePressed', 'mouseReleased', 'mouseClicked', 'mouseDragged', 'mouseMoved', 'mouseWheel',
        'keyPressed', 'keyReleased', 'keyTyped'].forEach(function (fn) {
        var orig = p[fn];
        if (typeof orig !== 'function') return;
        p[fn] = function () {
          try { return orig.apply(this, arguments); }
          catch (e) { if (fn === 'setup') throw e; fail(e && e.message ? e.message : String(e)); }
        };
      });
      return res;
    };

    var onErr = function (ev) {
      if (!self.inst && !starting) return;
      var msg = ev && (ev.error && ev.error.message || ev.message) || '';
      if (/ResizeObserver/.test(msg)) return;
      if (/^Script error\.?$/.test(msg)) msg = 'помилка в коді скетчу. Перевірте останні зміни або запустіть код у настільному Processing, щоб побачити точний рядок.';
      ev.preventDefault && ev.preventDefault();
      fail(msg);
    };
    window.removeEventListener('error', PDE._onErr || function () {});
    PDE._onErr = onErr;
    window.addEventListener('error', onErr);

    var starting = true;
    PDE.current = this;
    try {
      this.inst = new Processing(cv, sketch);
    } catch (e) {
      starting = false;
      fail(e && e.message ? e.message : String(e));
      return;
    }
    starting = false;
    if (errored) return;
    this.root.classList.add('running');
    this.status('Скетч працює. ' + (cv.width > this.stage.clientWidth - 28 ? 'Вікно ширше за екран — гортайте його вбік. ' : '') + 'Зупинити — ■.');
    this.raf = requestAnimationFrame(tick);
    cv.addEventListener('mousemove', function () {
      if (self.inst) self.xyEl.textContent = 'mouseX: ' + Math.round(self.inst.mouseX) + ' · mouseY: ' + Math.round(self.inst.mouseY);
    });
    cv.addEventListener('pointerdown', function () { cv.focus({ preventScroll: true }); });
  };

  // ---------- Публічний інтерфейс ----------
  window.PDE = {
    mount: function (elOrSel, opts) {
      var node = typeof elOrSel === 'string' ? document.querySelector(elOrSel) : elOrSel;
      var inst = new PDE(node, opts);
      window.PDE.main = inst;
      return inst;
    },
    // для тестів
    _rewrite: function (c) { return addLoopGuards(rewriteIntDivision(c)); },
    _check: function (code) { var t = { name: 't', code: code }; return checkBrackets(t) || checkSemicolons(t); }
  };
})();
