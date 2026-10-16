// Ловець — коло, що рухається за мишею

class Catcher {
  float r;
  float x, y;

  Catcher(float tempR) {
    r = tempR;
  }

  void setLocation(float tempX, float tempY) {
    x = tempX;
    y = tempY;
  }

  void display() {
    stroke(0);
    fill(255, 170, 0);
    ellipse(x, y, r * 2, r * 2);
  }

  // Зіткнення: відстань між центрами менша за суму радіусів
  boolean intersect(Drop d) {
    return dist(x, y, d.x, d.y) < r + d.r;
  }
}
