// Урок 12. Масиви: слід миші з 50 останніх положень

int num = 50;
int[] xs = new int[num];
int[] ys = new int[num];

void setup() {
  size(500, 400);
  noStroke();
}

void draw() {
  background(255);

  // Зсуваємо всі значення на одну позицію вліво
  for (int i = 0; i < num - 1; i++) {
    xs[i] = xs[i + 1];
    ys[i] = ys[i + 1];
  }
  // Нове положення миші — в кінець масиву
  xs[num - 1] = mouseX;
  ys[num - 1] = mouseY;

  // Малюємо: старіші точки — менші та світліші
  for (int i = 0; i < num; i++) {
    fill(255 - i * 5, 100, i * 5);
    ellipse(xs[i], ys[i], i, i);
  }
}
