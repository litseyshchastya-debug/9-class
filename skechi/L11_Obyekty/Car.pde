// Клас Car — «формочка» для машин

class Car {
  // Поля (дані)
  color c;
  float x, y;
  float speed;

  // Конструктор
  Car(color tempC, float tempX, float tempY, float tempSpeed) {
    c = tempC;
    x = tempX;
    y = tempY;
    speed = tempSpeed;
  }

  // Метод: рух
  void move() {
    x += speed;
    if (x > width + 20) {
      x = -20;
    }
  }

  // Метод: малювання
  void display() {
    rectMode(CENTER);
    stroke(0);
    fill(c);
    rect(x, y, 40, 20);
    fill(0);
    ellipse(x - 12, y + 10, 10, 10);
    ellipse(x + 12, y + 10, 10, 10);
  }
}
