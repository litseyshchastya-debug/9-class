// Урок 14. Кінетична типографіка: «хвиля» з літер

String message = "Привіт, Processing!";
PFont font;

void setup() {
  size(700, 300);
  font = createFont("Arial", 40);   // шрифт із кирилицею
  textFont(font);
  textAlign(LEFT, CENTER);
}

void draw() {
  background(20, 30, 60);
  float x = 40;
  for (int i = 0; i < message.length(); i++) {
    char letter = message.charAt(i);
    float y = height/2 + 30 * sin(frameCount * 0.08 + i * 0.5);
    fill(150 + 100 * sin(i * 0.4), 200, 255);
    text(letter, x, y);
    x += textWidth(letter);           // зсув на ширину літери
  }

  textSize(16);
  fill(255);
  text("Кадр: " + frameCount, 10, height - 20);
  textSize(40);
}
