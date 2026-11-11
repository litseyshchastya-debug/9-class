/* Тест «Перевір себе» з вибором однієї відповіді та оцінкою за 12-бальною шкалою.
 * Варіанти перемішуються під час кожного показу. Зараховується перша спроба:
 * її відповіді зберігаються в браузері й додаються до роботи, яку учень здає вчителю.
 * Наступні спроби — тренувальні.
 */
(function () {
  'use strict';
  var store = {
    get: function (k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  function shuffle(n) {
    var a = []; for (var i = 0; i < n; i++) a.push(i);
    for (var j = n - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)); var t = a[j]; a[j] = a[k]; a[k] = t; }
    return a;
  }
  // answers — масив індексів обраних варіантів (у порядку з уроку); key — індекси правильних
  function score(key, answers) {
    var right = 0;
    key.forEach(function (c, i) { if (answers && answers[i] === c) right++; });
    return { right: right, total: key.length, grade: Math.max(1, Math.round(right / key.length * 12)) };
  }
  function levelWord(g) { return g >= 10 ? 'високий' : g >= 7 ? 'достатній' : g >= 4 ? 'середній' : 'початковий'; }

  function mount(el, o) {
    var KEY = 'kviz:' + o.id, data = o.questions;
    var saved = store.get(KEY) || { attempts: 0 };
    var orders;

    function render() {
      orders = data.map(function (q) { return shuffle(q.options.length); });
      var html = '<ol class="kv-list">' + data.map(function (q, i) {
        return '<li class="kv-q" id="kv-q' + i + '"><fieldset><legend><span class="kv-n">' + (i + 1) + '.</span> ' + q.q + '</legend>' +
          orders[i].map(function (oi) {
            var id = 'kv-' + o.id + '-' + i + '-' + oi;
            return '<label class="kv-opt" for="' + id + '"><input type="radio" id="' + id + '" name="kv-' + o.id + '-' + i + '" value="' + oi + '"><span>' + q.options[oi] + '</span></label>';
          }).join('') + '</fieldset><div class="kv-expl" hidden></div></li>';
      }).join('') + '</ol>' +
        '<div class="kv-actions"><button type="button" class="zd-btn primary" id="kv-check-' + o.id + '">Перевірити тест</button>' +
        '<button type="button" class="zd-btn" id="kv-again-' + o.id + '" hidden>Пройти ще раз</button></div>' +
        '<div class="kv-result" aria-live="polite"></div>';
      el.innerHTML = html + (saved.first ? statusNote() : '');
      el.querySelector('#kv-check-' + o.id).addEventListener('click', check);
      el.querySelector('#kv-again-' + o.id).addEventListener('click', function () { render(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    }
    function statusNote() {
      var s = score(o.key, saved.first.answers);
      return '<p class="kv-note">Зараховано першу спробу: <strong>' + s.grade + ' з 12</strong> (' + s.right + ' з ' + s.total + ' правильних). Нові спроби — тренувальні.</p>';
    }
    function check() {
      var answers = data.map(function (q, i) {
        var c = el.querySelector('input[name="kv-' + o.id + '-' + i + '"]:checked');
        return c ? +c.value : null;
      });
      var missing = answers.map(function (a, i) { return a === null ? i + 1 : null; }).filter(function (x) { return x; });
      var res = el.querySelector('.kv-result');
      if (missing.length) {
        res.innerHTML = '<p class="kv-note">Дайте відповідь на всі питання. Пропущено: ' + missing.join(', ') + '.</p>';
        var first = el.querySelector('#kv-q' + (missing[0] - 1)); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      var isFirst = !saved.first;
      saved.attempts = (saved.attempts || 0) + 1;
      if (isFirst) saved.first = { answers: answers, at: new Date().toISOString() };
      saved.last = { answers: answers, at: new Date().toISOString() };
      store.set(KEY, saved);
      data.forEach(function (q, i) {
        var li = el.querySelector('#kv-q' + i), ok = answers[i] === o.key[i];
        li.classList.add(ok ? 'ok' : 'no');
        li.querySelectorAll('input').forEach(function (inp) {
          inp.disabled = true;
          var lab = inp.parentNode;
          if (+inp.value === o.key[i]) lab.classList.add('right');
          else if (inp.checked) lab.classList.add('wrong');
        });
        var ex = li.querySelector('.kv-expl');
        ex.hidden = false;
        ex.innerHTML = '<strong>' + (ok ? '✓ Правильно.' : '✗ Неправильно.') + '</strong> ' + q.expl;
      });
      var s = score(o.key, answers), f = score(o.key, saved.first.answers);
      res.innerHTML = '<div class="zd-grade"><span class="n">' + s.grade + '</span><span class="of">з 12</span>' +
        '<span class="lvl">' + s.right + ' з ' + s.total + ' правильних · ' + levelWord(s.grade) + ' рівень</span></div>' +
        (isFirst ? '<p class="kv-note">Це перша спроба — саме її оцінку отримає вчитель разом з роботою («Здати роботу на перевірку»).</p>'
          : '<p class="kv-note">Тренувальна спроба. Зараховано першу спробу: <strong>' + f.grade + ' з 12</strong>.</p>');
      el.querySelector('#kv-check-' + o.id).hidden = true;
      el.querySelector('#kv-again-' + o.id).hidden = false;
      var old = el.querySelector(':scope > .kv-note'); if (old) old.remove();
      res.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    render();
  }

  // для здачі роботи: відповіді першої спроби (або null)
  function firstAttempt(id) {
    var s = store.get('kviz:' + id);
    return s && s.first ? { a: s.first.answers, n: s.attempts || 1 } : null;
  }
  window.KVIZ = { mount: mount, score: score, firstAttempt: firstAttempt };
})();
