// Урок 10. Власна функція з параметрами: машинки

void setup() {
  size(400, 300);
}

void draw() {
  background(255);
  drawCar(100, 100, color(255, 0, 0));
  drawCar(250, 200, color(0, 0, 255));
  drawCar(mouseX, mouseY, color(0, 200, 0));
}

// Малює машину з центром у (x, y) кольору c
void drawCar(float x, float y, color c) {
  rectMode(CENTER);
  stroke(0);
  fill(c);
  rect(x, y, 80, 30);              // кузов
  fill(200, 230, 255);
  rect(x + 10, y - 22, 40, 16);    // кабіна
  fill(0);
  ellipse(x - 25, y + 15, 20, 20); // колеса
  ellipse(x + 25, y + 15, 20, 20);
}
