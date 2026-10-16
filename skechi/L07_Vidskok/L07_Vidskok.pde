// Урок 7. М'яч відскакує від стінок і падає під дією гравітації

float x = 100, y = 50;
float xSpeed = 3, ySpeed = 0;
float gravity = 0.3;
float d = 40;

void setup() {
  size(500, 400);
}

void draw() {
  background(255);

  ySpeed += gravity;     // гравітація збільшує швидкість падіння
  x += xSpeed;
  y += ySpeed;

  // відскок від бічних стінок
  if (x > width - d/2 || x < d/2) {
    xSpeed *= -1;
  }
  // відскок від підлоги з втратою енергії
  if (y > height - d/2) {
    y = height - d/2;
    ySpeed *= -0.85;
  }

  fill(255, 120, 0);
  ellipse(x, y, d, d);
}

// Клацання — підкинути м'яч заново
void mousePressed() {
  x = mouseX;
  y = mouseY;
  ySpeed = -8;
}
