// Урок 10. Функції, що малюють і повертають значення: клумба квітів
// Клацання мишею — посадити нову клумбу.

void setup() {
  size(600, 400);
  noLoop();          // малюємо один кадр; redraw() — ще один
}

void draw() {
  background(120, 190, 90);
  for (int i = 0; i < 12; i++) {
    float x = random(50, width - 50);
    float y = random(50, height - 50);
    drawFlower(x, y, random(30, 80), randomPetalColor());
  }
}

// Малює квітку: центр (x, y), розмір s, колір пелюсток c
void drawFlower(float x, float y, float s, color c) {
  noStroke();
  fill(c);
  for (int i = 0; i < 6; i++) {
    float a = TWO_PI / 6 * i;
    ellipse(x + cos(a) * s / 3, y + sin(a) * s / 3, s / 2, s / 2);
  }
  fill(255, 210, 0);
  ellipse(x, y, s / 3, s / 3);
}

// Повертає випадковий «квітковий» колір
color randomPetalColor() {
  color[] palette = { color(255, 90, 120), color(255, 255, 255), color(160, 110, 230), color(255, 150, 40) };
  return palette[int(random(palette.length))];
}

void mousePressed() {
  redraw();
}
