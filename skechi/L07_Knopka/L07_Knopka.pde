// Урок 7. Кнопка-перемикач і підсвічування при наведенні

int bx = 150, by = 120, bw = 200, bh = 80;
boolean isOn = false;

void setup() {
  size(500, 320);
  textAlign(CENTER, CENTER);
  textSize(24);
}

void draw() {
  if (isOn) background(255, 240, 150);
  else      background(40);

  boolean over = mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh;

  if (over) fill(255, 160, 0);   // наведення
  else      fill(200);
  stroke(0);
  rect(bx, by, bw, bh, 12);

  fill(0);
  if (isOn) text("ВИМКНУТИ", bx + bw/2, by + bh/2);
  else      text("УВІМКНУТИ", bx + bw/2, by + bh/2);
}

void mousePressed() {
  if (mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh) {
    isOn = !isOn;
  }
}
