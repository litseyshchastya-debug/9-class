// Урок 14. Пікселі: пуантилізм
// Програма створює зображення-джерело сама (градієнт і «сонце»),
// тож працює без файлу. Щоб узяти фото: покладіть photo.jpg у папку data
// і розкоментуйте рядок з loadImage().

PImage img;

void setup() {
  size(600, 400);
  img = makeSourceImage();
  // img = loadImage("photo.jpg"); img.resize(width, height);
  background(255);
  noStroke();
}

void draw() {
  // Щокадру малюємо 50 «мазків» кольором пікселя з джерела
  for (int i = 0; i < 50; i++) {
    int x = int(random(img.width));
    int y = int(random(img.height));
    int index = x + y * img.width;   // індекс пікселя в масиві
    color c = img.pixels[index];
    fill(c, 150);
    float d = map(mouseX, 0, width, 4, 24);
    ellipse(x, y, d, d);
  }
}

// Створює зображення попіксельно: небо, сонце, море
PImage makeSourceImage() {
  PImage src = createImage(width, height, RGB);
  src.loadPixels();
  for (int y = 0; y < src.height; y++) {
    for (int x = 0; x < src.width; x++) {
      int i = x + y * src.width;
      if (dist(x, y, 420, 150) < 60) {
        src.pixels[i] = color(255, 220, 60);                    // сонце
      } else if (y < src.height * 0.6) {
        src.pixels[i] = color(255, 150 + y / 4, 100 + y / 2);   // небо
      } else {
        src.pixels[i] = color(20, 80 + (y % 20) * 3, 160);      // море
      }
    }
  }
  src.updatePixels();
  return src;
}

void keyPressed() {
  if (key == 'c') background(255);
  if (key == 's') saveFrame("puantylizm-####.png");
}
