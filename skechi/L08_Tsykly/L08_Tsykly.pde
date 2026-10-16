// Урок 8. Цикли: інтерактивні лінії, кольорова сітка, концентричні кола
// Клавіші 1, 2, 3 перемикають режим.

int mode = 1;

void setup() {
  size(400, 400);
}

void draw() {
  background(255);
  if (mode == 1) drawLines();
  else if (mode == 2) drawGrid();
  else drawCircles();
}

// Лінії, що світлішають, коли далеко від курсора
void drawLines() {
  strokeWeight(3);
  for (int x = 0; x < width; x += 10) {
    float d = abs(mouseX - x);
    stroke(constrain(d, 0, 255));
    line(x, 0, x, height);
  }
}

// Вкладені цикли: рядки × стовпці
void drawGrid() {
  stroke(255);
  for (int y = 0; y < height; y += 40) {
    for (int x = 0; x < width; x += 40) {
      fill(x * 255 / width, y * 255 / height, 150);
      rect(x, y, 40, 40);
    }
  }
}

// Концентричні кола, центр — у курсора
void drawCircles() {
  noFill();
  stroke(0);
  strokeWeight(1);
  for (int d = 600; d > 0; d -= 20) {
    ellipse(mouseX, mouseY, d, d);
  }
}

void keyPressed() {
  if (key == '1') mode = 1;
  if (key == '2') mode = 2;
  if (key == '3') mode = 3;
}
