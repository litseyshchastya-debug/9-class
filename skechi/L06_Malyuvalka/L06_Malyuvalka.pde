// Урок 6. Малювалка
// Мишею — малювати; 1, 2, 3 — колір; c — очистити; s — зберегти PNG.

color brushColor;

void setup() {
  size(800, 500);
  background(255);
  brushColor = color(0);
}

void draw() {
  if (mousePressed) {
    // чим швидше рухається миша, тим тонша лінія
    float speed = dist(pmouseX, pmouseY, mouseX, mouseY);
    float w = map(speed, 0, 50, 12, 1);
    strokeWeight(constrain(w, 1, 12));
    stroke(brushColor);
    line(pmouseX, pmouseY, mouseX, mouseY);
  }
  drawPalette();
}

// Підказка-палітра в лівому верхньому куті
void drawPalette() {
  noStroke();
  fill(0);           rect(10, 10, 20, 20);
  fill(220, 30, 30); rect(35, 10, 20, 20);
  fill(30, 90, 220); rect(60, 10, 20, 20);
  fill(brushColor);  rect(90, 10, 20, 20);
}

void keyPressed() {
  if (key == '1') brushColor = color(0);
  if (key == '2') brushColor = color(220, 30, 30);
  if (key == '3') brushColor = color(30, 90, 220);
  if (key == 'c') background(255);
  if (key == 's') saveFrame("malyunok-####.png");
}
