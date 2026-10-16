// Урок 9. Шум Перліна: гірський пейзаж і плавний блукач

float t = 0;        // «час» для блукача
float offset = 0;   // зсув пейзажу — гори «пливуть»

void setup() {
  size(600, 400);
}

void draw() {
  background(200, 225, 255);

  // Три шари гір: що далі, то світліші
  drawMountains(0.005, 180, color(150, 170, 200), offset * 0.3);
  drawMountains(0.01, 250, color(90, 120, 150), offset * 0.6 + 100);
  drawMountains(0.02, 320, color(40, 60, 80), offset + 200);
  offset += 1;

  // Блукач: плавний рух через noise()
  float x = noise(t) * width;
  float y = noise(t + 1000) * height * 0.5;
  noStroke();
  fill(255, 200, 0);
  ellipse(x, y, 30, 30);
  t += 0.005;
}

// Малює шар гір; scale — «зернистість» шуму, base — висота шару
void drawMountains(float scale, float base, color c, float shift) {
  stroke(c);
  for (int x = 0; x < width; x++) {
    float h = noise((x + shift) * scale) * 200;
    line(x, height, x, base - h + 100);
  }
}
