// Крапля падає згори

class Drop {
  float x, y;
  float speed;
  float r = 8;
  color c = color(50, 100, 255);

  Drop(float baseSpeed) {
    x = random(r, width - r);
    y = -r * 4;
    speed = baseSpeed + random(1, 3);
  }

  void move() {
    y += speed;
  }

  boolean reachedBottom() {
    return y > height + r * 4;
  }

  // Крапля малюється стовпчиком кіл, що збільшуються донизу (як у Шиффмана)
  void display() {
    noStroke();
    fill(c);
    for (int i = 2; i < r; i++) {
      ellipse(x, y + i * 4, i * 2, i * 2);
    }
  }
}
