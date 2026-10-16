// Урок 11. Клас Ball: три незалежні м'ячі

Ball b1, b2, b3;

void setup() {
  size(500, 350);
  b1 = new Ball(100, 100, 40);
  b2 = new Ball(250, 200, 60);
  b3 = new Ball(400, 80, 25);
}

void draw() {
  background(255);
  b1.move();  b1.bounce();  b1.display();
  b2.move();  b2.bounce();  b2.display();
  b3.move();  b3.bounce();  b3.display();
}

class Ball {
  float x, y, d;
  float xSpeed, ySpeed;
  color c;

  Ball(float tempX, float tempY, float tempD) {
    x = tempX;
    y = tempY;
    d = tempD;
    xSpeed = random(-4, 4);
    ySpeed = random(-4, 4);
    c = color(random(255), random(255), random(255));
  }

  void move() {
    x += xSpeed;
    y += ySpeed;
  }

  // Відскок від стінок + зміна кольору
  void bounce() {
    if (x > width - d/2 || x < d/2) {
      xSpeed *= -1;
      c = color(random(255), random(255), random(255));
    }
    if (y > height - d/2 || y < d/2) {
      ySpeed *= -1;
      c = color(random(255), random(255), random(255));
    }
  }

  void display() {
    stroke(0);
    fill(c);
    ellipse(x, y, d, d);
  }

  // Чи знаходиться курсор над м'ячем?
  boolean isUnderMouse() {
    return dist(mouseX, mouseY, x, y) < d/2;
  }
}

// Клацання по м'ячу зупиняє його
void mousePressed() {
  if (b1.isUnderMouse()) { b1.xSpeed = 0; b1.ySpeed = 0; }
  if (b2.isUnderMouse()) { b2.xSpeed = 0; b2.ySpeed = 0; }
  if (b3.isUnderMouse()) { b3.xSpeed = 0; b3.ySpeed = 0; }
}
