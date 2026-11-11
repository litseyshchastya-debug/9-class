/* Здача робіт на перевірку й автоматичне оцінювання.
 * Учень: перевіряє свій скетч за критеріями уроку і отримує посилання для вчителя.
 * Робота (ім'я, клас, урок, код усіх вкладок) запакована в саме посилання — сервер не потрібен.
 * Вчитель: відкриває посилання, сторінка заново запускає й оцінює код (оцінку не можна підробити),
 * а результат потрапляє в журнал у браузері вчителя.
 */
(function () {
  'use strict';
  var PREFIX = 'pde1';

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var store = {
    get: function (k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };

  // ---------- Пакування роботи в посилання ----------
  function b64url(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64url(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    var bin = atob(str), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function streamBytes(bytes, stream) {
    var s = new Blob([bytes]).stream().pipeThrough(stream);
    return new Response(s).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function encode(payload) {
    var bytes = new TextEncoder().encode(JSON.stringify(payload));
    if (typeof CompressionStream === 'function') {
      return streamBytes(bytes, new CompressionStream('deflate-raw'))
        .then(function (z) { return PREFIX + 'z' + b64url(z); })
        .catch(function () { return PREFIX + 'u' + b64url(bytes); });
    }
    return Promise.resolve(PREFIX + 'u' + b64url(bytes));
  }
  // з будь-якого тексту (посилання, код, повідомлення з месенджера) дістає код роботи
  function findToken(text) {
    var m = String(text || '').match(/pde1[zu][A-Za-z0-9_-]{10,}/);
    return m ? m[0] : null;
  }
  function decode(token) {
    token = findToken(token);
    if (!token) return Promise.reject(new Error('Не знайдено код роботи. Вставте повне посилання, яке надіслав учень.'));
    var kind = token[4], bytes;
    try { bytes = unb64url(token.slice(5)); } catch (e) { return Promise.reject(new Error('Посилання пошкоджене (можливо, його обрізав месенджер).')); }
    var p = kind === 'z'
      ? (typeof DecompressionStream === 'function' ? streamBytes(bytes, new DecompressionStream('deflate-raw'))
        : Promise.reject(new Error('Цей браузер не вміє розпаковувати роботи. Відкрийте посилання в Chrome, Edge, Firefox або Safari 16.4+.')))
      : Promise.resolve(bytes);
    return p.then(function (b) {
      var data = JSON.parse(new TextDecoder().decode(b));
      if (!data || !data.tabs || !data.lesson) throw new Error('Це не робота з курсу.');
      data.token = token;
      return data;
    }, function (e) { throw new Error(e && /браузер/.test(e.message) ? e.message : 'Посилання пошкоджене (можливо, його обрізав месенджер). Попросіть учня надіслати код роботи.'); });
  }
  function hashToken(t) { var h = 0; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  // ---------- Автоперевірка ----------
  function grade(lesson, tabs, starter, pjs) {
    var opts = PDE_GRADE_OPTS(lesson); opts.pjs = pjs;
    return PDE.headless(tabs, opts).then(function (report) { return PDE_GRADE(lesson, report, starter); });
  }
  var LEVELS = { 1: 'Рівень 1 — до 6 балів', 2: 'Рівень 2 — до 9 балів', 3: 'Рівень 3 — до 12 балів' };
  function levelWord(g) { return g >= 10 ? 'високий' : g >= 7 ? 'достатній' : g >= 4 ? 'середній' : 'початковий'; }
  function resultHtml(res) {
    var html = '<div class="zd-grade"><span class="n">' + res.grade + '</span><span class="of">з 12</span>' +
      '<span class="lvl">' + levelWord(res.grade) + ' рівень</span></div>';
    if (res.note) html += '<p class="zd-note">' + esc(res.note) + '</p>';
    [1, 2, 3].forEach(function (lv) {
      var items = res.items.filter(function (i) { return i.level === lv; });
      html += '<h4>' + LEVELS[lv] + '</h4><ul class="zd-list">' + items.map(function (i) {
        return '<li class="' + (i.ok ? 'ok' : 'no') + '"><span class="mark" aria-hidden="true">' + (i.ok ? '✓' : '✗') + '</span>' +
          '<span class="t">' + esc(i.text) + '</span><span class="p">' + (i.ok ? '+' : '') + (i.ok ? i.pts : 0) + ' / ' + i.pts + '</span></li>';
      }).join('') + '</ul>';
    });
    return html;
  }
  function criteriaHtml(lesson) {
    var r = (window.PDE_RUBRICS || {})[lesson];
    if (!r) return '';
    return [1, 2, 3].map(function (lv) {
      return '<h4>' + LEVELS[lv] + '</h4><ul class="zd-list plain">' + r.items.filter(function (i) { return i.level === lv; })
        .map(function (i) { return '<li><span class="t">' + esc(i.text) + '</span><span class="p">' + i.pts + ' б.</span></li>'; }).join('') + '</ul>';
    }).join('');
  }
  function copyText(text, onDone, fallbackEl) {
    function fb() { if (fallbackEl) { fallbackEl.focus(); fallbackEl.select(); } onDone(false); }
    try { navigator.clipboard.writeText(text).then(function () { onDone(true); }, fb); } catch (e) { fb(); }
  }

  // ---------- Блок «Здати роботу» на сторінці уроку ----------
  function mountSubmit(el, o) {
    var who = store.get('zd-student') || {};
    el.innerHTML =
      '<p>Здається робота з редактора практикуму вище — один скетч з усіма вкладками. Автоперевірка запускає ваш скетч, ' +
      'рухає «мишею», клацає, натискає клавіші й перевіряє критерії нижче. Завдання рівнів 2 і 3 додавайте в той самий скетч. ' +
      'Перевіряти можна скільки завгодно разів.</p>' +
      '<details class="zd-crit"><summary>Критерії автоперевірки уроку</summary>' + criteriaHtml(o.lesson) + '</details>' +
      '<div class="zd-form">' +
      '<label for="zd-name">Прізвище та ім\'я<input id="zd-name" type="text" autocomplete="name" placeholder="Коваль Олена" value="' + esc(who.name) + '"></label>' +
      '<label for="zd-class">Клас<input id="zd-class" type="text" placeholder="9-Б" value="' + esc(who.cls) + '"></label>' +
      '</div>' +
      '<div class="zd-actions"><button type="button" class="zd-btn primary" id="zd-check">Перевірити роботу</button>' +
      '<button type="button" class="zd-btn" id="zd-link" disabled>Отримати посилання для вчителя</button></div>' +
      '<div class="zd-result" id="zd-result" aria-live="polite"></div>' +
      '<div class="zd-share" id="zd-share" hidden></div>';
    var nameEl = el.querySelector('#zd-name'), clsEl = el.querySelector('#zd-class');
    var resEl = el.querySelector('#zd-result'), shareEl = el.querySelector('#zd-share');
    var linkBtn = el.querySelector('#zd-link'), checkBtn = el.querySelector('#zd-check');
    var last = null;
    function remember() { store.set('zd-student', { name: nameEl.value.trim(), cls: clsEl.value.trim() }); }
    nameEl.addEventListener('change', remember); clsEl.addEventListener('change', remember);
    function currentTabs() {
      var ide = o.ide();
      ide.state.tabs[ide.active].code = ide.input.value;
      return ide.state.tabs.map(function (t) { return { name: t.name, code: t.code }; });
    }
    checkBtn.addEventListener('click', function () {
      var tabs = currentTabs();
      checkBtn.disabled = true; linkBtn.disabled = true; shareEl.hidden = true;
      resEl.innerHTML = '<p class="zd-wait">Перевіряю: запускаю скетч, рухаю мишею, клацаю…</p>';
      grade(o.lesson, tabs, o.starter, o.pjs).then(function (res) {
        last = { tabs: tabs, res: res };
        resEl.innerHTML = resultHtml(res);
        linkBtn.disabled = false;
      }, function (e) {
        resEl.innerHTML = '<p class="zd-note">Не вдалося перевірити: ' + esc(e && e.message || e) + '</p>';
      }).then(function () { checkBtn.disabled = false; });
    });
    linkBtn.addEventListener('click', function () {
      if (!last) return;
      var name = nameEl.value.trim(), cls = clsEl.value.trim();
      if (!name) { nameEl.focus(); resEl.insertAdjacentHTML('afterbegin', '<p class="zd-note">Вкажіть прізвище та ім\'я, щоб учитель знав, чия це робота.</p>'); return; }
      remember();
      var payload = { v: 1, lesson: o.lesson, name: name, cls: cls, at: new Date().toISOString(), seen: last.res.grade,
        tabs: last.tabs.map(function (t) { return [t.name, t.code]; }) };
      encode(payload).then(function (token) {
        var url = o.courseUrl() + '#' + token;
        shareEl.hidden = false;
        shareEl.innerHTML = '<h4>Посилання для вчителя</h4>' +
          '<p>Скопіюйте й надішліть учителеві (Classroom, месенджер, пошта). Учитель відкриє роботу, програма перевірить її ще раз і поставить оцінку в журнал.</p>' +
          '<div class="zd-linkrow"><input id="zd-url" type="text" readonly value="' + esc(url) + '" aria-label="Посилання на роботу">' +
          '<button type="button" class="zd-btn primary" id="zd-copy">Копіювати посилання</button></div>' +
          '<p class="zd-small">Посилання містить ваш код і оцінку ' + last.res.grade + ' з 12. Якщо ви зміните код, перевірте роботу й отримайте нове посилання. ' +
          'Якщо месенджер обріже довге посилання, надішліть <button type="button" class="zd-linkbtn" id="zd-copycode">код роботи</button> — учитель вставить його на сторінці перевірки.</p>';
        var urlEl = shareEl.querySelector('#zd-url');
        shareEl.querySelector('#zd-copy').addEventListener('click', function () {
          var b = this; copyText(url, function (ok) { b.textContent = ok ? 'Скопійовано ✓' : 'Виділено — натисніть Ctrl+C'; }, urlEl);
        });
        shareEl.querySelector('#zd-copycode').addEventListener('click', function () {
          var b = this; copyText(token, function (ok) { b.textContent = ok ? 'код скопійовано ✓' : 'код роботи'; if (!ok) { urlEl.value = token; urlEl.select(); } }, null);
        });
        urlEl.addEventListener('focus', function () { urlEl.select(); });
      });
    });
  }

  // ---------- Сторінка вчителя «Перевірка робіт» ----------
  var JKEY = 'zd-journal';
  function journal() { return store.get(JKEY) || []; }
  function fmtDate(iso) { try { var d = new Date(iso); return d.toLocaleDateString('uk-UA') + ' ' + d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; } }

  function mountTeacher(el, o) {
    el.innerHTML =
      '<div class="zd-paste"><label for="pv-input">Посилання або код роботи учня</label>' +
      '<textarea id="pv-input" rows="3" placeholder="Вставте сюди посилання, яке надіслав учень"></textarea>' +
      '<div class="zd-actions"><button type="button" class="zd-btn primary" id="pv-go">Перевірити роботу</button></div></div>' +
      '<div id="pv-out" aria-live="polite"></div>' +
      '<section class="zd-journal"><h2>Журнал перевірених робіт</h2>' +
      '<p class="zd-small">Журнал зберігається лише в цьому браузері. Щоб перенести оцінки в електронний журнал або таблицю, скопіюйте його й вставте в Excel чи Google Таблиці.</p>' +
      '<div class="zd-filters"><label for="pv-fclass">Клас <select id="pv-fclass"></select></label>' +
      '<label for="pv-flesson">Урок <select id="pv-flesson"></select></label>' +
      '<button type="button" class="zd-btn" id="pv-copyj">Копіювати журнал для Excel</button>' +
      '<button type="button" class="zd-btn" id="pv-clear">Очистити журнал</button></div>' +
      '<div class="tbl" id="pv-table"></div></section>';
    var input = el.querySelector('#pv-input'), out = el.querySelector('#pv-out');
    var fClass = el.querySelector('#pv-fclass'), fLesson = el.querySelector('#pv-flesson');

    function addToJournal(d, res) {
      var j = journal(), id = hashToken(d.token);
      var row = { id: id, at: d.at, checked: new Date().toISOString(), name: d.name, cls: d.cls || '', lesson: d.lesson, grade: res.grade, token: d.token };
      j = j.filter(function (r) { return r.id !== id; });
      j.unshift(row);
      if (!store.set(JKEY, j)) {                       // місце закінчилось — зберігаємо без кодів старих робіт
        j.forEach(function (r, i) { if (i > 20) delete r.token; });
        store.set(JKEY, j);
      }
      renderJournal();
    }
    function check(text) {
      out.innerHTML = '<p class="zd-wait">Розпаковую роботу й перевіряю…</p>';
      decode(text).then(function (d) {
        var lesson = +d.lesson;
        var tabs = d.tabs.map(function (t) { return { name: t[0], code: t[1] }; });
        return grade(lesson, tabs, (o.starters || {})[lesson], o.pjs).then(function (res) {
          var lessonLink = 'urok-' + String(lesson).padStart(2, '0') + '.html';
          out.innerHTML = '<article class="zd-card">' +
            '<div class="zd-head"><div><h2>' + esc(d.name) + (d.cls ? ' <span class="cls">' + esc(d.cls) + '</span>' : '') + '</h2>' +
            '<p><a href="' + lessonLink + '">' + esc(o.lessonTitles[lesson] || ('Урок ' + lesson)) + '</a> · надіслано ' + esc(fmtDate(d.at)) + '</p></div></div>' +
            resultHtml(res) +
            (d.seen != null && d.seen !== res.grade ? '<p class="zd-note">Учень бачив оцінку ' + esc(d.seen) + ', повторна перевірка дала ' + res.grade + '. Зараховано оцінку повторної перевірки.</p>' : '') +
            '<p class="zd-small">Робота додана до журналу нижче. Код учня відкрито в середовищі: його можна запустити ▶ і переглянути вкладки.</p>' +
            '</article>';
          addToJournal(d, res);
          if (o.onWork) o.onWork(tabs, d);
        });
      }).catch(function (e) { out.innerHTML = '<p class="zd-note">' + esc(e.message || e) + '</p>'; });
    }
    el.querySelector('#pv-go').addEventListener('click', function () { check(input.value); });

    function renderJournal() {
      var j = journal();
      var classes = Object.keys(j.reduce(function (o, r) { o[r.cls || '—'] = 1; return o; }, {})).sort();
      var lessons = Object.keys(j.reduce(function (o, r) { o[r.lesson] = 1; return o; }, {})).map(Number).sort(function (a, b) { return a - b; });
      var fc = fClass.value, fl = fLesson.value;
      fClass.innerHTML = '<option value="">усі</option>' + classes.map(function (c) { return '<option' + (c === fc ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
      fLesson.innerHTML = '<option value="">усі</option>' + lessons.map(function (l) { return '<option value="' + l + '"' + (String(l) === fl ? ' selected' : '') + '>' + l + '</option>'; }).join('');
      var rows = j.filter(function (r) { return (!fClass.value || (r.cls || '—') === fClass.value) && (!fLesson.value || String(r.lesson) === fLesson.value); });
      var t = el.querySelector('#pv-table');
      if (!rows.length) { t.innerHTML = '<p class="zd-small">Поки що порожньо. Перевірте першу роботу — вона з\'явиться тут.</p>'; return; }
      t.innerHTML = '<table><thead><tr><th>Учень</th><th>Клас</th><th>Урок</th><th>Оцінка</th><th>Надіслано</th><th></th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><td>' + esc(r.name) + '</td><td>' + esc(r.cls) + '</td><td>' + r.lesson + '</td><td class="g">' + r.grade + '</td><td>' + esc(fmtDate(r.at)) + '</td>' +
            '<td class="act">' + (r.token ? '<button type="button" class="zd-linkbtn" data-open="' + r.id + '">відкрити</button> ' : '') +
            '<button type="button" class="zd-linkbtn" data-del="' + r.id + '" aria-label="Видалити рядок">×</button></td></tr>';
        }).join('') + '</tbody></table>';
    }
    el.querySelector('#pv-table').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var j = journal();
      if (b.dataset.open) { var r = j.filter(function (x) { return x.id === b.dataset.open; })[0]; if (r) { input.value = r.token; check(r.token); el.scrollIntoView({ behavior: 'smooth' }); } }
      if (b.dataset.del) { store.set(JKEY, j.filter(function (x) { return x.id !== b.dataset.del; })); renderJournal(); }
    });
    fClass.addEventListener('change', renderJournal); fLesson.addEventListener('change', renderJournal);
    el.querySelector('#pv-copyj').addEventListener('click', function () {
      var b = this, j = journal().filter(function (r) { return (!fClass.value || (r.cls || '—') === fClass.value) && (!fLesson.value || String(r.lesson) === fLesson.value); });
      var tsv = ['Учень\tКлас\tУрок\tОцінка\tНадіслано'].concat(j.map(function (r) { return [r.name, r.cls, r.lesson, r.grade, fmtDate(r.at)].join('\t'); })).join('\n');
      copyText(tsv, function (ok) { b.textContent = ok ? 'Скопійовано ✓ — вставте в таблицю' : 'Не вдалося скопіювати'; setTimeout(function () { b.textContent = 'Копіювати журнал для Excel'; }, 2500); }, null);
    });
    var clearBtn = el.querySelector('#pv-clear'), armed = false;
    clearBtn.addEventListener('click', function () {
      if (!armed) { armed = true; clearBtn.textContent = 'Точно очистити? Натисніть ще раз'; setTimeout(function () { armed = false; clearBtn.textContent = 'Очистити журнал'; }, 4000); return; }
      store.set(JKEY, []); armed = false; clearBtn.textContent = 'Очистити журнал'; renderJournal();
    });
    renderJournal();
    var fromHash = findToken(location.hash);
    if (fromHash) { input.value = location.href; check(fromHash); }
  }

  window.ZDACHA = { mountSubmit: mountSubmit, mountTeacher: mountTeacher, encode: encode, decode: decode, findToken: findToken, grade: grade };
})();
