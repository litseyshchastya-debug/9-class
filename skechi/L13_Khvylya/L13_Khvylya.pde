// Урок 13. Синус: хвиля та маятник
// Миша по X змінює довжину хвилі, по Y — амплітуду.

float angle = 0;

void setup() {
  size(600, 400);
}

void draw() {
  background(255);

  float waveLen = map(mouseX, 0, width, 0.01, 0.15);
  float amp = map(mouseY, 0, height, 10, 150);

  // Хвиля з кружечків
  noStroke();
  fill(0, 120, 255);
  for (int x = 0; x < width; x += 10) {
    float y = height/2 + amp * sin(angle + x * waveLen);
    ellipse(x, y, 10, 10);
  }

  // Маятник: кут коливається через sin()
  float a = QUARTER_PI * sin(frameCount * 0.05);
  float bx = 520 + 80 * sin(a);
  float by = 20 + 80 * cos(a);
  stroke(0);
  line(520, 20, bx, by);
  fill(255, 80, 80);
  ellipse(bx, by, 20, 20);

  angle += 0.05;
}
