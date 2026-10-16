// Полотно-координатна сітка на головній сторінці: показує mouseX і mouseY під курсором
var cv = document.getElementById('grid'), ctx = cv.getContext('2d'), ro = document.getElementById('readout');
var pos = { x: 160, y: 90 };
function tok(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function draw() {
  var r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = tok('--panel'); ctx.fillRect(0, 0, w, h);
  ctx.lineWidth = 1;
  for (var gx = 0; gx <= w; gx += 20) { ctx.strokeStyle = gx % 100 === 0 ? tok('--rule') : tok('--grid'); ctx.beginPath(); ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, h); ctx.stroke(); }
  for (var gy = 0; gy <= h; gy += 20) { ctx.strokeStyle = gy % 100 === 0 ? tok('--rule') : tok('--grid'); ctx.beginPath(); ctx.moveTo(0, gy + 0.5); ctx.lineTo(w, gy + 0.5); ctx.stroke(); }
  ctx.font = '11px ' + tok('--f-mono'); ctx.fillStyle = tok('--muted');
  for (gx = 100; gx < w; gx += 100) ctx.fillText(String(gx), gx + 3, 12);
  for (gy = 100; gy < h; gy += 100) ctx.fillText(String(gy), 3, gy - 3);
  // осі
  ctx.strokeStyle = tok('--ink'); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(1, 1); ctx.lineTo(70, 1); ctx.moveTo(1, 1); ctx.lineTo(1, 70); ctx.stroke();
  ctx.fillStyle = tok('--ink'); ctx.font = '600 12px ' + tok('--f-mono');
  ctx.fillText('(0, 0)', 8, 26); ctx.fillText('X →', 76, 14); ctx.fillText('Y ↓', 6, 86);
  // напрямні до точки
  ctx.setLineDash([4, 4]); ctx.strokeStyle = tok('--accent'); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pos.x, 0); ctx.lineTo(pos.x, pos.y); ctx.moveTo(0, pos.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = tok('--accent'); ctx.globalAlpha = 0.18;
  ctx.beginPath(); ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1; ctx.strokeStyle = tok('--accent'); ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = tok('--mark'); ctx.beginPath(); ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = tok('--ink'); ctx.font = '12px ' + tok('--f-mono');
  var label = 'ellipse(' + pos.x + ', ' + pos.y + ', 40, 40);';
  var lx = Math.min(pos.x + 28, w - ctx.measureText(label).width - 6);
  ctx.fillText(label, Math.max(6, lx), pos.y > 40 ? pos.y - 26 : pos.y + 40);
  ro.textContent = 'mouseX = ' + pos.x + ' · mouseY = ' + pos.y;
}
function move(e) {
  var r = cv.getBoundingClientRect();
  pos.x = Math.max(0, Math.min(Math.round(e.clientX - r.left), Math.round(r.width) - 1));
  pos.y = Math.max(0, Math.min(Math.round(e.clientY - r.top), Math.round(r.height) - 1));
  draw();
}
cv.addEventListener('pointermove', move);
cv.addEventListener('pointerdown', move);
window.addEventListener('resize', draw);
if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
draw();
