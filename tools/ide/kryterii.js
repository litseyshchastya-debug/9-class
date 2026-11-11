/* Критерії автоматичного оцінювання практикуму кожного уроку.
 * Рівні навчальних досягнень: 0 — початковий, 1 — середній, 2 — достатній, 3 — високий;
 * на кожен рівень — 3 бали, разом 12.
 * Перевірка спирається на звіт невидимого запуску (PDE.headless): записані виклики функцій
 * малювання, вивід у консоль, кадри при різних положеннях миші, клік, перетягування, клавіші.
 */
(function () {
  'use strict';

  // ---------- Помічники ----------
  function helpers(r) {
    var noComments = r.code.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
    var main = r.isStatic ? 0 : (r.phases.start ? r.phases.start.to : 0);
    var SH = PDE.SHAPES;
    var h = {
      r: r,
      src: noComments,
      W: r.w, H: r.h,
      main: main,
      has: function (re) { return re.test(noComments); },
      count: function (re) { var g = new RegExp(re.source, 'g' + (re.ignoreCase ? 'i' : '')); return (noComments.match(g) || []).length; },
      // виклики функції fn (або масиву назв); where — фаза, масив фаз або номер кадру
      calls: function (fn, where) {
        var fns = Array.isArray(fn) ? fn : [fn];
        return r.log.filter(function (e) {
          if (fns.indexOf(e.f) < 0) return false;
          if (where == null) return true;
          if (typeof where === 'number') return e.fr === where;
          if (Array.isArray(where)) return where.indexOf(e.ph) >= 0;
          return e.ph === where;
        });
      },
      // функцію написано в коді учня і вона справді виконувалась (бібліотека сама викликає деякі функції)
      used: function (fn) {
        return new RegExp('\\b' + fn + '\\s*\\(').test(noComments) &&
          ((r.counts[fn] || 0) > 0 || r.log.some(function (e) { return e.f === fn; }));
      },
      // що видно в «головному» кадрі: виклики setup() і першого кадру draw()
      scene: function (fn) {
        return r.log.filter(function (e) { return (e.fr === 0 || e.fr === main) && (fn ? (Array.isArray(fn) ? fn.indexOf(e.f) >= 0 : e.f === fn) : SH[e.f]); });
      },
      lastOf: function (ph) { return r.phases[ph] ? r.phases[ph].to : 0; },
      frame: function (fr, fn) { return r.log.filter(function (e) { return e.fr === fr && (fn ? (Array.isArray(fn) ? fn.indexOf(e.f) >= 0 : e.f === fn) : SH[e.f]); }); },
      near: function (a, b, t) { return Math.abs(a - b) <= (t == null ? 4 : t); },
      // колір заливки запису журналу → [r, g, b] (без урахування HSB)
      rgb: function (fillKey) {
        if (fillKey == null) return null;
        var n = String(fillKey).split(',').map(Number);
        if (n.length >= 3) return [n[0], n[1], n[2]];
        var v = n[0];
        if (v > 255 || v < 0) return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
        return [v, v, v];
      },
      isDark: function (fillKey) { var c = h.rgb(fillKey); return !!c && c[0] < 60 && c[1] < 60 && c[2] < 60; },
      distinct: function (arr) { var o = {}; arr.forEach(function (x) { o[x] = 1; }); return Object.keys(o).length; },
      changed: function (a, b) {
        var A = r.phases[a] && r.phases[a].img, B = r.phases[b] && r.phases[b].img;
        if (!A || !B || A.data.length !== B.data.length) return false;
        for (var i = 0; i < A.data.length; i += 41) if (A.data[i] !== B.data[i]) return true;
        return false;
      },
      px: function (ph, x, y) {
        var im = r.phases[ph] && r.phases[ph].img; if (!im) return null;
        x = Math.max(0, Math.min(im.width - 1, Math.round(x))); y = Math.max(0, Math.min(im.height - 1, Math.round(y)));
        var i = (y * im.width + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]];
      },
      lineIs: function (e, x1, y1, x2, y2, t) {
        var a = e.a;
        return (h.near(a[0], x1, t) && h.near(a[1], y1, t) && h.near(a[2], x2, t) && h.near(a[3], y2, t)) ||
               (h.near(a[0], x2, t) && h.near(a[1], y2, t) && h.near(a[2], x1, t) && h.near(a[3], y1, t));
      },
      // фігура біля точки (x, y): центр еліпса/кола, кут або центр прямокутника, будь-яка вершина
      shapeNear: function (list, x, y, t) {
        return list.some(function (e) {
          var a = e.a;
          for (var i = 0; i + 1 < a.length; i += 2) if (typeof a[i] === 'number' && h.near(a[i], x, t) && h.near(a[i + 1], y, t)) return true;
          if ((e.f === 'rect' || e.f === 'square') && a.length >= 3) {
            var w = a[2], hh = a.length > 3 ? a[3] : a[2];
            if (h.near(a[0] + w / 2, x, t) && h.near(a[1] + hh / 2, y, t)) return true;
          }
          return false;
        });
      },
      userFunction: function (name) { return new RegExp('\\b(void|int|float|boolean|color|String)\\s+' + name + '\\s*\\(').test(noComments); },
      classNamed: function (name) { return new RegExp('\\bclass\\s+' + name + '\\b').test(noComments); },
      classes: function () { var m = noComments.match(/\bclass\s+([A-Z]\w*)/g) || []; return m.map(function (s) { return s.replace(/class\s+/, ''); }); },
      // тіло функції name (за дужками)
      body: function (name) {
        var m = new RegExp('\\b' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(noComments); if (!m) return '';
        var i = m.index + m[0].length, d = 1, st = i;
        while (i < noComments.length && d) { if (noComments[i] === '{') d++; else if (noComments[i] === '}') d--; i++; }
        return noComments.slice(st, i - 1);
      },
      // траєкторії: k-та фігура fn у кожному кадрі фази → масив траєкторій
      tracks: function (fn, ph) {
        var byFrame = {}, frames = [];
        r.log.forEach(function (e) {
          if (e.ph !== ph || (Array.isArray(fn) ? fn.indexOf(e.f) < 0 : e.f !== fn)) return;
          if (!byFrame[e.fr]) { byFrame[e.fr] = []; frames.push(e.fr); }
          byFrame[e.fr].push(e);
        });
        var n = frames.length ? Math.min.apply(null, frames.map(function (f) { return byFrame[f].length; })) : 0;
        var out = [];
        for (var k = 0; k < Math.min(n, 50); k++) out.push(frames.map(function (f) { return byFrame[f][k]; }));
        return out;
      },
      // перший еліпс/коло/прямокутник у кожному кадрі фази — для перевірки руху
      track: function (fn, ph) {
        var seen = {}, out = [];
        r.log.forEach(function (e) {
          if (e.ph !== ph || (Array.isArray(fn) ? fn.indexOf(e.f) < 0 : e.f !== fn) || seen[e.fr]) return;
          seen[e.fr] = 1; out.push(e);
        });
        return out;
      }
    };
    return h;
  }

  function I(level, pts, text, check) { return { level: level, pts: pts, text: text, check: check }; }
  var runs = I(0, 1, 'Програма запускається без помилок', function () { return true; });

  // ---------- Критерії уроків ----------
  var R = {};

  R[1] = { items: [
    runs,
    I(0, 1, 'Вікно має розмір 500×500 (size(500, 500))', function (h) { return h.W === 500 && h.H === 500; }),
    I(0, 1, 'Є діагональ з кута (0, 0) у кут (500, 500)', function (h) { return h.scene('line').some(function (e) { return h.lineIs(e, 0, 0, 500, 500, 6); }); }),
    I(1, 3, 'Є друга діагональ з (500, 0) у (0, 500) — разом «хрест»', function (h) { return h.scene('line').some(function (e) { return h.lineIs(e, 500, 0, 0, 500, 6); }); }),
    I(2, 1, 'Будиночок: є rect() і щонайменше ще дві лінії (дах)', function (h) { return h.scene('rect').length >= 1 && h.scene('line').length >= 4; }),
    I(2, 1, 'Є сонце — ellipse() або circle()', function (h) { return h.scene(['ellipse', 'circle']).length >= 1; }),
    I(2, 1, 'Малюнок складається щонайменше з 8 фігур', function (h) { return h.scene().length >= 8; }),
    I(3, 1, 'Ініціал: разом щонайменше 12 команд line() і rect()', function (h) { return h.scene(['line', 'rect']).length >= 12; }),
    I(3, 1, 'Використано щонайменше 3 різні види фігур', function (h) { return h.distinct(h.scene().map(function (e) { return e.f; })) >= 3; }),
    I(3, 1, 'Фігури (крім діагоналей хреста) є в усіх чотирьох чвертях вікна', function (h) {
      var q = {};
      h.scene().filter(function (e) { return !(e.f === 'line' && (h.lineIs(e, 0, 0, 500, 500, 6) || h.lineIs(e, 500, 0, 0, 500, 6))); }).forEach(function (e) { for (var i = 0; i + 1 < e.a.length; i += 2) if (typeof e.a[i] === 'number') q[(e.a[i] < h.W / 2 ? 'L' : 'R') + (e.a[i + 1] < h.H / 2 ? 'T' : 'B')] = 1; });
      return Object.keys(q).length === 4;
    })
  ] };

  R[2] = { items: [
    runs,
    I(0, 1, 'Є корпус світлофора — rect()', function (h) { return h.scene('rect').length >= 1; }),
    I(0, 1, 'Є щонайменше три кола (ellipse/circle)', function (h) { return h.scene(['ellipse', 'circle']).length >= 3; }),
    I(1, 3, 'Три кола розташовані одне під одним (однаковий x, різні y)', function (h) {
      var c = h.scene(['ellipse', 'circle']);
      for (var i = 0; i < c.length; i++) {
        var col = c.filter(function (e) { return h.near(e.a[0], c[i].a[0], 3); });
        if (h.distinct(col.map(function (e) { return Math.round(e.a[1]); })) >= 3) return true;
      }
      return false;
    }),
    I(2, 1, 'Використано rectMode(CENTER)', function (h) { return h.calls('rectMode').some(function (e) { return e.a[0] === h.r.K.CENTER; }); }),
    I(2, 1, 'Змінено товщину ліній strokeWeight()', function (h) { return h.calls('strokeWeight').some(function (e) { return e.a[0] !== 1; }); }),
    I(2, 1, 'Малюнок (робот) — щонайменше 6 фігур', function (h) { return h.scene().length >= 6; }),
    I(3, 1, 'Зірка: beginShape(), щонайменше 5 vertex() і endShape(CLOSE)', function (h) {
      return h.calls('beginShape').length > 0 && h.calls('vertex').length >= 5 && h.calls('endShape').some(function (e) { return e.a[0] === h.r.K.CLOSE; });
    }),
    I(3, 1, 'Є дуга arc()', function (h) { return h.calls('arc').length > 0; }),
    I(3, 1, '«Пакмен»: arc() у режимі PIE', function (h) { return h.calls('arc').some(function (e) { return e.a[6] === h.r.K.PIE; }); })
  ] };

  R[3] = { items: [
    runs,
    I(0, 1, 'Намальовано щонайменше 3 фігури', function (h) { return h.scene().length >= 3; }),
    I(0, 1, 'Використано колір RGB: fill() з трьома числами', function (h) { return h.calls('fill').some(function (e) { return e.a.length >= 3; }); }),
    I(1, 3, 'Щонайменше 3 різні кольори заливки', function (h) { return h.distinct(h.calls('fill').map(function (e) { return e.a.join(','); })) >= 3; }),
    I(2, 1, 'Прозорість: щонайменше 3 заливки з альфа-каналом (4-е число менше 255)', function (h) {
      return h.calls('fill').filter(function (e) { return e.a.length === 4 && e.a[3] < 255; }).length >= 3;
    }),
    I(2, 1, 'Три кола перекриваються (діаграма Венна)', function (h) {
      var c = h.scene(['ellipse', 'circle']);
      var pairs = 0;
      for (var i = 0; i < c.length; i++) for (var j = i + 1; j < c.length; j++) {
        var ri = c[i].a[2] / 2, rj = c[j].a[2] / 2;
        if (Math.hypot(c[i].a[0] - c[j].a[0], c[i].a[1] - c[j].a[1]) < ri + rj) pairs++;
      }
      return c.length >= 3 && pairs >= 2;
    }),
    I(2, 1, 'Контур вимкнено noStroke()', function (h) { return h.used('noStroke'); }),
    I(3, 1, 'Композиція: щонайменше 5 прямокутників', function (h) { return h.scene('rect').length >= 5; }),
    I(3, 1, 'Щонайменше 5 різних кольорів', function (h) { return h.distinct(h.calls('fill').map(function (e) { return e.a.join(','); })) >= 5; }),
    I(3, 1, 'Використано HSB (colorMode), шістнадцятковий колір #RRGGBB або змінну типу color', function (h) {
      return h.calls('colorMode').some(function (e) { return e.a[0] === h.r.K.HSB; }) || /#[0-9A-Fa-f]{6}\b/.test(h.r.code) || h.has(/\bcolor\s+\w+\s*=/);
    })
  ] };

  R[4] = { items: [
    runs,
    I(0, 1, 'Оголошено щонайменше 3 змінні (int або float)', function (h) { return h.count(/\b(int|float)\s+[A-Za-z_]\w*\s*[=;,]/) >= 3; }),
    I(1, 3, 'ellipse() отримує змінні як аргументи', function (h) { return h.has(/\bellipse\s*\(\s*[A-Za-z_]/); }),
    I(0, 1, 'Коло намальовано', function (h) { return h.scene(['ellipse', 'circle']).length >= 1; }),
    I(2, 1, 'Є змінні charX і charY', function (h) { return h.has(/\bcharX\b/) && h.has(/\bcharY\b/); }),
    I(2, 1, 'Щонайменше 3 фігури мають координати через charX/charY', function (h) {
      return h.count(/\b(rect|ellipse|line|triangle|circle|quad|arc)\s*\([^;]*\bchar[XY]\b/) >= 3;
    }),
    I(2, 1, 'Координати частин обчислюються від змінних (charX + … або charY - …)', function (h) { return h.has(/\bchar[XY]\s*[-+]/); }),
    I(3, 1, 'Є змінна масштабу типу float (наприклад, scale)', function (h) { return h.has(/\bfloat\s+\w*[Ss]cale\w*\s*=/) || h.has(/\bfloat\s+s\s*=/); }),
    I(3, 1, 'Розміри множаться на змінну масштабу', function (h) { return h.has(/\*\s*\w*[Ss]cale\w*\b/) || h.has(/\*\s*s\b/); }),
    I(3, 1, 'Фігур персонажа щонайменше 5', function (h) { return h.scene().length >= 5; })
  ] };

  // зміщення кожної фігури fn за фазу: [{dx, dy, dw}, ...]
  function moves(h, fn, ph) {
    return h.tracks(fn, ph || 'anim').filter(function (t) { return t.length >= 10; }).map(function (t) {
      var a = t[1].a, b = t[t.length - 1].a;
      return { dx: b[0] - a[0], dy: b[1] - a[1], dw: (b[2] || 0) - (a[2] || 0) };
    });
  }

  R[5] = { items: [
    runs,
    I(0, 2, 'Коло рухається вниз', function (h) { return moves(h, ['ellipse', 'circle']).some(function (m) { return m.dy > 5; }); }),
    I(1, 3, 'Коло рухається по діагоналі: і праворуч, і вниз одночасно', function (h) {
      return moves(h, ['ellipse', 'circle']).some(function (m) { return m.dx > 5 && m.dy > 5; });
    }),
    I(2, 1, 'Коло збільшується', function (h) { return moves(h, ['ellipse', 'circle']).some(function (m) { return m.dw > 2; }); }),
    I(2, 1, 'Колір змінюється з часом (fill() з різними значеннями в різних кадрах)', function (h) {
      return h.distinct(h.calls('fill', 'anim').map(function (e) { return e.a.join(','); })) >= 5;
    }),
    I(2, 1, 'Колір світлішає: від темного до світлого', function (h) {
      return h.tracks('fill', 'anim').some(function (t) {
        if (t.length < 10) return false;
        var a = h.rgb(t[0].a.join(',')), b = h.rgb(t[t.length - 1].a.join(','));
        return !!a && !!b && (b[0] + b[1] + b[2]) - (a[0] + a[1] + a[2]) > 60;
      });
    }),
    I(3, 1, 'Колір неба (background) змінюється з часом', function (h) {
      return h.distinct(h.calls('background', 'anim').map(function (e) { return e.a.join(','); })) >= 5;
    }),
    I(3, 1, 'Небо темнішає', function (h) {
      var b = h.calls('background', 'anim'); if (b.length < 10) return false;
      var x = h.rgb(b[0].a.join(',')), y = h.rgb(b[b.length - 1].a.join(','));
      return !!x && !!y && (x[0] + x[1] + x[2]) - (y[0] + y[1] + y[2]) > 20;
    }),
    I(3, 1, 'Сцена: щонайменше 3 фігури в кадрі', function (h) { return h.frame(h.lastOf('anim')).length >= 3; })
  ] };

  R[6] = { items: [
    runs,
    I(0, 1, 'Використано mouseX і mouseY', function (h) { return h.has(/\bmouseX\b/) && h.has(/\bmouseY\b/); }),
    I(0, 1, 'Курсор у лівому верхньому куті — персонаж поруч із ним', function (h) {
      return h.shapeNear(h.frame(h.lastOf('mouseTL')), h.W * 0.25, h.H * 0.25, 40);
    }),
    I(1, 3, 'Увесь персонаж (щонайменше 2 фігури) переміщується за курсором у правий нижній кут', function (h) {
      var fr = h.frame(h.lastOf('mouseBR'));
      return fr.filter(function (e) { return h.shapeNear([e], h.W * 0.75, h.H * 0.75, 70); }).length >= 2;
    }),
    I(2, 1, 'Колір залежить від положення миші', function (h) {
      var a = h.frame(h.lastOf('mouseTL'), 'fill').map(function (e) { return e.a.join(','); }).join('|');
      var b = h.frame(h.lastOf('mouseBR'), 'fill').map(function (e) { return e.a.join(','); }).join('|');
      return a !== b;
    }),
    I(2, 1, 'Є функція-подія mousePressed()', function (h) { return h.r.userFns.mousePressed; }),
    I(2, 1, 'Після клацання змінюється колір фону', function (h) {
      var a = h.frame(h.lastOf('mouseBR'), 'background').map(function (e) { return e.a.join(','); }).join('|');
      var b = h.frame(h.lastOf('click'), 'background').map(function (e) { return e.a.join(','); }).join('|');
      return a !== b;
    }),
    I(3, 1, 'Малювання неперервною лінією line(pmouseX, pmouseY, mouseX, mouseY)', function (h) { return h.has(/line\s*\(\s*pmouseX/); }),
    I(3, 1, 'Симетрія: використано width - mouseX', function (h) { return h.has(/width\s*-\s*mouseX/); }),
    I(3, 1, 'Під час перетягування миші малюються лінії', function (h) { return h.calls('line', 'drag').length >= 6; })
  ] };

  function fillAt(h, ph, x, y) {
    var list = h.frame(h.lastOf(ph), 'rect').filter(function (e) { return h.near(e.a[0], x, 3) && h.near(e.a[1], y, 3); });
    return list.length ? list[list.length - 1].fill : undefined;
  }
  R[7] = { frames: 300, items: [
    runs,
    I(0, 1, 'Використано умову if', function (h) { return h.has(/\bif\s*\(/); }),
    I(0, 1, 'Намальовано щонайменше 4 прямокутники (квадрати)', function (h) { return h.frame(h.lastOf('mouseTL'), 'rect').length >= 4; }),
    I(1, 2, 'Курсор у лівому верхньому квадраті — цей квадрат чорний', function (h) { return h.isDark(fillAt(h, 'mouseTL', 0, 0)); }),
    I(1, 1, 'Курсор у правому нижньому квадраті — він чорний, а лівий верхній уже ні', function (h) {
      return h.isDark(fillAt(h, 'mouseBR', h.W / 2, h.H / 2)) && fillAt(h, 'mouseBR', 0, 0) !== undefined && !h.isDark(fillAt(h, 'mouseBR', 0, 0));
    }),
    I(2, 1, 'М\'яч відскакує: напрямок руху змінюється', function (h) {
      var t = h.track(['ellipse', 'circle'], 'anim'); var flips = 0;
      for (var i = 2; i < t.length; i++) {
        var d1x = t[i - 1].a[0] - t[i - 2].a[0], d2x = t[i].a[0] - t[i - 1].a[0];
        var d1y = t[i - 1].a[1] - t[i - 2].a[1], d2y = t[i].a[1] - t[i - 1].a[1];
        if (d1x * d2x < 0 || d1y * d2y < 0) flips++;
      }
      return flips >= 1;
    }),
    I(2, 1, 'Колір м\'яча змінюється під час гри', function (h) {
      return h.distinct(h.track(['ellipse', 'circle'], 'anim').map(function (e) { return e.fill; })) >= 2;
    }),
    I(2, 1, 'Швидкість змінює знак (speed *= -1 або speed = -speed)', function (h) { return h.has(/\*=\s*-\s*1\b/) || h.has(/=\s*-\s*\w*[Ss]peed/); }),
    I(3, 1, 'Ракетка рухається за мишею', function (h) {
      var a = h.frame(h.lastOf('mouseTL'), 'rect').map(function (e) { return Math.round(e.a[0]); }).join(',');
      var b = h.frame(h.lastOf('mouseBR'), 'rect').map(function (e) { return Math.round(e.a[0]); }).join(',');
      return h.has(/rect\s*\([^;]*mouseX/) && a !== b;
    }),
    I(3, 1, 'Є напис для кінця гри (text())', function (h) { return h.has(/\btext\s*\(\s*"/); }),
    I(3, 1, 'Напис з\'являється лише за умови програшу (text() усередині if)', function (h) { return h.has(/\bif\s*\([^{;]*\)\s*\{?[^;{}]*\btext\s*\(/); })
  ] };

  R[8] = { items: [
    runs,
    I(0, 1, 'Використано цикл for', function (h) { return h.has(/\bfor\s*\(/); }),
    I(0, 1, 'У кадрі щонайменше 5 кіл', function (h) { return h.scene(['ellipse', 'circle']).length >= 5; }),
    I(1, 3, '10 кіл стоять в один рядок (однаковий y) — гірлянда', function (h) {
      var c = h.scene(['ellipse', 'circle']); var by = {};
      c.forEach(function (e) { var k = Math.round(e.a[1]); by[k] = (by[k] || 0) + 1; });
      return Object.keys(by).some(function (k) { return by[k] >= 10; });
    }),
    I(2, 1, 'Вкладені цикли (цикл усередині циклу)', function (h) { return h.has(/\bfor\s*\([^)]*\)\s*\{[^}]*\bfor\s*\(/); }),
    I(2, 1, 'Шахівниця: щонайменше 64 прямокутники', function (h) { return h.scene(['rect', 'square']).length >= 64; }),
    I(2, 1, 'Чергування кольорів через остачу %', function (h) { return h.has(/%\s*2/); }),
    I(3, 1, 'Використано dist()', function (h) { return h.used('dist'); }),
    I(3, 1, 'Кола різного розміру', function (h) { return h.distinct(h.frame(h.lastOf('mouseTL'), ['ellipse', 'circle']).map(function (e) { return Math.round(e.a[2]); })) >= 3; }),
    I(3, 1, 'Розміри кіл змінюються, коли рухається миша', function (h) {
      var a = h.frame(h.lastOf('mouseTL'), ['ellipse', 'circle']).map(function (e) { return Math.round(e.a[2]); }).join(',');
      var b = h.frame(h.lastOf('mouseBR'), ['ellipse', 'circle']).map(function (e) { return Math.round(e.a[2]); }).join(',');
      return a !== b;
    })
  ] };

  R[9] = { items: [
    runs,
    I(0, 1, 'Використано random()', function (h) { return h.used('random'); }),
    I(0, 1, 'Ціле випадкове число: int(random(...))', function (h) { return h.has(/\bint\s*\(\s*random\s*\(/); }),
    I(1, 1, 'Нове число — після клацання: є функція-подія mousePressed()', function (h) { return h.r.userFns.mousePressed; }),
    I(1, 2, 'Після клацання кубик показано крапками: від 1 до 6 кружечків', function (h) {
      var n = h.frame(h.lastOf('click'), ['ellipse', 'circle']).length; return n >= 1 && n <= 6;
    }),
    I(2, 1, 'Зоряне небо: щонайменше 200 зірок у кадрі', function (h) { return h.frame(h.lastOf('anim'), ['point', 'ellipse', 'circle']).length >= 200; }),
    I(2, 1, 'Зірки розкидано випадково по всьому вікну: random(width), random(height)', function (h) { return h.has(/random\s*\(\s*width\s*\)/) && h.has(/random\s*\(\s*height\s*\)/); }),
    I(2, 1, 'Зірки мерехтять: яскравість змінюється між кадрами', function (h) {
      var f1 = h.frame(h.lastOf('start'), ['fill', 'stroke']).map(function (e) { return e.a.join(','); }).join('|');
      var f2 = h.frame(h.lastOf('anim'), ['fill', 'stroke']).map(function (e) { return e.a.join(','); }).join('|');
      return f1 !== f2 && f1.length > 0;
    }),
    I(3, 1, 'Використано noise()', function (h) { return h.used('noise'); }),
    I(3, 1, 'Використано randomSeed() для повторюваного результату', function (h) { return h.has(/randomSeed\s*\(/); }),
    I(3, 1, 'Клавіша s зберігає постер (saveFrame())', function (h) { return h.has(/key\s*==\s*'s'/) && h.has(/saveFrame\s*\(/); })
  ], keys: ['s', 'a', ' '] };

  R[10] = { items: [
    runs,
    I(0, 1, 'Оголошено функцію drawFlower з параметрами', function (h) { return h.has(/void\s+drawFlower\s*\(\s*(float|int)\s+\w+\s*,/); }),
    I(0, 1, 'drawFlower() викликається щонайменше 3 рази (або в циклі)', function (h) {
      return h.count(/\bdrawFlower\s*\(/) - 1 >= 3 || h.has(/\bfor\s*\([^)]*\)\s*\{[^}]*drawFlower\s*\(/);
    }),
    I(1, 1, 'На клумбі щонайменше 5 квіток (багато пелюсток у кадрі)', function (h) { return h.scene(['ellipse', 'circle']).length >= 30; }),
    I(1, 2, 'Квітки різного розміру', function (h) {
      return h.distinct(h.scene(['ellipse', 'circle']).map(function (e) { return Math.round(e.a[2]); })) >= 6;
    }),
    I(2, 1, 'Є функції move(), bounce() і display()', function (h) { return h.userFunction('move') && h.userFunction('bounce') && h.userFunction('display'); }),
    I(2, 1, 'draw() викликає move(), bounce() і display()', function (h) { var b = h.body('void\\s+draw'); return /\bmove\s*\(\s*\)/.test(b) && /\bbounce\s*\(\s*\)/.test(b) && /\bdisplay\s*\(\s*\)/.test(b); }),
    I(2, 1, 'Є анімація', function (h) { return h.changed('start', 'anim'); }),
    I(3, 1, 'Функція персонажа має 4 параметри', function (h) { return h.has(/void\s+\w+\s*\(\s*\w+\s+\w+\s*,\s*\w+\s+\w+\s*,\s*\w+\s+\w+\s*,\s*\w+\s+\w+\s*\)/); }),
    I(3, 1, 'Один із параметрів — boolean (настрій)', function (h) { return h.has(/void\s+\w+\s*\([^)]*\bboolean\s+\w+/); }),
    I(3, 1, 'Натовп: функцію персонажа викликано в циклі', function (h) {
      var m = h.src.match(/void\s+(\w+)\s*\([^)]*\bboolean\s+\w+[^)]*\)/); if (!m) return false;
      return new RegExp('\\bfor\\s*\\([^)]*\\)\\s*\\{[^}]*\\b' + m[1] + '\\s*\\(').test(h.src);
    })
  ] };

  R[11] = { items: [
    runs,
    I(0, 1, 'Є клас Car', function (h) { return h.classNamed('Car'); }),
    I(0, 1, 'Створено щонайменше 3 машини (new Car)', function (h) { return h.count(/\bnew\s+Car\s*\(/) >= 3; }),
    I(1, 3, 'Машини їдуть: щонайменше 3 прямокутники, що рухаються', function (h) {
      return h.frame(h.lastOf('anim'), 'rect').length >= 3 && h.changed('start', 'anim');
    }),
    I(2, 1, 'Є клас Ball', function (h) { return h.classNamed('Ball'); }),
    I(2, 1, 'У Ball є конструктор і методи move(), bounce(), display()', function (h) {
      return h.has(/\bBall\s*\([^)]*\)\s*\{/) && h.has(/void\s+move\s*\(/) && h.has(/void\s+bounce\s*\(/) && h.has(/void\s+display\s*\(/);
    }),
    I(2, 1, 'Створено щонайменше 3 м\'ячі', function (h) { return h.count(/\bnew\s+Ball\s*\(/) >= 3 || (h.has(/new\s+Ball\s*\[/) && h.has(/\bnew\s+Ball\s*\(/)); }),
    I(3, 1, 'Є клас персонажа (третій клас)', function (h) { return h.classes().filter(function (c) { return c !== 'Car' && c !== 'Ball'; }).length >= 1; }),
    I(3, 1, 'У класі персонажа є методи display(), move() і jiggle()', function (h) { return h.has(/void\s+jiggle\s*\(/) && h.has(/void\s+display\s*\(/); }),
    I(3, 1, 'Метод isUnderMouse() повертає boolean', function (h) { return h.has(/boolean\s+isUnderMouse\s*\(/); })
  ] };

  R[12] = { items: [
    runs,
    I(0, 1, 'Є масив щонайменше з 10 чисел', function (h) {
      var m = h.src.match(/\b(int|float)\s*\[\s*\]\s*\w+\s*=\s*\{([^}]*)\}/); return !!m && m[2].split(',').length >= 10;
    }),
    I(0, 1, 'Масив перебирається циклом до .length', function (h) { return h.has(/\.length\b/) && h.has(/\bfor\s*\(/); }),
    I(1, 2, 'Діаграма: щонайменше 10 стовпчиків', function (h) { return h.scene('rect').length >= 10; }),
    I(1, 1, 'Стовпчики різної висоти', function (h) { return h.distinct(h.scene('rect').map(function (e) { return Math.round(e.a[3]); })) >= 3; }),
    I(2, 1, 'Є клас Snowflake', function (h) { return h.classNamed('Snowflake'); }),
    I(2, 1, 'Масив або список сніжинок (Snowflake[] чи ArrayList<Snowflake>)', function (h) { return h.has(/Snowflake\s*\[\s*\]/) || h.has(/ArrayList\s*<\s*Snowflake\s*>/); }),
    I(2, 1, 'У кадрі щонайменше 100 сніжинок', function (h) { return h.frame(h.lastOf('anim')).length >= 100; }),
    I(3, 1, 'Використано ArrayList', function (h) { return h.has(/ArrayList\s*</); }),
    I(3, 1, 'Клацання додає частинки', function (h) { return h.frame(h.lastOf('click')).length > h.frame(h.lastOf('mouseBR')).length + 20; }),
    I(3, 1, 'Згаслі частинки видаляються remove()', function (h) { return h.has(/\.remove\s*\(/); })
  ] };

  R[13] = { items: [
    runs,
    I(0, 1, 'Використано translate() і rotate()', function (h) { return h.used('translate') && h.used('rotate'); }),
    I(0, 1, 'Обертання огорнуто pushMatrix()/popMatrix()', function (h) { return h.used('pushMatrix') && h.used('popMatrix'); }),
    I(1, 2, 'Кут обертання змінюється з часом', function (h) { return h.distinct(h.calls('rotate', 'anim').map(function (e) { return e.a[0].toFixed(3); })) >= 10; }),
    I(1, 1, 'Швидкість обертання залежить від mouseX', function (h) {
      function speed(ph) { var t = h.track('rotate', ph); if (t.length < 2) return 0; return t[t.length - 1].a[0] - t[t.length - 2].a[0]; }
      return Math.abs(speed('mouseTL') - speed('mouseBR')) > 1e-4;
    }),
    I(2, 1, 'Годинник: використано second(), minute() або hour()', function (h) { return h.used('second') || h.used('minute') || h.used('hour'); }),
    I(2, 1, 'Три стрілки — щонайменше 3 лінії', function (h) { return h.frame(h.lastOf('start'), 'line').length >= 3 || h.scene('line').length >= 3; }),
    I(2, 1, 'Кути стрілок обчислено через sin()/cos() або rotate()', function (h) { return h.has(/\b(sin|cos)\s*\(/) || (h.has(/\brotate\s*\(/) && h.has(/\b(second|minute|hour)\s*\(/)); }),
    I(3, 1, 'Мандала: щонайменше 12 поворотів у кадрі', function (h) { return h.frame(h.lastOf('anim'), 'rotate').length >= 12; }),
    I(3, 1, 'Пелюстки розставлено циклом (TWO_PI / 12 або радіани)', function (h) { return h.has(/TWO_PI\s*\/\s*\w+/) || h.has(/radians\s*\(/); }),
    I(3, 1, 'Пульсація через sin(): розміри змінюються з часом', function (h) {
      return h.has(/\bsin\s*\(/) && h.changed('start', 'anim');
    })
  ] };

  R[14] = { items: [
    runs,
    I(0, 1, 'Виведено текст text()', function (h) { return h.scene('text').some(function (e) { return String(e.a[0]).trim().length > 0; }); }),
    I(0, 1, 'Текст вирівняно по центру вікна', function (h) {
      return h.calls('textAlign').some(function (e) { return e.a[0] === h.r.K.CENTER; }) && h.scene('text').some(function (e) { return h.near(e.a[1], h.W / 2, 3); });
    }),
    I(1, 2, 'Задано шрифт або розмір (createFont/textFont/textSize)', function (h) { return h.has(/\b(textSize|textFont|createFont)\s*\(/); }),
    I(1, 1, 'Колір тексту залежить від положення миші', function (h) {
      var a = h.frame(h.lastOf('mouseTL'), 'fill').map(function (e) { return e.a.join(','); }).join('|');
      var b = h.frame(h.lastOf('mouseBR'), 'fill').map(function (e) { return e.a.join(','); }).join('|');
      return a !== b;
    }),
    I(2, 1, 'Завантажено зображення loadImage()', function (h) { return h.has(/loadImage\s*\(/); }),
    I(2, 1, 'Застосовано фільтр filter()', function (h) { return h.has(/\bfilter\s*\(/); }),
    I(2, 1, 'Фільтри перемикаються клавішами', function (h) { return h.has(/key\s*==\s*'[1-4]'/); }),
    I(3, 1, 'Робота з пікселями: loadPixels(), pixels[], updatePixels()', function (h) { return h.has(/loadPixels\s*\(/) && h.has(/pixels\s*\[/) && h.has(/updatePixels\s*\(/); }),
    I(3, 1, 'Яскравість залежить від відстані dist() до миші', function (h) { return h.has(/\bdist\s*\(/); }),
    I(3, 1, 'Використано складові кольору red()/green()/blue() або brightness()', function (h) { return h.has(/\b(red|green|blue|brightness)\s*\(/); })
  ], keys: ['1', '2', '3', '4'] };

  R[15] = { items: [
    runs,
    I(0, 1, 'Змінено інтервал появи крапель (не 1000 мс)', function (h) { var m = h.src.match(/new\s+Timer\s*\(\s*(\d+)\s*\)/); return !!m && +m[1] !== 1000; }),
    I(0, 1, 'Змінено кількість життів (не 3)', function (h) { var m = h.src.match(/\blives\s*=\s*(\d+)\s*;/); return !!m && +m[1] !== 3; }),
    I(1, 3, 'Змінено швидкість падіння крапель', function (h) { return !h.has(/speed\s*=\s*baseSpeed\s*\+\s*random\s*\(\s*1\s*,\s*3\s*\)/) && h.has(/speed\s*=/); }),
    I(2, 1, 'Є змінна рівня (level)', function (h) { return h.has(/\bint\s+level\b/); }),
    I(2, 1, 'На екрані з\'являється напис «Рівень»', function (h) { return /text\s*\(\s*"Рівень/.test(h.r.code); }),
    I(2, 1, 'Швидкість залежить від рівня', function (h) { return h.has(/new\s+Drop\s*\([^)]*level/) || h.has(/speed[^;]*\blevel\b/); }),
    I(3, 1, 'Новий клас перешкоди (наприклад, Stone)', function (h) {
      return h.classes().filter(function (c) { return ['Drop', 'Catcher', 'Timer'].indexOf(c) < 0; }).length >= 1;
    }),
    I(3, 1, 'Окремий список для перешкод (ще один ArrayList)', function (h) { return h.count(/ArrayList\s*<\s*\w+\s*>\s+\w+/) >= 2; }),
    I(3, 1, 'Перешкода віднімає життя (lives-- використано щонайменше двічі)', function (h) { return h.count(/\blives\s*(--|-=)/) >= 2; })
  ] };

  R[16] = { items: [
    runs,
    I(0, 1, 'Щонайменше 80 непорожніх рядків коду', function (h) { return h.r.code.split('\n').filter(function (l) { return l.trim(); }).length >= 80; }),
    I(0, 1, 'Є щонайменше один власний клас', function (h) { return h.classes().length >= 1; }),
    I(1, 1, 'Є власна функція з параметрами', function (h) {
      return /\b(void|int|float|boolean)\s+(?!setup\b|draw\b)\w+\s*\(\s*(int|float|boolean|String|color|\w+)\s+\w+/.test(h.src);
    }),
    I(1, 1, 'Використано цикл', function (h) { return h.has(/\b(for|while)\s*\(/); }),
    I(1, 1, 'Використано умову', function (h) { return h.has(/\bif\s*\(/); }),
    I(2, 1, 'Є взаємодія: миша або клавіатура', function (h) {
      return h.has(/\b(mouseX|mouseY|mousePressed|keyPressed|key)\b/);
    }),
    I(2, 1, 'Є анімація або реакція на дії', function (h) { return h.changed('start', 'anim') || h.changed('mouseTL', 'mouseBR') || h.changed('click2', 'drag'); }),
    I(2, 1, 'Використано масив або ArrayList', function (h) { return h.has(/\[\s*\]|ArrayList\s*</); }),
    I(3, 1, 'Код прокоментовано (щонайменше 10 рядків коментарів)', function (h) { return (h.r.code.match(/\/\/|\/\*/g) || []).length >= 10; }),
    I(3, 1, 'Розміри через width/height, а не лише «чарівні числа»', function (h) { return h.count(/\b(width|height)\b/) >= 3; }),
    I(3, 1, 'Код структуровано: щонайменше 2 класи або 4 власні функції', function (h) {
      var fns = (h.src.match(/\b(void|int|float|boolean)\s+(?!setup\b|draw\b)\w+\s*\(/g) || []).length;
      return h.classes().length >= 2 || fns >= 4;
    })
  ] };

  // ---------- Оцінювання ----------
  function normalize(tabs) { return tabs.map(function (t) { return t.code.replace(/\s+/g, ''); }).join('|'); }

  window.PDE_RUBRICS = R;
  window.PDE_GRADE = function (lesson, report, starterTabs) {
    var rub = R[lesson];
    var res = { lesson: lesson, items: [], score: 0, max: 12, grade: 1, note: '' };
    if (!rub) { res.note = 'Для цього уроку немає критеріїв.'; return res; }
    var unchanged = starterTabs && normalize(report.tabs) === normalize(starterTabs);
    var h = report.ok ? helpers(report) : null;
    rub.items.forEach(function (it) {
      var ok = false;
      if (h && !unchanged) { try { ok = !!it.check(h); } catch (e) { ok = false; } }
      res.items.push({ level: it.level, pts: it.pts, text: it.text, ok: ok });
      if (ok) res.score += it.pts;
    });
    if (report.stage === 'forbidden') res.note = report.error;
    else if (!report.ok) res.note = 'Програма не запускається: ' + (report.error || 'помилка') + (report.errorLine ? ' (вкладка ' + report.errorTab + ', рядок ' + report.errorLine + ')' : '') + '. Виправте помилку — тоді критерії перевірять.';
    else if (unchanged) res.note = 'Код ще не змінено: це початковий код практикуму. Виконайте завдання.';
    res.grade = Math.max(1, res.score);
    return res;
  };
  window.PDE_GRADE_OPTS = function (lesson) { var r = R[lesson] || {}; return { frames: r.frames, keys: r.keys }; };
})();
