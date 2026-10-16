// Урок 5. Анімація: рух, зростання, шлейф
// Натисніть будь-яку клавішу, щоб увімкнути/вимкнути шлейф.

float x = 0;          // 1. Оголосили глобальні змінні
float diameter = 10;
float gray = 0;
boolean trail = false;

void setup() {
  size(500, 300);     // 2. Початкові налаштування
  background(255);
}

void draw() {
  if (trail) {
    noStroke();
    fill(255, 20);    // напівпрозоре «стирання» — плавний шлейф
    rect(0, 0, width, height);
  } else {
    background(255);
  }

  stroke(0);
  fill(gray);
  ellipse(x, height/2, diameter, diameter);   // 3. Використали змінні

  x = x + 2;          // 4. Змінили змінні
  diameter = diameter + 0.3;
  gray = gray + 1;

  if (x > width + diameter/2) {   // повертаємося на початок
    x = -diameter/2;
    diameter = 10;
    gray = 0;
  }
}

void keyPressed() {
  trail = !trail;
}
