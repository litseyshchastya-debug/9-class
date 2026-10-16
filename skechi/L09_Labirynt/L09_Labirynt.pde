// Урок 9. «10 PRINT» — генеративний лабіринт
// Клацання мишею — новий лабіринт.

int step = 20;

void setup() {
  size(600, 400);
  strokeWeight(3);
  strokeCap(ROUND);
  drawMaze();
}

void draw() {
  // малюємо лише при клацанні
}

void drawMaze() {
  background(30, 40, 90);
  stroke(255);
  for (int y = 0; y < height; y += step) {
    for (int x = 0; x < width; x += step) {
      if (random(1) < 0.5) {
        line(x, y, x + step, y + step);   // діагональ «\»
      } else {
        line(x + step, y, x, y + step);   // діагональ «/»
      }
    }
  }
}

void mousePressed() {
  drawMaze();
}
