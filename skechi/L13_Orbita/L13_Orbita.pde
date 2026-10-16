// Урок 13. Трансформації: Сонячна система (Сонце — Земля — Місяць, Марс)

float earthAngle = 0;
float moonAngle = 0;
float marsAngle = 0;

void setup() {
  size(600, 600);
}

void draw() {
  background(10, 10, 30);
  translate(width/2, height/2);   // початок координат — у центрі

  // Орбіти
  noFill();
  stroke(60);
  ellipse(0, 0, 300, 300);
  ellipse(0, 0, 480, 480);

  // Сонце
  noStroke();
  fill(255, 200, 0);
  ellipse(0, 0, 60, 60);

  // Земля + Місяць
  pushMatrix();                   // запам'ятали систему «Сонце»
  rotate(earthAngle);
  translate(150, 0);
  fill(50, 120, 255);
  ellipse(0, 0, 25, 25);
  rotate(moonAngle);
  translate(30, 0);               // Місяць — відносно Землі
  fill(200);
  ellipse(0, 0, 8, 8);
  popMatrix();                    // повернулися до Сонця

  // Марс
  pushMatrix();
  rotate(marsAngle);
  translate(240, 0);
  fill(220, 80, 40);
  ellipse(0, 0, 18, 18);
  popMatrix();

  earthAngle += 0.01;
  moonAngle += 0.05;
  marsAngle += 0.006;
}
